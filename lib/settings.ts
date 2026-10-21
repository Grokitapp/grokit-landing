import { useSyncExternalStore } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';

import type { Schema } from '../amplify/data/resource';
import { DEVICE_VOICE_ID, findVoice, istDayKey } from '../amplify/functions/shared/voices';
import {
  FREE_LIMITS,
  counterBucket,
  nextReset,
  type LimitedKind,
} from '../amplify/functions/shared/usage-limits';
import { cacheKeys, invalidate, useCachedQuery } from './cache';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_OPTIONS: ReadonlyArray<{ value: ThemePreference; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export interface AppSettings {
  /** Language used for generated lessons (pass to generate-outline / generate-lesson). */
  contentLanguage: string;
  /** Language of buttons, navigation and other app chrome. */
  appLanguage: string;
  /** Light / dark / follow the device. */
  theme: ThemePreference;
  soundEffects: boolean;
  /** Speech rate for read aloud: 0.85 slow, 1 normal, 1.2 fast. */
  readAloudSpeed: number;
  /** A Polly voice id (see shared/voices.ts), or 'device' for the browser's own voice. */
  readAloudVoice: string;
  /** Start reading each lesson card out loud automatically. */
  autoReadAloud: boolean;
}

export const CONTENT_LANGUAGES = [
  'English',
] as const;

export const APP_LANGUAGES = [
  'English',
] as const;

const STORAGE_KEY = 'grokit.settings.v1';

const DEFAULTS: AppSettings = {
  contentLanguage: 'English',
  appLanguage: 'English',
  // The app is dark today, so keep that as the default rather than "system".
  theme: 'dark',
  soundEffects: true,
  readAloudSpeed: 1,
  // The device voice is free and unlimited, so it is the starting point.
  // Natural voices are one tap away in Settings (they have a daily limit).
  readAloudVoice: DEVICE_VOICE_ID,
  autoReadAloud: false,
};

const isTheme = (value: unknown): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system';

// -----------------------------------------------------------------------------
// Persistence (per device; swap for a backend field later if you want sync)
// -----------------------------------------------------------------------------

function load(): AppSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return DEFAULTS;

    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      contentLanguage:
        typeof parsed.contentLanguage === 'string' && parsed.contentLanguage
          ? parsed.contentLanguage
          : DEFAULTS.contentLanguage,
      appLanguage:
        typeof parsed.appLanguage === 'string' && parsed.appLanguage
          ? parsed.appLanguage
          : DEFAULTS.appLanguage,
      theme: isTheme(parsed.theme) ? parsed.theme : DEFAULTS.theme,
      soundEffects:
        typeof parsed.soundEffects === 'boolean'
          ? parsed.soundEffects
          : DEFAULTS.soundEffects,
      readAloudSpeed:
        typeof parsed.readAloudSpeed === 'number' &&
        parsed.readAloudSpeed >= 0.5 &&
        parsed.readAloudSpeed <= 2
          ? parsed.readAloudSpeed
          : DEFAULTS.readAloudSpeed,
      readAloudVoice:
        typeof parsed.readAloudVoice === 'string' &&
        (parsed.readAloudVoice === DEVICE_VOICE_ID || findVoice(parsed.readAloudVoice))
          ? parsed.readAloudVoice
          : DEFAULTS.readAloudVoice,
      autoReadAloud:
        typeof parsed.autoReadAloud === 'boolean'
          ? parsed.autoReadAloud
          : DEFAULTS.autoReadAloud,
    };
  } catch {
    return DEFAULTS;
  }
}

const systemDarkQuery =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

function resolveTheme(theme: ThemePreference): 'light' | 'dark' {
  if (theme === 'system') return systemDarkQuery?.matches === false ? 'light' : 'dark';
  return theme;
}

function applyToDocument(settings: AppSettings) {
  const root = document.documentElement;
  const resolved = resolveTheme(settings.theme);

  // Hook for CSS: [data-theme='light'] { ...tokens }
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  root.lang = settings.appLanguage === 'English' ? 'en' : root.lang || 'en';
}

let state: AppSettings = load();
applyToDocument(state);

