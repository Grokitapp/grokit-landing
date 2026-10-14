import { Link } from 'react-router';
import { ChevronRight, Clock } from 'lucide-react';

import { cardClasses } from '../learn/components/GamificationCards';
import { MIN_XP_TO_PROMOTE, type LeaderboardData } from '../../lib/leaderboard';
import { formatTimeLeft, leagueAt, zoneFor } from '../../lib/leagues';
import LeagueEmblem from './LeagueEmblem';

const ZONE_COLOR = { up: '#58CC02', mid: '#C8D3DA', down: '#FF6B6B' } as const;

/** Compact league summary for the profile. Opens the full leaderboard. */
export default function LeagueCard({ data }: { data: LeaderboardData | null | undefined }) {
  const league = leagueAt(data?.leagueIndex ?? 0);
  const rank = data?.joined ? data.myRank : null;
  const zone = data && rank ? zoneFor(rank, data.rows.length) : null;

  let status = 'Complete a lesson to join this week’s group';
  let statusColor: string = '#91A4AC';

  if (data && rank && zone) {
    statusColor = ZONE_COLOR[zone];

    if (zone === 'up' && data.myXp < MIN_XP_TO_PROMOTE) {
      status = `Earn ${MIN_XP_TO_PROMOTE - data.myXp} more XP to move up`;
    } else {
      status =
        zone === 'up'
          ? 'In the promotion zone'
          : zone === 'down'
            ? 'In the demotion zone'
            : 'Safe this week';
    }
  }

  return (
    <Link
      to="/leaderboard"
      aria-label={`${league.name} League. ${status}. Open the leaderboard`}
      className={`${cardClasses} group relative flex items-center gap-4 overflow-hidden transition hover:border-[#536871] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange sm:gap-5`}
      style={{
        backgroundImage: `radial-gradient(ellipse at 0% 50%, ${league.color}2E, transparent 60%)`,
      }}
    >
      <span className="flex w-[84px] shrink-0 justify-center sm:w-[96px]">
        <LeagueEmblem league={league} size={44} glow />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-display text-xl font-extrabold leading-tight text-white sm:text-2xl">
          {league.name} League
        </p>

        <p className="mt-1 text-sm font-bold" style={{ color: statusColor }}>
          {status}
        </p>

        {data && (
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#91A4AC]">
            {rank && (
              <span>
                Rank <span className="text-white">#{rank}</span> of {data.rows.length}
              </span>
            )}
            <span>
              <span className="text-white">{data.myXp}</span> XP this week
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {formatTimeLeft(data.endsAt)}
            </span>
          </p>
        )}
      </div>

      <ChevronRight
        className="h-5 w-5 shrink-0 text-[#60757E] transition group-hover:translate-x-0.5 group-hover:text-white"
        aria-hidden="true"
      />
    </Link>
  );
}