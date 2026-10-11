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