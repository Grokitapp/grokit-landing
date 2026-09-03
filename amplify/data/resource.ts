import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  UserProfile: a.
  model({
    workTypes: a.string().array(),
    topics: a.string().array(),
    goals: a.string().array(),
    timeCommitment: a.string(),
    learnPrompt: a.string(),
    onboardingCompleted: a.boolean().default(false)
  }).
  authorization((allow) => [allow.owner()])
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool'
  }
});