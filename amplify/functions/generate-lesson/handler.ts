declare const process: {
  env: Record<string, string | undefined>;
};

import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { assertNoErrors, getErrorMessage } from "../shared/common";
import { consumeUsage, refundUsage } from "../shared/usage";

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

  const isFresh = () => {
    const updatedAt = lesson.updatedAt ? Date.parse(lesson.updatedAt) : 0;
    return Boolean(updatedAt) && Date.now() - updatedAt < STALE_AFTER_MS;
  };

  /** Starts the worker. On failure `onFailure` records it and we tell the client. */
  const startWorker = async (stage: "content" | "practice", onFailure: (message: string) => Promise<unknown>) => {
    try {
      await lambda.send(
        new InvokeCommand({
          FunctionName: workerName,
          InvocationType: "Event",
          Payload: new TextEncoder().encode(JSON.stringify({ lessonId, stage })),
        }),
      );
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("Failed to start lesson worker", { requestId, lessonId, stage, error: message });
      await onFailure(message);
      throw new Error("LESSON_GENERATION_START_FAILED");
    }
  };

  const hasCards = Boolean(lesson.content);

  /** Older article-style lesson that is already generated: never pay for it twice. */
  if (lesson.status === "READY" && lesson.coreContent && !hasCards) return lesson;

  if (lesson.status === "READY" && hasCards) {
    /** Cards and practice both done. */
    if (lesson.practiceStatus === "READY") return lesson;

    /** Practice is being written right now: do not start a second (billed) run. */
    if (lesson.practiceStatus === "GENERATING" && isFresh()) return lesson;

    /**
     * The cards are fine but the practice is missing, failed or stuck:
     * retry only that stage, so the learner never loses the cards.
     */
    const retrying = await client.models.Lesson.update({
      id: lessonId,
      practiceStatus: "GENERATING",
    });
    assertNoErrors(retrying.errors, "LESSON_PRACTICE_UPDATE_FAILED");

    await startWorker("practice", async () => {
      await client.models.Lesson.update({ id: lessonId, practiceStatus: "FAILED" });
    });

    return retrying.data ?? lesson;
  }

  /** Cards are already running and fresh: do not start a second (billed) generation. */
  if (lesson.status === "GENERATING" && isFresh()) return lesson;

  /**
   * Writing a lesson is a paid model call, so it takes one of today's slots
   * first. A slot is held exactly while a lesson is GENERATING or READY: it is
   * taken when the lesson leaves PENDING/FAILED, and given back whenever it
   * ends up FAILED. A stale GENERATING lesson restarted below already holds its
   * slot, so it is not charged twice. Practice-only retries above are free.
   */
  const needsSlot = lesson.status !== "GENERATING";

  if (needsSlot) await consumeUsage(sub, "lessonsGenerated");

  const generating = await client.models.Lesson.update({
    id: lessonId,
    status: "GENERATING",
    generationError: null,
  });

  if (generating.errors?.length) {
    if (needsSlot) await refundUsage(sub, "lessonsGenerated");
    assertNoErrors(generating.errors, "LESSON_GENERATING_UPDATE_FAILED");
  }

  await startWorker("content", async (message) => {
    await client.models.Lesson.update({
      id: lessonId,
      status: "FAILED",
      generationError: `WORKER_START_FAILED: ${message}`.slice(0, 5000),
    });
    await refundUsage(sub, "lessonsGenerated");
  });

  return generating.data ?? lesson;
};