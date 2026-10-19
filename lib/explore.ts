import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { getProfile } from './profile';
import { cacheKeys, invalidate } from './cache';

const client = generateClient<Schema>();

const USER_POOL = { authMode: 'userPool' } as const;

// Explore shows a browsable catalogue, not an infinite feed. Cap what we pull.
const MAX_JOURNEYS = 200;

export type PublicJourney = Schema['PublicJourney']['type'];

/**
 * Categories a learner can pick when publishing. `category` is a free string in
 * the backend, so this list can grow without a schema change. Keep the first
 * nine as they are (journeys already published use them) and "Other" last.
 */
export const PUBLIC_CATEGORIES = [
  'AI & Tech',
  'Programming & Data',
  'Business',
  'Finance & Money',
  'Marketing & Sales',
  'Career & Productivity',
  'Science',
  'Math',
  'Engineering',
  'Nature & Environment',
  'Health & Fitness',
  'Mind & Life',
  'Parenting & Relationships',
  'Creativity',
  'Art & Design',
  'Music',
  'Writing & Literature',
  'History',
  'Philosophy',
  'Politics & Society',
  'Law',
  'Languages',
  'Travel & Culture',
  'Cooking & Food',
  'Sports & Games',
  'Test Prep & Study Skills',
  'Other',
] as const;

/**
 * Journeys that have been published for everyone to browse.
 *
 * Featured journeys come first, then the most recently updated.
 */
export async function listPublicJourneys(): Promise<PublicJourney[]> {
  const journeys: PublicJourney[] = [];
  let nextToken: string | null | undefined;

  do {
    const { data, errors, nextToken: token } =
      await client.models.PublicJourney.list({
        ...USER_POOL,
        limit: 100,
        nextToken,
      });

    if (errors?.length) {
      console.error('[explore] Failed to load public journeys:', errors);
      throw new Error('EXPLORE_LOAD_FAILED');
    }

    journeys.push(...(data ?? []));
    nextToken = token;
  } while (nextToken && journeys.length < MAX_JOURNEYS);

  return journeys.sort((a, b) => {
    if (Boolean(a.featured) !== Boolean(b.featured)) {
      return a.featured ? -1 : 1;
    }

    const aDate = a.updatedAt ?? a.createdAt ?? '';
    const bDate = b.updatedAt ?? b.createdAt ?? '';

    return bDate.localeCompare(aDate);
  });
}

/** The public listing for one of the learner's journeys, if it has one. */
export async function getPublicJourneyForCourse(
  courseId: string,
): Promise<PublicJourney | null> {
  let nextToken: string | null | undefined;

  // Filters apply per page, so keep paging until the listing is found.
  for (let page = 0; page < 10; page += 1) {
    const { data, errors, nextToken: token } =
      await client.models.PublicJourney.list({
        ...USER_POOL,
        filter: { courseId: { eq: courseId } },
        limit: 100,
        nextToken,
      });

    if (errors?.length) {
      console.error('[explore] Failed to check public journey:', errors);
      throw new Error('PUBLIC_JOURNEY_CHECK_FAILED');
    }

    if (data?.length) return data[0];

    if (!token) break;

    nextToken = token;
  }

  return null;
}

export interface PublishJourneyInput {
  courseId: string;
  title: string;
  topic: string;
  category?: string | null;
  heroImageUrl?: string | null;
  zoneCount: number;
  lessonCount: number;
  /** Defaults to the signed-in learner's username (required to publish). */
  authorUsername?: string | null;
}

/** Make a journey visible to every signed-in learner in Explore. */
export async function publishJourney(
  input: PublishJourneyInput,
): Promise<PublicJourney> {
  let authorUsername = input.authorUsername?.trim() || '';

  if (!authorUsername) {
    authorUsername = (await getProfile())?.username?.trim() || '';
  }

  // Public journeys are credited to their author, so a username is required.
  if (!authorUsername) throw new Error('USERNAME_REQUIRED');

  const { data, errors } = await client.models.PublicJourney.create(
    {
      courseId: input.courseId,
      title: input.title,
      topic: input.topic,
      category: input.category || undefined,
      heroImageUrl: input.heroImageUrl || undefined,
      zoneCount: input.zoneCount,
      lessonCount: input.lessonCount,
      authorUsername,
      featured: false,
    },
    USER_POOL,
  );

  if (errors?.length || !data) {
    console.error('[explore] Failed to publish journey:', errors);
    throw new Error('PUBLISH_FAILED');
  }

  // Explore gains a journey, and the owner's Library gets its "Public" badge.
  invalidate(cacheKeys.publicJourneys);
  invalidate(cacheKeys.myJourneys);

  return data;
}

/** Remove a journey from Explore. */
export async function unpublishJourney(publicJourneyId: string) {
  const { errors } = await client.models.PublicJourney.delete(
    { id: publicJourneyId },
    USER_POOL,
  );

  if (errors?.length) {
    console.error('[explore] Failed to unpublish journey:', errors);
    throw new Error('UNPUBLISH_FAILED');
  }

  invalidate(cacheKeys.publicJourneys);
  invalidate(cacheKeys.myJourneys);
}