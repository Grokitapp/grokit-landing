import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import { COHORT_SIZE, MAX_LESSON_XP, weekIdOf } from '../shared/leaderboard-rules';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

const DEFAULT_NAME = 'Learner';
const NAME_MAX_LENGTH = 50;

// -----------------------------------------------------------------------------
// Event shapes
// -----------------------------------------------------------------------------

interface StreamAttribute {
  S?: string;
  N?: string;
}

interface StreamEvent {
  Records: {
    eventName?: string;
    dynamodb?: { NewImage?: Record<string, StreamAttribute | undefined> };
  }[];
}

interface AppSyncEvent {
  fieldName?: string;
  info?: { fieldName?: string };
  arguments: { profileId?: string; displayName?: string };
  identity?: { sub?: string } | null;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) throw new Error(`Missing environment variable ${name}`);

  return value;
}

function isConditionalFailure(error: unknown): boolean {
  return (error as { name?: string }).name === 'ConditionalCheckFailedException';
}

/** Amplify stores the owner as "<sub>::<username>" (or the bare sub). */
function ownedBy(owner: unknown, sub: string): boolean {
  return (
    typeof owner === 'string' &&
    (owner === sub || owner.startsWith(`${sub}::`))
  );
}

function cleanName(raw: unknown): string {
  const name = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : '';

  return name ? name.slice(0, NAME_MAX_LENGTH) : DEFAULT_NAME;
}

interface Member {
  league: number;
  displayName: string;
  username: string | null;
}

/** Makes sure the learner has a league record (Bronze to start with). */
async function ensureMember(userId: string): Promise<Member> {
  const now = new Date().toISOString();

  const { Attributes } = await db.send(
    new UpdateCommand({
      TableName: requiredEnv('LEAGUE_MEMBER_TABLE_NAME'),
      Key: { userId },
      UpdateExpression:
        'SET #league = if_not_exists(#league, :zero), ' +
        '#displayName = if_not_exists(#displayName, :name), ' +
        '#typename = if_not_exists(#typename, :typename), ' +
        '#createdAt = if_not_exists(#createdAt, :now), ' +
        '#updatedAt = :now',
      ExpressionAttributeNames: {
        '#league': 'league',
        '#displayName': 'displayName',
        '#typename': '__typename',
        '#createdAt': 'createdAt',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':zero': 0,
        ':name': DEFAULT_NAME,
        ':typename': 'LeagueMember',
        ':now': now,
      },
      ReturnValues: 'ALL_NEW',
    }),
  );

  return {
    league: typeof Attributes?.league === 'number' ? Attributes.league : 0,
    displayName: cleanName(Attributes?.displayName),
    username: typeof Attributes?.username === 'string' ? Attributes.username : null,
  };
}

/** Next free spot in this week's groups for a league (groups fill up in order). */
async function assignCohort(weekId: string, league: number): Promise<string> {
  const now = new Date().toISOString();

  const { Attributes } = await db.send(
    new UpdateCommand({
      TableName: requiredEnv('LEAGUE_COUNTER_TABLE_NAME'),
      Key: { bucket: `${weekId}#${league}` },
      UpdateExpression:
        'SET #typename = if_not_exists(#typename, :typename), ' +
        '#createdAt = if_not_exists(#createdAt, :now), #updatedAt = :now ' +
        'ADD #count :one',
      ExpressionAttributeNames: {
        '#typename': '__typename',
        '#createdAt': 'createdAt',
        '#updatedAt': 'updatedAt',
        '#count': 'count',
      },
      ExpressionAttributeValues: {
        ':typename': 'LeagueCounter',
        ':now': now,
        ':one': 1,
      },
      ReturnValues: 'ALL_NEW',
    }),
  );

  const position = typeof Attributes?.count === 'number' ? Attributes.count : 1;
  const group = Math.floor((position - 1) / COHORT_SIZE) + 1;

  return `${weekId}#${league}#${group}`;
}

// -----------------------------------------------------------------------------
// Stream: a lesson was completed, add its XP to this week
// -----------------------------------------------------------------------------

async function addXp(
  userId: string,
  lessonId: string,
  xp: number,
  completedAt: string,
  weekId: string,
): Promise<void> {
  const entryTable = requiredEnv('LEADERBOARD_ENTRY_TABLE_NAME');
  const member = await ensureMember(userId);
  const now = new Date().toISOString();

  const { Item: existing } = await db.send(
    new GetCommand({
      TableName: entryTable,
      Key: { weekId, userId },
      ConsistentRead: true,
    }),
  );

  if (!existing) {
    const cohortId = await assignCohort(weekId, member.league);

    try {
      await db.send(
        new PutCommand({
          TableName: entryTable,
          Item: {
            weekId,
            userId,
            cohortId,
            league: member.league,
            xp: 0,
            displayName: member.displayName,
            username: member.username,
            lastXpAt: completedAt,
            __typename: 'LeaderboardEntry',
            createdAt: now,
            updatedAt: now,
          },
          ConditionExpression: 'attribute_not_exists(userId)',
        }),
      );
    } catch (error) {
      // Another record for the same learner created it first. That's fine.
      if (!isConditionalFailure(error)) throw error;
    }
  }

  try {
    // lessonIds is a set of lessons already counted, so a retried stream batch
    // (or a lesson saved twice) can never add the same XP twice.
    await db.send(
      new UpdateCommand({
        TableName: entryTable,
        Key: { weekId, userId },
        UpdateExpression:
          'SET #xp = if_not_exists(#xp, :zero) + :xp, #lastXpAt = :at, #updatedAt = :now ' +
          'ADD #lessonIds :ids',
        ConditionExpression: 'attribute_exists(userId) AND NOT contains(#lessonIds, :lessonId)',
        ExpressionAttributeNames: {
          '#xp': 'xp',
          '#lastXpAt': 'lastXpAt',
          '#updatedAt': 'updatedAt',
          '#lessonIds': 'lessonIds',
        },
        ExpressionAttributeValues: {
          ':zero': 0,
          ':xp': xp,
          ':at': completedAt,
          ':now': now,
          ':ids': new Set([lessonId]),
          ':lessonId': lessonId,
        },
      }),
    );
  } catch (error) {
    if (!isConditionalFailure(error)) throw error;
  }
}

