import { defineFunction, secret } from "@aws-amplify/backend";

export const generateLesson = defineFunction({
  name: "generate-lesson",
  entry: "./handler.ts",
  timeoutSeconds: 90,
  resourceGroupName: "data",
  environment: {
    ANTHROPIC_API_KEY: secret("ANTHROPIC_API_KEY"),
  },
});