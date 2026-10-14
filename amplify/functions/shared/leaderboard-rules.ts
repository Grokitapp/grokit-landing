/**
 * Leaderboard rules shared by the backend functions and the browser, so both
 * always agree on weeks, group sizes and who moves up or down.
 *
 * All leaderboard weeks use India Standard Time (IST):
 * Monday 00:00 IST to the next Monday 00:00 IST.
 *
 * Dates returned by weekStart() and weekEndsAt() are JavaScript Date objects
 * representing absolute instants. Week boundaries are calculated using the
 * Asia/Kolkata timezone, regardless of the server or browser's local timezone.
 */

const INDIA_TIME_ZONE = "Asia/Kolkata";

/** Duration of one day in milliseconds. */
const DAY_MS = 86_400_000;

/** Learners per league group. */
export const COHORT_SIZE = 30;

/** Bronze, Silver, Gold, Sapphire, Ruby, Emerald, Amethyst, Diamond. */
export const LEAGUE_COUNT = 8;

/** At most this many learners move up from one group each week. */
export const PROMOTE_MAX = 10;

/** At most this many learners move down from one group each week. */
export const DEMOTE_MAX = 5;

/** A learner needs at least this much XP in the week to be promoted. */
export const MIN_XP_TO_PROMOTE = 50;

const istDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: INDIA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const istWeekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: INDIA_TIME_ZONE,
  weekday: "short",
});

function istDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = istDateFormatter.formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;

  return {
    year: Number(part("year")),
    month: Number(part("month")),
    day: Number(part("day")),
  };
}

function istDateId(date: Date): string {
  const { year, month, day } = istDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Returns Monday 00:00 IST for the week containing `date`.
 * The returned Date represents that exact instant, independent of the
 * machine's local timezone.
 */
export function weekStart(date: Date): Date {
  const { year, month, day } = istDateParts(date);
  const weekday = istWeekdayFormatter.format(date);
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  const daysSinceMonday = (weekdayIndex + 6) % 7;

  // Parse midnight in India Standard Time, then move back to Monday.
  const istMidnight = new Date(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+05:30`,
  );

  return new Date(istMidnight.getTime() - daysSinceMonday * DAY_MS);
}

/** Returns the IST calendar date of the week's Monday, e.g. "2026-10-12". */
export function weekIdOf(date: Date): string {
  return istDateId(weekStart(date));
}

/** Returns the previous week's Monday date in IST, e.g. "2026-10-05". */
export function previousWeekId(date: Date): string {
  return istDateId(new Date(weekStart(date).getTime() - 7 * DAY_MS));
}

/**
 * Returns the instant at which the current IST leaderboard week ends:
 * the following Monday at 00:00 IST.
 */
export function weekEndsAt(date: Date): Date {
  return new Date(weekStart(date).getTime() + 7 * DAY_MS);
}

/** How many learners move up / down in a group of this size. */
export function getZoneSizes(groupSize: number): { promote: number; demote: number } {
  const promote =
    groupSize < 2 ? 0 : Math.min(PROMOTE_MAX, Math.ceil(groupSize / 3));
  const demote =
    groupSize < 6 ? 0 : Math.min(DEMOTE_MAX, Math.floor(groupSize / 6));

  return { promote, demote };
}