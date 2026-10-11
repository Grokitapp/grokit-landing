import { defineFunction } from "@aws-amplify/backend";

/**
 * Fast "starter" behind the AppSync mutation. It only creates the Course
 * (status GENERATING) and triggers the background worker, so it finishes in
 * well under AppSync's ~30s limit regardless of how large the course is.
 * It never talks to Anthropic, so it does not need the API key.
 */
export const generateOutline = defineFunction({
  name: "generate-outline",
  entry: "./handler.ts",
  timeoutSeconds: 15,
  resourceGroupName: "data",
});
