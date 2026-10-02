declare const process: {
  env: Record<string, string | undefined>;
};

import type { Schema } from '../../data/resource';

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(
    process.env as Parameters<typeof getAmplifyDataClientConfig>[0],
  );

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';

if (!ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is not configured');
}

type Handler = Schema['generateOutline']['functionHandler'];

interface OwnerIdentity {
  sub: string;
  username: string;
}

interface OutlineLesson {
  order: number;
  title: string;
  hook: string;
}

interface OutlinePhase {
  order: number;
  title: string;
  lessons: OutlineLesson[];
}

interface CourseOutline {
  title: string;
  description: string;
  phases: OutlinePhase[];
}

export const handler: Handler = async (event, context) => {
  const { topic, personalizationProfile } = event.arguments;

  const requestId = context.awsRequestId;

  const normalizedTopic = topic.trim();

  if (!normalizedTopic) {
    throw new Error('COURSE_TOPIC_REQUIRED');
  }

  const owner = getOwnerIdentity(event);

  console.info('Starting course outline generation', {
    requestId,
    topic: normalizedTopic,
    owner: owner.username,
  });

  let courseId: string | undefined;

  try {
    /*
     * ------------------------------------------------------------
     * 1. Generate and validate the curriculum outline.
     * ------------------------------------------------------------
     */
    const outline = await callClaudeForOutline(
      normalizedTopic,
      personalizationProfile,
    );

    validateCourseOutline(outline);

    /*
     * ------------------------------------------------------------
     * 2. Create the Course in GENERATING state.
     * ------------------------------------------------------------
     *
     * We explicitly preserve the authenticated user's owner
     * identity because this write is performed by the Lambda.
     */
    const courseResult = await client.models.Course.create({
      owner: owner.value,
      title: outline.title,
      topic: normalizedTopic,
      description: outline.description,
      personalizationProfile,
      status: 'GENERATING',
      generationError: undefined,
    });

    if (courseResult.errors?.length) {
      throw new Error(
        `COURSE_CREATE_FAILED: ${formatDataErrors(
          courseResult.errors,
        )}`,
      );
    }

    const course = courseResult.data;

    if (!course) {
      throw new Error('COURSE_CREATE_FAILED');
    }

    courseId = course.id;

    /*
     * ------------------------------------------------------------
     * 3. Create the phase and lesson structure.
     * ------------------------------------------------------------
     */
    for (const phase of outline.phases) {
      const phaseResult = await client.models.Phase.create({
        owner: owner.value,
        courseId: course.id,
        order: phase.order,
        title: phase.title,
        locked: phase.order !== 1,
      });

      if (phaseResult.errors?.length) {
        throw new Error(
          `PHASE_CREATE_FAILED: ${formatDataErrors(
            phaseResult.errors,
          )}`,
        );
      }

      const phaseRecord = phaseResult.data;

      if (!phaseRecord) {
        throw new Error(
          `PHASE_CREATE_FAILED: No phase returned for "${phase.title}"`,
        );
      }

      for (const lesson of phase.lessons) {
        const lessonResult =
          await client.models.Lesson.create({
            owner: owner.value,
            courseId: course.id,
            phaseId: phaseRecord.id,
            order: lesson.order,
            title: lesson.title,
            hook: lesson.hook,
            status: 'PENDING',
            generationError: undefined,
          });

        if (lessonResult.errors?.length) {
          throw new Error(
            `LESSON_CREATE_FAILED: ${formatDataErrors(
              lessonResult.errors,
            )}`,
          );
        }

        if (!lessonResult.data) {
          throw new Error(
            `LESSON_CREATE_FAILED: No lesson returned for "${lesson.title}"`,
          );
        }
      }
    }

    /*
     * ------------------------------------------------------------
     * 4. The complete course structure exists.
     * ------------------------------------------------------------
     */
    const updatedResult =
      await client.models.Course.update({
        id: course.id,
        status: 'READY',
        generationError: undefined,
      });

    if (updatedResult.errors?.length) {
      throw new Error(
        `COURSE_FINALIZE_FAILED: ${formatDataErrors(
          updatedResult.errors,
        )}`,
      );
    }

    const updatedCourse = updatedResult.data;

    if (!updatedCourse) {
      throw new Error('COURSE_FINALIZE_FAILED');
    }

    console.info('Course outline generated successfully', {
      requestId,
      courseId: updatedCourse.id,
      phaseCount: outline.phases.length,
      lessonCount: countLessons(outline),
    });

    return updatedCourse;
  } catch (error) {
    const message = getErrorMessage(error);

    console.error('Course outline generation failed', {
      requestId,
      courseId,
      topic: normalizedTopic,
      error: message,
    });

    /*
     * If the Course was already created, make the failure visible
     * instead of leaving it permanently stuck in GENERATING.
     */
    if (courseId) {
      try {
        const failureResult =
          await client.models.Course.update({
            id: courseId,
            status: 'FAILED',
            generationError: message.slice(0, 5000),
          });

        if (failureResult.errors?.length) {
          console.error(
            'Failed to persist course generation error',
            {
              requestId,
              courseId,
              error: formatDataErrors(
                failureResult.errors,
              ),
            },
          );
        }
      } catch (updateError) {
        console.error(
          'Unexpected error while marking course as FAILED',
          {
            requestId,
            courseId,
            error: getErrorMessage(updateError),
          },
        );
      }
    }

    throw error;
  }
};

