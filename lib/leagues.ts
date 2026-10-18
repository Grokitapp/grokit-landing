import { LEAGUE_COUNT, getZoneSizes } from '../amplify/functions/shared/leaderboard-rules';

/**
 * Leagues are the XP "ranks" a learner climbs through. They are derived from
 * total XP only, so nothing needs to be stored.
 */

export interface League {
  id: string;
  name: string;
  /** Total XP needed to enter this league. */
  minXp: number;
  /** Main colour of the emblem (also used for accents). */
  color: string;
  /** Highlight colour at the top of the emblem. */
  light: string;
  /** Rim / shadow colour of the emblem. */
  rim: string;
}

export const LEAGUES: League[] = [
  { id: 'tidepool', name: 'Tidepool', minXp: 0, color: '#D9A35F', light: '#F5D49E', rim: '#8C5E26' },
  { id: 'shallows', name: 'Shallows', minXp: 300, color: '#45C4DB', light: '#9BEAF6', rim: '#1B7B93' },
  { id: 'reef', name: 'Reef', minXp: 800, color: '#FF6B8A', light: '#FFB1C2', rim: '#B8324F' },
  { id: 'lagoon', name: 'Lagoon', minXp: 1600, color: '#22C7A0', light: '#80EBD0', rim: '#0C7A62' },
  { id: 'current', name: 'Current', minXp: 3000, color: '#3B82F6', light: '#8DB8FF', rim: '#1D4DA8' },
  { id: 'deep', name: 'Deep', minXp: 5000, color: '#7C6CF2', light: '#B5ABFF', rim: '#4237B0' },
  { id: 'abyss', name: 'Abyss', minXp: 8000, color: '#C84BC2', light: '#F08EEA', rim: '#7C1D78' },
  { id: 'kraken', name: 'Kraken', minXp: 12000, color: '#FF8A1F', light: '#FFC46B', rim: '#C2500A' },
];

// The backend moves learners between exactly LEAGUE_COUNT leagues. If you add
// or remove one here, change LEAGUE_COUNT in leaderboard-rules.ts too.
if (import.meta.env.DEV && LEAGUES.length !== LEAGUE_COUNT) {
  console.warn(`[leagues] LEAGUES has ${LEAGUES.length} entries but LEAGUE_COUNT is ${LEAGUE_COUNT}.`);
}

export interface LeagueProgress {
  league: League;
  /** Position of the current league in LEAGUES. */
  index: number;
  next: League | null;
  /** XP earned inside the current league. */
  xpIntoLeague: number;
  /** XP the current league spans (0 in the top league). */
  xpForNext: number;
  /** XP still needed to reach the next league (0 in the top league). */
  xpToNext: number;
  /** 0 to 1 progress through the current league (1 in the top league). */
  fraction: number;
  isTop: boolean;
}

export function getLeagueProgress(totalXp: number): LeagueProgress {
  const xp = Math.max(0, totalXp);

  let index = 0;

  LEAGUES.forEach((league, position) => {
    if (xp >= league.minXp) index = position;
  });

  const league = LEAGUES[index];
  const next = LEAGUES[index + 1] ?? null;

  if (!next) {
    return {
      league,
      index,
      next: null,
      xpIntoLeague: xp - league.minXp,
      xpForNext: 0,
      xpToNext: 0,
      fraction: 1,
      isTop: true,
    };
  }

  const xpForNext = next.minXp - league.minXp;
  const xpIntoLeague = xp - league.minXp;

  return {
    league,
    index,
    next,
    xpIntoLeague,
    xpForNext,
    xpToNext: next.minXp - xp,
    fraction: Math.min(xpIntoLeague / xpForNext, 1),
    isTop: false,
  };
}

/** League by position (0 = Tidepool ... 7 = Kraken), safe for any number. */
export function leagueAt(index: number): League {
  return LEAGUES[Math.min(Math.max(Math.trunc(index) || 0, 0), LEAGUES.length - 1)];
}

export type Zone = 'up' | 'mid' | 'down';

/** Where a rank sits in a group: moving up, safe, or moving down. */
export function zoneFor(rank: number, groupSize: number): Zone {
  const { promote, demote } = getZoneSizes(groupSize);

  if (rank <= promote) return 'up';
  if (demote > 0 && rank > groupSize - demote) return 'down';

  return 'mid';
}

/** "3 days left", "5 hours left". */
export function formatTimeLeft(endsAt: Date): string {
  const ms = endsAt.getTime() - Date.now();

  if (ms <= 0) return 'Ending soon';

  const days = Math.floor(ms / 86_400_000);

  if (days >= 1) return `${days} day${days === 1 ? '' : 's'} left`;

  const hours = Math.max(1, Math.floor(ms / 3_600_000));

  return `${hours} hour${hours === 1 ? '' : 's'} left`;
}