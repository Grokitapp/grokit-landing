import { useEffect, useRef, useSyncExternalStore } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';
import {
  previousWeekId,
  weekEndsAt,
  weekIdOf,
} from '../amplify/functions/shared/leaderboard-rules';
import { useGamification } from './gamification';

export {
  COHORT_SIZE,
  DEMOTE_MAX,
  MIN_XP_TO_PROMOTE,
  PROMOTE_MAX,
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
// Fetching
// -----------------------------------------------------------------------------

type Entry = Schema['LeaderboardEntry']['type'];

function publicName(entry: Pick<Entry, 'displayName' | 'username'>): string {
  const name = entry.displayName?.trim();

  if (name && name !== ANONYMOUS_NAME) return name;

  return entry.username?.trim() || ANONYMOUS_NAME;
}

async function fetchLeaderboard(userId: string): Promise<LeaderboardData> {
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

// -----------------------------------------------------------------------------
// Cache (stale-while-revalidate)
//
// The same approach big apps use for feeds and dashboards:
//  - show what we already have instantly, then refresh quietly in the background;
//  - "fresh" data is reused with no network call at all (FRESH_MS);
//  - one request at a time, however many screens ask (request de-duplication);
//  - survives a page reload for a few minutes (sessionStorage);
//  - refreshed when the tab comes back into view, and shortly after the
//    learner earns XP (the server adds XP a moment after a lesson is saved);
//  - a failed refresh never wipes good data off the screen;
//  - thrown away on a new week or a different account.
// -----------------------------------------------------------------------------

/** Data younger than this is served without asking the server. */
const FRESH_MS = 20_000;
/** Data older than this is not reused after a page reload. */
const MAX_AGE_MS = 10 * 60_000;
/** The server records XP a moment after a lesson is saved. */
const XP_SETTLE_MS = 2_500;
const STORAGE_KEY = 'grokit:leaderboard:v1';

interface Store {
  data: LeaderboardData | null;
  fetchedAt: number;
  refreshing: boolean;
  error: boolean;
  userId: string | null;
}

const EMPTY: Store = {
  data: null,
  fetchedAt: 0,
  refreshing: false,
  error: false,
  userId: null,
};

function readSaved(): Store {
  if (typeof window === 'undefined') return EMPTY;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);

    if (!raw) return EMPTY;

    const saved = JSON.parse(raw) as {
      userId: string;
      fetchedAt: number;
      data: Omit<LeaderboardData, 'endsAt'> & { endsAt: string };
    };

    if (
      Date.now() - saved.fetchedAt > MAX_AGE_MS ||
      saved.data.weekId !== weekIdOf(new Date())
    ) {
      return EMPTY;
    }

    return {
      ...EMPTY,
      data: { ...saved.data, endsAt: new Date(saved.data.endsAt) },
      fetchedAt: saved.fetchedAt,
      userId: saved.userId,
    };
  } catch {
    return EMPTY;
  }
}

function save(next: Store) {
  if (typeof window === 'undefined' || !next.data) return;

  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        userId: next.userId,
        fetchedAt: next.fetchedAt,
        data: next.data,
      }),
    );
  } catch {
    // Storage can be full or blocked. The in-memory copy still works.
  }
}

let store: Store = readSaved();
let inflight: Promise<void> | null = null;
let generation = 0;

const listeners = new Set<() => void>();

function setStore(patch: Partial<Store>) {
  store = { ...store, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => store;

function isFresh(): boolean {
  return (
    store.data !== null &&
    Date.now() - store.fetchedAt < FRESH_MS &&
    store.data.weekId === weekIdOf(new Date())
  );
}

/**
 * Loads the leaderboard unless fresh data is already on hand. Pass `force` to
 * always ask the server. Safe to call as often as you like.
 */
export function revalidateLeaderboard(force = false): Promise<void> {
  if (inflight) return inflight;

  if (!force && isFresh()) return Promise.resolve();

  const startedIn = generation;

  setStore({ refreshing: true });

  inflight = (async () => {
    try {
      const { userId } = await getCurrentUser();

      if (startedIn !== generation) return;

      // A different account signed in: never show the previous one's group.
      if (store.userId && store.userId !== userId) {
        setStore({ data: null, fetchedAt: 0 });
      }

      const data = await fetchLeaderboard(userId);

      if (startedIn !== generation) return;

      setStore({ data, userId, fetchedAt: Date.now(), error: false });
      save(store);
    } catch (loadError) {
      console.error('[leaderboard] Failed to load:', loadError);

      if (startedIn === generation) setStore({ error: true });
    } finally {
      if (startedIn === generation) setStore({ refreshing: false });

      inflight = null;
    }
  })();

  return inflight;
}

const forceRefresh = () => revalidateLeaderboard(true);

/** Call on logout so the next account never sees the previous one's data. */
export function resetLeaderboard(): void {
  generation += 1;
  inflight = null;

  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }

  setStore({ ...EMPTY });
}

/**
 * The learner's group for this week. Opens instantly with the last known data
 * and refreshes in the background. Pass `refreshEvery` (ms) on screens that
 * should keep updating while they're open.
 */
export function useLeaderboard(options: { refreshEvery?: number } = {}) {
  const { refreshEvery = 0 } = options;
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const { stats } = useGamification();

  // Load (or refresh) when a screen opens.
  useEffect(() => {
    void revalidateLeaderboard();
  }, []);

  // Refresh when the learner comes back to the tab.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void revalidateLeaderboard();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  // Keep a screen that stays open up to date.
  useEffect(() => {
    if (refreshEvery <= 0) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void revalidateLeaderboard(true);
    }, refreshEvery);

    return () => window.clearInterval(timer);
  }, [refreshEvery]);

  // New XP means the standings changed: refresh once the server has caught up.
  const totalXp = stats?.totalXp;
  const lastXp = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (totalXp === undefined) return;

    const previous = lastXp.current;

    lastXp.current = totalXp;

    if (previous === undefined || previous === totalXp) return;

    const timer = window.setTimeout(() => void revalidateLeaderboard(true), XP_SETTLE_MS);

    return () => window.clearTimeout(timer);
  }, [totalXp]);

  return {
    data: snapshot.data,
    /** True only on the very first load, when there is nothing to show yet. */
    loading: snapshot.data === null && !snapshot.error,
    /** True while a background refresh is running (data is still shown). */
    refreshing: snapshot.refreshing && snapshot.data !== null,
    /** Only set when there is no data to show at all. */
    error: snapshot.error && snapshot.data === null,
    refresh: forceRefresh,
  };
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