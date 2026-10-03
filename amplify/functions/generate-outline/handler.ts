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

/*
 * ==============================================================
 * TYPES
 * ==============================================================
 */

interface OwnerIdentity {
  sub: string;
  username?: string;
  value: string;
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

/*
 * ==============================================================
 * STRUCTURED OUTPUT SCHEMA
 * ==============================================================
 *
 * The AI generates the curriculum structure only.
 *
 * The application-level validator below enforces the exact
 * curriculum shape required by Grokit:
 *
 *   4 phases
 *   3 lessons per phase
 *   12 lessons total
 *
 * We intentionally enforce this in application code rather
 * than relying entirely on the model/schema.
 */

const OUTLINE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: {
      type: 'string',
      description: 'Clear, concise course title.',
    },

    description: {
      type: 'string',
      description:
        'Short description explaining what the learner will understand or be able to do.',
    },

    phases: {
      type: 'array',
      description:
        'The four progressive phases of the learning course.',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          order: {
            type: 'integer',
            description: 'Sequential phase number starting at 1.',
          },

          title: {
            type: 'string',
            description: 'Concise phase title.',
          },

          lessons: {
            type: 'array',
            description:
              'The three lessons belonging to this phase.',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                order: {
                  type: 'integer',
                  description:
                    'Sequential lesson number within the phase starting at 1.',
                },

                title: {
                  type: 'string',
                  description: 'Clear lesson title.',
                },

                hook: {
                  type: 'string',
                  description:
                    'Short compelling hook explaining why the lesson is interesting or useful.',
                },
              },
              required: ['order', 'title', 'hook'],
            },
          },
        },
        required: ['order', 'title', 'lessons'],
      },
    },
  },
  required: ['title', 'description', 'phases'],
} as const;

