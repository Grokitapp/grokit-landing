import { defineFunction } from "@aws-amplify/backend";

export const linkGoogleUser = defineFunction({
  name: "link-google-user",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});