import { generateClient } from "aws-amplify/data";
import { fetchUserAttributes } from "aws-amplify/auth";
import type { Schema } from "../amplify/data/resource";

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
    throw new Error("User email not found.");
  }

  return attrs.email.toLowerCase();
}

async function findExistingProfile() {
  const email = await getEmail();

  const { data } = await client.models.UserProfile.list({
    filter: {
      email: {
        eq: email,
      },
    },
    limit: 1,
  });

  return data[0] ?? null;
}

export async function getProfile() {
  return findExistingProfile();
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