import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

const USER_POOL = { authMode: 'userPool' } as const;

function formatErrors(errors: readonly { message: string }[]): Error {
  return new Error(errors.map((error) => error.message).join('; '));
}

function assertNoErrors(errors: readonly { message: string }[] | undefined): void {
  if (errors?.length) throw formatErrors(errors);
}

function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

function sortByUpdatedAtDesc<T extends { updatedAt?: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bDate - aDate;
  });
}

export async function createCourseFromPrompt(topic: string, personalizationProfile?: unknown) {
  const { data, errors } = await client.mutations.generateOutline(
    { topic: topic.trim(), personalizationProfile: personalizationProfile as never },
    USER_POOL,
  );

  assertNoErrors(errors);

  if (!data) throw new Error('No course returned from generateOutline');

  return data;
}

export async function listCourses() {
  const { data, errors } = await client.models.Course.list(USER_POOL);

  assertNoErrors(errors);

  return sortByUpdatedAtDesc(data ?? []);
}

export async function getCourse(courseId: string) {
  const { data, errors } = await client.models.Course.get({ id: courseId }, USER_POOL);

  assertNoErrors(errors);

  return data;
}

export async function listPhasesForCourse(courseId: string) {
  const { data, errors } = await client.models.Phase.list(
    { filter: { courseId: { eq: courseId } }, ...USER_POOL },
  );

  assertNoErrors(errors);

  return sortByOrder(data ?? []);
}

export async function listLessonsForPhase(phaseId: string) {
  const { data, errors } = await client.models.Lesson.list(
    { filter: { phaseId: { eq: phaseId } }, ...USER_POOL },
  );

  assertNoErrors(errors);

  return sortByOrder(data ?? []);
}

export async function listLessonsForCourse(courseId: string) {
  const { data, errors } = await client.models.Lesson.list(
    { filter: { courseId: { eq: courseId } }, ...USER_POOL },
  );

  assertNoErrors(errors);

  return sortByOrder(data ?? []);
}

export async function generateLessonContent(lessonId: string) {
  const { data, errors } = await client.mutations.generateLesson({ lessonId }, USER_POOL);

  assertNoErrors(errors);

  if (!data) throw new Error('No lesson returned from generateLesson');

  return data;
}

export async function listProgressForCourse(courseId: string) {
  const { data, errors } = await client.models.UserProgress.list(
    { filter: { courseId: { eq: courseId } }, ...USER_POOL },
  );

  assertNoErrors(errors);

  return data ?? [];
}

export async function markLessonComplete(courseId: string, lessonId: string, xp = 10) {
  const { data, errors } = await client.models.UserProgress.create(
    { courseId, lessonId, completedAt: new Date().toISOString(), xp },
    USER_POOL,
  );

  assertNoErrors(errors);

  return data;
}

export async function unlockPhase(phaseId: string) {
  const { data, errors } = await client.models.Phase.update(
    { id: phaseId, locked: false },
    USER_POOL,
  );

  assertNoErrors(errors);

  return data;
}