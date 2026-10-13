/**
 * Leaderboard rules shared by the backend functions and the browser, so both
 * always agree on weeks, group sizes and who moves up or down.
 *
 * Weeks run Monday 00:00 UTC to the next Monday 00:00 UTC, the same for
 * every learner, wherever they are.
 */

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

const DAY_MS = 86_400_000;

/** Monday 00:00 UTC of the week that contains `date`. */
export function weekStart(date: Date): Date {
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() - daysSinceMonday,
    ),
  );
}

/** A week's id is the date of its Monday, e.g. "2026-10-12". */
export function weekIdOf(date: Date): string {
  return weekStart(date).toISOString().slice(0, 10);
}

export function previousWeekId(date: Date): string {
  return weekIdOf(new Date(weekStart(date).getTime() - DAY_MS));
}

/** The moment the week that contains `date` ends. */
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