import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
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

export async function saveProfile(fields: ProfileFields): Promise<void> {
  const { userId } = await getCurrentUser();

  const { data: existing } = await client.models.UserProfile.get({ id: userId });

  if (existing) {
    await client.models.UserProfile.update({ id: userId, ...fields });
  } else {
    await client.models.UserProfile.create({ id: userId, ...fields });
  }
}

export async function getProfile() {
  const { userId } = await getCurrentUser();
  const { data } = await client.models.UserProfile.get({ id: userId });
  return data;
}