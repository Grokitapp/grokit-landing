declare const process: {
  env: Record<string, string | undefined>;
};

import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { assertNoErrors, getErrorMessage } from "../shared/common";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  process.env as Parameters<typeof getAmplifyDataClientConfig>[0],
);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();
const lambda = new LambdaClient({});

type Handler = Schema["generateLesson"]["functionHandler"];

/**
 * A lesson stuck in GENERATING longer than this is assumed to have lost its
 * worker (crash/timeout) and may be started again. Must exceed the worker's
 * timeout (300s).
 */
const STALE_AFTER_MS = 330_000;

export const handler: Handler = async (event, context) => {
  const requestId = context.awsRequestId;
  const lessonId = event.arguments.lessonId?.trim();

  if (!lessonId) throw new Error("LESSON_ID_REQUIRED");

  const workerName = process.env.LESSON_WORKER_FUNCTION;
  if (!workerName) throw new Error("LESSON_WORKER_NOT_CONFIGURED");

  const identity = event.identity as { sub?: string } | null | undefined;
  const sub = identity?.sub?.trim();
  if (!sub) throw new Error("LESSON_OWNER_IDENTITY_MISSING");

  const lessonResult = await client.models.Lesson.get({ id: lessonId });
  assertNoErrors(lessonResult.errors, "LESSON_LOAD_FAILED");

  const lesson = lessonResult.data;

  // The functions run with elevated data access, so ownership must be
  // checked here. The same error is used for "missing" and "not yours".
  if (!lesson || lesson.owner !== sub) throw new Error("LESSON_NOT_FOUND");

  /** Already generated: never pay for the same lesson twice. */
  if (lesson.status === "READY" && lesson.coreContent) return lesson;

  /** Already running and fresh: do not start a second (billed) generation. */
  if (lesson.status === "GENERATING") {
    const updatedAt = lesson.updatedAt ? Date.parse(lesson.updatedAt) : 0;
    if (updatedAt && Date.now() - updatedAt < STALE_AFTER_MS) return lesson;
  }

  const generating = await client.models.Lesson.update({
    id: lessonId,
    status: "GENERATING",
    generationError: null,
  });
  assertNoErrors(generating.errors, "LESSON_GENERATING_UPDATE_FAILED");

  try {
    await lambda.send(
      new InvokeCommand({
        FunctionName: workerName,
        InvocationType: "Event",
        Payload: new TextEncoder().encode(JSON.stringify({ lessonId })),
      }),
    );
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("Failed to start lesson worker", { requestId, lessonId, error: message });

    await client.models.Lesson.update({
      id: lessonId,
      status: "FAILED",
      generationError: `WORKER_START_FAILED: ${message}`.slice(0, 5000),
    });

    throw new Error("LESSON_GENERATION_START_FAILED");
  }

  return generating.data ?? lesson;
};
