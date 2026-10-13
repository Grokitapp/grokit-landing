import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import {
  LEAGUE_COUNT,
  MIN_XP_TO_PROMOTE,
  getZoneSizes,
  previousWeekId,
} from '../shared/leaderboard-rules';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

interface Entry {
  userId: string;
  cohortId: string;
  league: number;
  xp: number;
  lastXpAt: string;
}

type Result = 'PROMOTED' | 'DEMOTED' | 'STAYED';

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) throw new Error(`Missing environment variable ${name}`);

  return value;
}

function isConditionalFailure(error: unknown): boolean {
  return (error as { name?: string }).name === 'ConditionalCheckFailedException';
}

async function loadEntries(weekId: string): Promise<Entry[]> {
  const entries: Entry[] = [];
  let startKey: Record<string, unknown> | undefined;

  do {
    const page = await db.send(
      new QueryCommand({
        TableName: requiredEnv('LEADERBOARD_ENTRY_TABLE_NAME'),
        KeyConditionExpression: 'weekId = :weekId',
        ExpressionAttributeValues: { ':weekId': weekId },
        ExclusiveStartKey: startKey,
      }),
    );

    for (const item of page.Items ?? []) {
      entries.push({
        userId: String(item.userId),
        cohortId: String(item.cohortId),
        league: typeof item.league === 'number' ? item.league : 0,
        xp: typeof item.xp === 'number' ? item.xp : 0,
        lastXpAt: typeof item.lastXpAt === 'string' ? item.lastXpAt : '',
      });
    }

    startKey = page.LastEvaluatedKey;
  } while (startKey);

  return entries;
}

/** Highest XP first; whoever reached their XP earlier wins a tie. */
function byRank(a: Entry, b: Entry): number {
  return b.xp - a.xp || a.lastXpAt.localeCompare(b.lastXpAt) || a.userId.localeCompare(b.userId);
}

async function applyResult(
  weekId: string,
  entry: Entry,
  rank: number,
  result: Result,
): Promise<void> {
  const league =
    result === 'PROMOTED'
      ? Math.min(entry.league + 1, LEAGUE_COUNT - 1)
      : result === 'DEMOTED'
        ? Math.max(entry.league - 1, 0)
        : entry.league;

  try {
    await db.send(
      new UpdateCommand({
        TableName: requiredEnv('LEAGUE_MEMBER_TABLE_NAME'),
        Key: { userId: entry.userId },
        UpdateExpression:
          'SET #league = :league, #lastWeekId = :weekId, #lastRank = :rank, ' +
          '#lastResult = :result, #lastWeekXp = :xp, #updatedAt = :now',
        // Applied once per learner per week, so re-running is harmless.
        ConditionExpression:
          'attribute_exists(userId) AND (attribute_not_exists(#lastWeekId) OR #lastWeekId <> :weekId)',
        ExpressionAttributeNames: {
          '#league': 'league',
          '#lastWeekId': 'lastWeekId',
          '#lastRank': 'lastRank',
          '#lastResult': 'lastResult',
          '#lastWeekXp': 'lastWeekXp',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':league': league,
          ':weekId': weekId,
          ':rank': rank,
          ':result': result,
          ':xp': entry.xp,
          ':now': new Date().toISOString(),
        },
      }),
    );
  } catch (error) {
    if (!isConditionalFailure(error)) throw error;
  }
}

export const handler = async (): Promise<{ weekId: string; status: string }> => {
  const weekId = previousWeekId(new Date());
  const counterTable = requiredEnv('LEAGUE_COUNTER_TABLE_NAME');
  const marker = `finalized#${weekId}`;

  const { Item: done } = await db.send(
    new GetCommand({ TableName: counterTable, Key: { bucket: marker } }),
  );

  if (done) return { weekId, status: 'already-finalized' };

  const entries = await loadEntries(weekId);
  const groups = new Map<string, Entry[]>();

  for (const entry of entries) {
    const group = groups.get(entry.cohortId) ?? [];

    group.push(entry);
    groups.set(entry.cohortId, group);
  }

  const jobs: (() => Promise<void>)[] = [];

  for (const group of groups.values()) {
    const ranked = [...group].sort(byRank);
    const { promote, demote } = getZoneSizes(ranked.length);
    const demoteFrom = ranked.length - demote;

    ranked.forEach((entry, index) => {
      let result: Result = 'STAYED';

      if (index < promote && entry.xp >= MIN_XP_TO_PROMOTE && entry.league < LEAGUE_COUNT - 1) {
        result = 'PROMOTED';
      } else if (demote > 0 && index >= demoteFrom && entry.league > 0) {
        result = 'DEMOTED';
      }

      jobs.push(() => applyResult(weekId, entry, index + 1, result));
    });
  }

  // A few at a time so a big week doesn't flood DynamoDB.
  const BATCH = 25;

  for (let start = 0; start < jobs.length; start += BATCH) {
    await Promise.all(jobs.slice(start, start + BATCH).map((job) => job()));
  }

  const now = new Date().toISOString();

  await db.send(
    new PutCommand({
      TableName: counterTable,
      Item: {
        bucket: marker,
        count: entries.length,
        __typename: 'LeagueCounter',
        createdAt: now,
        updatedAt: now,
      },
    }),
  );

  return { weekId, status: `finalized ${entries.length} entries` };
};