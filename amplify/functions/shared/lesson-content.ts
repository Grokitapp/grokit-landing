/**
 * Lesson content format v1: the card-based lessons.
 *
 * This file is pure TypeScript (no AWS or Node imports) so the backend
 * functions AND the browser can import it, the same way leaderboard-rules.ts
 * is shared. It holds:
 *   - the types the player renders,
 *   - the JSON schemas the model must follow,
 *   - validation that repairs small model slips instead of failing a lesson,
 *   - grading and XP, so the server and the UI always agree.
 */

export const CONTENT_VERSION = 1;

/* ---------------------------------------------------------------------------
 * XP
 * ------------------------------------------------------------------------- */

/** XP for finishing a lesson. */
export const BASE_LESSON_XP = 10;

/** Extra XP earned in proportion to first-try accuracy (a perfect run gets all of it). */
export const MAX_ACCURACY_BONUS = 5;

/* ---------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

export type CardKind =
  | 'hook'
  | 'concept'
  | 'analogy'
  | 'example'
  | 'misconception'
  | 'reflection'
  | 'apply';

export type VisualType = 'stats' | 'cycle' | 'line' | 'bar' | 'compare' | 'steps';

export interface VisualItem {
  label: string;
  /** stats: the big number/text. line/bar: a plain number as text. Others: empty. */
  value: string;
  /** Small supporting line. steps: the step description. */
  note: string;
}

export interface VisualColumn {
  heading: string;
  points: string[];
}

export interface Visual {
  type: VisualType;
  title: string;
  /** One-line takeaway under the visual. May be empty. */
  caption: string;
  /** line/bar: the unit of the values, e.g. "times better". May be empty. */
  unit: string;
  items: VisualItem[];
  columns: VisualColumn[];
}

export interface LessonCard {
  kind: CardKind;
  title: string;
  /** 1 to 4 short paragraphs. Inline: **bold** and [[glossary term]]. */
  body: string[];
  visual: Visual | null;
}

export interface Prediction {
  question: string;
  options: string[];
  correctIndex: number;
  reveal: string;
}

export interface KnowledgeCard {
  term: string;
  definition: string;
  example: string;
}

export interface LessonContent {
  version: number;
  estimatedMinutes: number;
  prediction: Prediction | null;
  cards: LessonCard[];
  knowledgeCards: KnowledgeCard[];
}

export type PracticeType = 'mcq' | 'fill' | 'scenario';

export interface PracticeQuestion {
  type: PracticeType;
  /** For "fill", contains "____" where the answer goes. */
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  /** Zero-based index of the card that teaches this, for "review this card". */
  cardIndex: number | null;
}

/* ---------------------------------------------------------------------------
 * Shape of a lesson
 * ------------------------------------------------------------------------- */

export interface LessonShape {
  cards: { min: number; max: number };
  questions: number;
  estimatedMinutes: number;
}

export function makeLessonShape(minCards: number, maxCards: number, questions: number): LessonShape {
  const target = (minCards + maxCards) / 2;

  return {
    cards: { min: minCards, max: maxCards },
    questions,
    estimatedMinutes: Math.max(2, Math.round(target * 0.45 + questions * 0.4)),
  };
}

/** Used when we know nothing about the learner's time. */
export const DEFAULT_LESSON_SHAPE: LessonShape = makeLessonShape(6, 7, 5);

/* ---------------------------------------------------------------------------
 * JSON schemas for structured output
 *
 * Kept deliberately plain: no min/max/length keywords (not supported by
 * structured outputs). Counts are asked for in the prompt and enforced by
 * the normalisers below.
 * ------------------------------------------------------------------------- */

const STRING = { type: 'string' } as const;
const STRING_LIST = { type: 'array', items: STRING } as const;

