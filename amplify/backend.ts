import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import { EventInvokeConfig } from "aws-cdk-lib/aws-lambda";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

import { auth } from "./auth/resource";
import { data } from "./data/resource";

import { generateOutline } from "./functions/generate-outline/resource";
import { generateOutlineWorker } from "./functions/generate-outline-worker/resource";
import { generateLesson } from "./functions/generate-lesson/resource";
import { generateLessonWorker } from "./functions/generate-lesson-worker/resource";
import { linkGoogleUser } from "./functions/link-google-user/resource";
import { changeUsername } from "./functions/change-username/resource";

const backend = defineBackend({
  auth,
  data,
  generateOutline,
  generateOutlineWorker,
  generateLesson,
  generateLessonWorker,
  linkGoogleUser,
  changeUsername,
});

/* ---------------------------------------------------------------------------
 * Background generation workers
 *
 * The AppSync-facing functions ("starters") return in a second or two and
 * trigger a worker asynchronously, so slow Claude calls are never cut off by
 * AppSync's ~30s limit. Each starter gets the worker's name and permission to
 * invoke exactly that one function. Async retries are turned off so a crashed
 * worker can never run twice and bill the model twice.
 * ------------------------------------------------------------------------- */

const outlineWorker = backend.generateOutlineWorker.resources.lambda;

backend.generateOutline.addEnvironment("OUTLINE_WORKER_FUNCTION", outlineWorker.functionName);
backend.generateOutline.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    sid: "InvokeOutlineWorker",
    actions: ["lambda:InvokeFunction"],
    resources: [outlineWorker.functionArn],
  }),
);
new EventInvokeConfig(Stack.of(outlineWorker), "OutlineWorkerAsyncConfig", {
  function: outlineWorker,
  retryAttempts: 0,
});

const lessonWorker = backend.generateLessonWorker.resources.lambda;

backend.generateLesson.addEnvironment("LESSON_WORKER_FUNCTION", lessonWorker.functionName);
backend.generateLesson.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    sid: "InvokeLessonWorker",
    actions: ["lambda:InvokeFunction"],
    resources: [lessonWorker.functionArn],
  }),
);
new EventInvokeConfig(Stack.of(lessonWorker), "LessonWorkerAsyncConfig", {
  function: lessonWorker,
  retryAttempts: 0,
});

/* ---------------------------------------------------------------------------
 * Google account linking (unchanged)
 * ------------------------------------------------------------------------- */

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

// Usernames
const userProfileTable = backend.data.resources.tables["UserProfile"];
const usernameClaimTable = backend.data.resources.tables["UsernameClaim"];
const changeUsernameLambda = backend.changeUsername.resources.lambda;

backend.changeUsername.addEnvironment("USER_PROFILE_TABLE_NAME", userProfileTable.tableName);
backend.changeUsername.addEnvironment("USERNAME_CLAIM_TABLE_NAME", usernameClaimTable.tableName);

userProfileTable.grantReadWriteData(changeUsernameLambda);
usernameClaimTable.grantReadWriteData(changeUsernameLambda);