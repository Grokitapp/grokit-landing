import type { LessonCard, LessonContent, Prediction, Visual } from './lesson-content';

/**
 * Turns lesson data into the text that is spoken. Built from the DATA, not the
 * screen, so it is clean and in the same order the learner sees things.
 *
 * Used in two places: the read-aloud function (to decide what to synthesize,
 * so the browser can never ask for arbitrary text) and the browser (as the
 * device-voice fallback). No browser or Node APIs here on purpose.
 */

export type SpeechPart = 'prediction' | 'card' | 'review' | 'sample';

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
      body = visual.columns.map((column) => join([column.heading, ...column.points])).join(' ');
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

  // Same placement as the card screen: the picture sits after the first two
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

/** The text for one screen of a lesson. Empty when that screen has nothing to read. */
export function buildSpeech(
  content: LessonContent,
  part: Exclude<SpeechPart, 'sample'>,
  cardIndex = 0,
): string {
  switch (part) {
    case 'prediction':
      return content.prediction ? predictionToSpeech(content.prediction) : '';
    case 'card': {
      const card = content.cards[cardIndex];

      return card ? cardToSpeech(card) : '';
    }
    case 'review':
      return reviewToSpeech(content);
  }
}