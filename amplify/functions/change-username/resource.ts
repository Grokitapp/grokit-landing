import { defineFunction } from '@aws-amplify/backend';

/**
 * Claims, changes and checks usernames. It talks to DynamoDB directly so the
 * claim + profile update + release of the old name happen in ONE transaction.
 *
 * resourceGroupName: 'data' keeps this function in the data stack, which avoids
 * the data <-> function circular dependency (it is a data handler that also
 * needs the tables). Table names and permissions are wired in backend.ts.
 */
export const changeUsername = defineFunction({
  name: 'change-username',
  entry: './handler.ts',
  resourceGroupName: 'data',
  timeoutSeconds: 15,
});