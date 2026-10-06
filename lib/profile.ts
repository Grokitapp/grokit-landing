import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes } from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

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