import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

// ─── Mutations (AI generation) ─────────────────────────────────────────────

export async function createCourseFromPrompt(
  topic: string,
  personalizationProfile?: unknown,
) {
  const { data, errors } =
    await client.mutations.generateOutline({
      topic: topic.trim(),
      personalizationProfile:
        personalizationProfile as never,
    });

  if (errors?.length) {
    throw new Error(
      errors.map((error) => error.message).join('; '),
    );
  }

  if (!data) {
    throw new Error(
      'No course returned from generateOutline',
    );
  }

  return data;
}

export async function generateLessonContent(
  lessonId: string,
) {
  const { data, errors } =
    await client.mutations.generateLesson({
      lessonId,
    });

  if (errors?.length) {
    throw new Error(
      errors.map((error) => error.message).join('; '),
    );
  }

  if (!data) {
    throw new Error(
      'No lesson returned from generateLesson',
    );
  }

  return data;
}

// ─── Course reads ───────────────────────────────────────────────────────────

export async function getCourse(courseId: string) {
  if (!courseId.trim()) {
    throw new Error('COURSE_ID_REQUIRED');
  }

  const { data, errors } =
    await client.models.Course.get({
      id: courseId,
    });

  if (errors?.length) {
    throw new Error(
      errors.map((error) => error.message).join('; '),
    );
  }

  return data;
}

export async function listPhasesForCourse(
  courseId: string,
) {
  if (!courseId.trim()) {
    throw new Error('COURSE_ID_REQUIRED');
  }

  const { data, errors } =
    await client.models.Phase.list({
      filter: {
        courseId: {
          eq: courseId,
        },
      },
    });

  if (errors?.length) {
    throw new Error(
      errors.map((error) => error.message).join('; '),
    );
  }

  return [...(data ?? [])].sort(
    (a, b) => a.order - b.order,
  );
}

// ─── Phase reads ────────────────────────────────────────────────────────────

export async function getPhase(phaseId: string) {
  if (!phaseId.trim()) {
    throw new Error('PHASE_ID_REQUIRED');
  }

  const { data, errors } =
    await client.models.Phase.get({
      id: phaseId,
    });

  if (errors?.length) {
    throw new Error(
      errors.map((error) => error.message).join('; '),
    );
  }

  return data;
}

export async function listLessonsForPhase(
  phaseId: string,
) {
  if (!phaseId.trim()) {
    throw new Error('PHASE_ID_REQUIRED');
  }

  const { data, errors } =
    await client.models.Lesson.list({
      filter: {
        phaseId: {
          eq: phaseId,
        },
      },
    });

  if (errors?.length) {
    throw new Error(
      errors.map((error) => error.message).join('; '),
    );
  }

  return [...(data ?? [])].sort(
    (a, b) => a.order - b.order,
  );
}

// ─── Lesson reads ──────────────────────────────────────────────────────────

export async function getLesson(lessonId: string) {
  if (!lessonId.trim()) {
    throw new Error('LESSON_ID_REQUIRED');
  }

  const { data, errors } =
    await client.models.Lesson.get({
      id: lessonId,
    });

  if (errors?.length) {
    throw new Error(
      errors.map((error) => error.message).join('; '),
    );
  }

  return data;
}

export async function listLessonsForCourse(
  courseId: string,
) {
  if (!courseId.trim()) {
    throw new Error('COURSE_ID_REQUIRED');
  }

  const { data, errors } =
    await client.models.Lesson.list({
      filter: {
        courseId: {
          eq: courseId,
        },
      },
    });

  if (errors?.length) {
    throw new Error(
      errors.map((error) => error.message).join('; '),
    );
  }

  return [...(data ?? [])].sort(
    (a, b) => a.order - b.order,
  );
}

// ─── Progress ──────────────────────────────────────────────────────────────

export async function listProgressForCourse(
  courseId: string,
) {
  if (!courseId.trim()) {
    throw new Error('COURSE_ID_REQUIRED');
  }

  const { data, errors } =
    await client.models.UserProgress.list({
      filter: {
        courseId: {
          eq: courseId,
        },
      },
    });

  if (errors?.length) {
    throw new Error(
      errors.map((error) => error.message).join('; '),
    );
  }

  return data ?? [];
}

