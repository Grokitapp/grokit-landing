import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Hub } from 'aws-amplify/utils';

// -----------------------------------------------------------------------------
// A small stale-while-revalidate cache (the same idea as SWR / React Query).
//
//  - Data is kept in memory for the whole session, so moving between pages
//    shows the last known data instantly instead of a loading state.
//  - Data older than `staleMs` is refreshed quietly in the background, and
//    again when the tab regains focus.
//  - Simultaneous requests for the same key share one network call.
//  - After a save, call setCached (we know the new value) or invalidate
//    (refetch it) so every screen stays consistent.
//  - Everything is cleared on sign-out, so accounts never see each other's data.
// -----------------------------------------------------------------------------

interface Entry<T> {
  data: T;
  fetchedAt: number;
}

const entries = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();
const listeners = new Set<() => void>();

// Bumped on sign-out so a request that finishes afterwards can't repopulate the cache.
let generation = 0;

const DEFAULT_STALE_MS = 60_000;

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getCached<T>(key: string): T | undefined {
  return entries.get(key)?.data as T | undefined;
}

export function setCached<T>(key: string, data: T) {
  entries.set(key, { data, fetchedAt: Date.now() });
  emit();
}

/** Keep showing the current data, but refetch it as soon as it is next used. */
export function invalidate(key: string) {
  const entry = entries.get(key);

  if (!entry) return;

  entries.set(key, { data: entry.data, fetchedAt: 0 });
  emit();
}

export function clearCache() {
  generation += 1;
  entries.clear();
  inflight.clear();
  emit();
}

export function fetchCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);

  if (existing) return existing as Promise<T>;

  const startedIn = generation;

  const request = fetcher()
    .then((data) => {
      if (startedIn === generation) {
        entries.set(key, { data, fetchedAt: Date.now() });
        emit();
      }

      return data;
    })
    .finally(() => {
      if (inflight.get(key) === request) inflight.delete(key);
    });

  inflight.set(key, request);

  return request;
}

Hub.listen('auth', ({ payload }) => {
  if (payload.event === 'signedOut') clearCache();
});

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useCachedResource<T>(
  key: string,
  fetcher: () => Promise<T>,
  { staleMs = DEFAULT_STALE_MS }: { staleMs?: number } = {},
) {
  const entry = useSyncExternalStore(
    subscribe,
    () => entries.get(key) as Entry<T> | undefined,
  );

  const [error, setError] = useState<unknown>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  /** Fetches fresh data. Never throws; failures show up in `error`. */
  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      await fetchCached(key, () => fetcherRef.current());
    } catch (caught) {
      console.error(`[cache] Failed to load "${key}":`, caught);
      setError(caught);
    } finally {
      setRefreshing(false);
    }
  }, [key]);

  const fetchedAt = entry?.fetchedAt;

  // Fetch when there is nothing cached yet, or what we have is stale.
  useEffect(() => {
    if (fetchedAt !== undefined && Date.now() - fetchedAt < staleMs) return;

    void refresh();
  }, [key, fetchedAt, staleMs, refresh]);

  // Quietly refresh when the learner comes back to the tab.
  useEffect(() => {
    const onFocus = () => {
      const current = entries.get(key);

      if (!current || Date.now() - current.fetchedAt >= staleMs) void refresh();
    };

    window.addEventListener('focus', onFocus);

    return () => window.removeEventListener('focus', onFocus);
  }, [key, staleMs, refresh]);

  return {
    data: entry?.data,
    /** True only while there is nothing to show yet. */
    loading: entry === undefined && error === null,
    /** A background refresh failing never replaces data we already have. */
    error: entry === undefined ? error : null,
    refreshing,
    refresh,
  };
}