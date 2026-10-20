import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';

import type { Schema } from '../amplify/data/resource';
import type { LessonContent } from '../amplify/functions/shared/lesson-content';
import { buildSpeech, type SpeechPart } from '../amplify/functions/shared/speech';
import {
  DEVICE_VOICE_ID,
  READ_ALOUD_DAILY_CHARACTERS,
  istDayKey,
  sampleText,
} from '../amplify/functions/shared/voices';
import { getSettings } from './settings';

/**
 * Read aloud.
 *
 * Natural voices (Amazon Polly) come from the `readAloud` mutation, which
 * returns a link to a cached MP3 that plays in a normal <audio> element. The
 * learner is never left without a voice: if they picked "Device voice", are
 * offline, have used today's natural-voice allowance, or the request fails, the
 * browser's built-in speech reads the same text instead (with a short note
 * saying why).
 */

export { buildSpeech };

// ─── What to read ─────────────────────────────────────────────────────────────

export interface SpeechSource {
  lessonId: string;
  part: Exclude<SpeechPart, 'sample'>;
  /** Which card, when `part` is 'card'. */
  cardIndex?: number;
  /** The same text the server will speak. Only used for the device-voice fallback. */
  text: string;
}

export function sourceFor(
  content: LessonContent,
  lessonId: string,
  part: SpeechSource['part'],
  cardIndex = 0,
): SpeechSource | null {
  const text = buildSpeech(content, part, cardIndex);

  return text ? { lessonId, part, cardIndex: part === 'card' ? cardIndex : undefined, text } : null;
}

interface AudioRequest {
  lessonId?: string;
  part: SpeechPart;
  cardIndex?: number;
  voiceId: string;
}

// ─── Fetching audio links ─────────────────────────────────────────────────────

let dataClient: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  dataClient ??= generateClient<Schema>();

  return dataClient;
}

type LinkResult = { status: 'ok'; url: string } | { status: 'limit' };

// The signed links last an hour; reuse them for 50 minutes so going back to a card is instant.
const LINK_TTL_MS = 50 * 60 * 1000;
const links = new Map<string, { url: string; expires: number }>();
const pending = new Map<string, Promise<LinkResult>>();

const keyOf = (request: AudioRequest) =>
  [request.voiceId, request.part, request.lessonId ?? '', request.cardIndex ?? ''].join('|');

function fetchLink(request: AudioRequest): Promise<LinkResult> {
  const key = keyOf(request);
  const hit = links.get(key);

  if (hit && hit.expires > Date.now()) return Promise.resolve({ status: 'ok', url: hit.url });

  const running = pending.get(key);

  if (running) return running;

  const promise = (async (): Promise<LinkResult> => {
    const result = await getClient().mutations.readAloud(
      {
        lessonId: request.lessonId,
        part: request.part,
        cardIndex: request.cardIndex,
        voiceId: request.voiceId,
      },
      { authMode: 'userPool' },
    );

    if (result.errors?.length) {
      throw new Error(result.errors.map((error) => error.message).join('; '));
    }

    if (result.data?.status === 'limit') return { status: 'limit' };

    if (!result.data?.url) throw new Error('READ_ALOUD_FAILED');

    links.set(key, { url: result.data.url, expires: Date.now() + LINK_TTL_MS });

    return { status: 'ok', url: result.data.url };
  })().finally(() => pending.delete(key));

  pending.set(key, promise);

  return promise;
}

// ─── One shared <audio> element ───────────────────────────────────────────────
// Phones only let a page play audio that a tap started. One element that was
// "unlocked" by the learner's first tap can keep playing new sources later,
// which is what makes auto read aloud work between cards.

const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

let audioElement: HTMLAudioElement | null = null;
let unlocked = false;

function getAudio(): HTMLAudioElement {
  audioElement ??= new Audio();

  return audioElement;
}

function unlockAudio(): void {
  if (unlocked || typeof Audio === 'undefined') return;

  unlocked = true;

  const audio = getAudio();

  audio.muted = true;
  audio.src = SILENT_WAV;
  audio
    .play()
    .then(() => {
      // Only stop it if a real recording has not taken over in the meantime.
      if (audio.src.startsWith('data:audio/wav')) audio.pause();
    })
    .catch(() => {
      unlocked = false;
    })
    .finally(() => {
      audio.muted = false;
    });
}

