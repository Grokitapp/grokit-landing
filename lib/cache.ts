import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { Hub } from 'aws-amplify/utils';

// -----------------------------------------------------------------------------
// A small stale-while-revalidate cache (the same idea as SWR / React Query).
//
//  - Data is kept in memory for the whole session, so moving between pages
//    shows the last known data instantly instead of a loading state. The
//    skeleton only appears the very first time.
//  - Data older than `staleMs` is refreshed quietly in the background, and
//    again when the tab regains focus. A failed background refresh never
//    replaces data that is already showing.
//  - Simultaneous requests for the same key share one network call.
//  - After a save, call setCached (we know the new value) or invalidate
//    (refetch it) so every screen stays consistent. A response that was already
//    in flight when you edited can't overwrite the edit.
//  - Everything is cleared on sign-out (and when the account changes), so
//    accounts never see each other's data.
//
// Two ways to use it:
//   useCachedQuery(key, fetcher, { enabled, staleMs })   // loading/error/data/setData
//   useCachedResource(key, fetcher, { staleMs })         // original API, still here
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Keys
// -----------------------------------------------------------------------------

export const cacheKeys = {
  journey: (courseId: string) => `journey:${courseId}`,
  myJourneys: 'library:journeys',
  savedJourneys: 'saved-journeys',
  notes: 'library:notes',
  publicJourneys: 'explore:public',
  usage: 'settings:usage',
  myCourseLinks: 'explore:my-course-links',
} as const;

// useCachedResource's default freshness window (useCachedQuery defaults to 0:
// show the cached copy instantly and re-check every time the screen opens).
const DEFAULT_STALE_MS = 60_000;

// When the tab regains focus, refresh anything older than this.
const FOCUS_REVALIDATE_MS = 30_000;

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

interface Entry<T = unknown> {
  data: T | undefined;
  /** When `data` was last confirmed by the server (0 = never). */
  updatedAt: number;
  fetching: boolean;
  error: boolean;
  /** What the last failed fetch threw. */
  failure: unknown;
  /** Set by invalidate(): the data is known to be out of date. */
  invalidated: boolean;
}

const EMPTY_ENTRY: Entry = {
  data: undefined,
  updatedAt: 0,
  fetching: false,
  error: false,
  failure: undefined,
  invalidated: false,
};

type Fetcher = () => Promise<unknown>;

const entries = new Map<string, Entry>();
const listeners = new Map<string, Set<() => void>>();
const mounted = new Map<string, Set<Fetcher>>();
const inflight = new Map<string, Promise<void>>();
// Bumped on every local edit, so a slower in-flight response can't undo it.
const revisions = new Map<string, number>();

// Bumped on sign-out so a request that finishes afterwards can't repopulate the cache.
let generation = 0;
let scope: string | null = null;

const revisionOf = (key: string) => revisions.get(key) ?? 0;

function emit(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function write(key: string, patch: Partial<Entry>) {
  entries.set(key, { ...(entries.get(key) ?? EMPTY_ENTRY), ...patch });
  emit(key);
}

function addListener(key: string, listener: () => void) {
  const set = listeners.get(key) ?? new Set();
  set.add(listener);
  listeners.set(key, set);

  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(key);
  };
}

function addMounted(key: string, fetcher: Fetcher) {
  const set = mounted.get(key) ?? new Set();
  set.add(fetcher);
  mounted.set(key, set);

  return () => {
    set.delete(fetcher);
    if (set.size === 0) mounted.delete(key);
  };
}

const getEntry = (key: string): Entry => entries.get(key) ?? EMPTY_ENTRY;

function isStale(entry: Entry, maxAgeMs: number) {
  return (
    entry.data === undefined ||
    entry.invalidated ||
    Date.now() - entry.updatedAt >= maxAgeMs
  );
}

async function run(key: string, fetcher: Fetcher): Promise<void> {
  const startGeneration = generation;

  // Two attempts: if a local edit lands while we're fetching, our response may
  // be older than that edit, so throw it away and fetch once more.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const startRevision = revisionOf(key);

    write(key, { fetching: true, error: false, failure: undefined });

    try {
      const data = await fetcher();

      if (startGeneration !== generation) return; // signed out / switched account
      if (revisionOf(key) !== startRevision) continue;

      write(key, {
        data,
        updatedAt: Date.now(),
        fetching: false,
        error: false,
        failure: undefined,
        invalidated: false,
      });

      return;
    } catch (failure) {
      if (startGeneration !== generation) return;

      console.error(`[cache] Failed to load "${key}":`, failure);
      write(key, { fetching: false, error: true, failure });

      return;
    }
  }

  write(key, { fetching: false, invalidated: true });
}

/** Fetch `key` now (shares an already running request for the same key). Never throws. */
export function load(key: string, fetcher: Fetcher): Promise<void> {
  const existing = inflight.get(key);

  if (existing) return existing;

  const request = run(key, fetcher).finally(() => {
    if (inflight.get(key) === request) inflight.delete(key);
  });

  inflight.set(key, request);

  return request;
}

// -----------------------------------------------------------------------------
// Imperative API
// -----------------------------------------------------------------------------

export function getCached<T>(key: string): T | undefined {
  return entries.get(key)?.data as T | undefined;
}

/**
 * Update the cache after a local change.
 *
 *  - setCached(key, (current) => next): edits data that is already cached. Does
 *    nothing if that data was never loaded, so a half-empty list can't be
 *    mistaken for the real thing.
 *  - setCached(key, value): stores a value we know, even if nothing was cached.
 */
