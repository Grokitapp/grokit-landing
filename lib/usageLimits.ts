import {
  limitFor,
  nextReset,
  parseLimitError,
  periodFor,
  type LimitedKind,
} from '../amplify/functions/shared/usage-limits';
import { formatReset, readUsageCount } from './settings';

const WHAT: Record<LimitedKind, string> = {
  coursesCreated: 'new journeys',
  lessonsGenerated: 'new lessons',
};

/** The sentence shown to the learner when a daily or monthly limit stops them. */
export function describeLimit(kind: LimitedKind, limit: number, resetsAt: string): string {
  const reset = formatReset(resetsAt);
  const extra =
    kind === 'lessonsGenerated' ? ' Lessons you’ve already opened are still yours to finish.' : '';

  const when = periodFor(kind) === 'month' ? 'this month’s' : 'today’s';

  return `You’ve reached ${when} limit of ${limit} ${WHAT[kind]}.${reset ? ` ${reset}.` : ''}${extra}`;
}

/**
 * Thrown when the backend refuses an action because today's allowance is used
 * up. `message` is already written for the learner.
 */
export class LimitReachedError extends Error {
  readonly kind: LimitedKind;
  readonly limit: number;
  readonly resetsAt: string;

  constructor(kind: LimitedKind, limit: number, resetsAt: string) {
    super(describeLimit(kind, limit, resetsAt));
    this.name = 'LimitReachedError';
    this.kind = kind;
    this.limit = limit;
    this.resetsAt = resetsAt;
  }
}

/**
 * Looks for a "limit reached" failure in whatever an API call gave back: the
 * `errors` array of a mutation, an Error, or a plain message.
 */
export function limitErrorFrom(source: unknown): LimitReachedError | null {
  if (source instanceof LimitReachedError) return source;

  const messages: string[] = [];

  if (typeof source === 'string') {
    messages.push(source);
  } else if (source instanceof Error) {
    messages.push(source.message);
  } else if (Array.isArray(source)) {
    for (const item of source) {
      if (item && typeof item === 'object' && 'message' in item) {
        messages.push(String((item as { message?: unknown }).message));
      }
    }
  }

  for (const message of messages) {
    const parsed = parseLimitError(message);

    if (parsed) return new LimitReachedError(parsed.kind, parsed.limit, parsed.resetsAt);
  }

  return null;
}

/**
 * Asks, before the learner fills in anything, whether the current allowance is
 * already used up. Returns the message to show, or null to carry on. If the
 * count can't be read it returns null: the backend still enforces the limit,
 * this check only saves the learner from a late surprise.
 */
export async function getLimitNotice(kind: LimitedKind): Promise<string | null> {
  try {
    const used = await readUsageCount(kind);
    const limit = limitFor(kind);

    return used >= limit ? describeLimit(kind, limit, nextReset(kind)) : null;
  } catch (error) {
    console.warn('[usage] could not check the limit:', error);

    return null;
  }
}