// ─── Device voice (fallback) ──────────────────────────────────────────────────

const deviceSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

/** Chrome stops any single utterance after about 15 seconds, so queue sentence-sized chunks. */
function toChunks(text: string, maxLength = 180): string[] {
  const sentences = text.match(/[^.!?:;]+[.!?:;]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';

  for (const part of sentences) {
    if (current && current.length + part.length > maxLength) {
      chunks.push(current.trim());
      current = '';
    }

    current += part;
  }

  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

function pickDeviceVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith('en'));

  if (voices.length === 0) return null;

  const score = (voice: SpeechSynthesisVoice) => {
    let value = 0;

    if (/natural|neural|enhanced|premium/i.test(voice.name)) value += 4;
    if (/google|samantha|aria|jenny|daniel|karen/i.test(voice.name)) value += 2;
    if (voice.lang === 'en-US' || voice.lang === 'en-IN') value += 1;
    if (voice.default) value += 1;

    return value;
  };

  return [...voices].sort((a, b) => score(b) - score(a))[0];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/** loading = fetching the natural voice; speaking = playing; paused = natural voice on hold. */
export type ReadAloudStatus = 'idle' | 'loading' | 'speaking' | 'paused';

const NOTICE_MS = 9000;

const NOTICES = {
  limit: 'You’ve used today’s natural-voice listening, so this is your device’s voice. It resets at midnight.',
  failed: 'The natural voice isn’t available right now, so this is your device’s voice.',
  offline: 'You’re offline, so this is your device’s voice.',
} as const;

export function useReadAloud() {
  const supported = deviceSupported() || typeof Audio !== 'undefined';
  const [status, setStatus] = useState<ReadAloudStatus>('idle');
  const [notice, setNotice] = useState<string | null>(null);
  // Bumped on every start/stop, so late events from a cancelled run are ignored.
  const session = useRef(0);
  // Which engine is playing: the natural voice can pause and resume, the device voice cannot.
  const mode = useRef<'audio' | 'device'>('audio');
  const noticeTimer = useRef<number | undefined>(undefined);

  const showNotice = useCallback((message: string | null) => {
    window.clearTimeout(noticeTimer.current);
    setNotice(message);

    if (message) noticeTimer.current = window.setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);

  const halt = useCallback(() => {
    if (audioElement) {
      audioElement.onended = null;
      audioElement.onerror = null;
      audioElement.pause();
    }

    if (deviceSupported()) window.speechSynthesis.cancel();
  }, []);

  const stop = useCallback(() => {
    session.current += 1;
    halt();
    setStatus('idle');
  }, [halt]);

  const speakWithDevice = useCallback((text: string, id: number) => {
    mode.current = 'device';

    if (!deviceSupported() || session.current !== id) {
      if (session.current === id) setStatus('idle');
      return;
    }

    const synth = window.speechSynthesis;
    const chunks = toChunks(text);

    synth.cancel();

    if (chunks.length === 0) {
      setStatus('idle');
      return;
    }

    const voice = pickDeviceVoice();
    const rate = getSettings().readAloudSpeed;
    const finish = () => {
      if (session.current === id) setStatus('idle');
    };

    chunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk);

      utterance.rate = rate;
      utterance.lang = voice?.lang ?? 'en-US';
      if (voice) utterance.voice = voice;

      utterance.onerror = finish;
      if (index === chunks.length - 1) utterance.onend = finish;

      synth.speak(utterance);
    });

    setStatus('speaking');
  }, []);

  const playLink = useCallback(async (url: string, id: number) => {
    const audio = getAudio();
    const rate = getSettings().readAloudSpeed;

    mode.current = 'audio';
    audio.muted = false;
    audio.onended = () => {
      if (session.current === id) setStatus('idle');
    };
    audio.src = url;
    // Loading a new source resets the speed, so set it afterwards.
    audio.defaultPlaybackRate = rate;
    audio.playbackRate = rate;

    await audio.play();

    if (session.current === id) setStatus('speaking');
  }, []);

  /** Starts one read, natural voice first and device voice if that isn't possible. */
  const run = useCallback(
    (request: AudioRequest, text: string, upcoming?: AudioRequest) => {
      const id = ++session.current;

      halt();
      showNotice(null);

      if (request.voiceId === DEVICE_VOICE_ID) {
        speakWithDevice(text, id);
        return;
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        showNotice(NOTICES.offline);
        speakWithDevice(text, id);
        return;
      }

      setStatus('loading');

      void (async () => {
        try {
          const link = await fetchLink(request);

          if (session.current !== id) return;

          if (link.status === 'limit') {
            showNotice(NOTICES.limit);
            speakWithDevice(text, id);
            return;
          }

          await playLink(link.url, id);

          // Quietly get the next screen ready so it starts without a wait.
          if (upcoming) {
            void fetchLink(upcoming)
              .then((next) => {
                if (next.status !== 'ok') return;

                const warm = new Audio();

                warm.preload = 'auto';
                warm.src = next.url;
              })
              .catch(() => undefined);
          }
        } catch (error) {
          if (session.current !== id) return;

          // The browser blocked playback until the next tap. Another voice would be blocked too.
          if (error instanceof DOMException && error.name === 'NotAllowedError') {
            setStatus('idle');
            return;
          }

          console.warn('[read aloud] natural voice failed, using the device voice:', error);
          showNotice(NOTICES.failed);
          speakWithDevice(text, id);
        }
      })();
    },
    [halt, playLink, showNotice, speakWithDevice],
  );

  /**
   * Reads one screen. Pass `upcoming` (the next screen) only when the learner is
   * likely to keep listening, since getting it ready can use up new allowance.
   */
  const speak = useCallback(
    (source: SpeechSource, upcoming?: SpeechSource | null) => {
      const voiceId = getSettings().readAloudVoice;

      run(
        { lessonId: source.lessonId, part: source.part, cardIndex: source.cardIndex, voiceId },
        source.text,
        upcoming
          ? { lessonId: upcoming.lessonId, part: upcoming.part, cardIndex: upcoming.cardIndex, voiceId }
          : undefined,
      );
    },
    [run],
  );

  /** A short sample of a voice (used by the picker in Settings). */
  const preview = useCallback(
    (voiceId: string) => run({ part: 'sample', voiceId }, sampleText(voiceId)),
    [run],
  );

  /** The natural voice pauses in place; the device voice can't, so it just stops. */
  const pause = useCallback(() => {
    if (mode.current === 'audio' && audioElement && status === 'speaking') {
      audioElement.pause();
      setStatus('paused');
      return;
    }

    stop();
  }, [status, stop]);

  const resume = useCallback(() => {
    if (mode.current !== 'audio' || !audioElement) return;

    audioElement
      .play()
      .then(() => setStatus('speaking'))
      .catch(() => setStatus('idle'));
  }, []);

  // Unlock audio on the learner's first tap or key press anywhere in the app.
  useEffect(() => {
    const unlock = () => unlockAudio();

    window.addEventListener('pointerdown', unlock, { once: true, capture: true });
    window.addEventListener('keydown', unlock, { once: true, capture: true });

    return () => {
      window.removeEventListener('pointerdown', unlock, { capture: true });
      window.removeEventListener('keydown', unlock, { capture: true });
    };
  }, []);

  // Never keep talking after the lesson closes or the tab goes away.
  useEffect(() => {
    window.addEventListener('pagehide', stop);

    return () => {
      window.removeEventListener('pagehide', stop);
      window.clearTimeout(noticeTimer.current);
      stop();
    };
  }, [stop]);

  return { supported, status, notice, speak, preview, pause, resume, stop };
}

// ─── Today's allowance (for the Settings page) ────────────────────────────────

/** How much new natural speech the learner has used today. null while loading or unavailable. */
export function useReadAloudUsage() {
  const [usedCharacters, setUsedCharacters] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { userId } = await getCurrentUser();
      const result = await getClient().models.ReadAloudUsage.get(
        { userId, day: istDayKey() },
        { selectionSet: ['characters'], authMode: 'userPool' },
      );

      setUsedCharacters(result.data?.characters ?? 0);
    } catch (error) {
      console.warn('[read aloud] could not load usage:', error);
      setUsedCharacters(null);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  return { usedCharacters, limitCharacters: READ_ALOUD_DAILY_CHARACTERS, refresh };
}