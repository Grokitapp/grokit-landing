declare const process: {
  env: Record<string, string | undefined>;
};

import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { assertNoErrors, formatDataErrors, parseJsonish } from "../shared/common";
import {
  computeLessonXp,
  gradeAnswers,
  readLessonContent,
  readPractice,
  type Gradable,
} from "../shared/lesson-content";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  process.env as Parameters<typeof getAmplifyDataClientConfig>[0],
);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

type Handler = Schema["completeLesson"]["functionHandler"];

interface LegacyQuizQuestion {
  options: unknown[];
  correctIndex: number;
}

/** Older article-style lessons keep their questions in `quiz`. */
function readLegacyQuiz(value: unknown): Gradable[] {
  const parsed = parseJsonish(value);

  if (!Array.isArray(parsed)) return [];

  return parsed.filter(
    (item): item is LegacyQuizQuestion =>
      Boolean(item) &&
      typeof item === "object" &&
      Array.isArray((item as LegacyQuizQuestion).options) &&
      typeof (item as LegacyQuizQuestion).correctIndex === "number",
  );
}

/** The data client reports a failed "create if new" as a conditional-check error. */
function isAlreadyExists(errors: readonly unknown[] | undefined): boolean {
  if (!errors || errors.length === 0) return false;

  return /conditional/i.test(formatDataErrors(errors));
}

export const handler: Handler = async (event, context) => {
  const requestId = context.awsRequestId;
  const lessonId = event.arguments.lessonId?.trim();

  if (!lessonId) throw new Error("LESSON_ID_REQUIRED");

  const identity = event.identity as { sub?: string; username?: string } | null | undefined;
  const sub = identity?.sub?.trim();
  const username = identity?.username?.trim();

  if (!sub || !username) throw new Error("IDENTITY_MISSING");

  const lessonResult = await client.models.Lesson.get({ id: lessonId });
  assertNoErrors(lessonResult.errors, "LESSON_LOAD_FAILED");

  const lesson = lessonResult.data;

  // This function has elevated data access, so ownership is checked here.
  // The same error is used for "missing" and "not yours".
  if (!lesson || lesson.owner !== sub) throw new Error("LESSON_NOT_FOUND");

  if (lesson.status !== "READY") throw new Error("LESSON_NOT_READY");

  /* Work out what the learner is graded against. */

  let questions: Gradable[];

  const content = readLessonContent(lesson.content);

  if (content) {
    if (lesson.practiceStatus === "READY") {
      const practice = readPractice(lesson.practice);
      if (!practice || practice.length === 0) throw new Error("PRACTICE_NOT_READY");
      questions = practice;
    } else if (lesson.practiceStatus === "FAILED") {
      // Practice could not be written. The learner may finish for base XP
      // rather than be stuck; only the server can reach this state.
      questions = [];
    } else {
      throw new Error("PRACTICE_NOT_READY");
    }
  } else {
    questions = readLegacyQuiz(lesson.quiz);
  }

  const answers = parseJsonish(event.arguments.answers);

  const { correct, total } =
    questions.length === 0
      ? { correct: 0, total: 0 }
      : gradeAnswers(questions, answers);

  const xp = computeLessonXp(correct, total);

  /**
   * One UserProgress row per lesson: its id IS the lesson id, so completing
   * the same lesson twice fails the "create if new" check and earns nothing.
   * The owner is written in the "<sub>::<username>" form the learner's own
   * reads (and the leaderboard stream) expect.
   */
  const created = await client.models.UserProgress.create({
    id: lessonId,
    owner: `${sub}::${username}`,
    courseId: lesson.courseId,
    lessonId,
    completedAt: new Date().toISOString(),
    xp,
    correct,
    total,
  });

  if (isAlreadyExists(created.errors)) {
    console.info("Lesson already completed", { requestId, lessonId });
    return { xp: 0, correct, total, alreadyCompleted: true };
  }

  assertNoErrors(created.errors, "PROGRESS_SAVE_FAILED");

  console.info("Lesson completed", { requestId, lessonId, xp, correct, total });

  return { xp, correct, total, alreadyCompleted: false };
};