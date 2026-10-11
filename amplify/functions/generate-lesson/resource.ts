import { defineFunction } from "@aws-amplify/backend";

/**
 * Fast "starter" behind the AppSync mutation. It checks ownership, flips the
 * lesson to GENERATING and triggers the background worker. It never calls
 * Anthropic, so it does not need the API key.
 */
export const generateLesson = defineFunction({
  name: "generate-lesson",
  entry: "./handler.ts",
  timeoutSeconds: 15,
  resourceGroupName: "data",
});
