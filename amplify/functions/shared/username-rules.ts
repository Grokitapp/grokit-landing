/**
 * Username rules, shared by the browser (instant feedback) and the
 * change-username Lambda (the real enforcement). Keep this file free of
 * Node / browser APIs so both sides can import it.
 *
 * Policy (in line with Reddit, Discord, Instagram and X):
 *  - 3 to 20 characters
 *  - lowercase letters, digits, "." and "_" only (ASCII only, which blocks
 *    look-alike / homoglyph impersonation; input is lowercased, so
 *    "Sam" and "sam" are the same name)
 *  - starts and ends with a letter or digit, no two separators in a row
 *  - at least one letter (no all-number names)
 *  - reserved and brand names are blocked
 *  - the first username is free; after that, 2 changes per rolling 15 days
 */

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

export const USERNAME_CHANGE_LIMIT = 2;
export const USERNAME_CHANGE_WINDOW_DAYS = 15;
export const USERNAME_CHANGE_WINDOW_MS =
  USERNAME_CHANGE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export const USERNAME_RULES_SUMMARY =
  `${USERNAME_MIN_LENGTH}–${USERNAME_MAX_LENGTH} characters. ` +
  'Letters, numbers, periods and underscores.';

/** Exact names nobody can take (routes, roles, system words). */
const RESERVED_NAMES = new Set([
  'about', 'abuse', 'admin', 'administrator', 'anonymous', 'api', 'app',
  'billing', 'contact', 'create', 'dashboard', 'explore', 'help', 'home',
  'info', 'leaderboard', 'learn', 'library', 'login', 'logout', 'mail',
  'me', 'mod', 'moderator', 'news', 'null', 'official', 'postmaster',
  'privacy', 'profile', 'root', 'security', 'settings', 'signin', 'signup',
  'staff', 'status', 'support', 'system', 'team', 'terms', 'undefined',
  'webmaster', 'www', 'you',
]);

/** Anything containing these is blocked (brand protection). Extend as needed. */
const RESERVED_SUBSTRINGS = ['grokit'];

export type UsernameIssue =
  | 'empty'
  | 'too_short'
  | 'too_long'
  | 'invalid_chars'
  | 'bad_edge'
  | 'repeated_separators'
  | 'needs_letter'
  | 'reserved';

export type UsernameValidation =
  | { ok: true; handle: string }
  | { ok: false; issue: UsernameIssue; message: string };

/** Trim, drop a leading "@", normalise Unicode and lowercase. */
export function normalizeUsername(input: string): string {
  return input.normalize('NFKC').trim().replace(/^@+/, '').toLowerCase();
}

export function validateUsername(input: string): UsernameValidation {
  const handle = normalizeUsername(input);

  const fail = (issue: UsernameIssue, message: string): UsernameValidation => ({
    ok: false,
    issue,
    message,
  });

  if (!handle) return fail('empty', 'Enter a username.');

  if (handle.length < USERNAME_MIN_LENGTH) {
    return fail(
      'too_short',
      `Use at least ${USERNAME_MIN_LENGTH} characters.`,
    );
  }

  if (handle.length > USERNAME_MAX_LENGTH) {
    return fail(
      'too_long',
      `Use ${USERNAME_MAX_LENGTH} characters or fewer.`,
    );
  }

  if (!/^[a-z0-9._]+$/.test(handle)) {
    return fail(
      'invalid_chars',
      'Use only letters, numbers, periods and underscores.',
    );
  }

  if (!/^[a-z0-9]/.test(handle) || !/[a-z0-9]$/.test(handle)) {
    return fail(
      'bad_edge',
      'Start and end with a letter or number.',
    );
  }

  if (/[._]{2}/.test(handle)) {
    return fail(
      'repeated_separators',
      'Don’t put periods or underscores next to each other.',
    );
  }

  if (!/[a-z]/.test(handle)) {
    return fail('needs_letter', 'Include at least one letter.');
  }

  if (
    RESERVED_NAMES.has(handle) ||
    RESERVED_SUBSTRINGS.some((word) => handle.includes(word))
  ) {
    return fail('reserved', 'That username isn’t available.');
  }

  return { ok: true, handle };
}

export interface UsernameChangeStatus {
  limit: number;
  /** Changes still available right now. */
  remaining: number;
  /** When the next change opens up; null if one is available now. */
  nextAvailableAt: Date | null;
}

/**
 * Rolling-window limit: at most USERNAME_CHANGE_LIMIT changes in any
 * USERNAME_CHANGE_WINDOW_DAYS. `changedAt` holds ISO timestamps of past
 * changes (the first username is not a change and is never recorded).
 */
export function getUsernameChangeStatus(
  changedAt: readonly (string | null)[] | null | undefined,
  now: number = Date.now(),
): UsernameChangeStatus {
  const recent = (changedAt ?? [])
    .map((value) => (value ? new Date(value).getTime() : NaN))
    .filter((time) => Number.isFinite(time) && now - time < USERNAME_CHANGE_WINDOW_MS)
    .sort((a, b) => a - b);

  const remaining = Math.max(0, USERNAME_CHANGE_LIMIT - recent.length);

  return {
    limit: USERNAME_CHANGE_LIMIT,
    remaining,
    nextAvailableAt:
      remaining > 0
        ? null
        : new Date(recent[recent.length - USERNAME_CHANGE_LIMIT] + USERNAME_CHANGE_WINDOW_MS),
  };
}