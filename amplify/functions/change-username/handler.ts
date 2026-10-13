import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';

import {
  USERNAME_CHANGE_LIMIT,
  USERNAME_CHANGE_WINDOW_MS,
  getUsernameChangeStatus,
  validateUsername,
} from '../shared/username-rules';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

interface AppSyncEvent {
  fieldName?: string;
  info?: { fieldName?: string };
  arguments: { username?: string; profileId?: string };
  identity?: { sub?: string } | null;
}

interface UsernameResult {
  ok: boolean;
  code:
    | 'OK'
    | 'AVAILABLE'
    | 'UNCHANGED'
    | 'INVALID'
    | 'TAKEN'
    | 'RATE_LIMITED'
    | 'CONFLICT'
    | 'NO_PROFILE';
  message?: string;
  username?: string;
  nextChangeAt?: string;
  changesRemaining?: number;
}

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) throw new Error(`Missing environment variable ${name}`);

  return value;
}

/** Amplify stores the owner as "<sub>::<username>" (or the bare sub). */
function ownedBy(owner: unknown, sub: string): boolean {
  return (
    typeof owner === 'string' &&
    (owner === sub || owner.startsWith(`${sub}::`))
  );
}

async function checkUsername(sub: string, raw: string): Promise<UsernameResult> {
  const validation = validateUsername(raw);

  if (!validation.ok) {
    return { ok: false, code: 'INVALID', message: validation.message };
  }

  const { Item } = await db.send(
    new GetCommand({
      TableName: requiredEnv('USERNAME_CLAIM_TABLE_NAME'),
      Key: { handle: validation.handle },
    }),
  );

  if (!Item) {
    return { ok: true, code: 'AVAILABLE', username: validation.handle };
  }

  if (Item.owner === sub) {
    return { ok: true, code: 'UNCHANGED', username: validation.handle };
  }

  return { ok: false, code: 'TAKEN', message: 'That username is taken.' };
}

async function changeUsername(
  sub: string,
  profileId: string,
  raw: string,
): Promise<UsernameResult> {
  const validation = validateUsername(raw);

  if (!validation.ok) {
    return { ok: false, code: 'INVALID', message: validation.message };
  }

  const handle = validation.handle;
  const profileTable = requiredEnv('USER_PROFILE_TABLE_NAME');
  const claimTable = requiredEnv('USERNAME_CLAIM_TABLE_NAME');

  // The caller must own the profile they are changing.
  const { Item: profile } = await db.send(
    new GetCommand({
      TableName: profileTable,
      Key: { id: profileId },
      ConsistentRead: true,
    }),
  );

  if (!profile || !ownedBy(profile.owner, sub)) {
    return { ok: false, code: 'NO_PROFILE', message: 'We couldn’t find your profile.' };
  }

  const current: string | undefined = profile.username || undefined;

  if (current === handle) {
    return { ok: true, code: 'UNCHANGED', username: handle };
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const history: string[] = Array.isArray(profile.usernameChangedAt)
    ? profile.usernameChangedAt
    : [];
  const version: number = typeof profile.usernameVersion === 'number' ? profile.usernameVersion : 0;

  // Setting the very first username is free; every later one counts.
  let nextHistory = history;

  if (current) {
    const status = getUsernameChangeStatus(history, nowMs);

    if (status.remaining === 0) {
      return {
        ok: false,
        code: 'RATE_LIMITED',
        message: 'You’ve used all your username changes for now.',
        nextChangeAt: status.nextAvailableAt?.toISOString(),
        changesRemaining: 0,
      };
    }

    nextHistory = [
      ...history.filter((value) => nowMs - new Date(value).getTime() < USERNAME_CHANGE_WINDOW_MS),
      nowIso,
    ].slice(-USERNAME_CHANGE_LIMIT);
  }

  // One atomic transaction: claim the new name (fails if taken), update the
  // profile (fails if it changed since we read it), release the old name.
  const versionCondition =
    version === 0
      ? 'attribute_not_exists(#version)'
      : '#version = :expectedVersion';

  try {
    await db.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: claimTable,
              Item: {
                handle,
                owner: sub,
                __typename: 'UsernameClaim',
                createdAt: nowIso,
                updatedAt: nowIso,
              },
              ConditionExpression: 'attribute_not_exists(handle)',
            },
          },
          {
            Update: {
              TableName: profileTable,
              Key: { id: profileId },
              UpdateExpression:
                'SET #username = :username, #changedAt = :changedAt, #version = :nextVersion, #updatedAt = :now',
              ConditionExpression: `attribute_exists(id) AND ${versionCondition}`,
              ExpressionAttributeNames: {
                '#username': 'username',
                '#changedAt': 'usernameChangedAt',
                '#version': 'usernameVersion',
                '#updatedAt': 'updatedAt',
              },
              ExpressionAttributeValues: {
                ':username': handle,
                ':changedAt': nextHistory,
                ':nextVersion': version + 1,
                ':now': nowIso,
                ...(version === 0 ? {} : { ':expectedVersion': version }),
              },
            },
          },
          ...(current
            ? [
                {
                  Delete: {
                    TableName: claimTable,
                    Key: { handle: current },
                    // Only ever release a claim that is ours (or already gone).
                    ConditionExpression: 'attribute_not_exists(handle) OR #owner = :sub',
                    ExpressionAttributeNames: { '#owner': 'owner' },
                    ExpressionAttributeValues: { ':sub': sub },
                  },
                },
              ]
            : []),
        ],
      }),
    );
  } catch (error) {
    const reasons: { Code?: string }[] | undefined = (
      error as { CancellationReasons?: { Code?: string }[] }
    ).CancellationReasons;

    if ((error as { name?: string }).name === 'TransactionCanceledException' && reasons) {
      if (reasons[0]?.Code === 'ConditionalCheckFailed') {
        return { ok: false, code: 'TAKEN', message: 'That username is taken.' };
      }

      if (reasons[1]?.Code === 'ConditionalCheckFailed') {
        return {
          ok: false,
          code: 'CONFLICT',
          message: 'Your profile changed while saving. Please try again.',
        };
      }
    }

    throw error;
  }

  const after = getUsernameChangeStatus(nextHistory, nowMs);

  return {
    ok: true,
    code: 'OK',
    username: handle,
    changesRemaining: after.remaining,
    nextChangeAt: after.nextAvailableAt?.toISOString(),
  };
}

export const handler = async (event: AppSyncEvent): Promise<UsernameResult> => {
  const sub = event.identity?.sub;

  if (!sub) throw new Error('Unauthorized');

  const { username = '', profileId = '' } = event.arguments ?? {};
  const fieldName = event.fieldName ?? event.info?.fieldName;

  switch (fieldName) {
    case 'checkUsername':
      return checkUsername(sub, username);

    case 'changeUsername':
      if (!profileId) {
        return { ok: false, code: 'NO_PROFILE', message: 'We couldn’t find your profile.' };
      }

      return changeUsername(sub, profileId, username);

    default:
      throw new Error(`Unsupported operation: ${String(fieldName)}`);
  }
};