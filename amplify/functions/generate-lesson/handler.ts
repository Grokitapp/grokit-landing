declare const process: {
  env: Record<string, string | undefined>;
};

import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  process.env as Parameters<typeof getAmplifyDataClientConfig>[0]
);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

type Handler = Schema["generateLesson"]["functionHandler"];

interface LessonContent {
  coreContent: string;
  keyTerms: KeyTerm[];
  quiz: QuizQuestion[];
}

interface KeyTerm {
  term: string;
  definition: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

/**
 * ==============================================================
 * HANDLER
 * ==============================================================
 */

export const handler: Handler = async (event, context) => {
  const { lessonId } = event.arguments;
  const requestId = context.awsRequestId;

  if (!lessonId?.trim()) throw new Error("LESSON_ID_REQUIRED");
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY_NOT_CONFIGURED");

  console.info("Starting lesson generation", { requestId, lessonId });

  let lessonExists = false;

  try {
    /** 1. Load the lesson */
    const lessonResult = await client.models.Lesson.get({ id: lessonId });
    assertNoErrors(lessonResult.errors, "LESSON_LOAD_FAILED");

    const lesson = lessonResult.data;
    if (!lesson) throw new Error("LESSON_NOT_FOUND");

    lessonExists = true;

    /** 2. Do not regenerate an already completed lesson */
    if (lesson.status === "READY") {
      console.info("Lesson already generated", { requestId, lessonId });
      return lesson;
    }

    /** 3. Mark lesson as GENERATING (clears any previous error for a clean retry) */
    const generatingResult = await client.models.Lesson.update({
      id: lessonId,
      status: "GENERATING",
      generationError: undefined,
    });
    assertNoErrors(generatingResult.errors, "LESSON_GENERATING_UPDATE_FAILED");

    /** 4. Load the course context */
    const courseResult = await client.models.Course.get({ id: lesson.courseId });
    assertNoErrors(courseResult.errors, "COURSE_LOAD_FAILED");

    const course = courseResult.data;

    /** 5. Generate the lesson with Claude */
    const content = await callClaudeForLesson({
      courseTitle: course?.title ?? "",
      courseTopic: course?.topic ?? "",
      lessonTitle: lesson.title,
      hook: lesson.hook ?? "",
    });

    /** 6. Save validated lesson content */
    const updatedResult = await client.models.Lesson.update({
      id: lessonId,
      coreContent: content.coreContent,
      keyTerms: content.keyTerms,
      quiz: content.quiz,
      status: "READY",
      generationError: undefined,
    });
    assertNoErrors(updatedResult.errors, "LESSON_FINALIZE_FAILED");

    const updatedLesson = updatedResult.data;
    if (!updatedLesson) throw new Error("LESSON_FINALIZE_FAILED");

    console.info("Lesson generated successfully", { requestId, lessonId });
    return updatedLesson;
  } catch (error) {
    const message = getErrorMessage(error);

    console.error("Lesson generation failed", { requestId, lessonId, error: message });

    /**
     * 7. Persist FAILED state.
     *
     * Critical: without this, a failure after the GENERATING update
     * can leave the lesson permanently stuck in GENERATING.
     */
    if (lessonExists) {
      try {
        const failureResult = await client.models.Lesson.update({
          id: lessonId,
          status: "FAILED",
          generationError: message.slice(0, 5000),
        });

        if (failureResult.errors?.length) {
          console.error("Failed to persist lesson generation error", {
            requestId,
            lessonId,
            error: formatDataErrors(failureResult.errors),
          });
        }
      } catch (updateError) {
        console.error("Unexpected error while marking lesson as FAILED", {
          requestId,
          lessonId,
          error: getErrorMessage(updateError),
        });
      }
    }

    throw error;
  }
};

/**
 * ==============================================================
 * CLAUDE
 * ==============================================================
 */

async function callClaudeForLesson(input: {
  courseTitle: string;
  courseTopic: string;
  lessonTitle: string;
  hook: string;
}): Promise<LessonContent> {
  const systemPrompt = `
You are Grokit's AI lesson writer.

Create a clear, engaging lesson for an online learner.

The lesson should:
- Explain the concept progressively.
- Build from the learner's likely current understanding.
- Focus on the lesson topic only.
- Use concrete examples where useful.
- Prefer practical understanding over unnecessary detail.
- Avoid introducing unrelated concepts.
- Make the explanation easy to follow.
- Use concise but meaningful sections.
- Never assume advanced knowledge unless the topic clearly requires it.

Return ONLY valid JSON.

{
  "coreContent": "The complete lesson explanation in Markdown.",
  "keyTerms": [{ "term": "Term", "definition": "Clear, concise definition." }],
  "quiz": [{
    "question": "Question testing meaningful understanding.",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0
  }]
}

Requirements:
- coreContent must be useful as a standalone lesson.
- keyTerms should contain the most important terms from the lesson.
- Every quiz question must have exactly 4 options.
- correctIndex must be 0, 1, 2, or 3.
- Quiz questions should test understanding, not trivial wording recall.
- Do not include answers outside the correctIndex field.
- Return JSON only.
`;

  const userMessage = [
    `Course: ${input.courseTitle}`,
    `Topic: ${input.courseTopic}`,
    `Lesson: ${input.lessonTitle}`,
    `Hook: ${input.hook}`,
  ].join("\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ANTHROPIC_API_ERROR_${response.status}: ${errorBody.slice(0, 3000)}`);
  }

  const responseBody: unknown = await response.json();
  const text = extractTextResponse(responseBody);

  if (!text) throw new Error("ANTHROPIC_EMPTY_RESPONSE");

  return parseLessonContent(text);
}

/**
 * ==============================================================
 * RESPONSE PARSING
 * ==============================================================
 */

function extractTextResponse(responseBody: unknown): string {
  if (!responseBody || typeof responseBody !== "object") {
    throw new Error("ANTHROPIC_INVALID_RESPONSE");
  }

  const content = (responseBody as { content?: unknown }).content;
  if (!Array.isArray(content)) throw new Error("ANTHROPIC_CONTENT_MISSING");

  const textBlock = content.find(
    (block): block is { type: "text"; text: string } =>
      typeof block === "object" &&
      block !== null &&
      (block as { type?: unknown }).type === "text" &&
      typeof (block as { text?: unknown }).text === "string"
  );

  return textBlock?.text.trim() ?? "";
}

function parseLessonContent(text: string): LessonContent {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed: unknown = JSON.parse(cleaned);
    validateLessonContent(parsed);
    return parsed;
  } catch (error) {
    console.error("Failed to parse or validate Claude lesson", {
      error: getErrorMessage(error),
      responsePreview: cleaned.slice(0, 3000),
    });
    throw new Error(`INVALID_AI_LESSON: ${getErrorMessage(error)}`);
  }
}

