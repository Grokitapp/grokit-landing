import { defineFunction, secret } from "@aws-amplify/backend";

/**
 * Background worker that writes one lesson with Claude. Invoked
 * asynchronously by `generate-lesson` when a learner opens a lesson.
 * Async retries are disabled in backend.ts so a crash never double-bills.
 */
export const generateLessonWorker = defineFunction({
  name: "generate-lesson-worker",
  entry: "./handler.ts",
  timeoutSeconds: 300,
  memoryMB: 512,
  resourceGroupName: "data",
  environment: {
    ANTHROPIC_API_KEY: secret("ANTHROPIC_API_KEY"),
  },
});
