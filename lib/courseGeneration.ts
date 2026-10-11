import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

const USER_POOL = { authMode: 'userPool' } as const;

type GraphqlError = {
  message?: string;
};

type ExperienceLevel =
  | 'new'
  | 'beginner'
  | 'intermediate'
  | 'advanced';

type PersonalizationProfile = {
  experienceLevel: ExperienceLevel;
  existingKnowledge: string[];
  learningFocus: string;
  focusAreas: string[];
};

const EXPERIENCE_LEVELS = new Set<ExperienceLevel>([
  'new',
  'beginner',
  'intermediate',
  'advanced',
]);

function throwIfErrors(
  errors?: readonly GraphqlError[] | null,
  code = 'REQUEST_FAILED',
): void {
  if (!errors?.length) return;

  console.error(`[courseGeneration] ${code}:`, errors);
  throw new Error(code);
}

function requireId(id: string, code: string): void {
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error(code);
  }
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function normalizePersonalization(
  profile?: PersonalizationProfile,
): PersonalizationProfile | undefined {
  if (profile == null) return undefined;

  if (
    typeof profile !== 'object' ||
    !EXPERIENCE_LEVELS.has(profile.experienceLevel)
  ) {
    throw new Error('PERSONALIZATION_PROFILE_INVALID');
  }

  return {
    experienceLevel: profile.experienceLevel,
    existingKnowledge: normalizeStringList(profile.existingKnowledge),
    learningFocus:
      typeof profile.learningFocus === 'string'
        ? profile.learningFocus.trim()
        : '',
    focusAreas: normalizeStringList(profile.focusAreas),
  };
}

// ─── Course generation ──────────────────────────────────────────────────────

export async function createCourseFromPrompt(
  topic: string,
  personalizationProfile?: PersonalizationProfile,
) {
  const normalizedTopic =
    typeof topic === 'string' ? topic.trim() : '';

  if (!normalizedTopic) {
    throw new Error('COURSE_TOPIC_REQUIRED');
  }

  const profile = normalizePersonalization(personalizationProfile);

  try {
    const { data, errors } = await client.mutations.generateOutline(
      {
        topic: normalizedTopic,
        ...(profile ? { personalizationProfile: profile } : {}),
      },
      USER_POOL,
    );

    throwIfErrors(errors, 'COURSE_GENERATION_FAILED');

    if (!data) {
      throw new Error('COURSE_GENERATION_EMPTY');
    }

    return data;
  } catch (error) {
    console.error('[courseGeneration] Course generation failed:', error);

    if (
      error instanceof Error &&
      (error.message.startsWith('COURSE_') ||
        error.message === 'PERSONALIZATION_PROFILE_INVALID')
    ) {
      throw error;
    }

    throw new Error('COURSE_GENERATION_FAILED');
  }
}

export async function generateLessonContent(lessonId: string) {
  requireId(lessonId, 'LESSON_ID_REQUIRED');

  try {
    const { data, errors } = await client.mutations.generateLesson(
      { lessonId },
      USER_POOL,
    );

    throwIfErrors(errors, 'LESSON_GENERATION_FAILED');

    if (!data) {
      throw new Error('LESSON_GENERATION_EMPTY');
    }

    return data;
  } catch (error) {
    console.error('[courseGeneration] Lesson generation failed:', error);

    if (
      error instanceof Error &&
      error.message.startsWith('LESSON_')
    ) {
      throw error;
    }

    throw new Error('LESSON_GENERATION_FAILED');
  }
}

// ─── Course reads ───────────────────────────────────────────────────────────

export async function listCourses() {
  const { data, errors } = await client.models.Course.list();

  throwIfErrors(errors, 'COURSES_LOAD_FAILED');

  return [...(data ?? [])].sort((a, b) => {
    const aDate = a.updatedAt ?? a.createdAt ?? '';
    const bDate = b.updatedAt ?? b.createdAt ?? '';

    return bDate.localeCompare(aDate);
  });
}

export async function getCourse(courseId: string) {
  requireId(courseId, 'COURSE_ID_REQUIRED');

  const { data, errors } = await client.models.Course.get({
    id: courseId,
  });

  throwIfErrors(errors, 'COURSE_LOAD_FAILED');

  return data;
}

export async function listPhasesForCourse(courseId: string) {
  requireId(courseId, 'COURSE_ID_REQUIRED');

  const { data, errors } = await client.models.Phase.list({
    filter: { courseId: { eq: courseId } },
  });

  throwIfErrors(errors, 'PHASES_LOAD_FAILED');

  return [...(data ?? [])].sort((a, b) => a.order - b.order);
}

// ─── Phase reads ────────────────────────────────────────────────────────────

export async function getPhase(phaseId: string) {
  requireId(phaseId, 'PHASE_ID_REQUIRED');

  const { data, errors } = await client.models.Phase.get({
    id: phaseId,
  });

  throwIfErrors(errors, 'PHASE_LOAD_FAILED');

  return data;
}

export async function listLessonsForPhase(phaseId: string) {
  requireId(phaseId, 'PHASE_ID_REQUIRED');

  const { data, errors } = await client.models.Lesson.list({
    filter: { phaseId: { eq: phaseId } },
  });

  throwIfErrors(errors, 'LESSONS_LOAD_FAILED');

  return [...(data ?? [])].sort((a, b) => a.order - b.order);
}