/*
 * ==============================================================
 * OWNER
 * ==============================================================
 *
 * Amplify owner authorization uses:
 *
 *     <sub>::<username>
 *
 * for Cognito user-pool identities.
 */
function getOwnerIdentity(
  event: Parameters<Handler>[0],
): OwnerIdentity & { value: string } {
  const identity = event.identity as
    | {
        sub?: string;
        username?: string;
      }
    | null
    | undefined;

  const sub = identity?.sub?.trim();
  const username = identity?.username?.trim();

  if (!sub || !username) {
    console.error('Missing authenticated user identity', {
      identity,
    });

    throw new Error(
      'COURSE_OWNER_IDENTITY_MISSING',
    );
  }

  return {
    sub,
    username,
    value: `${sub}::${username}`,
  };
}

/*
 * ==============================================================
 * CLAUDE OUTLINE GENERATION
 * ==============================================================
 */
async function callClaudeForOutline(
  topic: string,
  profile: unknown,
): Promise<CourseOutline> {
  const systemPrompt = `
You are Grokit's AI curriculum architect.

Your job is to design a coherent, progressive learning course
for the learner.

The course must:

- Start from the learner's likely starting point.
- Build concepts progressively.
- Avoid unnecessary repetition.
- Introduce prerequisites before dependent concepts.
- Move from understanding to application.
- Keep lessons focused on one meaningful learning objective.
- Make the sequence feel intentional rather than like a list
  of unrelated topics.
- Adapt the structure to the learner profile when one is provided.
- Cover the requested topic thoroughly without adding unrelated
  material.
- Create useful lesson hooks that make the learner want to
  continue.
- Prefer practical understanding and examples where appropriate.
- Avoid assuming advanced knowledge unless the learner profile
  indicates it.

Do not generate lesson content yet.

Generate the course structure only.

Return ONLY valid JSON.
Do not use markdown fences.
Do not include commentary outside the JSON.

The JSON must have exactly this conceptual structure:

{
  "title": "Course title",
  "description": "Short course description",
  "phases": [
    {
      "order": 1,
      "title": "Phase title",
      "lessons": [
        {
          "order": 1,
          "title": "Lesson title",
          "hook": "Short compelling lesson hook"
        }
      ]
    }
  ]
}

Rules for the structure:

- Every phase must contain at least one lesson.
- Lesson ordering must restart from 1 within each phase.
- Phase ordering must start at 1 and increase sequentially.
- Lesson ordering must increase sequentially within each phase.
- Do not duplicate lesson concepts unnecessarily.
- Do not generate quizzes or detailed lesson content.
`;

  const userMessage = [
    `Learning topic: ${topic}`,
    '',
    profile
      ? `Learner profile:\n${JSON.stringify(profile)}`
      : 'Learner profile: Not provided',
  ].join('\n');

  const response = await fetch(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `ANTHROPIC_API_ERROR_${response.status}: ${errorBody}`,
    );
  }

  const responseBody = await response.json();

  const text = extractTextResponse(responseBody);

  if (!text) {
    throw new Error(
      'ANTHROPIC_EMPTY_RESPONSE',
    );
  }

  return parseJsonResponse(text);
}

/*
 * ==============================================================
 * RESPONSE PARSING
 * ==============================================================
 */
function extractTextResponse(
  responseBody: unknown,
): string {
  if (
    !responseBody ||
    typeof responseBody !== 'object'
  ) {
    throw new Error(
      'ANTHROPIC_INVALID_RESPONSE',
    );
  }

  const content = (
    responseBody as {
      content?: unknown;
    }
  ).content;

  if (!Array.isArray(content)) {
    throw new Error(
      'ANTHROPIC_CONTENT_MISSING',
    );
  }

  const textBlock = content.find(
    (block): block is { type: 'text'; text: string } =>
      typeof block === 'object' &&
      block !== null &&
      (block as { type?: unknown }).type === 'text' &&
      typeof (block as { text?: unknown }).text ===
        'string',
  );

  return textBlock?.text.trim() ?? '';
}

