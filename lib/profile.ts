import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes, updateUserAttributes } from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';
import { getCached, invalidate, setCached, useCachedResource } from './cache';

const client = generateClient<Schema>();

// Cache keys. Screens read these through the hooks at the bottom of this file.
export const PROFILE_CACHE_KEY = 'profile:record';
export const ACCOUNT_CACHE_KEY = 'profile:account';

// Username rules live in one shared file so the browser and the backend
// function can never disagree.
export {
  USERNAME_CHANGE_LIMIT,
  USERNAME_CHANGE_WINDOW_DAYS,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_RULES_SUMMARY,
  getUsernameChangeStatus,
  normalizeUsername,
  validateUsername,
} from '../amplify/functions/shared/username-rules';

export type ProfileFields = Partial<{
  // New learner profile
  motivations: string[];
  interests: string[];
  startingPreference: string;
  learningPreferences: string[];
  comprehensionPreferences: string[];
  desiredOutcomes: string[];
  timeCommitment: string;

  // Legacy profile fields
  workTypes: string[];
  topics: string[];
  goals: string[];
  learnPrompt: string;

  // Onboarding state
  onboardingCompleted: boolean;
}>;

async function getEmail(): Promise<string> {
  const attrs = await fetchUserAttributes();

  const email = attrs.email?.trim().toLowerCase();

  if (!email) {
    throw new Error('User email not found.');
  }

  return email;
}

async function findExistingProfile() {
  const email = await getEmail();

  const { data } = await client.models.UserProfile.list({
    filter: {
      email: {
        eq: email,
      },
    },
    limit: 10,
  });

  if (!data.length) {
    return null;
  }

  // If duplicate profiles exist, prefer the completed profile.
  const completedProfile = data.find(
    (profile) => profile.onboardingCompleted === true,
  );

  return completedProfile ?? data[0];
}

export async function getProfile() {
  return findExistingProfile();
}

/**
 * Reads the profile repeatedly until onboarding completion
 * becomes visible, or the retry window is exhausted.
 *
 * This protects the onboarding -> /learn transition from
 * temporary read-after-write delays.
 */
export async function getProfileWithRetry() {
  const delays = [0, 300, 700, 1200, 2000, 3000];

  let profile = null;

  for (const delay of delays) {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    profile = await getProfile();

    if (profile?.onboardingCompleted === true) {
      return profile;
    }
  }

  return profile;
}

export async function saveProfile(fields: ProfileFields) {
  const email = await getEmail();
  const existing = await findExistingProfile();

  const result = existing
    ? await client.models.UserProfile.update({
        id: existing.id,
        ...fields,
      })
    : await client.models.UserProfile.create({
        email,
        onboardingCompleted: false,
        ...fields,
      });

  // Anything showing the cached profile refetches it.
  invalidate(PROFILE_CACHE_KEY);

  return result;
}

/**
 * Same as saveProfile, but throws when the API reports errors, so callers
 * (like the edit-profile form) can show a failure instead of a silent no-op.
 */
export async function updateLearningProfile(fields: ProfileFields) {
  const { data, errors } = await saveProfile(fields);

  if (errors?.length) {
    throw new Error(errors.map((error) => error.message).join('; '));
  }

  return data;
}

// -----------------------------------------------------------------------------
// Username (checked and written by the change-username function)
// -----------------------------------------------------------------------------

export type UsernameResultCode =
  | 'OK'
  | 'AVAILABLE'
  | 'UNCHANGED'
  | 'INVALID'
  | 'TAKEN'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'NO_PROFILE';

export interface UsernameResult {
  ok: boolean;
  code: UsernameResultCode;
  message: string | null;
  username: string | null;
  nextChangeAt: string | null;
  changesRemaining: number | null;
}

function toUsernameResult(
  data: Schema['UsernameResult']['type'] | null | undefined,
  errors: readonly { message: string }[] | undefined,
): UsernameResult {
  if (errors?.length || !data) {
    throw new Error(
      errors?.map((error) => error.message).join('; ') ||
        'No response from the username service.',
    );
  }

  return {
    ok: data.ok,
    code: data.code as UsernameResultCode,
    message: data.message ?? null,
    username: data.username ?? null,
    nextChangeAt: data.nextChangeAt ?? null,
    changesRemaining: data.changesRemaining ?? null,
  };
}

/** Is this username free? (Format is checked on both sides.) */
export async function checkUsernameAvailability(
  username: string,
): Promise<UsernameResult> {
  const { data, errors } = await client.queries.checkUsername({ username });

  return toUsernameResult(data, errors);
}

/** Claims or changes the username. The backend enforces every rule. */
export async function changeUsername(
  profileId: string,
  username: string,
): Promise<UsernameResult> {
  const { data, errors } = await client.mutations.changeUsername({
    profileId,
    username,
  });

  const result = toUsernameResult(data, errors);

  if (result.ok) invalidate(PROFILE_CACHE_KEY);

  return result;
}

/** Lets other parts of the app (the sidebar) react to a username change. */
export const USERNAME_CHANGED_EVENT = 'grokit:username-changed';

export function announceUsernameChanged(username: string) {
  window.dispatchEvent(
    new CustomEvent<string>(USERNAME_CHANGED_EVENT, { detail: username }),
  );
}

// -----------------------------------------------------------------------------
// Display name (stored as the Cognito `name` attribute)
// -----------------------------------------------------------------------------

export const NAME_MAX_LENGTH = 50;

/** The learner's saved name, or '' if they haven't set one. */
export async function getDisplayName(): Promise<string> {
  const attributes = await fetchUserAttributes();

  return attributes.name?.trim() ?? '';
}

export function validateDisplayName(
  raw: string,
): { ok: true; name: string } | { ok: false; message: string } {
  const name = raw.trim().replace(/\s+/g, ' ');

  if (!name) return { ok: false, message: 'Please enter your name.' };

  if (name.length > NAME_MAX_LENGTH) {
    return { ok: false, message: `Keep your name under ${NAME_MAX_LENGTH} characters.` };
  }

  return { ok: true, name };
}

export async function updateDisplayName(raw: string): Promise<string> {
  const result = validateDisplayName(raw);

  if (!result.ok) throw new Error(result.message);

  await updateUserAttributes({ userAttributes: { name: result.name } });

  // We know the new value, so every screen can show it straight away.
  const previous = getCached<AccountNames>(ACCOUNT_CACHE_KEY);

  setCached<AccountNames>(ACCOUNT_CACHE_KEY, {
    fullName: result.name,
    fallback: previous?.fallback ?? 'You',
  });

  return result.name;
}

// -----------------------------------------------------------------------------
// Cached reads (stale-while-revalidate): pages open instantly with the last
// known data and refresh quietly in the background.
// -----------------------------------------------------------------------------

export interface AccountNames {
  /** The name the learner chose, or '' if they haven't set one. */
  fullName: string;
  /** What to show when there is no name or username. */
  fallback: string;
}

export async function getAccountNames(): Promise<AccountNames> {
  const attributes = await fetchUserAttributes();

  return {
    fullName: attributes.name?.trim() ?? '',
    fallback:
      attributes.preferred_username ||
      attributes.email?.split('@')[0] ||
      'You',
  };
}

export function useProfileRecord() {
  return useCachedResource(PROFILE_CACHE_KEY, getProfile);
}

export function useAccountNames() {
  return useCachedResource(ACCOUNT_CACHE_KEY, getAccountNames, {
    staleMs: 5 * 60_000,
  });
}