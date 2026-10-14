import { useSyncExternalStore } from 'react';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface AppSettings {
  /** Language used for generated lessons (pass to generate-outline / generate-lesson). */
  contentLanguage: string;
  soundEffects: boolean;
  /** Turns off animations and transitions app-wide. */
  reduceMotion: boolean;
}

export const CONTENT_LANGUAGES = [
  'English',
] as const;

const STORAGE_KEY = 'grokit.settings.v1';

const DEFAULTS: AppSettings = {
  contentLanguage: 'English',
  soundEffects: true,
  reduceMotion: false,
};

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
      soundEffects:
        typeof parsed.soundEffects === 'boolean'
          ? parsed.soundEffects
          : DEFAULTS.soundEffects,
      reduceMotion:
        typeof parsed.reduceMotion === 'boolean'
          ? parsed.reduceMotion
          : DEFAULTS.reduceMotion,
    };
  } catch {
    return DEFAULTS;
  }
}

function applyToDocument(settings: AppSettings) {
  document.documentElement.dataset.reduceMotion = String(settings.reduceMotion);
}

let state: AppSettings = load();
applyToDocument(state);

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