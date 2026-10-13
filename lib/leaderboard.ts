import { useCallback, useEffect, useRef, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';
import {
  previousWeekId,
  weekEndsAt,
  weekIdOf,
} from '../amplify/functions/shared/leaderboard-rules';

export {
  COHORT_SIZE,
  MIN_XP_TO_PROMOTE,
  getZoneSizes,
} from '../amplify/functions/shared/leaderboard-rules';

const client = generateClient<Schema>();

const USER_POOL = { authMode: 'userPool' } as const;

const ANONYMOUS_NAME = 'Learner';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface LeaderboardRow {
  userId: string;
  name: string;
  xp: number;
  rank: number;
  isMe: boolean;
}

export type WeekResult = 'PROMOTED' | 'DEMOTED' | 'STAYED';

export interface LastWeek {
  rank: number;
  xp: number;
  result: WeekResult;
}

export interface LeaderboardData {
  weekId: string;
  endsAt: Date;
  /** 0 = Bronze ... 7 = Diamond. */
  leagueIndex: number;
  /** True once the learner has earned XP this week and is in a group. */
  joined: boolean;
  /** Everyone in the learner's group, best first. Empty until they join. */
  rows: LeaderboardRow[];
  myRank: number | null;
  myXp: number;
  /** How last week ended, if the learner took part. */
  lastWeek: LastWeek | null;
}

// -----------------------------------------------------------------------------
// Loading
// -----------------------------------------------------------------------------

type Entry = Schema['LeaderboardEntry']['type'];

function publicName(entry: Pick<Entry, 'displayName' | 'username'>): string {
  const name = entry.displayName?.trim();

  if (name && name !== ANONYMOUS_NAME) return name;

  return entry.username?.trim() || ANONYMOUS_NAME;
}

export async function loadLeaderboard(): Promise<LeaderboardData> {
  const { userId } = await getCurrentUser();
  const now = new Date();
  const weekId = weekIdOf(now);

  const [memberResult, entryResult] = await Promise.all([
    client.models.LeagueMember.get({ userId }, USER_POOL),
    client.models.LeaderboardEntry.get({ weekId, userId }, USER_POOL),
  ]);

  if (memberResult.errors?.length) throw new Error(memberResult.errors[0].message);
  if (entryResult.errors?.length) throw new Error(entryResult.errors[0].message);

  const member = memberResult.data;
  const mine = entryResult.data;

  let rows: LeaderboardRow[] = [];

  if (mine) {
    const { data, errors } = await client.models.LeaderboardEntry.listByCohort(
      { cohortId: mine.cohortId },
      { ...USER_POOL, sortDirection: 'DESC', limit: 100 },
    );

    if (errors?.length) throw new Error(errors[0].message);

    rows = [...(data ?? [])]
      // Same tie-break the weekly function uses: reached the XP first wins.
      .sort(
        (a, b) =>
          b.xp - a.xp || (a.lastXpAt ?? '').localeCompare(b.lastXpAt ?? ''),
      )
      .map((entry, index) => ({
        userId: entry.userId,
        name: publicName(entry),
        xp: entry.xp,
        rank: index + 1,
        isMe: entry.userId === userId,
      }));
  }

  const me = rows.find((row) => row.isMe);

  const lastWeek: LastWeek | null =
    member?.lastWeekId === previousWeekId(now) &&
    member.lastResult &&
    member.lastRank
      ? {
          rank: member.lastRank,
          xp: member.lastWeekXp ?? 0,
          result: member.lastResult as WeekResult,
        }
      : null;

  return {
    weekId,
    endsAt: weekEndsAt(now),
    leagueIndex: mine?.league ?? member?.league ?? 0,
    joined: Boolean(mine),
    rows,
    myRank: me?.rank ?? null,
    myXp: me?.xp ?? 0,
    lastWeek,
  };
}

/**
 * The learner's group for this week, plus a `refresh` to load it again.
 * Safe to use on several screens; each loads its own copy.
 */
export function useLeaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const next = await loadLeaderboard();

      if (!mounted.current) return;

      setData(next);
      setError(false);
    } catch (loadError) {
      console.error('[leaderboard] Failed to load:', loadError);

      if (mounted.current) setError(true);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();

    return () => {
      mounted.current = false;
    };
  }, [refresh]);

  return { data, loading: loading && data === null, error: error && data === null, refresh };
}

// -----------------------------------------------------------------------------
// Public name
// -----------------------------------------------------------------------------

let lastSynced = '';

/**
 * Copies the learner's name and username onto their leaderboard rows so other
 * learners see them. Cheap to call often: it only talks to the server when the
 * values changed. Returns true when the server accepted it.
 */
export async function ensureLeaderboardIdentity(
  profileId: string,
  displayName: string,
): Promise<boolean> {
  const name = displayName.trim() || ANONYMOUS_NAME;
  const key = `${profileId}|${name}`;

  if (key === lastSynced) return false;

  try {
    const { data, errors } = await client.mutations.syncLeaderboardIdentity({
      profileId,
      displayName: name,
    });

    if (errors?.length || !data) return false;

    lastSynced = key;

    return true;
  } catch (syncError) {
    console.error('[leaderboard] Failed to sync name:', syncError);

    return false;
  }
}