const VISUAL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    type: {
      type: 'string',
      enum: ['none', 'stats', 'cycle', 'line', 'bar', 'compare', 'steps'],
    },
    title: STRING,
    caption: STRING,
    unit: STRING,
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { label: STRING, value: STRING, note: STRING },
        required: ['label', 'value', 'note'],
      },
    },
    columns: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { heading: STRING, points: STRING_LIST },
        required: ['heading', 'points'],
      },
    },
  },
  required: ['type', 'title', 'caption', 'unit', 'items', 'columns'],
} as const;

export const LESSON_CONTENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    prediction: {
      type: 'object',
      additionalProperties: false,
      properties: {
        question: STRING,
        options: STRING_LIST,
        correctIndex: { type: 'integer' },
        reveal: STRING,
      },
      required: ['question', 'options', 'correctIndex', 'reveal'],
    },
    cards: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          kind: {
            type: 'string',
            enum: ['hook', 'concept', 'analogy', 'example', 'misconception', 'reflection', 'apply'],
          },
          title: STRING,
          body: STRING_LIST,
          visual: VISUAL_SCHEMA,
        },
        required: ['kind', 'title', 'body', 'visual'],
      },
    },
    knowledgeCards: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { term: STRING, definition: STRING, example: STRING },
        required: ['term', 'definition', 'example'],
      },
    },
  },
  required: ['prediction', 'cards', 'knowledgeCards'],
} as const;

export const PRACTICE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { type: 'string', enum: ['mcq', 'fill', 'scenario'] },
          prompt: STRING,
          options: STRING_LIST,
          correctIndex: { type: 'integer' },
          explanation: STRING,
          cardIndex: { type: 'integer' },
        },
        required: ['type', 'prompt', 'options', 'correctIndex', 'explanation', 'cardIndex'],
      },
    },
  },
  required: ['questions'],
} as const;

/* ---------------------------------------------------------------------------
 * Small helpers
 * ------------------------------------------------------------------------- */

const CARD_KINDS: readonly CardKind[] = [
  'hook',
  'concept',
  'analogy',
  'example',
  'misconception',
  'reflection',
  'apply',
];

