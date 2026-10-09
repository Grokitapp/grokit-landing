import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

type GraphqlError = { message: string };

function throwIfErrors(errors?: GraphqlError[] | null) {
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join('; '));
  }
}

function requireId(id: string, code: string) {
  if (!id.trim()) throw new Error(code);
}

// ─── Mutations (AI generation) ─────────────────────────────────────────────


type PersonalizationProfile = {
  experienceLevel: 'new' | 'beginner' | 'intermediate' | 'advanced';
  existingKnowledge: string[];
  learningFocus: string;
  focusAreas: string[];
};

export async function createCourseFromPrompt(
  topic: string,
  personalizationProfile?: PersonalizationProfile,
) {
  const normalizedTopic = topic.trim();

  if (!normalizedTopic) {
    throw new Error('COURSE_TOPIC_REQUIRED');
  }

  const profile =
    personalizationProfile &&
    typeof personalizationProfile === 'object'
      ? {
          experienceLevel: personalizationProfile.experienceLevel,
          existingKnowledge: Array.isArray(
            personalizationProfile.existingKnowledge,
          )
            ? personalizationProfile.existingKnowledge.filter(
                (item): item is string => typeof item === 'string',
              )
            : [],
          learningFocus:
            typeof personalizationProfile.learningFocus === 'string'
              ? personalizationProfile.learningFocus.trim()
              : '',
          focusAreas: Array.isArray(personalizationProfile.focusAreas)
            ? personalizationProfile.focusAreas.filter(
                (item): item is string => typeof item === 'string',
              )
            : [],
        }
      : undefined;

  const input = {
    topic: normalizedTopic,
    ...(profile ? { personalizationProfile: profile } : {}),
  };

  const { data, errors } =
    await client.mutations.generateOutline(input);

  throwIfErrors(errors);

  if (!data) {
    throw new Error('No course returned from generateOutline');
  }

  return data;
}

export async function generateLessonContent(lessonId: string) {
  const { data, errors } = await client.mutations.generateLesson({ lessonId });

  throwIfErrors(errors);

  if (!data) throw new Error('No lesson returned from generateLesson');

  return data;
}

// ─── Course reads ───────────────────────────────────────────────────────────

export async function getCourse(courseId: string) {
  requireId(courseId, 'COURSE_ID_REQUIRED');

  const { data, errors } = await client.models.Course.get({ id: courseId });

  throwIfErrors(errors);

  return data;
}

export async function listPhasesForCourse(courseId: string) {
  requireId(courseId, 'COURSE_ID_REQUIRED');

  const { data, errors } = await client.models.Phase.list({
    filter: { courseId: { eq: courseId } },
  });

  throwIfErrors(errors);

  return [...(data ?? [])].sort((a, b) => a.order - b.order);
}

// ─── Phase reads ────────────────────────────────────────────────────────────

export async function getPhase(phaseId: string) {
  requireId(phaseId, 'PHASE_ID_REQUIRED');

  const { data, errors } = await client.models.Phase.get({ id: phaseId });

  throwIfErrors(errors);

  return data;
}

export async function listLessonsForPhase(phaseId: string) {
  requireId(phaseId, 'PHASE_ID_REQUIRED');

  const { data, errors } = await client.models.Lesson.list({
    filter: { phaseId: { eq: phaseId } },
  });

  throwIfErrors(errors);

  return [...(data ?? [])].sort((a, b) => a.order - b.order);
}

// ─── Lesson reads ──────────────────────────────────────────────────────────

export async function getLesson(lessonId: string) {
  requireId(lessonId, 'LESSON_ID_REQUIRED');

  const { data, errors } = await client.models.Lesson.get({ id: lessonId });

  throwIfErrors(errors);

  return data;
}

export async function listLessonsForCourse(courseId: string) {
  requireId(courseId, 'COURSE_ID_REQUIRED');

  const { data, errors } = await client.models.Lesson.list({
    filter: { courseId: { eq: courseId } },
  });

  throwIfErrors(errors);

  return [...(data ?? [])].sort((a, b) => a.order - b.order);
}

// ─── Progress ──────────────────────────────────────────────────────────────

export async function listProgressForCourse(courseId: string) {
  requireId(courseId, 'COURSE_ID_REQUIRED');

  const { data, errors } = await client.models.UserProgress.list({
    filter: { courseId: { eq: courseId } },
  });

  throwIfErrors(errors);

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
  requireId(courseId, 'COURSE_ID_REQUIRED');
  requireId(lessonId, 'LESSON_ID_REQUIRED');

  if (!Number.isFinite(xp) || xp < 0) throw new Error('XP_INVALID');

  // 1. Check for an existing completion.
  const progress = await listProgressForCourse(courseId);
  const existing = progress.find((p) => p.lessonId === lessonId);

  if (existing) {
    // The record exists, but phase progression may not have
    // completed during the original request.
    await advancePhaseIfComplete(courseId, lessonId);
    return existing;
  }

  // 2. Create the completion record.
  const { data, errors } = await client.models.UserProgress.create({
    courseId,
    lessonId,
    completedAt: new Date().toISOString(),
    xp,
  });

  throwIfErrors(errors);

  if (!data) throw new Error('LESSON_COMPLETION_FAILED');

  // 3. Advance the course if this completed the phase.
  await advancePhaseIfComplete(courseId, lessonId);

  return data;
}

// ─── Phase progression ─────────────────────────────────────────────────────

async function advancePhaseIfComplete(
  courseId: string,
  lessonId: string,
) {
  // Find the completed lesson.
  const lesson = await getLesson(lessonId);

  if (!lesson) throw new Error('COMPLETED_LESSON_NOT_FOUND');

  // Prevent a completion record from one course from
  // progressing another course.
  if (lesson.courseId !== courseId) {
    throw new Error('LESSON_COURSE_MISMATCH');
  }

  // Find the lesson's phase.
  const phase = await getPhase(lesson.phaseId);

  if (!phase) throw new Error('LESSON_PHASE_NOT_FOUND');

  // Load all lessons belonging to the phase.
  const phaseLessons = await listLessonsForPhase(phase.id);

  if (!phaseLessons.length) return;

  // Load current course progress.
  const progress = await listProgressForCourse(courseId);
  const completedLessonIds = new Set(progress.map((p) => p.lessonId));

  // A phase is complete only when every lesson in that
  // phase has a UserProgress record.
  const phaseComplete = phaseLessons.every((l) =>
    completedLessonIds.has(l.id),
  );

  if (!phaseComplete) return;

  // Find the next phase by sequence order.
  const phases = await listPhasesForCourse(courseId);
  const nextPhase = phases.find(
    (candidate) => candidate.order === phase.order + 1,
  );

  // There is no next phase when the final phase is complete.
  if (!nextPhase) return;

  // Unlock the next phase.
  await unlockPhase(nextPhase.id);
}

export async function unlockPhase(phaseId: string) {
  requireId(phaseId, 'PHASE_ID_REQUIRED');

  const phase = await getPhase(phaseId);

  if (!phase) throw new Error('PHASE_NOT_FOUND');

  // Idempotent unlock.
  if (phase.locked === false) return phase;

  const { data, errors } = await client.models.Phase.update({
    id: phaseId,
    locked: false,
  });

  throwIfErrors(errors);

  if (!data) throw new Error('PHASE_UNLOCK_FAILED');

  return data;
}