import { getSettings } from './settings';

/**
 * Tiny synthesized sound effects (Web Audio), so there are no audio files to
 * ship. Every call checks the "Sound effects" setting, so switching it off
 * silences the whole app at once.
 */

export type SoundName = 'correct' | 'wrong' | 'complete';

interface Note {
  /** Frequency in Hz. */
  freq: number;
  /** Seconds after the sound starts. */
  at: number;
  /** Length in seconds. */
  length: number;
  type?: OscillatorType;
  volume?: number;
}

const SOUNDS: Record<SoundName, Note[]> = {
  // Two quick rising notes.
  correct: [
    { freq: 659.25, at: 0, length: 0.11, type: 'triangle' },
    { freq: 880, at: 0.1, length: 0.2, type: 'triangle' },
  ],
  // One short, low, soft buzz.
  wrong: [
    { freq: 233, at: 0, length: 0.14, type: 'sawtooth', volume: 0.5 },
    { freq: 175, at: 0.12, length: 0.22, type: 'sawtooth', volume: 0.5 },
  ],
  // A bright rising arpeggio.
  complete: [
    { freq: 523.25, at: 0, length: 0.14, type: 'triangle' },
    { freq: 659.25, at: 0.12, length: 0.14, type: 'triangle' },
    { freq: 783.99, at: 0.24, length: 0.14, type: 'triangle' },
    { freq: 1046.5, at: 0.36, length: 0.42, type: 'triangle' },
  ],
};

const MASTER_VOLUME = 0.16;

type AudioContextConstructor = typeof AudioContext;

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!context) {
    const Constructor: AudioContextConstructor | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;

    if (!Constructor) return null;

    context = new Constructor();
  }

  // Browsers keep audio suspended until the learner has interacted with the page.
  if (context.state === 'suspended') void context.resume().catch(() => undefined);

  return context;
}

/** Plays a sound unless the learner turned sound effects off. Never throws. */
export function playSound(name: SoundName): void {
  if (!getSettings().soundEffects) return;

  try {
    const audio = getContext();

    if (!audio) return;

    const start = audio.currentTime + 0.01;

    for (const note of SOUNDS[name]) {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const begin = start + note.at;
      const end = begin + note.length;
      const peak = MASTER_VOLUME * (note.volume ?? 1);

      oscillator.type = note.type ?? 'sine';
      oscillator.frequency.setValueAtTime(note.freq, begin);

      // Quick fade in and out so the notes never click.
      gain.gain.setValueAtTime(0.0001, begin);
      gain.gain.exponentialRampToValueAtTime(peak, begin + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(begin);
      oscillator.stop(end + 0.02);
    }
  } catch (error) {
    console.warn('[sounds] could not play sound:', error);
  }
}