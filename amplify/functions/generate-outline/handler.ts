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
  throw new Error('ANTHROPIC_API_KEY is not configured.');
}

type Handler = Schema['generateOutline']['functionHandler'];

type OwnerIdentity = {
  value: string;
  sub: string;
  username: string;
};

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

const OUTLINE_MODEL = 'claude-sonnet-5-5';

const OUTLINE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 120,
    },
    description: {
      type: 'string',
      minLength: 1,
      maxLength: 500,
    },
    phases: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          order: {
            type: 'integer',
            minimum: 1,
            maximum: 6,
          },
          title: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
          },
          lessons: {
            type: 'array',
            minItems: 2,
            maxItems: 5,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                order: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 5,
                },
                title: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 120,
                },
                hook: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 240,
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
};

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
    owner: owner.sub,
    model: OUTLINE_MODEL,
  });

  let courseId: string | undefined;

  try {
    const startedAt = Date.now();

    const outline = await callClaudeForOutline(
      normalizedTopic,
      personalizationProfile,
    );

    const aiDurationMs = Date.now() - startedAt;

    console.info('Claude outline generated', {
      requestId,
      durationMs: aiDurationMs,
      phases: outline.phases.length,
      lessons: countLessons(outline),
    });

    validateCourseOutline(outline);

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
        `COURSE_CREATE_FAILED: ${formatDataErrors(courseResult.errors)}`,
      );
    }

    const course = courseResult.data;

    if (!course) {
      throw new Error('COURSE_CREATE_FAILED: No course was returned.');
    }

    courseId = course.id;

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
          `PHASE_CREATE_FAILED: ${formatDataErrors(phaseResult.errors)}`,
        );
      }

      const phaseRecord = phaseResult.data;

      if (!phaseRecord) {
        throw new Error(
          `PHASE_CREATE_FAILED: No phase was returned for "${phase.title}".`,
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
            `LESSON_CREATE_FAILED: ${formatDataErrors(lessonResult.errors)}`,
          );
        }

        if (!lessonResult.data) {
          throw new Error(
            `LESSON_CREATE_FAILED: No lesson was returned for "${lesson.title}".`,
          );
        }
      }
    }

    const updatedResult = await client.models.Course.update({
      id: course.id,
      status: 'READY',
      generationError: undefined,
    });

    if (updatedResult.errors?.length) {
      throw new Error(
        `COURSE_FINALIZE_FAILED: ${formatDataErrors(updatedResult.errors)}`,
      );
    }

    const updatedCourse = updatedResult.data;

    if (!updatedCourse) {
      throw new Error('COURSE_FINALIZE_FAILED: No course was returned.');
    }

    console.info('Course outline generation completed', {
      requestId,
      courseId: course.id,
      phases: outline.phases.length,
      lessons: countLessons(outline),
      totalDurationMs: Date.now() - startedAt,
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

    if (courseId) {
      try {
        const failureResult = await client.models.Course.update({
          id: courseId,
          status: 'FAILED',
          generationError: message.slice(0, 5000),
        });

        if (failureResult.errors?.length) {
          console.error('Failed to mark course as FAILED', {
            requestId,
            courseId,
            errors: formatDataErrors(failureResult.errors),
          });
        }
      } catch (updateError) {
        console.error('Failed to persist course generation error', {
          requestId,
          courseId,
          error: getErrorMessage(updateError),
        });
      }
    }

    throw error;
  }
};

function getOwnerIdentity(event: Parameters<Handler>[0]): OwnerIdentity {
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
    throw new Error('AUTHENTICATED_USER_IDENTITY_REQUIRED');
  }

  return {
    sub,
    username,
    value: `${sub}::${username}`,
  };
}

async function callClaudeForOutline(
  topic: string,
  personalizationProfile: unknown,
): Promise<CourseOutline> {
  const systemPrompt = `
You are Grokit's curriculum architect.

Design a coherent learning curriculum for the requested topic.

Your job is to create the COURSE STRUCTURE only.
Do not write lesson content.

Curriculum rules:
- Start from fundamentals and progress toward practical understanding.
- Avoid unnecessary repetition.
- Each phase should have a clear learning purpose.
- Lessons within a phase must build logically on one another.
- Use concise, specific lesson titles.
- Hooks should create curiosity and explain why the lesson matters.
- Do not use markdown.
- Do not include quizzes, explanations, examples, references, or long prose.
- Keep the structure appropriate for the learner profile when one is provided.
- Prefer 3–5 phases.
- Prefer 2–4 lessons per phase unless the topic genuinely requires more.
- The output should be useful as the blueprint for later lesson generation.
`;

  const userMessage = [
    `Topic: ${topic}`,
    '',
    'Learner profile:',
    JSON.stringify(personalizationProfile ?? {}),
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
        model: OUTLINE_MODEL,
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
    const body = await response.text();

    throw new Error(
      `ANTHROPIC_API_ERROR_${response.status}: ${body.slice(0, 2000)}`,
    );
  }

  const json = (await response.json()) as {
    content?: Array<{
      type?: string;
      text?: string;
    }>;
    stop_reason?: string;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
    };
  };

  const text =
    json.content?.find((block) => block.type === 'text')?.text?.trim() ?? '';

  if (!text) {
    throw new Error(
      `ANTHROPIC_EMPTY_RESPONSE: stopReason=${json.stop_reason ?? 'unknown'}`,
    );
  }

  console.info('Anthropic outline response received', {
    model: OUTLINE_MODEL,
    stopReason: json.stop_reason,
    inputTokens: json.usage?.input_tokens,
    outputTokens: json.usage?.output_tokens,
  });

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `INVALID_AI_OUTLINE_JSON: ${getErrorMessage(error)}`,
    );
  }

  validateCourseOutline(parsed);

  return parsed;
}

