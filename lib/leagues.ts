import { getZoneSizes } from '../amplify/functions/shared/leaderboard-rules';

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
  { id: 'bronze', name: 'Bronze', minXp: 0, color: '#D48A4A', light: '#F2B67C', rim: '#8A4F1D' },
  { id: 'silver', name: 'Silver', minXp: 300, color: '#B8C2CF', light: '#E3E9F0', rim: '#6F7B8B' },
  { id: 'gold', name: 'Gold', minXp: 800, color: '#FFC83D', light: '#FFE48A', rim: '#B8801A' },
  { id: 'sapphire', name: 'Sapphire', minXp: 1600, color: '#3B82F6', light: '#8DB8FF', rim: '#1D4DA8' },
  { id: 'ruby', name: 'Ruby', minXp: 3000, color: '#EF4455', light: '#FF8D98', rim: '#9E1E2C' },
  { id: 'emerald', name: 'Emerald', minXp: 5000, color: '#10B981', light: '#6EE7B7', rim: '#0A7455' },
  { id: 'amethyst', name: 'Amethyst', minXp: 8000, color: '#A855F7', light: '#D2A5FF', rim: '#6B2AA8' },
  { id: 'diamond', name: 'Diamond', minXp: 12000, color: '#38D6EE', light: '#B4F3FF', rim: '#0E8BA6' },
];

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

/** League by position (0 = Bronze ... 7 = Diamond), safe for any number. */
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