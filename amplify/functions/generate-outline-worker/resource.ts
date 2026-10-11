import { defineFunction, secret } from "@aws-amplify/backend";

/**
 * Background worker that designs the course with Claude and writes zones +
 * lessons. It is invoked asynchronously by `generate-outline`, so it is not
 * bound by AppSync's ~30s limit. Async retries are disabled in backend.ts so
 * a crash can never create a duplicate course.
 */
export const generateOutlineWorker = defineFunction({
  name: "generate-outline-worker",
  entry: "./handler.ts",
  timeoutSeconds: 300,
  memoryMB: 512,
  resourceGroupName: "data",
  environment: {
    ANTHROPIC_API_KEY: secret("ANTHROPIC_API_KEY"),
  },
});
