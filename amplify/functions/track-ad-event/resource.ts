import { defineFunction } from '@aws-amplify/backend';

// Same options as the other data-stack functions (see import-journey/resource.ts).
export const trackAdEvent = defineFunction({
  name: 'track-ad-event',
  entry: './handler.ts',
  timeoutSeconds: 10,
  memoryMB: 256,
  resourceGroupName: 'data',
});