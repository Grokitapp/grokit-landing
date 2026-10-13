import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import type { PublicJourney } from './explore';
import { cacheKeys, setCached } from './cache';

const client = generateClient<Schema>();

const USER_POOL = { authMode: 'userPool' } as const;

export type SavedJourney = Schema['SavedJourney']['type'];
export type Note = Schema['Note']['type'];

function newestFirst<T extends { updatedAt?: string | null; createdAt?: string | null }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) =>
    (b.updatedAt ?? b.createdAt ?? '').localeCompare(
      a.updatedAt ?? a.createdAt ?? '',
    ),
  );
}

async function listAll<T>(
  fetchPage: (
    nextToken: string | null | undefined,
  ) => Promise<{
    data: T[] | null | undefined;
    errors?: readonly unknown[];
    nextToken?: string | null;
  }>,
  errorCode: string,
): Promise<T[]> {
  const items: T[] = [];
  let nextToken: string | null | undefined;

  do {
    const page = await fetchPage(nextToken);

    if (page.errors?.length) {
      console.error(`[library] ${errorCode}:`, page.errors);
      throw new Error(errorCode);
    }

    items.push(...(page.data ?? []));
    nextToken = page.nextToken;
  } while (nextToken && items.length < 500);

  return items;
}

// ─── Saved journeys ─────────────────────────────────────────────────────────

export async function listSavedJourneys(): Promise<SavedJourney[]> {
  const items = await listAll<SavedJourney>(
    (nextToken) =>
      client.models.SavedJourney.list({ ...USER_POOL, limit: 100, nextToken }),
    'SAVED_LOAD_FAILED',
  );

  return newestFirst(items);
}

export async function saveJourney(journey: PublicJourney): Promise<SavedJourney> {
  const { data, errors } = await client.models.SavedJourney.create(
    {
      publicJourneyId: journey.id,
      title: journey.title,
      topic: journey.topic,
      category: journey.category ?? undefined,
      heroImageUrl: journey.heroImageUrl ?? undefined,
      zoneCount: journey.zoneCount ?? undefined,
      lessonCount: journey.lessonCount ?? undefined,
      authorUsername: journey.authorUsername ?? undefined,
    },
    USER_POOL,
  );

  if (errors?.length || !data) {
    console.error('[library] Failed to save journey:', errors);
    throw new Error('SAVE_FAILED');
  }

  // Explore and Library both read this list; update it for both at once.
  setCached<SavedJourney[]>(cacheKeys.savedJourneys, (current) => [
    data,
    ...current.filter((item) => item.id !== data.id),
  ]);

  return data;
}

export async function unsaveJourney(savedId: string): Promise<void> {
  const { errors } = await client.models.SavedJourney.delete(
    { id: savedId },
    USER_POOL,
  );

  if (errors?.length) {
    console.error('[library] Failed to unsave journey:', errors);
    throw new Error('UNSAVE_FAILED');
  }

  setCached<SavedJourney[]>(cacheKeys.savedJourneys, (current) =>
    current.filter((item) => item.id !== savedId),
  );
}

// ─── Notes ──────────────────────────────────────────────────────────────────

export async function listNotes(): Promise<Note[]> {
  const items = await listAll<Note>(
    (nextToken) =>
      client.models.Note.list({ ...USER_POOL, limit: 100, nextToken }),
    'NOTES_LOAD_FAILED',
  );

  return newestFirst(items);
}

export async function createNote(input: {
  title: string;
  content: string;
}): Promise<Note> {
  const { data, errors } = await client.models.Note.create(
    { title: input.title, content: input.content },
    USER_POOL,
  );

  if (errors?.length || !data) {
    console.error('[library] Failed to create note:', errors);
    throw new Error('NOTE_CREATE_FAILED');
  }

  return data;
}

export async function updateNote(
  id: string,
  input: { title: string; content: string },
): Promise<Note> {
  const { data, errors } = await client.models.Note.update(
    { id, title: input.title, content: input.content },
    USER_POOL,
  );

  if (errors?.length || !data) {
    console.error('[library] Failed to update note:', errors);
    throw new Error('NOTE_UPDATE_FAILED');
  }

  return data;
}

export async function deleteNote(id: string): Promise<void> {
  const { errors } = await client.models.Note.delete({ id }, USER_POOL);

  if (errors?.length) {
    console.error('[library] Failed to delete note:', errors);
    throw new Error('NOTE_DELETE_FAILED');
  }
}