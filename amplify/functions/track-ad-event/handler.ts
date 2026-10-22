declare const process: {
  env: Record<string, string | undefined>;
};

import type { Schema } from "../../data/resource";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

type Handler = Schema["trackAdEvent"]["functionHandler"];

const STAT_TABLE = process.env.AD_STAT_TABLE_NAME;
const DEDUPE_TABLE = process.env.AD_DEDUPE_TABLE_NAME;

/** Campaign ids look like "campaign:<uuid>" or "house:<name>". */
const ID_PATTERN = /^[A-Za-z0-9:_-]{1,90}$/;

/** A learner's clicks on one ad beyond this per day are ignored. */
const MAX_CLICKS_PER_DAY = 3;
const DEDUPE_TTL_SECONDS = 3 * 24 * 60 * 60;

/**
 * Counts one ad impression or click.
 *
 *  - impression: counted once per learner per campaign per day.
 *  - click: counted up to MAX_CLICKS_PER_DAY per learner per campaign per day.
 *
 * Returns true when it was counted and false when it was ignored as a repeat.
 */
export const handler: Handler = async (event) => {
  if (!STAT_TABLE || !DEDUPE_TABLE) throw new Error("AD_TABLES_NOT_CONFIGURED");

  const identity = event.identity as { sub?: string } | null | undefined;
  const userId = identity?.sub?.trim();
  if (!userId) throw new Error("AD_IDENTITY_MISSING");

  const campaignId = (event.arguments.campaignId ?? "").trim();
  if (!ID_PATTERN.test(campaignId)) throw new Error("AD_CAMPAIGN_INVALID");

  const kind = event.arguments.event;
  if (kind !== "impression" && kind !== "click") throw new Error("AD_EVENT_INVALID");

  const now = new Date();
  const day = now.toISOString().slice(0, 10); // UTC
  const nowIso = now.toISOString();
  const expiresAt = Math.floor(now.getTime() / 1000) + DEDUPE_TTL_SECONDS;
  const bucket = `${kind}#${campaignId}#${day}`;

  try {
    if (kind === "impression") {
      await ddb.send(
        new PutCommand({
          TableName: DEDUPE_TABLE,
          Item: {
            userId,
            bucket,
            count: 1,
            expiresAt,
            __typename: "AdDedupe",
            createdAt: nowIso,
            updatedAt: nowIso,
          },
          ConditionExpression: "attribute_not_exists(userId)",
        }),
      );
    } else {
      await ddb.send(
        new UpdateCommand({
          TableName: DEDUPE_TABLE,
          Key: { userId, bucket },
          UpdateExpression:
            "ADD #c :one SET expiresAt = :exp, #tn = if_not_exists(#tn, :tn), createdAt = if_not_exists(createdAt, :now), updatedAt = :now",
          ConditionExpression: "attribute_not_exists(#c) OR #c < :max",
          ExpressionAttributeNames: { "#c": "count", "#tn": "__typename" },
          ExpressionAttributeValues: {
            ":one": 1,
            ":max": MAX_CLICKS_PER_DAY,
            ":exp": expiresAt,
            ":tn": "AdDedupe",
            ":now": nowIso,
          },
        }),
      );
    }
  } catch (error) {
    if ((error as { name?: string }).name === "ConditionalCheckFailedException") return false;
    throw error;
  }

  const field = kind === "impression" ? "impressions" : "clicks";

  await ddb.send(
    new UpdateCommand({
      TableName: STAT_TABLE,
      Key: { campaignId, day },
      UpdateExpression:
        "ADD #f :one SET #tn = if_not_exists(#tn, :tn), createdAt = if_not_exists(createdAt, :now), updatedAt = :now",
      ExpressionAttributeNames: { "#f": field, "#tn": "__typename" },
      ExpressionAttributeValues: { ":one": 1, ":tn": "AdDailyStat", ":now": nowIso },
    }),
  );

  return true;
};