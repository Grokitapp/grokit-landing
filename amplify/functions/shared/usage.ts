declare const process: {
  env: Record<string, string | undefined>;
};

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getErrorMessage } from "./common";
import { getPlan } from "./get-plan";
import { counterBucket, formatLimitError, limitFor, nextReset, periodFor, type LimitedKind } from "./usage-limits";
import { istDayKey } from "./voices";

/**
 * Per-learner counters (daily for lessons, monthly for journeys) for the
 * actions that cost money.
 *
 * Rows are written straight to DynamoDB (like ReadAloudUsage), so the browser
 * can read its own counts but never change them. The check and the count are
 * ONE atomic write: "add 1, but only if still under the limit". Two requests
 * at the same moment can therefore never both slip through.
 *
 * Unlike read-aloud, a counter problem blocks the action instead of letting it
 * through: these limits exist to cap spend, so failing open would defeat them.
 */

const TABLE = process.env.USAGE_COUNTER_TABLE_NAME;
// A row must outlive its period, or the count would silently reset early.
// (TTL is refreshed on every write.) Daily rows: 14 days. Monthly rows: 45.
const rowTtlSeconds = (kind: LimitedKind): number =>
  (periodFor(kind) === "month" ? 45 : 14) * 24 * 3600;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const isConditionFailure = (error: unknown): boolean =>
  (error as { name?: string }).name === "ConditionalCheckFailedException";

/**
 * Takes one slot for the current period (today / this month), or throws the "limit reached" error the browser
 * understands. Call it BEFORE the paid work starts.
 */
export async function consumeUsage(sub: string, kind: LimitedKind): Promise<{ used: number; limit: number }> {
  if (!TABLE) throw new Error("USAGE_NOT_CONFIGURED");

  // The limit depends on the learner's plan (Free or Pro), read on the server.
  const plan = await getPlan(sub);
  const limit = limitFor(kind, plan);
  const now = new Date();

  try {
    const out = await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { userId: sub, bucket: counterBucket(kind, istDayKey()) },
        UpdateExpression:
          "ADD #c :one SET #o = :sub, #e = :exp, #u = :now, #t = :type, #cr = if_not_exists(#cr, :now)",
        ConditionExpression: "attribute_not_exists(#c) OR #c < :limit",
        ExpressionAttributeNames: {
          "#c": "count",
          "#o": "owner",
          "#e": "expiresAt",
          "#u": "updatedAt",
          "#t": "__typename",
          "#cr": "createdAt",
        },
        ExpressionAttributeValues: {
          ":one": 1,
          ":limit": limit,
          ":sub": sub,
          ":exp": Math.floor(now.getTime() / 1000) + rowTtlSeconds(kind),
          ":now": now.toISOString(),
          ":type": "UsageCounter",
        },
        ReturnValues: "UPDATED_NEW",
      }),
    );

    return { used: Number(out.Attributes?.count ?? 1), limit };
  } catch (error) {
    if (isConditionFailure(error)) {
      console.log(JSON.stringify({ event: "usage_limit_reached", kind, limit, plan }));
      throw new Error(formatLimitError(kind, limit, nextReset(kind), plan));
    }

    console.error("Usage counter write failed", { kind, error: getErrorMessage(error) });
    throw new Error("USAGE_CHECK_FAILED");
  }
}

/**
 * Gives a slot back when the paid work did not produce anything (the worker
 * failed), so a failure never costs the learner an allowance. Best effort: it
 * never throws, and the count never goes below zero.
 */
export async function refundUsage(sub: string, kind: LimitedKind): Promise<void> {
  if (!TABLE) return;

  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { userId: sub, bucket: counterBucket(kind, istDayKey()) },
        UpdateExpression: "ADD #c :minus",
        ConditionExpression: "#c > :zero",
        ExpressionAttributeNames: { "#c": "count" },
        ExpressionAttributeValues: { ":minus": -1, ":zero": 0 },
      }),
    );
  } catch (error) {
    // Nothing to give back (already zero, or the day rolled over): that is fine.
    if (!isConditionFailure(error)) {
      console.error("Usage refund failed", { kind, error: getErrorMessage(error) });
    }
  }
}