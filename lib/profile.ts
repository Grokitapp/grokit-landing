import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes } from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

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

  if (existing) {
    return client.models.UserProfile.update({
      id: existing.id,
      ...fields,
    });
  }

  return client.models.UserProfile.create({
    email,
    onboardingCompleted: false,
    ...fields,
  });
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

  return toUsernameResult(data, errors);
}

/** Lets other parts of the app (the sidebar) react to a username change. */
export const USERNAME_CHANGED_EVENT = 'grokit:username-changed';

export function announceUsernameChanged(username: string) {
  window.dispatchEvent(
    new CustomEvent<string>(USERNAME_CHANGED_EVENT, { detail: username }),
  );
}