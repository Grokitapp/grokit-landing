import { defineFunction } from '@aws-amplify/backend';

// Keep these options in step with generate-outline/resource.ts (same
// resourceGroupName, so the function lives in the data stack and can use it).
export const importJourney = defineFunction({
  name: 'import-journey',
  entry: './handler.ts',
  // AppSync gives a resolver 30 seconds, so stay just under it.
  timeoutSeconds: 29,
  memoryMB: 512,
  resourceGroupName: 'data',
});