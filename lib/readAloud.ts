import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  LessonCard,
  LessonContent,
  Prediction,
  Visual,
} from '../amplify/functions/shared/lesson-content';
import { getSettings } from './settings';

/**
 * Read aloud, using the browser's built-in speech (Web Speech API).
 *
 * Everything the UI needs is in `useReadAloud()`. If you later move to a cloud
 * voice (for example Amazon Polly), only `speak` / `stop` below change.
 */

// ─── Text builders ────────────────────────────────────────────────────────────
// Speech is built from the lesson DATA, not the screen, so it is clean and in
// the same order the learner sees things.

/** Removes the inline marks: **bold** and [[glossary]]. */
export function stripMarks(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Makes sure a line ends in punctuation so the voice pauses between lines. */
function sentence(text: string): string {
  const clean = stripMarks(text);

  if (!clean) return '';

  return /[.!?:;]$/.test(clean) ? clean : `${clean}.`;
}

const join = (parts: Array<string | null | undefined>) =>
  parts
    .map((part) => (part ? sentence(part) : ''))
    .filter(Boolean)
    .join(' ');

export function visualToSpeech(visual: Visual): string {
  const intro = join([visual.title]);
  const caption = join([visual.caption]);
  let body = '';

  switch (visual.type) {
    case 'stats':
      body = visual.items.map((item) => join([`${item.value}, ${item.label}`, item.note])).join(' ');
      break;

    case 'cycle': {
      const labels = visual.items.map((item) => stripMarks(item.label));

      body = labels.length
        ? sentence(`It goes round like this: ${labels.join(', then ')}, and back to ${labels[0]}`)
        : '';
      break;
    }

    case 'line':
    case 'bar':
      body = visual.items
        .map((item) => sentence(`${item.label}: ${item.value}${visual.unit ? ` ${visual.unit}` : ''}`))
        .join(' ');
      break;

    case 'compare':
      body = visual.columns
        .map((column) => join([column.heading, ...column.points]))
        .join(' ');
      break;

    case 'steps':
      body = visual.items
        .map((item, index) => join([`Step ${index + 1}, ${item.label}`, item.note]))
        .join(' ');
      break;
  }

  return [intro, body, caption].filter(Boolean).join(' ');
}

export function cardToSpeech(card: LessonCard): string {
  const reflection = card.kind === 'reflection';

  // Same placement as CardView: the picture sits after the first two
  // paragraphs (or at the very end for reflection cards).
  const splitAt = card.visual && !reflection ? Math.min(2, card.body.length) : card.body.length;
  const visual = card.visual ? visualToSpeech(card.visual) : '';

  return [
    join([card.title]),
    join(card.body.slice(0, splitAt)),
    reflection ? '' : visual,
    join(card.body.slice(splitAt)),
    reflection ? visual : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function predictionToSpeech(prediction: Prediction): string {
  return [
    join(['Quick guess before you start', prediction.question]),
    join(prediction.options.map((option, index) => `Option ${index + 1}, ${option}`)),
  ].join(' ');
}

export function reviewToSpeech(content: LessonContent): string {
  return [
    join(['Key ideas from this lesson']),
    ...content.knowledgeCards.map((item) =>
      join([item.term, item.definition, item.example ? `For example, ${item.example}` : '']),
    ),
  ].join(' ');
}

// ─── Speech engine ────────────────────────────────────────────────────────────

export type ReadAloudStatus = 'idle' | 'speaking';

const isSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

/**
 * Chrome silently stops any single utterance after roughly 15 seconds, so long
 * text is queued as sentence-sized chunks instead.
 */
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

/** Prefers a natural-sounding English voice when the device has one. */
function pickVoice(): SpeechSynthesisVoice | null {
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

export function useReadAloud() {
  const supported = isSupported();
  const [status, setStatus] = useState<ReadAloudStatus>('idle');
  // Bumped on every speak/stop, so events from a cancelled run are ignored.
  const session = useRef(0);

  const stop = useCallback(() => {
    session.current += 1;

    if (isSupported()) window.speechSynthesis.cancel();

    setStatus('idle');
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported()) return;

    const synth = window.speechSynthesis;
    const id = ++session.current;
    const chunks = toChunks(text);

    synth.cancel();

    if (chunks.length === 0) {
      setStatus('idle');
      return;
    }

    const voice = pickVoice();
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

  // Never keep talking after the lesson closes or the tab goes away.
  useEffect(() => {
    window.addEventListener('pagehide', stop);

    return () => {
      window.removeEventListener('pagehide', stop);
      stop();
    };
  }, [stop]);

  return { supported, status, speak, stop };
}