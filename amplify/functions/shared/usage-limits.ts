/**
 * Daily limits for actions that cost real money (every AI-written journey or
 * lesson is a paid model call).
 *
 * This file has NO imports on purpose: the Lambda functions enforce the limits
 * and the browser shows them, and both read the numbers from here, so what
 * the Usage page says is exactly what is checked.
 *
 * Counters reset at midnight India time (see istDayKey in voices.ts).
 */

export type LimitedKind = 'lessonsGenerated' | 'coursesCreated';

export const FREE_DAILY_LIMITS: Record<LimitedKind, number> = {
  /** New lessons written by the AI per day. Opening a finished lesson is always free. */
  lessonsGenerated: 10,
  /** New journeys per day, whether created from a topic or imported from Explore. */
  coursesCreated: 3,
};

/** How a counter row is keyed: one row per learner per action per day. */
export const counterBucket = (kind: LimitedKind, dayKey: string): string => `${kind}#${dayKey}`;

// -----------------------------------------------------------------------------
// The "limit reached" error
//
// A custom mutation can only fail with a message, so the details travel inside
// it, in a fixed shape the browser can read back:
//   USAGE_LIMIT_REACHED|<kind>|<limit>|<ISO reset time>
// -----------------------------------------------------------------------------

export const LIMIT_ERROR_CODE = 'USAGE_LIMIT_REACHED';

export function formatLimitError(kind: LimitedKind, limit: number, resetsAt: string): string {
  return `${LIMIT_ERROR_CODE}|${kind}|${limit}|${resetsAt}`;
}

const LIMIT_PATTERN = /USAGE_LIMIT_REACHED\|(lessonsGenerated|coursesCreated)\|(\d+)\|([^\s|"']+)/;

/** Finds a limit error anywhere in a message (AppSync may wrap it). */
export function parseLimitError(
  message: string,
): { kind: LimitedKind; limit: number; resetsAt: string } | null {
  const match = LIMIT_PATTERN.exec(message);

  if (!match) return null;

  return { kind: match[1] as LimitedKind, limit: Number(match[2]), resetsAt: match[3] };
}