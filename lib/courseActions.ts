import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import type { JourneyRaw } from './courseGeneration';
import { cacheKeys, removeCached, setCached } from './cache';

const client = generateClient<Schema>();

const USER_POOL = { authMode: 'userPool' } as const;

// -----------------------------------------------------------------------------
// Cross-component change notifications
// -----------------------------------------------------------------------------
// The sidebar (AppShell) and the journey page (CourseOverview) both need to
// react when a journey is renamed or deleted from either menu.

export const JOURNEY_CHANGED_EVENT = 'grokit:journey-changed';

export type JourneyChange =
  | { id: string; action: 'rename'; title: string }
  | { id: string; action: 'delete' };

export function emitJourneyChange(change: JourneyChange): void {
  window.dispatchEvent(
    new CustomEvent<JourneyChange>(JOURNEY_CHANGED_EVENT, { detail: change }),
  );
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

type ApiErrors = readonly { message: string }[] | undefined;

function assertNoErrors(errors: ApiErrors): void {
  if (errors?.length) {
    throw new Error(errors.map((error) => error.message).join('; '));
  }
}

interface Page {
  data: { id: string }[];
  errors?: ApiErrors;
  nextToken?: string | null;
}

// list() is paginated; follow nextToken so nothing is left behind on delete.
async function collectIds(
  fetchPage: (nextToken?: string | null) => Promise<Page>,
): Promise<string[]> {
  const ids: string[] = [];
  let nextToken: string | null | undefined;

  do {
    const page = await fetchPage(nextToken);
    assertNoErrors(page.errors);
    ids.push(...page.data.map((item) => item.id));
    nextToken = page.nextToken;
  } while (nextToken);

  return ids;
}

async function deleteInChunks(
  ids: string[],
  remove: (id: string) => Promise<{ errors?: ApiErrors }>,
): Promise<void> {
  const CHUNK_SIZE = 10;

  for (let index = 0; index < ids.length; index += CHUNK_SIZE) {
    const results = await Promise.all(
      ids.slice(index, index + CHUNK_SIZE).map(remove),
    );

    results.forEach((result) => assertNoErrors(result.errors));
  }
}

// -----------------------------------------------------------------------------
// Actions
// -----------------------------------------------------------------------------

export async function renameCourse(courseId: string, title: string) {
  const nextTitle = title.trim();

  if (!nextTitle) throw new Error('Journey name cannot be empty');

  const { data, errors } = await client.models.Course.update(
    { id: courseId, title: nextTitle },
    USER_POOL,
  );

  assertNoErrors(errors);

  // Keep every cached copy of this title in step, so nothing shows the old name.
  setCached<JourneyRaw>(cacheKeys.journey(courseId), (current) => ({
    ...current,
    course: { ...current.course, title: nextTitle },
  }));
  setCached<{ courses: { id: string; title: string }[] }>(
    cacheKeys.myJourneys,
    (current) => ({
      ...current,
      courses: current.courses.map((course) =>
        course.id === courseId ? { ...course, title: nextTitle } : course,
      ),
    }),
  );

  return data;
}

/**
 * Permanently deletes a journey and everything that belongs to it
 * (progress, lessons, zones). If you have other models keyed by courseId,
 * add them to the cascade below.
 */
export async function deleteCourse(courseId: string) {
  const filter = { courseId: { eq: courseId } };

  const [progressIds, lessonIds, phaseIds] = await Promise.all([
    collectIds((nextToken) =>
      client.models.UserProgress.list({ filter, nextToken, ...USER_POOL }),
    ),
    collectIds((nextToken) =>
      client.models.Lesson.list({ filter, nextToken, ...USER_POOL }),
    ),
    collectIds((nextToken) =>
      client.models.Phase.list({ filter, nextToken, ...USER_POOL }),
    ),
  ]);

  await deleteInChunks(progressIds, (id) =>
    client.models.UserProgress.delete({ id }, USER_POOL),
  );
  await deleteInChunks(lessonIds, (id) =>
    client.models.Lesson.delete({ id }, USER_POOL),
  );
  await deleteInChunks(phaseIds, (id) =>
    client.models.Phase.delete({ id }, USER_POOL),
  );

  const { errors } = await client.models.Course.delete(
    { id: courseId },
    USER_POOL,
  );

  assertNoErrors(errors);

  removeCached(cacheKeys.journey(courseId));
  setCached<{ courses: { id: string }[] }>(cacheKeys.myJourneys, (current) => ({
    ...current,
    courses: current.courses.filter((course) => course.id !== courseId),
  }));
}