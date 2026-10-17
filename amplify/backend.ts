import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import { EventInvokeConfig } from "aws-cdk-lib/aws-lambda";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { StartingPosition } from "aws-cdk-lib/aws-lambda";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

import { auth } from "./auth/resource";
import { data } from "./data/resource";

import { generateOutline } from "./functions/generate-outline/resource";
import { generateOutlineWorker } from "./functions/generate-outline-worker/resource";
import { generateLesson } from "./functions/generate-lesson/resource";
import { generateLessonWorker } from "./functions/generate-lesson-worker/resource";
import { completeLesson } from "./functions/complete-lesson/resource";
import { linkGoogleUser } from "./functions/link-google-user/resource";
import { changeUsername } from "./functions/change-username/resource";
import { leaderboardSync } from "./functions/leaderboard-sync/resource";
import { leaderboardWeekly } from "./functions/leaderboard-weekly/resource";

const backend = defineBackend({
  auth,
  data,
  generateOutline,
  generateOutlineWorker,
  generateLesson,
  generateLessonWorker,
  completeLesson,
  linkGoogleUser,
  changeUsername,
  leaderboardSync,
  leaderboardWeekly,
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

/* ---------------------------------------------------------------------------
 * Weekly leaderboard
 *
 * leaderboardSync is triggered by the UserProgress table stream (every lesson a learner completes adds XP to their weekly entry) and also answers the
 * syncLeaderboardIdentity mutation. leaderboardWeekly runs daily and closes the finished week (promotions and demotions). Both talk to DynamoDB
 * directly, so clients can never write XP or leagues themselves.
 * ------------------------------------------------------------------------- */

const userProgressTable = backend.data.resources.tables["UserProgress"];
const leagueMemberTable = backend.data.resources.tables["LeagueMember"];
const leaderboardEntryTable = backend.data.resources.tables["LeaderboardEntry"];
const leagueCounterTable = backend.data.resources.tables["LeagueCounter"];

const leaderboardSyncLambda = backend.leaderboardSync.resources.lambda;
const leaderboardWeeklyLambda = backend.leaderboardWeekly.resources.lambda;

for (const fn of [backend.leaderboardSync, backend.leaderboardWeekly]) {
  fn.addEnvironment("LEAGUE_MEMBER_TABLE_NAME", leagueMemberTable.tableName);
  fn.addEnvironment("LEADERBOARD_ENTRY_TABLE_NAME", leaderboardEntryTable.tableName);
  fn.addEnvironment("LEAGUE_COUNTER_TABLE_NAME", leagueCounterTable.tableName);
}

backend.leaderboardSync.addEnvironment("USER_PROFILE_TABLE_NAME", userProfileTable.tableName);

for (const lambda of [leaderboardSyncLambda, leaderboardWeeklyLambda]) {
  leagueMemberTable.grantReadWriteData(lambda);
  leaderboardEntryTable.grantReadWriteData(lambda);
  leagueCounterTable.grantReadWriteData(lambda);
}

userProfileTable.grantReadData(leaderboardSyncLambda);

leaderboardSyncLambda.addEventSource(
  new DynamoEventSource(userProgressTable, {
    startingPosition: StartingPosition.LATEST,
    batchSize: 25,
    retryAttempts: 3,
    bisectBatchOnError: true,
  }),
);