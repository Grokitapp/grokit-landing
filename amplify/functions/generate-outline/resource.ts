import { defineFunction, secret } from "@aws-amplify/backend";

export const generateOutline = defineFunction({
  name: "generate-outline",
  entry: "./handler.ts",
  timeoutSeconds: 60,
  environment: {
    ANTHROPIC_API_KEY: secret("ANTHROPIC_API_KEY"),
  },
});