import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

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
// Types
// -----------------------------------------------------------------------------

export type UsageKey =
  | 'lessonsTaken'
  | 'aiChats'
  | 'liveVoice'
  | 'coursesCreated'
  | 'lessonsGenerated'
  | 'podcastEpisodes'
  | 'lessonVideos'
  | 'learningImages'
  | 'planningMessages'
  | 'sourceFiles';

export interface UsageItem {
  used: number;
  limit: number;
  /** ISO timestamp of the next reset. */
  resetsAt: string;
  /** IANA zone used to display the reset time. Defaults to the learner's zone. */
  timeZone?: string;
}

export interface UsageSnapshot {
  plan: 'free' | 'pro';
  items: Record<UsageKey, UsageItem>;
}

export const USAGE_LABELS: Record<UsageKey, string> = {
  lessonsTaken: 'Lessons taken',
  aiChats: 'AI chats',
  liveVoice: 'Live voice sessions',
  coursesCreated: 'Courses created',
  lessonsGenerated: 'Lessons generated',
  podcastEpisodes: 'Podcast episodes',
  lessonVideos: 'Lesson videos',
  learningImages: 'Learning images',
  planningMessages: 'Course planning messages',
  sourceFiles: 'Source files processed',
};

export const USAGE_GROUPS: ReadonlyArray<{ title: string; keys: UsageKey[] }> = [
  { title: 'Learning', keys: ['lessonsTaken', 'aiChats', 'liveVoice'] },
  {
    title: 'Creation',
    keys: [
      'coursesCreated',
      'lessonsGenerated',
      'podcastEpisodes',
      'lessonVideos',
      'learningImages',
      'planningMessages',
      'sourceFiles',
    ],
  },
];

// -----------------------------------------------------------------------------
// Formatting
// -----------------------------------------------------------------------------

/** "Resets Oct 15, 2026 at 12:00 AM" (adds "UTC" when shown in UTC). */
export function formatReset(resetsAt: string, timeZone?: string): string {
  const date = new Date(resetsAt);

  if (Number.isNaN(date.getTime())) return '';

  const zone = timeZone ? { timeZone } : {};
  const day = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...zone,
  }).format(date);
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    ...zone,
  }).format(date);

  return `Resets ${day} at ${time}${timeZone === 'UTC' ? ' UTC' : ''}`;
}

// -----------------------------------------------------------------------------
// Data
// -----------------------------------------------------------------------------

/**
 * TODO: replace the body with your real usage endpoint. Everything else (the
 * Settings card, the Usage page, the hook) only depends on `UsageSnapshot`.
 *
 * The placeholder below returns numbers matching the design reference so the
 * UI can be reviewed before the backend is wired up.
 */
export async function fetchUsage(): Promise<UsageSnapshot> {
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const daily = (used: number, limit: number): UsageItem => ({
    used,
    limit,
    resetsAt: nextMidnight.toISOString(),
  });
  const monthly = (used: number, limit: number): UsageItem => ({
    used,
    limit,
    resetsAt: nextMonth.toISOString(),
  });

  return {
    plan: 'free',
    items: {
      lessonsTaken: daily(0, 5),
      aiChats: daily(0, 10),
      liveVoice: { used: 0, limit: 1, resetsAt: nextMonthUtc.toISOString(), timeZone: 'UTC' },
      coursesCreated: monthly(2, 3),
      lessonsGenerated: daily(0, 5),
      podcastEpisodes: monthly(1, 3),
      lessonVideos: monthly(0, 2),
      learningImages: daily(0, 5),
      planningMessages: daily(0, 30),
      sourceFiles: daily(0, 5),
    },
  };
}

export function useUsage() {
  const [data, setData] = useState<UsageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const request = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++request.current;

    setLoading(true);
    setError(false);

    try {
      const next = await fetchUsage();

      if (id === request.current) setData(next);
    } catch (caught) {
      console.error('[usage] failed to load:', caught);

      if (id === request.current) setError(true);
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    return () => {
      // Ignore any in-flight response after unmount.
      request.current += 1;
    };
  }, [refresh]);

  return { data, loading, error, refresh };
}