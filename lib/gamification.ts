import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

const USER_POOL = { authMode: 'userPool' } as const;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ProgressEntry {
  courseId: string;
  lessonId: string;
  completedAt: string | null;
  xp: number;
}

export type BadgeIcon =
  | 'footprints'
  | 'book'
  | 'medal'
  | 'flame'
  | 'trophy'
  | 'award'
  | 'star'
  | 'zap'
  | 'target';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: BadgeIcon;
  value: number;
  target: number;
  earned: boolean;
}

export interface WeekDay {
  key: string;
  label: string;
  active: boolean;
  isToday: boolean;
  isFuture: boolean;
  xp: number;
}

export interface GamificationStats {
  totalXp: number;
  level: number;
  levelXp: number;
  levelSize: number;
  currentStreak: number;
  longestStreak: number;
  /** True when a lesson was completed today (the streak is safe for today). */
  streakActiveToday: boolean;
  todayXp: number;
  lessonsCompleted: number;
  firstActivityAt: Date | null;
  week: WeekDay[];
  activeDays: Set<string>;
  badges: Badge[];
}

// -----------------------------------------------------------------------------
// Date helpers (everything is based on the learner's local calendar day)
// -----------------------------------------------------------------------------

const pad = (value: number) => String(value).padStart(2, '0');

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dayNumber(key: string): number {
  const [year, month, day] = key.split('-').map(Number);

  return Math.round(Date.UTC(year, month - 1, day) / 86_400_000);
}

const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// -----------------------------------------------------------------------------
// Stats
// -----------------------------------------------------------------------------

const LEVEL_SIZE = 100;

export function computeStats(
  entries: ProgressEntry[],
  now: Date = new Date(),
): GamificationStats {
  // A lesson only counts once, even if it was completed more than once.
  const sorted = [...entries].sort((a, b) =>
    (a.completedAt ?? '').localeCompare(b.completedAt ?? ''),
  );
  const unique = new Map<string, ProgressEntry>();

  for (const entry of sorted) {
    if (!unique.has(entry.lessonId)) unique.set(entry.lessonId, entry);
  }

  const lessons = [...unique.values()];

  const xpByDay = new Map<string, number>();
  let totalXp = 0;
  let firstActivityAt: Date | null = null;

  for (const entry of lessons) {
    totalXp += entry.xp;

    if (!entry.completedAt) continue;

    const completed = new Date(entry.completedAt);

    if (Number.isNaN(completed.getTime())) continue;

    if (!firstActivityAt || completed < firstActivityAt) {
      firstActivityAt = completed;
    }

    const key = dayKey(completed);
    xpByDay.set(key, (xpByDay.get(key) ?? 0) + entry.xp);
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayKey = dayKey(today);
  const todayXp = xpByDay.get(todayKey) ?? 0;
  const streakActiveToday = xpByDay.has(todayKey);

  // Current streak: consecutive active days ending today (or yesterday, so the
  // streak stays alive until the day is over).
  const cursor = new Date(today);

  if (!streakActiveToday) cursor.setDate(cursor.getDate() - 1);

  let currentStreak = 0;

  while (xpByDay.has(dayKey(cursor))) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Longest streak across all history.
  const orderedDays = [...xpByDay.keys()].map(dayNumber).sort((a, b) => a - b);
  let longestStreak = 0;
  let run = 0;

  orderedDays.forEach((value, index) => {
    run = index > 0 && value - orderedDays[index - 1] === 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
  });

  // Current week, Monday to Sunday.
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  const week: WeekDay[] = WEEK_LABELS.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    const key = dayKey(date);

    return {
      key,
      label,
      active: xpByDay.has(key),
      isToday: key === todayKey,
      isFuture: date > today,
      xp: xpByDay.get(key) ?? 0,
    };
  });

  const lessonsCompleted = lessons.length;

  const badge = (
    id: string,
    title: string,
    description: string,
    icon: BadgeIcon,
    value: number,
    target: number,
  ): Badge => ({
    id,
    title,
    description,
    icon,
    value: Math.min(value, target),
    target,
    earned: value >= target,
  });

  const badges: Badge[] = [
    badge('first-step', 'First step', 'Complete your first lesson', 'footprints', lessonsCompleted, 1),
    badge('getting-going', 'Getting going', 'Complete 10 lessons', 'book', lessonsCompleted, 10),
    badge('seeker', 'Knowledge seeker', 'Complete 25 lessons', 'medal', lessonsCompleted, 25),
    badge('on-fire', 'On fire', 'Reach a 3 day streak', 'flame', longestStreak, 3),
    badge('week-warrior', 'Week warrior', 'Reach a 7 day streak', 'trophy', longestStreak, 7),
    badge('unstoppable', 'Unstoppable', 'Reach a 30 day streak', 'award', longestStreak, 30),
    badge('century', 'Century', 'Earn 100 XP', 'star', totalXp, 100),
    badge('rising-star', 'Rising star', 'Earn 500 XP', 'zap', totalXp, 500),
  ];

  return {
    totalXp,
    level: Math.floor(totalXp / LEVEL_SIZE) + 1,
    levelXp: totalXp % LEVEL_SIZE,
    levelSize: LEVEL_SIZE,
    currentStreak,
    longestStreak,
    streakActiveToday,
    todayXp,
    lessonsCompleted,
    firstActivityAt,
    week,
    activeDays: new Set(xpByDay.keys()),
    badges,
  };
}

