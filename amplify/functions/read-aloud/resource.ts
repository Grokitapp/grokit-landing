import { defineFunction } from "@aws-amplify/backend";

/**
 * Turns one screen of a lesson into natural speech (Amazon Polly), caches the
 * MP3 in S3 and returns a short-lived link the browser can play.
 *
 * The bucket, the Polly permission and the environment variables are wired up
 * in backend.ts. Kept in the "data" group like the other AppSync-facing
 * functions, so the bucket can live in the same stack without circular
 * dependencies.
 */
export const readAloud = defineFunction({
  name: "read-aloud",
  entry: "./handler.ts",
  // AppSync gives up at about 30s, so stay under it.
  timeoutSeconds: 25,
  memoryMB: 512,
  resourceGroupName: "data",
});