declare const process: {
  env: Record<string, string | undefined>;
};

import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { assertNoErrors, getErrorMessage, parseJsonish } from "../shared/common";
import { consumeUsage, refundUsage } from "../shared/usage";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  process.env as Parameters<typeof getAmplifyDataClientConfig>[0],
);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();
const lambda = new LambdaClient({});

type Handler = Schema["generateOutline"]["functionHandler"];

const MAX_TOPIC_LENGTH = 600;
const MAX_PROFILE_BYTES = 12_000;

/**
 * Creates the Course immediately (status GENERATING) and starts the
 * background worker. The frontend polls the course until it is READY/FAILED.
 */
export const handler: Handler = async (event, context) => {
  const requestId = context.awsRequestId;
  const topic = (event.arguments.topic ?? "").trim();

  if (!topic) throw new Error("COURSE_TOPIC_REQUIRED");
  if (topic.length > MAX_TOPIC_LENGTH) throw new Error("COURSE_TOPIC_TOO_LONG");

  const workerName = process.env.OUTLINE_WORKER_FUNCTION;
  if (!workerName) throw new Error("OUTLINE_WORKER_NOT_CONFIGURED");

  const identity = event.identity as { sub?: string } | null | undefined;
  const owner = identity?.sub?.trim();
  if (!owner) throw new Error("COURSE_OWNER_IDENTITY_MISSING");

  /** Normalise the profile; drop it if it is oversized or not valid JSON. */
  const rawProfile = event.arguments.personalizationProfile;
  const profileObject =
    typeof rawProfile === "string" && rawProfile.length > MAX_PROFILE_BYTES
      ? undefined
      : parseJsonish(rawProfile);

  // Take today's slot before any paid work starts. Throws the "limit reached"
  // error when the learner has used their allowance.
  await consumeUsage(owner, "coursesCreated");

  console.info("Starting course generation", { requestId, owner, topicLength: topic.length });

  const created = await client.models.Course.create({
    owner,
    // Provisional title; the worker replaces it with the real one.
    title: topic.slice(0, 60),
    topic,
    personalizationProfile:
      profileObject && typeof profileObject === "object" ? JSON.stringify(profileObject) : undefined,
    status: "GENERATING",
  });
  if (created.errors?.length || !created.data) {
    await refundUsage(owner, "coursesCreated");
    assertNoErrors(created.errors, "COURSE_CREATE_FAILED");
    throw new Error("COURSE_CREATE_FAILED");
  }

  const course = created.data;

  try {
    await lambda.send(
      new InvokeCommand({
        FunctionName: workerName,
        InvocationType: "Event", // asynchronous: returns as soon as it is queued
        Payload: new TextEncoder().encode(JSON.stringify({ courseId: course.id })),
      }),
    );
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("Failed to start outline worker", { requestId, courseId: course.id, error: message });

    await client.models.Course.update({
      id: course.id,
      status: "FAILED",
      generationError: `WORKER_START_FAILED: ${message}`.slice(0, 5000),
    });

    await refundUsage(owner, "coursesCreated");

    throw new Error("COURSE_GENERATION_START_FAILED");
  }

  return course;
};