const VISUAL_TYPES: readonly VisualType[] = ['stats', 'cycle', 'line', 'bar', 'compare', 'steps'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';

  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/** Paragraph text keeps its content but is flattened to one line. */
function paragraph(value: unknown): string {
  return text(value, 600);
}

function stringList(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => text(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

/** Parses "37", "1,000", "2.4x", "15%" to a number, or null. */
export function parseNumeric(value: string): number | null {
  const cleaned = value.replace(/[,\s]/g, '').replace(/[%x×]$/i, '');

  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : null;
}

function hasDuplicates(options: string[]): boolean {
  return new Set(options.map((option) => option.toLowerCase())).size !== options.length;
}

/**
 * Shuffles options and tracks where the correct one lands. Models like to put
 * the right answer in the same slot, so we never trust their order.
 */
export function shuffleOptions(
  options: string[],
  correctIndex: number,
  random: () => number = Math.random,
): { options: string[]; correctIndex: number } {
  const order = options.map((_, index) => index);

  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  return {
    options: order.map((index) => options[index]),
    correctIndex: order.indexOf(correctIndex),
  };
}

/* ---------------------------------------------------------------------------
 * Lesson content: normalise
 * ------------------------------------------------------------------------- */

function normaliseVisual(value: unknown): Visual | null {
  if (!isRecord(value)) return null;

  const type = value.type as VisualType;
  if (!VISUAL_TYPES.includes(type)) return null;

  const items = Array.isArray(value.items)
    ? value.items
        .filter(isRecord)
        .map((item) => ({
          label: text(item.label, 60),
          value: text(item.value, 40),
          note: text(item.note, 140),
        }))
        .filter((item) => item.label)
    : [];

  const columns = Array.isArray(value.columns)
    ? value.columns
        .filter(isRecord)
        .map((column) => ({
          heading: text(column.heading, 60),
          points: stringList(column.points, 4, 100),
        }))
        .filter((column) => column.heading && column.points.length > 0)
    : [];

  const visual: Visual = {
    type,
    title: text(value.title, 80),
    caption: text(value.caption, 160),
    unit: text(value.unit, 40),
    items,
    columns,
  };

  switch (type) {
    case 'stats':
      return items.length >= 2 && items.length <= 4 && items.every((item) => item.value)
        ? { ...visual, items: items.slice(0, 4), columns: [] }
        : null;

    case 'cycle':
      return items.length >= 3 && items.length <= 5 ? { ...visual, items, columns: [] } : null;

    case 'steps':
      return items.length >= 3 && items.length <= 5 ? { ...visual, items, columns: [] } : null;

    case 'line':
    case 'bar': {
      if (items.length < 3 || items.length > 7) return null;
      const numeric = items.map((item) => parseNumeric(item.value));
      if (numeric.some((number) => number === null)) return null;
      return { ...visual, items, columns: [] };
    }

    case 'compare':
      return columns.length === 2 ? { ...visual, items: [], columns } : null;

    default:
      return null;
  }
}

function normalisePrediction(value: unknown, random: () => number): Prediction | null {
  if (!isRecord(value)) return null;

  const question = text(value.question, 200);
  const options = stringList(value.options, 3, 80);
  const correctIndex = value.correctIndex;

  if (
    !question ||
    options.length < 2 ||
    hasDuplicates(options) ||
    typeof correctIndex !== 'number' ||
    !Number.isInteger(correctIndex) ||
    correctIndex < 0 ||
    correctIndex >= options.length
  ) {
    return null;
  }

  const shuffled = shuffleOptions(options, correctIndex, random);

  return {
    question,
    options: shuffled.options,
    correctIndex: shuffled.correctIndex,
    reveal: text(value.reveal, 240),
  };
}

export function normaliseLessonContent(
  value: unknown,
  shape: LessonShape,
  random: () => number = Math.random,
): LessonContent {
  if (!isRecord(value)) throw new Error('LESSON_MUST_BE_OBJECT');

  if (!Array.isArray(value.cards)) throw new Error('LESSON_CARDS_INVALID');

  const cards: LessonCard[] = [];

  value.cards.forEach((raw) => {
    if (!isRecord(raw)) return;

    const body = (Array.isArray(raw.body) ? raw.body : [])
      .map(paragraph)
      .filter(Boolean)
      .slice(0, 4);

    const title = text(raw.title, 70);

    // A card with no words is useless; drop it rather than fail the lesson.
    if (!title || body.length === 0) return;

    const kind = CARD_KINDS.includes(raw.kind as CardKind) ? (raw.kind as CardKind) : 'concept';

    cards.push({ kind, title, body, visual: normaliseVisual(raw.visual) });
  });

  // Too few cards is a real failure (the lesson would feel empty).
  if (cards.length < Math.max(3, shape.cards.min - 2)) throw new Error('LESSON_TOO_FEW_CARDS');

  const trimmed = cards.slice(0, shape.cards.max + 1);

  const knowledgeCards: KnowledgeCard[] = (Array.isArray(value.knowledgeCards) ? value.knowledgeCards : [])
    .filter(isRecord)
    .map((card) => ({
      term: text(card.term, 60),
      definition: text(card.definition, 240),
      example: text(card.example, 240),
    }))
    .filter((card) => card.term && card.definition)
    .slice(0, 6);

  return {
    version: CONTENT_VERSION,
    estimatedMinutes: shape.estimatedMinutes,
    prediction: normalisePrediction(value.prediction, random),
    cards: trimmed,
    knowledgeCards,
  };
}

/* ---------------------------------------------------------------------------
 * Practice: normalise
 * ------------------------------------------------------------------------- */

export function normalisePractice(
  value: unknown,
  cardCount: number,
  maxQuestions: number,
  random: () => number = Math.random,
): PracticeQuestion[] {
  const rawQuestions = isRecord(value) ? value.questions : Array.isArray(value) ? value : null;

  if (!Array.isArray(rawQuestions)) throw new Error('PRACTICE_INVALID');

  const questions: PracticeQuestion[] = [];

  rawQuestions.forEach((raw) => {
    if (!isRecord(raw)) return;

    const prompt = text(raw.prompt, 400);
    const options = stringList(raw.options, 4, 140);
    const correctIndex = raw.correctIndex;

    if (
      !prompt ||
      options.length < 2 ||
      hasDuplicates(options) ||
      typeof correctIndex !== 'number' ||
      !Number.isInteger(correctIndex) ||
      correctIndex < 0 ||
      correctIndex >= options.length
    ) {
      return;
    }

    let type: PracticeType = raw.type === 'fill' || raw.type === 'scenario' ? raw.type : 'mcq';

    // A fill-in-the-blank without a blank is just a question.
    if (type === 'fill' && !prompt.includes('____')) type = 'mcq';

    const cardIndex =
      typeof raw.cardIndex === 'number' &&
      Number.isInteger(raw.cardIndex) &&
      raw.cardIndex >= 0 &&
      raw.cardIndex < cardCount
        ? raw.cardIndex
        : null;

    const shuffled = shuffleOptions(options, correctIndex, random);

    questions.push({
      type,
      prompt,
      options: shuffled.options,
      correctIndex: shuffled.correctIndex,
      explanation: text(raw.explanation, 400),
      cardIndex,
    });
  });

  if (questions.length < 2) throw new Error('PRACTICE_TOO_FEW_QUESTIONS');

  return questions.slice(0, Math.max(maxQuestions, 2));
}

/* ---------------------------------------------------------------------------
 * Reading stored JSON back (AWSJSON fields arrive as strings)
 * ------------------------------------------------------------------------- */

/**
 * AWSJSON fields can come back as an object, a JSON string, or a JSON string
 * that was stringified twice (the data client stringifies what we send).
 * Accept all three.
 */
function parseStored(value: unknown): unknown {
  let current = value;

  for (let i = 0; i < 2 && typeof current === 'string'; i += 1) {
    try {
      current = JSON.parse(current);
    } catch {
      return null;
    }
  }

  return current;
}

export function readLessonContent(value: unknown): LessonContent | null {
  const parsed = parseStored(value);

  if (!isRecord(parsed) || !Array.isArray(parsed.cards) || parsed.cards.length === 0) return null;

  return parsed as unknown as LessonContent;
}

export function readPractice(value: unknown): PracticeQuestion[] | null {
  const parsed = parseStored(value);

  if (!Array.isArray(parsed)) return null;

  const valid = parsed.every(
    (item) =>
      isRecord(item) &&
      Array.isArray(item.options) &&
      typeof item.correctIndex === 'number' &&
      typeof item.prompt === 'string',
  );

  return valid ? (parsed as PracticeQuestion[]) : null;
}

/* ---------------------------------------------------------------------------
 * Grading and XP
 * ------------------------------------------------------------------------- */

export interface Gradable {
  correctIndex: number;
  options: readonly unknown[];
}

/**
 * answers[i] is the option the learner picked FIRST for question i
 * (-1 when unanswered). Throws ANSWERS_INVALID on a malformed submission.
 */
export function gradeAnswers(
  questions: readonly Gradable[],
  answers: unknown,
): { correct: number; total: number } {
  if (!Array.isArray(answers) || answers.length !== questions.length) {
    throw new Error('ANSWERS_INVALID');
  }

  let correct = 0;

  questions.forEach((question, index) => {
    const answer = answers[index];

    if (typeof answer !== 'number' || !Number.isInteger(answer)) throw new Error('ANSWERS_INVALID');

    if (answer === question.correctIndex) correct += 1;
  });

  return { correct, total: questions.length };
}

export function computeLessonXp(correct: number, total: number): number {
  if (total <= 0) return BASE_LESSON_XP;

  const ratio = Math.min(1, Math.max(0, correct / total));

  return BASE_LESSON_XP + Math.round(MAX_ACCURACY_BONUS * ratio);
}