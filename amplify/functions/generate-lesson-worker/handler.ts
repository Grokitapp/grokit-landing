declare const process: {
  env: Record<string, string | undefined>;
};

import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { callClaudeJson } from "../shared/claude";
import { assertNoErrors, getErrorMessage, parseJsonish } from "../shared/common";
import { buildLearnerBrief } from "../shared/learner";
import { refundUsage } from "../shared/usage";
import {
  CONTENT_VERSION,
  LESSON_CONTENT_SCHEMA,
  PRACTICE_SCHEMA,
  normaliseLessonContent,
  normalisePractice,
  readLessonContent,
} from "../shared/lesson-content";
import {
  SYSTEM_PROMPT,
  buildCourseBlock,
  buildLessonBlock,
  buildPracticeBlock,
  type StoredOutline,
} from "../shared/lesson-prompts";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  process.env as Parameters<typeof getAmplifyDataClientConfig>[0],
);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

/* ---------------------------------------------------------------------------
 * Tunables
 * ------------------------------------------------------------------------- */

const LESSON_MODEL = process.env.LESSON_MODEL || "claude-haiku-5-5";

const LESSON_EFFORT = /^claude-(haiku|sonnet|opus)-5/.test(LESSON_MODEL) ? ("low" as const) : undefined;

const CONTENT_MAX_TOKENS = 8_000;
const PRACTICE_MAX_TOKENS = 4_000;

/* ---------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

interface WorkerEvent {
  lessonId: string;
  /**
   * "content" (default) writes the cards, then continues to practice.
   * "practice" only (re)writes the practice questions for a lesson whose
   * cards already exist.
   */
  stage?: "content" | "practice";
}

/* ---------------------------------------------------------------------------
 * Handler
 * ------------------------------------------------------------------------- */

