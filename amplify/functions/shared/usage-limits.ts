/**
 * Free-plan limits for actions that cost real money (every AI-written journey
 * or lesson is a paid model call).
 *
 *   - New lessons written by the AI: 7 per DAY
 *   - New journeys (created or imported): 3 per MONTH
 *
 * Limits are per learner. Counters reset at midnight India time (daily) or at
 * midnight India time on the 1st (monthly), i.e. a calendar month, not a
 * rolling 30 days.
 *
 * This file has NO imports on purpose: the Lambda functions enforce the limits
 * and the browser shows them, and both read the numbers from here, so what
 * the Usage page says is exactly what is checked.
 */

export type LimitedKind = 'lessonsGenerated' | 'coursesCreated';

export type LimitPeriod = 'day' | 'month';

export const FREE_LIMITS: Record<LimitedKind, { limit: number; period: LimitPeriod }> = {
  /** New lessons written by the AI per day. Opening a finished lesson is always free. */
  lessonsGenerated: { limit: 7, period: 'day' },
  /** New journeys per calendar month, whether created from a topic or imported from Explore. */
  coursesCreated: { limit: 3, period: 'month' },
};

/**
 * Kept so older imports keep compiling. These are the plain numbers only (the
 * course limit is monthly now, despite the name). Prefer FREE_LIMITS.
 */
export const FREE_DAILY_LIMITS: Record<LimitedKind, number> = {
  lessonsGenerated: FREE_LIMITS.lessonsGenerated.limit,
  coursesCreated: FREE_LIMITS.coursesCreated.limit,
};

export const limitFor = (kind: LimitedKind): number => FREE_LIMITS[kind].limit;

export const periodFor = (kind: LimitedKind): LimitPeriod => FREE_LIMITS[kind].period;

// -----------------------------------------------------------------------------
// India Standard Time periods (UTC+05:30, no daylight saving)
// -----------------------------------------------------------------------------

const IST_OFFSET_MS = 19_800_000;

const pad2 = (value: number): string => String(value).padStart(2, '0');

/** A Date whose UTC fields read as the wall-clock time in India. */
const istWallClock = (date: Date): Date => new Date(date.getTime() + IST_OFFSET_MS);

/** "YYYY-MM" for the IST calendar month containing `date`. */
export function istMonthKey(date: Date = new Date()): string {
  const ist = istWallClock(date);

  return `${ist.getUTCFullYear()}-${pad2(ist.getUTCMonth() + 1)}`;
}

/** ISO time of the next reset for this kind: next IST midnight, or midnight on the 1st. */
export function nextReset(kind: LimitedKind, now: Date = new Date()): string {
  const ist = istWallClock(now);
  const year = ist.getUTCFullYear();
  const month = ist.getUTCMonth();
  const day = ist.getUTCDate();

  const nextLocalMidnight =
    periodFor(kind) === 'month' ? Date.UTC(year, month + 1, 1) : Date.UTC(year, month, day + 1);

  return new Date(nextLocalMidnight - IST_OFFSET_MS).toISOString();
}

/**
 * How a counter row is keyed: one row per learner per action per period.
 * Daily kinds use the day key as given (YYYY-MM-DD, India time). Monthly kinds
 * use the month part of it (YYYY-MM).
 */
export const counterBucket = (kind: LimitedKind, dayKey: string): string => {
  if (periodFor(kind) === 'month') {
    const match = /^(\d{4}-\d{2})-\d{2}/.exec(dayKey);

    return `${kind}#${match ? match[1] : istMonthKey()}`;
  }

  return `${kind}#${dayKey}`;
};

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