// -----------------------------------------------------------------------------
// Shared store (AppShell, the journey page and Profile all read the same data)
// -----------------------------------------------------------------------------

interface StoreState {
  entries: ProgressEntry[] | null;
  loading: boolean;
  error: boolean;
}

let state: StoreState = {
  entries: null,
  loading: false,
  error: false,
};

const listeners = new Set<() => void>();

function setState(patch: Partial<StoreState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;

async function fetchAllProgress(): Promise<ProgressEntry[]> {
  const entries: ProgressEntry[] = [];
  let nextToken: string | null | undefined;

  do {
    const { data, errors, nextToken: token } =
      await client.models.UserProgress.list({
        limit: 1000,
        nextToken,
        ...USER_POOL,
      });

    if (errors?.length) {
      throw new Error(errors.map((error) => error.message).join('; '));
    }

    for (const item of data ?? []) {
      entries.push({
        courseId: item.courseId ?? '',
        lessonId: item.lessonId ?? '',
        completedAt: item.completedAt ?? null,
        xp: item.xp ?? 0,
      });
    }

    nextToken = token;
  } while (nextToken);

  return entries;
}

let inflight: Promise<void> | null = null;
let lastFetchAt = 0;

export function refreshGamification(force = false): Promise<void> {
  if (inflight) return inflight;

  if (!force && state.entries && Date.now() - lastFetchAt < 3000) {
    return Promise.resolve();
  }

  if (state.entries === null) setState({ loading: true });

  inflight = fetchAllProgress()
    .then((entries) => {
      lastFetchAt = Date.now();
      setState({ entries, loading: false, error: false });
    })
    .catch((error) => {
      console.error('[gamification] Failed to load progress:', error);
      setState({ loading: false, error: state.entries === null });
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/** Call on logout so the next account never sees the previous one's data. */
export function resetGamification(): void {
  lastFetchAt = 0;
  setState({
    entries: null,
    loading: false,
    error: false,
  });
}

/**
 * Streak, XP, level and badges, derived from UserProgress.
 * Pass `refreshKey` (e.g. the route pathname) to refetch when it changes.
 */
export function useGamification(refreshKey?: string) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    void refreshGamification();
  }, [refreshKey]);

  const stats = useMemo(
    () => (snapshot.entries ? computeStats(snapshot.entries) : null),
    [snapshot.entries],
  );

  return {
    stats,
    loading: snapshot.loading && snapshot.entries === null,
    error: snapshot.error,
    refresh: () => refreshGamification(true),
  };
}