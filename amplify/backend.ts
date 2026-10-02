import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

import { auth } from "./auth/resource";
import { data } from "./data/resource";

import { generateOutline } from "./functions/generate-outline/resource";
import { generateLesson } from "./functions/generate-lesson/resource";
import { linkGoogleUser } from "./functions/link-google-user/resource";

const backend = defineBackend({
  auth,
  data,
  generateOutline,
  generateLesson,
  linkGoogleUser,
});

const linkGoogleUserLambda = backend.linkGoogleUser.resources.lambda;

const userPoolArn = Stack.of(linkGoogleUserLambda).formatArn({
  service: "cognito-idp",
  resource: "userpool",
  resourceName: "*",
});

linkGoogleUserLambda.addToRolePolicy(
  new PolicyStatement({
    sid: "LinkGoogleIdentityToCognitoUser",
    actions: [
      "cognito-idp:ListUsers",
      "cognito-idp:AdminLinkProviderForUser",
    ],
    resources: [userPoolArn],
  }),
);