function parseJsonResponse(
  text: string,
): CourseOutline {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed: unknown = JSON.parse(cleaned);

    validateCourseOutline(parsed);

    return parsed;
  } catch (error) {
    console.error(
      'Failed to parse or validate Claude outline',
      {
        error: getErrorMessage(error),
        responsePreview: cleaned.slice(0, 2000),
      },
    );

    throw new Error(
      `INVALID_AI_OUTLINE: ${getErrorMessage(error)}`,
    );
  }
}

/*
 * ==============================================================
 * OUTLINE VALIDATION
 * ==============================================================
 *
 * This validates structure rather than imposing arbitrary
 * curriculum limits.
 */
function validateCourseOutline(
  value: unknown,
): asserts value is CourseOutline {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new Error(
      'Outline must be a JSON object',
    );
  }

  const outline = value as Record<string, unknown>;

  if (
    !isNonEmptyString(outline.title)
  ) {
    throw new Error(
      'Outline title is missing or invalid',
    );
  }

  if (
    !isNonEmptyString(outline.description)
  ) {
    throw new Error(
      'Outline description is missing or invalid',
    );
  }

  if (!Array.isArray(outline.phases)) {
    throw new Error(
      'Outline phases must be an array',
    );
  }

  if (outline.phases.length === 0) {
    throw new Error(
      'Outline must contain at least one phase',
    );
  }

  let expectedPhaseOrder = 1;

  for (const phaseValue of outline.phases) {
    if (
      !phaseValue ||
      typeof phaseValue !== 'object' ||
      Array.isArray(phaseValue)
    ) {
      throw new Error(
        'Invalid phase structure',
      );
    }

    const phase =
      phaseValue as Record<string, unknown>;

    if (
      phase.order !== expectedPhaseOrder
    ) {
      throw new Error(
        `Phase order must be ${expectedPhaseOrder}`,
      );
    }

    if (
      !isNonEmptyString(phase.title)
    ) {
      throw new Error(
        `Phase ${expectedPhaseOrder} has an invalid title`,
      );
    }

    if (!Array.isArray(phase.lessons)) {
      throw new Error(
        `Phase ${expectedPhaseOrder} lessons must be an array`,
      );
    }

    if (phase.lessons.length === 0) {
      throw new Error(
        `Phase ${expectedPhaseOrder} must contain at least one lesson`,
      );
    }

    let expectedLessonOrder = 1;

    for (const lessonValue of phase.lessons) {
      if (
        !lessonValue ||
        typeof lessonValue !== 'object' ||
        Array.isArray(lessonValue)
      ) {
        throw new Error(
          `Invalid lesson structure in phase ${expectedPhaseOrder}`,
        );
      }

      const lesson =
        lessonValue as Record<string, unknown>;

      if (
        lesson.order !== expectedLessonOrder
      ) {
        throw new Error(
          `Lesson order must be ${expectedLessonOrder} in phase ${expectedPhaseOrder}`,
        );
      }

      if (
        !isNonEmptyString(lesson.title)
      ) {
        throw new Error(
          `Lesson ${expectedLessonOrder} in phase ${expectedPhaseOrder} has an invalid title`,
        );
      }

      if (
        !isNonEmptyString(lesson.hook)
      ) {
        throw new Error(
          `Lesson ${expectedLessonOrder} in phase ${expectedPhaseOrder} has an invalid hook`,
        );
      }

      expectedLessonOrder += 1;
    }

    expectedPhaseOrder += 1;
  }
}

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0
  );
}

/*
 * ==============================================================
 * HELPERS
 * ==============================================================
 */
function countLessons(
  outline: CourseOutline,
): number {
  return outline.phases.reduce(
    (total, phase) =>
      total + phase.lessons.length,
    0,
  );
}

function formatDataErrors(
  errors: readonly unknown[],
): string {
  return errors
    .map((error) => {
      if (
        error &&
        typeof error === 'object' &&
        'message' in error
      ) {
        return String(
          (error as { message?: unknown }).message,
        );
      }

      return String(error);
    })
    .join('; ');
}

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  ) {
    return String(
      (error as { message?: unknown }).message,
    );
  }

  return String(error);
}