/*
 * ==============================================================
 * HANDLER
 * ==============================================================
 */

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
    owner: owner.value,
  });

  let courseId: string | undefined;

  try {
    /*
     * ----------------------------------------------------------
     * 1. Generate the curriculum outline
     * ----------------------------------------------------------
     */

    const outline = await callClaudeForOutline(
      normalizedTopic,
      personalizationProfile,
    );

    validateCourseOutline(outline);

    /*
     * ----------------------------------------------------------
     * 2. Create the Course
     * ----------------------------------------------------------
     *
     * IMPORTANT:
     *
     * data/resource.ts now uses:
     *
     *   identityClaim('sub')
     *
     * Therefore owner MUST be the Cognito sub only.
     *
     * Example:
     *
     *   61c3bdfa-c0b1-7074-afd7-d0ef802e0506
     *
     * NOT:
     *
     *   61c3bdfa-c0b1-7074-afd7-d0ef802e0506::
     *   61c3bdfa-c0b1-7074-afd7-d0ef802e0506
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
     * ----------------------------------------------------------
     * 3. Create phases and lessons
     * ----------------------------------------------------------
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
     * ----------------------------------------------------------
     * 4. Mark the course READY
     * ----------------------------------------------------------
     *
     * At this point only the curriculum structure is generated.
     * Individual lesson content remains PENDING and can be
     * generated separately by generateLesson.
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
      owner: owner.value,
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
      owner: owner.value,
      error: message,
    });

    /*
     * If Course creation already succeeded, persist the failure
     * so the frontend never gets a permanently stuck GENERATING
     * course.
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
 * data/resource.ts explicitly uses:
 *
 *   identityClaim('sub')
 *
 * Therefore the owner stored in Course / Phase / Lesson is:
 *
 *   <cognito-sub>
 *
 * Example:
 *
 *   61c3bdfa-c0b1-7074-afd7-d0ef802e0506
 */

function getOwnerIdentity(
  event: Parameters<Handler>[0],
): OwnerIdentity {
  const identity = event.identity as
    | {
        sub?: string;
        username?: string;
      }
    | null
    | undefined;

  const sub = identity?.sub?.trim();
  const username = identity?.username?.trim();

  if (!sub) {
    console.error('Missing Cognito sub in authenticated identity', {
      identity,
    });

    throw new Error(
      'COURSE_OWNER_IDENTITY_MISSING',
    );
  }

  return {
    sub,
    username,
    value: sub,
  };
}

/*
 * ==============================================================
 * CLAUDE
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

Your curriculum should:

- Start from the learner's likely starting point.
- Build concepts progressively.
- Introduce prerequisites before dependent concepts.
- Move from understanding to application.
- Keep each lesson focused on one meaningful learning objective.
- Avoid unnecessary repetition.
- Make the sequence feel intentional and coherent.
- Adapt to the learner profile when one is provided.
- Cover the requested topic meaningfully.
- Avoid unrelated material.
- Prefer practical understanding and examples where appropriate.
- Avoid assuming advanced knowledge unless the learner profile
  indicates it.
- Make lesson hooks interesting and useful.
- Ensure each phase naturally prepares the learner for the next.

Do not generate detailed lesson content.

Do not generate quizzes.

Generate the curriculum structure only.

The course must contain exactly:

- 4 phases.
- 3 lessons in every phase.
- 12 lessons total.

The progression should be:

Phase 1:
Foundational concepts and mental model.

Phase 2:
Core mechanisms, principles, or processes.

Phase 3:
Deeper understanding, systems, practical reasoning, or application.

Phase 4:
Real-world application, synthesis, troubleshooting, or advanced practical understanding.

Do not blindly follow those labels if the topic requires a better pedagogical progression. Adapt the actual phase titles and lesson topics to the subject.

Each lesson should have one clear learning objective.

Return only the requested structured JSON.
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
        model: 'claude-sonnet-5-5',

        max_tokens: 4096,

        system: systemPrompt,

        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],

        output_config: {
          effort: 'low',

          format: {
            type: 'json_schema',

            schema: OUTLINE_SCHEMA,
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `ANTHROPIC_API_ERROR_${response.status}: ${errorBody}`,
    );
  }

  const responseBody: unknown =
    await response.json();

  const text =
    extractTextResponse(responseBody);

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
    (
      block,
    ): block is {
      type: 'text';
      text: string;
    } =>
      typeof block === 'object' &&
      block !== null &&
      (block as { type?: unknown }).type ===
        'text' &&
      typeof (
        block as { text?: unknown }
      ).text === 'string',
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
    const parsed: unknown =
      JSON.parse(cleaned);

    validateCourseOutline(parsed);

    return parsed;
  } catch (error) {
    console.error(
      'Failed to parse or validate Claude outline',
      {
        error: getErrorMessage(error),
        responsePreview: cleaned.slice(
          0,
          2000,
        ),
      },
    );

    throw new Error(
      `INVALID_AI_OUTLINE: ${getErrorMessage(
        error,
      )}`,
    );
  }
}

/*
 * ==============================================================
 * OUTLINE VALIDATION
 * ==============================================================
 *
 * The AI schema defines the intended shape.
 *
 * This validator is the final application-level guard.
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
      'OUTLINE_MUST_BE_OBJECT',
    );
  }

  const outline =
    value as Record<string, unknown>;

  if (
    !isNonEmptyString(outline.title)
  ) {
    throw new Error(
      'OUTLINE_TITLE_INVALID',
    );
  }

  if (
    !isNonEmptyString(
      outline.description,
    )
  ) {
    throw new Error(
      'OUTLINE_DESCRIPTION_INVALID',
    );
  }

  if (!Array.isArray(outline.phases)) {
    throw new Error(
      'OUTLINE_PHASES_INVALID',
    );
  }

  /*
   * Grokit curriculum contract:
   *
   * 4 phases × 3 lessons = 12 lessons
   */

  if (outline.phases.length !== 4) {
    throw new Error(
      `OUTLINE_PHASE_COUNT_INVALID: expected 4, received ${outline.phases.length}`,
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
        'INVALID_PHASE_STRUCTURE',
      );
    }

    const phase =
      phaseValue as Record<string, unknown>;

    if (
      phase.order !==
      expectedPhaseOrder
    ) {
      throw new Error(
        `PHASE_ORDER_INVALID: expected ${expectedPhaseOrder}`,
      );
    }

    if (
      !isNonEmptyString(phase.title)
    ) {
      throw new Error(
        `PHASE_TITLE_INVALID: phase ${expectedPhaseOrder}`,
      );
    }

    if (!Array.isArray(phase.lessons)) {
      throw new Error(
        `PHASE_LESSONS_INVALID: phase ${expectedPhaseOrder}`,
      );
    }

    if (phase.lessons.length !== 3) {
      throw new Error(
        `PHASE_LESSON_COUNT_INVALID: phase ${expectedPhaseOrder} expected 3 lessons, received ${phase.lessons.length}`,
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
          `INVALID_LESSON_STRUCTURE: phase ${expectedPhaseOrder}`,
        );
      }

      const lesson =
        lessonValue as Record<
          string,
          unknown
        >;

      if (
        lesson.order !==
        expectedLessonOrder
      ) {
        throw new Error(
          `LESSON_ORDER_INVALID: phase ${expectedPhaseOrder}, expected ${expectedLessonOrder}`,
        );
      }

      if (
        !isNonEmptyString(
          lesson.title,
        )
      ) {
        throw new Error(
          `LESSON_TITLE_INVALID: phase ${expectedPhaseOrder}, lesson ${expectedLessonOrder}`,
        );
      }

      if (
        !isNonEmptyString(
          lesson.hook,
        )
      ) {
        throw new Error(
          `LESSON_HOOK_INVALID: phase ${expectedPhaseOrder}, lesson ${expectedLessonOrder}`,
        );
      }

      expectedLessonOrder += 1;
    }

    expectedPhaseOrder += 1;
  }
}

/*
 * ==============================================================
 * HELPERS
 * ==============================================================
 */

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0
  );
}

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
          (
            error as {
              message?: unknown;
            }
          ).message,
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
      (
        error as {
          message?: unknown;
        }
      ).message,
    );
  }

  return String(error);
}