export function setCached<T>(key: string, updater: (current: T) => T): void;
export function setCached<T>(key: string, value: T): void;
export function setCached<T>(
  key: string,
  valueOrUpdater: T | ((current: T) => T),
): void {
  if (typeof valueOrUpdater === 'function') {
    const entry = entries.get(key);

    if (!entry || entry.data === undefined) return;

    const next = (valueOrUpdater as (current: T) => T)(entry.data as T);

    revisions.set(key, revisionOf(key) + 1);
    write(key, { data: next });

    return;
  }

  revisions.set(key, revisionOf(key) + 1);
  write(key, {
    data: valueOrUpdater,
    updatedAt: Date.now(),
    invalidated: false,
    error: false,
    failure: undefined,
  });
}

/**
 * Keep showing the current data, but refetch it. If a screen is showing it, it
 * refreshes right away; otherwise on the next visit.
 */
export function invalidate(key: string): void {
  const entry = entries.get(key);

  if (!entry) return;

  write(key, { invalidated: true });

  const fetcher = mounted.get(key)?.values().next().value;

  if (fetcher) void load(key, fetcher);
}

/** Re-fetch `key` in the background, but only if it's already in the cache. */
export function refreshIfCached(key: string, fetcher: Fetcher): Promise<void> {
  const entry = entries.get(key);

  if (!entry || entry.data === undefined) return Promise.resolve();

  return load(key, fetcher);
}

/** Forget cached data that no screen is showing (e.g. a deleted journey). */
export function removeCached(key: string): void {
  if (!mounted.has(key)) entries.delete(key);
}

/** Wipe everything. Also runs automatically on sign-out. */
export function clearCache(): void {
  generation += 1;

  const keys = [...entries.keys()];

  entries.clear();
  inflight.clear();
  revisions.clear();
  keys.forEach(emit);
}

/** Tell the cache who is signed in; switching accounts wipes it. */
export function setCacheScope(next: string | null | undefined): void {
  const value = next ?? null;

  if (scope !== null && value !== scope) clearCache();

  scope = value;
}

/**
 * Fetch (or reuse an identical request already running) and return the data.
 * Unlike load(), this rejects when the request fails.
 */
export async function fetchCached<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  await load(key, fetcher);

  const entry = entries.get(key);

  if (entry?.error) {
    throw entry.failure ?? new Error(`Failed to load "${key}"`);
  }

  if (!entry || entry.data === undefined) {
    throw new Error(`"${key}" was cleared while loading`);
  }

  return entry.data as T;
}

Hub.listen('auth', ({ payload }) => {
  if (payload.event === 'signedOut') clearCache();
});

// -----------------------------------------------------------------------------
// Hooks
// -----------------------------------------------------------------------------

interface QueryOptions {
  /** Set false to hold off (e.g. a tab that hasn't been opened yet). */
  enabled?: boolean;
  /**
   * How long cached data counts as fresh. 0 (default) shows the cached result
   * instantly and still re-checks every time the screen opens. A larger value,
   * e.g. 5 minutes for rarely-changing data, skips the re-check while fresh.
   */
  staleMs?: number;
}

export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  { enabled = true, staleMs = 0 }: QueryOptions = {},
) {
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const subscribe = useCallback(
    (listener: () => void) => addListener(key, listener),
    [key],
  );
  const getSnapshot = useCallback(() => getEntry(key) as Entry<T>, [key]);

  const entry = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!enabled) return;

    const thunk: Fetcher = () => fetcherRef.current();
    const unregister = addMounted(key, thunk);

    if (isStale(getEntry(key), staleMs)) void load(key, thunk);

    // Coming back to the tab: quietly refresh anything that has aged.
    const revalidate = () => {
      if (document.visibilityState === 'hidden') return;

      const current = getEntry(key);

      if (current.fetching) return;

      if (isStale(current, Math.max(staleMs, FOCUS_REVALIDATE_MS))) {
        void load(key, thunk);
      }
    };

    window.addEventListener('focus', revalidate);
    document.addEventListener('visibilitychange', revalidate);

    return () => {
      window.removeEventListener('focus', revalidate);
      document.removeEventListener('visibilitychange', revalidate);
      unregister();
    };
  }, [key, enabled, staleMs]);

  const refetch = useCallback(
    () => load(key, () => fetcherRef.current()),
    [key],
  );

  const setData = useCallback(
    (updater: (current: T | null) => T) =>
      setCached<T>(key, (current: T) => updater(current)),
    [key],
  );

  const hasData = entry.data !== undefined;

  return {
    data: hasData ? (entry.data as T) : null,
    /** True only when there is nothing to show yet (first load / retry). */
    loading: enabled && !hasData && !entry.error,
    /** True while a background refresh runs behind data that is already showing. */
    refreshing: entry.fetching && hasData,
    /** Only reported when there is no data to fall back on. */
    error: !hasData && entry.error,
    /** What the failed request threw (only when `error` is true). */
    errorValue: !hasData && entry.error ? entry.failure : undefined,
    refetch,
    setData,
  };
}

/**
 * The original hook, unchanged for existing callers: `data` is undefined until
 * loaded, `error` is the thrown value (or null), and `refresh` never throws.
 */
export function useCachedResource<T>(
  key: string,
  fetcher: () => Promise<T>,
  { staleMs = DEFAULT_STALE_MS }: { staleMs?: number } = {},
) {
  const query = useCachedQuery(key, fetcher, { staleMs });

  return {
    data: query.data ?? undefined,
    loading: query.loading,
    error: query.error ? (query.errorValue ?? new Error('REQUEST_FAILED')) : null,
    refreshing: query.refreshing,
    refresh: query.refetch,
  };
}