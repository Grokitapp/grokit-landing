// A stop-gap admin tool until the admin site exists.
//
//   node scripts/ad-campaign.mjs create --advertiser "Acme" --title "Edit faster" \
//     --body "20% off your first year." --cta-label "Claim offer" \
//     --cta-url https://example.com --starts 2026-11-01 --ends 2026-11-30 \
//     [--tone sky] [--icon sparkles] [--weight 1] [--image https://...] [--status ACTIVE]
//   node scripts/ad-campaign.mjs list
//   node scripts/ad-campaign.mjs set-status <id> ACTIVE|PAUSED|ENDED
//   node scripts/ad-campaign.mjs stats [campaign:<id>|house:<name>]
//
// Needs: AWS credentials for your account, and the two table names from the
// DynamoDB console (they look like "AdCampaign-xxxx-NONE"):
//   AD_CAMPAIGN_TABLE=... AD_STAT_TABLE=... AWS_REGION=... node scripts/ad-campaign.mjs list
// Install once: npm i -D @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb

import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const CAMPAIGN_TABLE = process.env.AD_CAMPAIGN_TABLE;
const STAT_TABLE = process.env.AD_STAT_TABLE;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const [command, ...rest] = process.argv.slice(2);

function flags(args) {
  const out = {};
  for (let i = 0; i < args.length; i += 2) out[args[i].replace(/^--/, '')] = args[i + 1];
  return out;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function scanAll(table) {
  const items = [];
  let key;
  do {
    const page = await ddb.send(new ScanCommand({ TableName: table, ExclusiveStartKey: key }));
    items.push(...(page.Items ?? []));
    key = page.LastEvaluatedKey;
  } while (key);
  return items;
}

if (!CAMPAIGN_TABLE) fail('Set AD_CAMPAIGN_TABLE.');

if (command === 'create') {
  const f = flags(rest);
  for (const need of ['advertiser', 'title', 'body', 'cta-label', 'cta-url']) {
    if (!f[need]) fail(`Missing --${need}`);
  }
  if (!/^https:\/\//i.test(f['cta-url'])) fail('--cta-url must start with https://');
  if (f.image && !/^https:\/\//i.test(f.image)) fail('--image must start with https://');

  const now = new Date().toISOString();
  const item = {
    id: randomUUID(),
    __typename: 'AdCampaign',
    createdAt: now,
    updatedAt: now,
    name: f.name ?? `${f.advertiser} ${f.title}`,
    advertiser: f.advertiser,
    status: f.status ?? 'DRAFT',
    placement: 'journey-rail',
    tone: f.tone ?? 'sky',
    icon: f.icon ?? 'sparkles',
    eyebrow: f.eyebrow ?? 'Sponsored',
    title: f.title,
    body: f.body,
    ctaLabel: f['cta-label'],
    ctaUrl: f['cta-url'],
    imageUrl: f.image,
    startsAt: f.starts,
    endsAt: f.ends,
    weight: Number(f.weight ?? 1),
  };
  await ddb.send(new PutCommand({ TableName: CAMPAIGN_TABLE, Item: item }));
  console.log(`Created ${item.id} (${item.status})`);
} else if (command === 'list') {
  const items = await scanAll(CAMPAIGN_TABLE);
  for (const c of items) {
    console.log(`${c.id}  ${c.status}  ${c.advertiser}: ${c.title}  [${c.startsAt ?? '-'} to ${c.endsAt ?? '-'}]`);
  }
} else if (command === 'set-status') {
  const [id, status] = rest;
  if (!id || !['ACTIVE', 'PAUSED', 'ENDED', 'DRAFT'].includes(status)) fail('Usage: set-status <id> ACTIVE|PAUSED|ENDED|DRAFT');
  await ddb.send(
    new UpdateCommand({
      TableName: CAMPAIGN_TABLE,
      Key: { id },
      UpdateExpression: 'SET #s = :s, updatedAt = :u',
      ConditionExpression: 'attribute_exists(id)',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': status, ':u': new Date().toISOString() },
    }),
  );
  console.log(`${id} is now ${status}`);
} else if (command === 'stats') {
  if (!STAT_TABLE) fail('Set AD_STAT_TABLE.');
  const only = rest[0];
  const rows = (await scanAll(STAT_TABLE)).filter((r) => !only || r.campaignId === only);
  const totals = new Map();
  for (const r of rows) {
    const t = totals.get(r.campaignId) ?? { impressions: 0, clicks: 0 };
    t.impressions += r.impressions ?? 0;
    t.clicks += r.clicks ?? 0;
    totals.set(r.campaignId, t);
  }
  for (const [id, t] of totals) {
    const ctr = t.impressions ? ((t.clicks / t.impressions) * 100).toFixed(2) : '0.00';
    console.log(`${id}  impressions ${t.impressions}  clicks ${t.clicks}  CTR ${ctr}%`);
  }
} else {
  fail('Commands: create | list | set-status | stats');
}
