import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

const USER_POOL = { authMode: 'userPool' } as const;

// Explore shows a browsable catalogue, not an infinite feed. Cap what we pull.
const MAX_JOURNEYS = 200;

export type PublicJourney = Schema['PublicJourney']['type'];

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
}

/** Make a journey visible to every signed-in learner in Explore. */
export async function publishJourney(
  input: PublishJourneyInput,
): Promise<PublicJourney> {
  const { data, errors } = await client.models.PublicJourney.create(
    {
      courseId: input.courseId,
      title: input.title,
      topic: input.topic,
      category: input.category || undefined,
      heroImageUrl: input.heroImageUrl || undefined,
      zoneCount: input.zoneCount,
      lessonCount: input.lessonCount,
      featured: false,
    },
    USER_POOL,
  );

  if (errors?.length || !data) {
    console.error('[explore] Failed to publish journey:', errors);
    throw new Error('PUBLISH_FAILED');
  }

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
}