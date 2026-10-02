import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes } from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

export type ProfileFields = Partial<{
  workTypes: string[];
  topics: string[];
  goals: string[];
  timeCommitment: string;
  learnPrompt: string;
  onboardingCompleted: boolean;
}>;

async function getEmail() {
  const attrs = await fetchUserAttributes();

  if (!attrs.email) {
    throw new Error('User email not found.');
  }

  return attrs.email.trim().toLowerCase();
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

  // If duplicate profiles exist for the same email,
  // always prefer the completed profile.
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

  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt] > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, delays[attempt]),
      );
    }

    profile = await getProfile();

    // The state we actually need has become available.
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