function validateCourseOutline(value: unknown): asserts value is CourseOutline {
  if (!isRecord(value)) {
    throw new Error('INVALID_AI_OUTLINE: Expected an object.');
  }

  if (!isNonEmptyString(value.title)) {
    throw new Error('INVALID_AI_OUTLINE: Missing course title.');
  }

  if (!isNonEmptyString(value.description)) {
    throw new Error('INVALID_AI_OUTLINE: Missing course description.');
  }

  if (!Array.isArray(value.phases)) {
    throw new Error('INVALID_AI_OUTLINE: Phases must be an array.');
  }

  if (value.phases.length < 3 || value.phases.length > 6) {
    throw new Error(
      'INVALID_AI_OUTLINE: Course must contain between 3 and 6 phases.',
    );
  }

  const phaseOrders = new Set<number>();

  value.phases.forEach((phaseValue, phaseIndex) => {
    if (!isRecord(phaseValue)) {
      throw new Error(
        `INVALID_AI_OUTLINE: Phase ${phaseIndex + 1} is invalid.`,
      );
    }

    if (
      !isInteger(phaseValue.order) ||
      phaseValue.order < 1 ||
      phaseValue.order > 6
    ) {
      throw new Error(
        `INVALID_AI_OUTLINE: Phase ${phaseIndex + 1} has an invalid order.`,
      );
    }

    if (phaseOrders.has(phaseValue.order)) {
      throw new Error(
        `INVALID_AI_OUTLINE: Duplicate phase order ${phaseValue.order}.`,
      );
    }

    phaseOrders.add(phaseValue.order);

    if (!isNonEmptyString(phaseValue.title)) {
      throw new Error(
        `INVALID_AI_OUTLINE: Phase ${phaseIndex + 1} is missing a title.`,
      );
    }

    if (!Array.isArray(phaseValue.lessons)) {
      throw new Error(
        `INVALID_AI_OUTLINE: Phase ${phaseIndex + 1} lessons must be an array.`,
      );
    }

    if (phaseValue.lessons.length < 2 || phaseValue.lessons.length > 5) {
      throw new Error(
        `INVALID_AI_OUTLINE: Phase ${phaseIndex + 1} must contain between 2 and 5 lessons.`,
      );
    }

    const lessonOrders = new Set<number>();

    phaseValue.lessons.forEach((lessonValue, lessonIndex) => {
      if (!isRecord(lessonValue)) {
        throw new Error(
          `INVALID_AI_OUTLINE: Lesson ${lessonIndex + 1} in phase ${phaseIndex + 1} is invalid.`,
        );
      }

      if (
        !isInteger(lessonValue.order) ||
        lessonValue.order < 1 ||
        lessonValue.order > 5
      ) {
        throw new Error(
          `INVALID_AI_OUTLINE: Lesson ${lessonIndex + 1} in phase ${phaseIndex + 1} has an invalid order.`,
        );
      }

      if (lessonOrders.has(lessonValue.order)) {
        throw new Error(
          `INVALID_AI_OUTLINE: Duplicate lesson order ${lessonValue.order} in phase ${phaseIndex + 1}.`,
        );
      }

      lessonOrders.add(lessonValue.order);

      if (!isNonEmptyString(lessonValue.title)) {
        throw new Error(
          `INVALID_AI_OUTLINE: Lesson ${lessonIndex + 1} in phase ${phaseIndex + 1} is missing a title.`,
        );
      }

      if (!isNonEmptyString(lessonValue.hook)) {
        throw new Error(
          `INVALID_AI_OUTLINE: Lesson ${lessonIndex + 1} in phase ${phaseIndex + 1} is missing a hook.`,
        );
      }
    });
  });

  const sortedPhaseOrders = [...phaseOrders].sort((a, b) => a - b);

  sortedPhaseOrders.forEach((order, index) => {
    const expected = index + 1;

    if (order !== expected) {
      throw new Error(
        `INVALID_AI_OUTLINE: Phase ordering must start at 1 and be sequential.`,
      );
    }
  });

  value.phases.forEach((phase, phaseIndex) => {
    const orders: number[] = phase.lessons.map(
      (lesson: OutlineLesson) => lesson.order,
    );

    orders.sort((a: number, b: number) => a - b);

    orders.forEach((order: number, lessonIndex: number) => {
      if (order !== lessonIndex + 1) {
        throw new Error(
          `INVALID_AI_OUTLINE: Lesson ordering in phase ${phaseIndex + 1} must start at 1 and be sequential.`,
        );
      }
    });
  });
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

function countLessons(outline: CourseOutline): number {
  return outline.phases.reduce(
    (total, phase) => total + phase.lessons.length,
    0,
  );
}

function formatDataErrors(
  errors: Array<{ message?: string }>,
): string {
  return errors
    .map((error) => error.message ?? 'Unknown data error')
    .join('; ');
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}