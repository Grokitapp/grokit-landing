#!/usr/bin/env node
/**
 * Gives a learner a plan by hand (for testing, support, or a lifetime deal).
 * Writes the Subscription row straight to DynamoDB, the same row the payment
 * webhook will write later.
 *
 *   node scripts/grant-plan.mjs <userId> <free|pro> [options]
 *
 *   <userId>            the learner's Cognito "sub" (Cognito console > Users)
 *   --days N            plan lasts N days (default: until you change it)
 *   --interval month|year   (default month)
 *   --status active|trialing   (default active)
 *   --table NAME        Subscription table (default: found automatically)
 *   --region REGION     (default: AWS_REGION, or amplify_outputs.json)
 *
 * Needs AWS credentials in your shell, and once:
 *   npm i -D @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
 *
 * "free" removes the row. The learner sees the change within a minute.
 */
import { existsSync, readFileSync } from 'node:fs';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : fallback;
};

const [userId, plan] = args;

if (!userId || !['free', 'pro'].includes(plan)) {
  console.error('Usage: node scripts/grant-plan.mjs <userId> <free|pro> [--days N] [--interval month|year] [--status active|trialing] [--table NAME]');
  process.exit(1);
}

const interval = flag('interval', 'month');
const status = flag('status', 'active');
const days = flag('days') ? Number(flag('days')) : null;

if (!['month', 'year'].includes(interval) || !['active', 'trialing'].includes(status) || (days !== null && !(days > 0))) {
  console.error('Check --interval (month|year), --status (active|trialing) and --days (a positive number).');
  process.exit(1);
}

let region = flag('region', process.env.AWS_REGION);
if (!region && existsSync('amplify_outputs.json')) {
  region = JSON.parse(readFileSync('amplify_outputs.json', 'utf8'))?.data?.aws_region;
}

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

let table = flag('table');
if (!table) {
  const names = [];
  let start;
  do {
    const out = await new DynamoDBClient({ region }).send(new ListTablesCommand({ ExclusiveStartTableName: start }));
    names.push(...(out.TableNames ?? []));
    start = out.LastEvaluatedTableName;
  } while (start);

  const found = names.filter((name) => name.startsWith('Subscription-'));
  if (found.length !== 1) {
    console.error(found.length ? `Several Subscription tables: ${found.join(', ')}. Pass --table.` : 'No Subscription table found. Deploy first, or pass --table.');
    process.exit(1);
  }
  table = found[0];
}

if (plan === 'free') {
  await ddb.send(new DeleteCommand({ TableName: table, Key: { userId } }));
  console.log(`Removed the plan for ${userId}: they are on Free.`);
  process.exit(0);
}

const now = new Date();
const end = days ? new Date(now.getTime() + days * 86_400_000).toISOString() : undefined;

await ddb.send(
  new PutCommand({
    TableName: table,
    Item: {
      __typename: 'Subscription',
      userId,
      owner: userId, // the form the learner's own reads expect
      plan,
      status,
      interval,
      provider: 'manual',
      cancelAtPeriodEnd: false,
      ...(end ? { currentPeriodEnd: end } : {}),
      ...(status === 'trialing' && end ? { trialEndsAt: end } : {}),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  }),
);

console.log(`${userId} is now on ${plan} (${status})${end ? ` until ${end}` : ', until changed'}. Table: ${table}`);