/**
 * ==============================================================
 * LESSON VALIDATION
 * ==============================================================
 */

function validateLessonContent(value: unknown): asserts value is LessonContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("LESSON_CONTENT_MUST_BE_OBJECT");
  }

  const lesson = value as Record<string, unknown>;

  /** Core content */
  if (!isNonEmptyString(lesson.coreContent)) {
    throw new Error("LESSON_CORE_CONTENT_INVALID");
  }

  /** Key terms */
  if (!Array.isArray(lesson.keyTerms)) throw new Error("LESSON_KEY_TERMS_INVALID");

  for (const [index, item] of lesson.keyTerms.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`LESSON_KEY_TERM_INVALID: ${index}`);
    }

    const term = item as Record<string, unknown>;

    if (!isNonEmptyString(term.term)) {
      throw new Error(`LESSON_KEY_TERM_NAME_INVALID: ${index}`);
    }
    if (!isNonEmptyString(term.definition)) {
      throw new Error(`LESSON_KEY_TERM_DEFINITION_INVALID: ${index}`);
    }
  }

  /** Quiz */
  if (!Array.isArray(lesson.quiz)) throw new Error("LESSON_QUIZ_INVALID");

  for (const [index, item] of lesson.quiz.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`LESSON_QUIZ_QUESTION_INVALID: ${index}`);
    }

    const question = item as Record<string, unknown>;

    if (!isNonEmptyString(question.question)) {
      throw new Error(`LESSON_QUIZ_QUESTION_TEXT_INVALID: ${index}`);
    }

    if (!Array.isArray(question.options) || question.options.length !== 4) {
      throw new Error(`LESSON_QUIZ_OPTIONS_COUNT_INVALID: ${index}`);
    }

    for (const option of question.options) {
      if (!isNonEmptyString(option)) {
        throw new Error(`LESSON_QUIZ_OPTION_INVALID: ${index}`);
      }
    }

    if (
      typeof question.correctIndex !== "number" ||
      !Number.isInteger(question.correctIndex) ||
      question.correctIndex < 0 ||
      question.correctIndex > 3
    ) {
      throw new Error(`LESSON_QUIZ_CORRECT_INDEX_INVALID: ${index}`);
    }
  }
}

/**
 * ==============================================================
 * HELPERS
 * ==============================================================
 */

function assertNoErrors(
  errors: readonly unknown[] | undefined,
  code: string
): void {
  if (errors?.length) {
    throw new Error(`${code}: ${formatDataErrors(errors)}`);
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function formatDataErrors(errors: readonly unknown[]): string {
  return errors
    .map((error) =>
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message)
        : String(error)
    )
    .join("; ");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: unknown }).message);
  }

  return String(error);
}