// ─── Lesson reads ───────────────────────────────────────────────────────────

export async function getLesson(lessonId: string) {
  requireId(lessonId, 'LESSON_ID_REQUIRED');

  const { data, errors } = await client.models.Lesson.get({
    id: lessonId,
  });

  throwIfErrors(errors, 'LESSON_LOAD_FAILED');

  return data;
}

export async function listLessonsForCourse(courseId: string) {
  requireId(courseId, 'COURSE_ID_REQUIRED');

  const { data, errors } = await client.models.Lesson.list({
    filter: { courseId: { eq: courseId } },
  });

  throwIfErrors(errors, 'LESSONS_LOAD_FAILED');

  return [...(data ?? [])].sort((a, b) => a.order - b.order);
}

// ─── Progress ───────────────────────────────────────────────────────────────

export async function listProgressForCourse(courseId: string) {
  requireId(courseId, 'COURSE_ID_REQUIRED');

  const { data, errors } = await client.models.UserProgress.list({
    filter: { courseId: { eq: courseId } },
  });

  throwIfErrors(errors, 'PROGRESS_LOAD_FAILED');

  return data ?? [];
}

/**
 * Mark a lesson complete.
 *
 * Existing completion records are reused. Progression is checked again
 * when an existing record is found, allowing a failed phase unlock to
 * recover on a later attempt.
 *
 * Client-side checks cannot prevent duplicate records from concurrent
 * requests. Enforce uniqueness or idempotency on the backend if required.
 */
export async function markLessonComplete(
  courseId: string,
  lessonId: string,
  xp = 10,
) {
  requireId(courseId, 'COURSE_ID_REQUIRED');
  requireId(lessonId, 'LESSON_ID_REQUIRED');

  if (!Number.isSafeInteger(xp) || xp < 0) {
    throw new Error('XP_INVALID');
  }

  const lesson = await getLesson(lessonId);

  if (!lesson) {
    throw new Error('LESSON_NOT_FOUND');
  }

  if (lesson.courseId !== courseId) {
    throw new Error('LESSON_COURSE_MISMATCH');
  }

  const phase = await getPhase(lesson.phaseId);

  if (!phase) {
    throw new Error('LESSON_PHASE_NOT_FOUND');
  }

  if (phase.courseId !== courseId) {
    throw new Error('LESSON_PHASE_COURSE_MISMATCH');
  }

  const progress = await listProgressForCourse(courseId);
  const existing = progress.find(
    (item) => item.lessonId === lessonId,
  );

  if (existing) {
    await advancePhaseIfComplete(courseId, lessonId);
    return existing;
  }

  const { data, errors } = await client.models.UserProgress.create(
    {
      courseId,
      lessonId,
      completedAt: new Date().toISOString(),
      xp,
    },
  );

  throwIfErrors(errors, 'LESSON_COMPLETION_FAILED');

  if (!data) {
    throw new Error('LESSON_COMPLETION_FAILED');
  }

  // Completion is saved before progression. If unlocking fails, a retry
  // can reuse the existing completion record and retry progression.
  await advancePhaseIfComplete(courseId, lessonId);

  return data;
}

// ─── Phase progression ──────────────────────────────────────────────────────

async function advancePhaseIfComplete(
  courseId: string,
  lessonId: string,
): Promise<void> {
  const lesson = await getLesson(lessonId);

  if (!lesson) {
    throw new Error('COMPLETED_LESSON_NOT_FOUND');
  }

  if (lesson.courseId !== courseId) {
    throw new Error('LESSON_COURSE_MISMATCH');
  }

  const phase = await getPhase(lesson.phaseId);

  if (!phase) {
    throw new Error('LESSON_PHASE_NOT_FOUND');
  }

  if (phase.courseId !== courseId) {
    throw new Error('LESSON_PHASE_COURSE_MISMATCH');
  }

  const [phaseLessons, progress, phases] = await Promise.all([
    listLessonsForPhase(phase.id),
    listProgressForCourse(courseId),
    listPhasesForCourse(courseId),
  ]);

  if (
    phaseLessons.length === 0 ||
    phaseLessons.some((item) => item.courseId !== courseId)
  ) {
    return;
  }

  const completedLessonIds = new Set(
    progress.map((item) => item.lessonId),
  );

  const phaseComplete = phaseLessons.every((item) =>
    completedLessonIds.has(item.id),
  );

  if (!phaseComplete) return;

  // Find the nearest subsequent phase without assuming consecutive orders.
  const nextPhase = phases
    .filter((candidate) => candidate.order > phase.order)
    .sort((a, b) => a.order - b.order)[0];

  if (!nextPhase) return;

  await unlockPhase(nextPhase.id);
}

export async function unlockPhase(phaseId: string) {
  requireId(phaseId, 'PHASE_ID_REQUIRED');

  const phase = await getPhase(phaseId);

  if (!phase) {
    throw new Error('PHASE_NOT_FOUND');
  }

  if (phase.locked === false) {
    return phase;
  }

  const { data, errors } = await client.models.Phase.update({
    id: phaseId,
    locked: false,
  });

  throwIfErrors(errors, 'PHASE_UNLOCK_FAILED');

  if (!data) {
    throw new Error('PHASE_UNLOCK_FAILED');
  }

  return data;
}