// Keep "System" in sync when the device switches between light and dark.
systemDarkQuery?.addEventListener('change', () => {
  if (state.theme === 'system') applyToDocument(state);
});

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;

export function updateSettings(patch: Partial<AppSettings>): void {
  state = { ...state, ...patch };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be blocked (private mode); the setting still applies this session.
  }

  applyToDocument(state);
  listeners.forEach((listener) => listener());
}

/** Read anywhere (e.g. before playing a sound): `getSettings().soundEffects`. */
export function getSettings(): AppSettings {
  return state;
}

export function useSettings(): AppSettings {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// -----------------------------------------------------------------------------
// Usage
//
// Everything here is counted from the learner's own saved data, so the numbers
// on the Settings and Usage pages are real. Nothing is made up.
// -----------------------------------------------------------------------------

export type UsageKey = 'lessonsTaken' | 'lessonsGenerated' | 'coursesCreated';

export interface UsageItem {
  used: number;
  /** null while no limit is enforced: the page then shows the count only. */
  limit: number | null;
  /** "day" counters reset at midnight IST, "month" counters on the 1st. */
  period: 'day' | 'month';
  /** ISO timestamp of the next reset. */
  resetsAt: string;
  /** IANA zone used to display the reset time. */
  timeZone?: string;
}

export interface UsageSnapshot {
  plan: 'free' | 'pro';
  items: Record<UsageKey, UsageItem>;
}

export const USAGE_LABELS: Record<UsageKey, string> = {
  lessonsTaken: 'Lessons completed',
  lessonsGenerated: 'Lessons generated',
  coursesCreated: 'Courses created',
};

export const USAGE_GROUPS: ReadonlyArray<{ title: string; keys: UsageKey[] }> = [
  { title: 'Learning', keys: ['lessonsTaken'] },
  { title: 'Creation', keys: ['coursesCreated', 'lessonsGenerated'] },
];

/**
 * Free-plan limits. The numbers live in shared/usage-limits.ts, the same file
 * the backend functions enforce them from, so this page can never promise a
 * limit that nothing checks. A null means "no limit": the page then shows the
 * count only.
 */
export const USAGE_LIMITS: Record<UsageKey, number | null> = {
  lessonsTaken: null,
  lessonsGenerated: FREE_LIMITS.lessonsGenerated.limit,
  coursesCreated: FREE_LIMITS.coursesCreated.limit,
};

/** Flip to true once a /pricing page exists. Until then the upgrade card is hidden. */
export const PRICING_ENABLED = false;

export const hasUsageLimits = (): boolean =>
  Object.values(USAGE_LIMITS).some((limit) => limit !== null);

// -----------------------------------------------------------------------------
// Formatting
// -----------------------------------------------------------------------------

const USAGE_TIME_ZONE = 'Asia/Kolkata';

/** Formats a reset instant in India Standard Time. */
export function formatReset(resetsAt: string, timeZone = USAGE_TIME_ZONE): string {
  const date = new Date(resetsAt);

  if (Number.isNaN(date.getTime())) return '';

  const day = new Intl.DateTimeFormat('en-IN', {
    timeZone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
  const time = new Intl.DateTimeFormat('en-IN', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  return `Resets ${day} at ${time}`;
}

// -----------------------------------------------------------------------------
// Period boundaries (India Standard Time, which has no daylight saving)
// -----------------------------------------------------------------------------

const DAY_MS = 86_400_000;

function istParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: USAGE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value);

  return { year: part('year'), month: part('month'), day: part('day') };
}

const pad = (value: number) => String(value).padStart(2, '0');

/** Midnight IST at the start of the IST calendar day containing `date`. */
export function istDayStart(date: Date): Date {
  const { year, month, day } = istParts(date);

  return new Date(`${year}-${pad(month)}-${pad(day)}T00:00:00+05:30`);
}

/** Midnight IST at the start of the IST calendar month containing `date`. */
export function istMonthStart(date: Date): Date {
  const { year, month } = istParts(date);

  return new Date(`${year}-${pad(month)}-01T00:00:00+05:30`);
}

export function istNextMonthStart(date: Date): Date {
  const { year, month } = istParts(date);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  return new Date(`${nextYear}-${pad(nextMonth)}-01T00:00:00+05:30`);
}

// -----------------------------------------------------------------------------
// Data
// -----------------------------------------------------------------------------

// Created on first use, not at import time: this file loads very early (it applies
// the saved theme), possibly before Amplify has been configured.
let dataClient: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  dataClient ??= generateClient<Schema>();

  return dataClient;
}

interface CountPage {
  data: readonly unknown[] | null;
  errors?: readonly { message: string }[];
  nextToken?: string | null;
}

/** Counts every row a filtered list returns, following pagination to the end. */
async function countRows(fetchPage: (nextToken?: string | null) => Promise<CountPage>): Promise<number> {
  let total = 0;
  let nextToken: string | null | undefined;

  do {
    const page = await fetchPage(nextToken);

    if (page.errors?.length) {
      throw new Error(page.errors.map((error) => error.message).join('; '));
    }

    total += page.data?.length ?? 0;
    nextToken = page.nextToken;
  } while (nextToken);

  return total;
}

const USER_POOL = { authMode: 'userPool' } as const;

/**
 * How much of a limited action the learner has used this period (today or this month). The backend keeps
 * these counts as it enforces the limits (see UsageCounter), so this is
 * exactly what it checks.
 */
export async function readUsageCount(kind: LimitedKind): Promise<number> {
  const { userId } = await getCurrentUser();

  const { data, errors } = await getClient().models.UsageCounter.get(
    { userId, bucket: counterBucket(kind, istDayKey()) },
    { selectionSet: ['count'], ...USER_POOL },
  );

  if (errors?.length) {
    throw new Error(errors.map((error) => error.message).join('; '));
  }

  return data?.count ?? 0;
}

export async function fetchUsage(): Promise<UsageSnapshot> {
  const now = new Date();
  const dayStart = istDayStart(now).toISOString();

  const [lessonsTaken, lessonsGenerated, coursesCreated] = await Promise.all([
    // Lessons finished today. One progress row is saved per finished lesson.
    countRows((nextToken) =>
      getClient().models.UserProgress.list({
        filter: { completedAt: { ge: dayStart } },
        selectionSet: ['id'],
        limit: 1000,
        nextToken,
        ...USER_POOL,
      }),
    ),
    // The two creation counters are kept by the backend as it enforces the
    // limits, so what is shown here is exactly what is checked.
    readUsageCount('lessonsGenerated'),
    readUsageCount('coursesCreated'),
  ]);

  const nextMidnight = new Date(istDayStart(now).getTime() + DAY_MS).toISOString();

  const item = (
    key: UsageKey,
    used: number,
    period: UsageItem['period'],
    resetsAt: string,
  ): UsageItem => ({
    used,
    limit: USAGE_LIMITS[key],
    period,
    resetsAt,
    timeZone: USAGE_TIME_ZONE,
  });

  return {
    plan: 'free',
    items: {
      lessonsTaken: item('lessonsTaken', lessonsTaken, 'day', nextMidnight),
      lessonsGenerated: item(
        'lessonsGenerated',
        lessonsGenerated,
        FREE_LIMITS.lessonsGenerated.period,
        nextReset('lessonsGenerated', now),
      ),
      coursesCreated: item(
        'coursesCreated',
        coursesCreated,
        FREE_LIMITS.coursesCreated.period,
        nextReset('coursesCreated', now),
      ),
    },
  };
}

/** How long a loaded usage snapshot counts as fresh before it is re-checked. */
const USAGE_STALE_MS = 20_000;

/** Call after something that changes the counts (a lesson or journey was created). */
export function invalidateUsage(): void {
  invalidate(cacheKeys.usage);
}

/**
 * Usage numbers, served from the shared cache: opening Settings or Usage again
 * shows the last numbers instantly and re-checks only when they are older than
 * USAGE_STALE_MS (or when the tab regains focus), instead of refetching
 * everything on every visit.
 */
export function useUsage() {
  const query = useCachedQuery<UsageSnapshot>(cacheKeys.usage, fetchUsage, {
    staleMs: USAGE_STALE_MS,
  });

  return {
    data: query.data,
    /** True on the first load and while a manual or background refresh runs. */
    loading: query.loading || query.refreshing,
    error: query.error,
    refresh: query.refetch,
  };
}