/**
 * Mark a lesson as complete.
 *
 * Completion is application-level idempotent:
 * if the lesson has already been completed, the existing
 * progress record is returned.
 *
 * Phase progression is checked even when an existing
 * progress record is found, which allows a previously
 * interrupted phase-unlock operation to recover.
 */
export async function markLessonComplete(
  courseId: string,
  lessonId: string,
  xp = 10,
) {
  if (!courseId.trim()) {
    throw new Error('COURSE_ID_REQUIRED');
  }

  if (!lessonId.trim()) {
    throw new Error('LESSON_ID_REQUIRED');
  }

  if (!Number.isFinite(xp) || xp < 0) {
    throw new Error('XP_INVALID');
  }

  /**
   * 1. Check for an existing completion.
   */

  const existingProgress =
    await listProgressForCourse(courseId);

  const existing = existingProgress.find(
    (progress) => progress.lessonId === lessonId,
  );

  if (existing) {
    /**
     * The progress record already exists, but phase
     * progression may not have completed successfully
     * during the original request.
     */
    await advancePhaseIfComplete(
      courseId,
      lessonId,
    );

    return existing;
  }

  /**
   * 2. Create the completion record.
   */

  const { data, errors } =
    await client.models.UserProgress.create({
      courseId,
      lessonId,
      completedAt: new Date().toISOString(),
      xp,
    });

  if (errors?.length) {
    throw new Error(
      errors.map((error) => error.message).join('; '),
    );
  }

  if (!data) {
    throw new Error(
      'LESSON_COMPLETION_FAILED',
    );
  }

  /**
   * 3. Advance the course if this completed the phase.
   */

  await advancePhaseIfComplete(
    courseId,
    lessonId,
  );

  return data;
}

// ─── Phase progression ─────────────────────────────────────────────────────

async function advancePhaseIfComplete(
  courseId: string,
  lessonId: string,
) {
  /**
   * Find the completed lesson.
   */

  const lesson = await getLesson(lessonId);

  if (!lesson) {
    throw new Error(
      'COMPLETED_LESSON_NOT_FOUND',
    );
  }

  /**
   * Prevent a completion record from one course from
   * progressing another course.
   */

  if (lesson.courseId !== courseId) {
    throw new Error(
      'LESSON_COURSE_MISMATCH',
    );
  }

  /**
   * Find the lesson's phase.
   */

  const phase = await getPhase(
    lesson.phaseId,
  );

  if (!phase) {
    throw new Error(
      'LESSON_PHASE_NOT_FOUND',
    );
  }

  /**
   * Load all lessons belonging to the phase.
   */

  const phaseLessons =
    await listLessonsForPhase(phase.id);

  if (!phaseLessons.length) {
    return;
  }

  /**
   * Load current course progress.
   */

  const progress =
    await listProgressForCourse(courseId);

  const completedLessonIds = new Set(
    progress.map(
      (item) => item.lessonId,
    ),
  );

  /**
   * A phase is complete only when every lesson in that
   * phase has a UserProgress record.
   */

  const phaseComplete =
    phaseLessons.every((phaseLesson) =>
      completedLessonIds.has(phaseLesson.id),
    );

  if (!phaseComplete) {
    return;
  }

  /**
   * Find the next phase by sequence order.
   */

  const phases =
    await listPhasesForCourse(courseId);

  const nextPhase = phases.find(
    (candidate) =>
      candidate.order === phase.order + 1,
  );

  /**
   * There is no next phase when the final phase is complete.
   */

  if (!nextPhase) {
    return;
  }

  /**
   * Unlock the next phase.
   */

  await unlockPhase(nextPhase.id);
}

export async function unlockPhase(
  phaseId: string,
) {
  if (!phaseId.trim()) {
    throw new Error('PHASE_ID_REQUIRED');
  }

  const phase = await getPhase(phaseId);

  if (!phase) {
    throw new Error('PHASE_NOT_FOUND');
  }

  /**
   * Idempotent unlock.
   */

  if (phase.locked === false) {
    return phase;
  }

  const { data, errors } =
    await client.models.Phase.update({
      id: phaseId,
      locked: false,
    });

  if (errors?.length) {
    throw new Error(
      errors.map((error) => error.message).join('; '),
    );
  }

  if (!data) {
    throw new Error(
      'PHASE_UNLOCK_FAILED',
    );
  }

  return data;
}