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
  username: string;
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
 * HANDLER
 * ==============================================================
 */

export const handler: Handler = async (event, context) => {
  const requestId = context.awsRequestId;
  const { topic, personalizationProfile } = event.arguments;

  const normalizedTopic = topic.trim();

  if (!normalizedTopic) {
    throw new Error('COURSE_TOPIC_REQUIRED');
  }

  /*
   * The Lambda is executing on behalf of the authenticated user.
   *
   * Course / Phase / Lesson use ownerDefinedIn('owner'), so the
   * Lambda must explicitly preserve the authenticated user's
   * Cognito owner identity when creating those records.
   */
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
     * 1. Generate the curriculum outline.
     * ------------------------------------------------------------
     */

    const outline = await callClaudeForOutline(
      normalizedTopic,
      personalizationProfile,
    );

    validateCourseOutline(outline);

    console.info('Generated course outline', {
      requestId,
      outline: {
        title: outline.title,
        description: outline.description,
        phases: outline.phases.map((phase) => ({
          order: phase.order,
          title: phase.title,
          lessons: phase.lessons.map((lesson) => ({
            order: lesson.order,
            title: lesson.title,
            hook: lesson.hook,
          })),
        })),
      },
    });

    /*
     * ------------------------------------------------------------
     * 2. Create the Course.
     * ------------------------------------------------------------
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
     * 3. Create all phases and lessons.
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
        const lessonResult = await client.models.Lesson.create({
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
     * 4. Mark the course as READY.
     * ------------------------------------------------------------
     */

    const updatedResult = await client.models.Course.update({
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
     * If the Course was already created, do not leave it stuck
     * permanently in GENERATING.
     */
    if (courseId) {
      try {
        const failureResult = await client.models.Course.update({
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
 * OWNER IDENTITY
 * ==============================================================
 *
 * Amplify owner authorization for Cognito user-pool identities
 * uses the following owner value:
 *
 *     <sub>::<username>
 *
 * Example:
 *
 *     61c3bdfa-...::61c3bdfa-...
 *
 * We explicitly put this value into Course / Phase / Lesson
 * because those records are created by the Lambda rather than
 * directly by the browser's authenticated client.
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

  if (!sub || !username) {
    console.error('Missing authenticated user identity', {
      identity,
    });

    throw new Error('COURSE_OWNER_IDENTITY_MISSING');
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

The course MUST contain exactly:
- 4 phases
- 3 lessons in every phase
- 12 lessons total

Phase 1 should establish the foundation.
Phase 2 should build the core concepts.
Phase 3 should move into deeper understanding and application.
Phase 4 should consolidate knowledge and move toward practical
use, synthesis, or advanced application.

Every lesson should have one clear learning objective.

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

Rules:

- There must be exactly 4 phases.
- Each phase must contain exactly 3 lessons.
- Phase order must be 1, 2, 3, 4.
- Lesson order must be 1, 2, 3 within every phase.
- Do not duplicate lesson concepts unnecessarily.
- Do not generate quizzes.
- Do not generate detailed lesson content.
- Do not generate key terms.
- Do not add additional JSON fields.
`;

  const userMessage = [
    `Learning topic: ${topic}`,
    '',
    profile
      ? `Learner profile:\n${JSON.stringify(profile)}`
      : 'Learner profile: Not provided',
  ].join('\n');

  /*
   * Keep the request intentionally compact.
   *
   * The outline is only the curriculum skeleton.
   * Detailed lesson generation happens separately.
   */

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
        output_config: {
          effort: 'low',
          format: {
            type: 'json_schema',
            schema: OUTLINE_SCHEMA,
          },
        },
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
    throw new Error('ANTHROPIC_EMPTY_RESPONSE');
  }

  return parseJsonResponse(text);
}

/*
 * ==============================================================
 * STRUCTURED OUTPUT SCHEMA
 * ==============================================================
 *
 * Keep this schema compatible with Anthropic Structured Outputs.
 *
 * We deliberately do NOT use minItems / maxItems because those
 * constraints were rejected by the API in the previous version.
 *
 * Exact 4 × 3 enforcement happens in validateCourseOutline().
 */

const OUTLINE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
    phases: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          order: {
            type: 'integer',
          },
          title: {
            type: 'string',
          },
          lessons: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                order: {
                  type: 'integer',
                },
                title: {
                  type: 'string',
                },
                hook: {
                  type: 'string',
                },
              },
              required: [
                'order',
                'title',
                'hook',
              ],
            },
          },
        },
        required: [
          'order',
          'title',
          'lessons',
        ],
      },
    },
  },
  required: [
    'title',
    'description',
    'phases',
  ],
} as const;

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
    throw new Error('ANTHROPIC_INVALID_RESPONSE');
  }

  const content = (
    responseBody as {
      content?: unknown;
    }
  ).content;

  if (!Array.isArray(content)) {
    throw new Error('ANTHROPIC_CONTENT_MISSING');
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
 * The API schema guarantees JSON shape.
 * This validator guarantees application-level business rules.
 *
 * This is where we enforce the exact 4 × 3 structure.
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

  /*
   * ------------------------------------------------------------
   * Course
   * ------------------------------------------------------------
   */

  if (!isNonEmptyString(outline.title)) {
    throw new Error(
      'Outline title is missing or invalid',
    );
  }

  if (!isNonEmptyString(outline.description)) {
    throw new Error(
      'Outline description is missing or invalid',
    );
  }

  if (!Array.isArray(outline.phases)) {
    throw new Error(
      'Outline phases must be an array',
    );
  }

  /*
   * Exactly 4 phases.
   */

  if (outline.phases.length !== 4) {
    throw new Error(
      `Outline must contain exactly 4 phases, received ${outline.phases.length}`,
    );
  }

  /*
   * ------------------------------------------------------------
   * Phases
   * ------------------------------------------------------------
   */

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

    /*
     * Exactly 3 lessons per phase.
     */

    if (phase.lessons.length !== 3) {
      throw new Error(
        `Phase ${expectedPhaseOrder} must contain exactly 3 lessons, received ${phase.lessons.length}`,
      );
    }

    /*
     * ----------------------------------------------------------
     * Lessons
     * ----------------------------------------------------------
     */

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

  /*
   * The structure above guarantees:
   *
   * 4 phases × 3 lessons = 12 lessons.
   */
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
          (error as {
            message?: unknown;
          }).message,
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
      (error as {
        message?: unknown;
      }).message,
    );
  }

  return String(error);
}