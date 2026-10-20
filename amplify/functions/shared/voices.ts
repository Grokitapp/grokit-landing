/**
 * The voices a learner can pick for Read aloud. Shared by the browser (the
 * picker in Settings) and the read-aloud function (the allow-list), so the two
 * can never disagree.
 *
 * Every Polly voice here has a "generative" variant, the most natural engine
 * Polly offers. If a region ever lacks it, the function falls back to the
 * "neural" engine for the same voice.
 */

export interface ReadAloudVoice {
  /** Polly VoiceId. */
  id: string;
  /** Shown in the picker. */
  label: string;
  /** Polly language code. */
  languageCode: string;
}

export const READ_ALOUD_VOICES: readonly ReadAloudVoice[] = [
  { id: 'Ruth', label: 'Ruth · US woman, warm', languageCode: 'en-US' },
  { id: 'Matthew', label: 'Matthew · US man, friendly', languageCode: 'en-US' },
  { id: 'Danielle', label: 'Danielle · US woman, clear', languageCode: 'en-US' },
  { id: 'Stephen', label: 'Stephen · US man, calm', languageCode: 'en-US' },
  { id: 'Kajal', label: 'Kajal · Indian woman', languageCode: 'en-IN' },
  { id: 'Amy', label: 'Amy · British woman', languageCode: 'en-GB' },
];

export const DEFAULT_VOICE_ID = 'Ruth';

/** Not a Polly voice: use whatever voice the phone or computer has (free, but robotic). */
export const DEVICE_VOICE_ID = 'device';

export function findVoice(id: string | null | undefined): ReadAloudVoice | undefined {
  return READ_ALOUD_VOICES.find((voice) => voice.id === id);
}

/** A short line used to preview a voice. Fixed text, so it is synthesized once and cached forever. */
export function sampleText(voiceId: string): string {
  const name = findVoice(voiceId)?.id;

  return name
    ? `Hi, I'm ${name}. This is how I'll read your lessons out loud.`
    : 'Hi. This is how your lessons will sound when read out loud.';
}

// ─── Daily listening allowance ────────────────────────────────────────────────
// Natural voices cost real money per character, so each learner gets a daily
// allowance. Replaying something already heard is free and never counts; when
// the allowance runs out, reading carries on in the device voice.

/** Characters of NEW natural speech per learner per day (about 3 lessons). */
export const READ_ALOUD_DAILY_CHARACTERS = 20_000;

/** Speech runs at roughly 15 characters a second. Used only to show friendly minutes. */
const CHARACTERS_PER_MINUTE = 900;

export const charactersToMinutes = (characters: number): number =>
  Math.round(Math.max(0, characters) / CHARACTERS_PER_MINUTE);

const USAGE_TIME_ZONE = 'Asia/Kolkata';

/** The allowance resets at midnight India time, like the rest of the Usage page. */
export function istDayKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: USAGE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function nextIstMidnight(date: Date = new Date()): string {
  return new Date(new Date(`${istDayKey(date)}T00:00:00+05:30`).getTime() + 86_400_000).toISOString();
}