async function handleStream(event: StreamEvent): Promise<void> {
  const currentWeek = weekIdOf(new Date());
  let failed = 0;

  for (const record of event.Records) {
    if (record.eventName !== 'INSERT' && record.eventName !== 'MODIFY') continue;

    const image = record.dynamodb?.NewImage;
    const owner = image?.owner?.S;
    const lessonId = image?.lessonId?.S;
    const completedAt = image?.completedAt?.S;
    // Clamped so one row can never add more than a lesson can be worth.
    const xp = Math.min(Number(image?.xp?.N ?? 0), MAX_LESSON_XP);

    if (!owner || !lessonId || !completedAt || !(xp > 0)) continue;

    const completed = new Date(completedAt);

    if (Number.isNaN(completed.getTime())) continue;

    // Only this week's lessons count towards this week's league.
    if (weekIdOf(completed) !== currentWeek) continue;

    try {
      await addXp(owner.split('::')[0], lessonId, xp, completedAt, currentWeek);
    } catch (error) {
      failed += 1;
      console.error('[leaderboard-sync] Failed to add XP:', error);
    }
  }

  // Throwing makes the stream retry the batch; adding XP is idempotent.
  if (failed > 0) throw new Error(`${failed} leaderboard update(s) failed`);
}

// -----------------------------------------------------------------------------
// AppSync: copy the learner's public name onto their leaderboard rows
// -----------------------------------------------------------------------------

async function syncIdentity(
  sub: string,
  profileId: string,
  rawName: string,
): Promise<boolean> {
  // The caller must own the profile the username is read from.
  const { Item: profile } = await db.send(
    new GetCommand({
      TableName: requiredEnv('USER_PROFILE_TABLE_NAME'),
      Key: { id: profileId },
    }),
  );

  if (!profile || !ownedBy(profile.owner, sub)) return false;

  const displayName = cleanName(rawName);
  const username =
    typeof profile.username === 'string' && profile.username ? profile.username : null;
  const now = new Date().toISOString();

  await db.send(
    new UpdateCommand({
      TableName: requiredEnv('LEAGUE_MEMBER_TABLE_NAME'),
      Key: { userId: sub },
      UpdateExpression:
        'SET #displayName = :name, #username = :username, ' +
        '#league = if_not_exists(#league, :zero), ' +
        '#typename = if_not_exists(#typename, :typename), ' +
        '#createdAt = if_not_exists(#createdAt, :now), #updatedAt = :now',
      ExpressionAttributeNames: {
        '#displayName': 'displayName',
        '#username': 'username',
        '#league': 'league',
        '#typename': '__typename',
        '#createdAt': 'createdAt',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':name': displayName,
        ':username': username,
        ':zero': 0,
        ':typename': 'LeagueMember',
        ':now': now,
      },
    }),
  );

  // Refresh this week's row too, if the learner already has one.
  try {
    await db.send(
      new UpdateCommand({
        TableName: requiredEnv('LEADERBOARD_ENTRY_TABLE_NAME'),
        Key: { weekId: weekIdOf(new Date()), userId: sub },
        UpdateExpression: 'SET #displayName = :name, #username = :username, #updatedAt = :now',
        ConditionExpression: 'attribute_exists(userId)',
        ExpressionAttributeNames: {
          '#displayName': 'displayName',
          '#username': 'username',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':name': displayName,
          ':username': username,
          ':now': now,
        },
      }),
    );
  } catch (error) {
    if (!isConditionalFailure(error)) throw error;
  }

  return true;
}

// -----------------------------------------------------------------------------
// Entry point
// -----------------------------------------------------------------------------

export const handler = async (
  event: StreamEvent | AppSyncEvent,
): Promise<boolean | void> => {
  if ('Records' in event) {
    return handleStream(event);
  }

  const sub = event.identity?.sub;

  if (!sub) throw new Error('Unauthorized');

  const fieldName = event.fieldName ?? event.info?.fieldName;

  if (fieldName !== 'syncLeaderboardIdentity') {
    throw new Error(`Unsupported operation: ${String(fieldName)}`);
  }

  const { profileId = '', displayName = '' } = event.arguments ?? {};

  if (!profileId) return false;

  return syncIdentity(sub, profileId, displayName);
};