export const handler = async (event: WorkerEvent, context: { awsRequestId: string }): Promise<void> => {
  const requestId = context.awsRequestId;
  const { lessonId } = event;
  const practiceOnly = event.stage === "practice";

  if (!lessonId) {
    console.error("Lesson worker called without lessonId", { requestId });
    return;
  }

  // Which stage failed decides which status we mark, so a practice failure
  // never throws away cards the learner can already read.
  let stage: "content" | "practice" = practiceOnly ? "practice" : "content";

  // Whose daily slot to give back if the cards cannot be written.
  let refundOwner: string | undefined;

  try {
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY_NOT_CONFIGURED");

    const lessonResult = await client.models.Lesson.get({ id: lessonId });
    assertNoErrors(lessonResult.errors, "LESSON_LOAD_FAILED");

    const lesson = lessonResult.data;
    if (!lesson) throw new Error("LESSON_NOT_FOUND");
    refundOwner = lesson.owner ?? undefined;

    // Idempotency: never regenerate (or re-bill) finished work.
    if (lesson.status === "READY" && lesson.coreContent && !lesson.content) return; // older article lesson

    let content = lesson.status === "READY" ? readLessonContent(lesson.content) : null;

    if (practiceOnly && !content) throw new Error("PRACTICE_REQUESTED_WITHOUT_CONTENT");

    if (content && lesson.practiceStatus === "READY") return;

    const courseResult = await client.models.Course.get({ id: lesson.courseId });
    assertNoErrors(courseResult.errors, "COURSE_LOAD_FAILED");

    const course = courseResult.data;
    if (!course) throw new Error("COURSE_NOT_FOUND");

    const brief = buildLearnerBrief(parseJsonish(course.personalizationProfile));
    const outline = parseOutline(course.outline);
    const shape = brief.lessonShape;

    /** Zone title is only needed when the course predates the stored outline. */
    let fallbackZoneTitle = "";
    if (!outline) {
      const phaseResult = await client.models.Phase.get({ id: lesson.phaseId });
      fallbackZoneTitle = phaseResult.data?.title ?? "";
    }

    const courseBlock = buildCourseBlock({
      title: course.title,
      topic: course.topic,
      description: course.description ?? "",
      learnerText: brief.text,
      outline,
    });

    /* ---------------- Stage 1: the cards ---------------- */

    if (!content) {
      const lessonBlock = buildLessonBlock({
        lessonId,
        lessonTitle: lesson.title,
        lessonHook: lesson.hook ?? "",
        outline,
        fallbackZoneTitle,
        shape,
      });

      const { data, usage } = await callClaudeJson({
        apiKey: ANTHROPIC_API_KEY,
        model: LESSON_MODEL,
        system: SYSTEM_PROMPT,
        blocks: [
          // Stable per course: cached, so later lessons read it at a fraction
          // of the normal input price (when the prefix is large enough).
          { text: courseBlock, cache: true },
          { text: lessonBlock },
        ],
        maxTokens: CONTENT_MAX_TOKENS,
        schema: LESSON_CONTENT_SCHEMA,
        effort: LESSON_EFFORT,
        timeoutMs: 60_000,
        maxAttempts: 2,
      });

      console.info("Lesson content model usage", { requestId, lessonId, model: LESSON_MODEL, usage });

      content = normaliseLessonContent(data, shape);

      // The learner can start reading now; practice is written while they read.
      const saved = await client.models.Lesson.update({
        id: lessonId,
        content: JSON.stringify(content),
        contentVersion: CONTENT_VERSION,
        generatedAt: new Date().toISOString(),
        status: "READY",
        practiceStatus: "GENERATING",
        generationError: null,
      });
      assertNoErrors(saved.errors, "LESSON_FINALIZE_FAILED");

      console.info("Lesson content ready", { requestId, lessonId, cards: content.cards.length });
    }

    /* ---------------- Stage 2: the practice ---------------- */

    stage = "practice";

    const practiceBlock = buildPracticeBlock({
      lessonTitle: lesson.title,
      content,
      shape,
    });

    const { data: practiceData, usage: practiceUsage } = await callClaudeJson({
      apiKey: ANTHROPIC_API_KEY,
      model: LESSON_MODEL,
      system: SYSTEM_PROMPT,
      blocks: [{ text: courseBlock, cache: true }, { text: practiceBlock }],
      maxTokens: PRACTICE_MAX_TOKENS,
      schema: PRACTICE_SCHEMA,
      effort: LESSON_EFFORT,
      timeoutMs: 60_000,
      maxAttempts: 2,
    });

    console.info("Lesson practice model usage", { requestId, lessonId, model: LESSON_MODEL, usage: practiceUsage });

    const practice = normalisePractice(practiceData, content.cards.length, shape.questions);

    const savedPractice = await client.models.Lesson.update({
      id: lessonId,
      practice: JSON.stringify(practice),
      practiceStatus: "READY",
    });
    assertNoErrors(savedPractice.errors, "PRACTICE_FINALIZE_FAILED");

    console.info("Lesson practice ready", { requestId, lessonId, questions: practice.length });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("Lesson generation failed", { requestId, lessonId, stage, error: message });

    try {
      if (stage === "content") {
        await client.models.Lesson.update({
          id: lessonId,
          status: "FAILED",
          generationError: message.slice(0, 5000),
        });

        // A lesson that was never written must not use up the allowance.
        if (refundOwner) await refundUsage(refundOwner, "lessonsGenerated");
      } else {
        // The cards are fine; only the practice failed. The learner can read
        // on, and generateLesson will retry just this stage when asked again.
        await client.models.Lesson.update({ id: lessonId, practiceStatus: "FAILED" });
      }
    } catch (updateError) {
      console.error("Could not record generation failure", { requestId, lessonId, error: getErrorMessage(updateError) });
    }

    // Deliberately do NOT rethrow: a thrown error would make Lambda re-run
    // the worker (and re-bill the model call).
  }
};

/* ---------------------------------------------------------------------------
 * Parsing
 * ------------------------------------------------------------------------- */

function parseOutline(value: unknown): StoredOutline | null {
  const parsed = parseJsonish(value);
  if (!parsed || typeof parsed !== "object") return null;

  const zones = (parsed as { zones?: unknown }).zones;
  if (!Array.isArray(zones) || zones.length === 0) return null;

  const valid = zones.every(
    (zone) =>
      zone &&
      typeof zone === "object" &&
      typeof (zone as { title?: unknown }).title === "string" &&
      Array.isArray((zone as { lessons?: unknown }).lessons) &&
      (zone as { lessons: unknown[] }).lessons.every(
        (lesson) =>
          lesson &&
          typeof lesson === "object" &&
          typeof (lesson as { id?: unknown }).id === "string" &&
          typeof (lesson as { title?: unknown }).title === "string" &&
          typeof (lesson as { hook?: unknown }).hook === "string",
      ),
  );

  return valid ? (parsed as StoredOutline) : null;
}