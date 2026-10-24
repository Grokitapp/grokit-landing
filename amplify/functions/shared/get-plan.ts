declare const process: {
  env: Record<string, string | undefined>;
};

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { getErrorMessage } from "./common";
import { effectivePlan, type PlanId } from "./plans";

/**
 * Which plan a learner is on, read on the server. The browser never tells us:
 * every limit check calls this, so a learner cannot give themselves Pro.
 *
 * The Subscription row is keyed by the learner's id (sub) and is written only
 * by the payment webhook or the grant-plan script. If the row is missing or
 * the read fails, the learner is treated as Free: when in doubt, protect spend.
 */

const TABLE = process.env.SUBSCRIPTION_TABLE_NAME;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export async function getPlan(sub: string): Promise<PlanId> {
  if (!TABLE) return "free";

  try {
    const out = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: { userId: sub },
        ProjectionExpression: "#p, #s, #e",
        ExpressionAttributeNames: { "#p": "plan", "#s": "status", "#e": "currentPeriodEnd" },
      }),
    );

    return effectivePlan(out.Item as { plan?: string; status?: string; currentPeriodEnd?: string } | undefined);
  } catch (error) {
    console.error("Plan lookup failed, treating as free", { error: getErrorMessage(error) });

    return "free";
  }
}
