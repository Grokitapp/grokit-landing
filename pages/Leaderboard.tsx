import { Fragment, useEffect } from 'react';
import { Link } from 'react-router';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  RefreshCw,
  Trophy,
  Zap,
} from 'lucide-react';

import { cardClasses } from './learn/components/GamificationCards';
import { useGamification } from '../lib/gamification';
import {
  COHORT_SIZE,
  DEMOTE_MAX,
  MIN_XP_TO_PROMOTE,
  PROMOTE_MAX,
  ensureLeaderboardIdentity,
  getZoneSizes,
  useLeaderboard,
  type LeaderboardData,
  type LeaderboardRow,
} from '../lib/leaderboard';
import { LEAGUES, formatTimeLeft, leagueAt, zoneFor } from '../lib/leagues';
import { useAccountNames, useProfileRecord } from '../lib/profile';
import LeagueEmblem from './profile/LeagueEmblem';

const AVATAR_COLORS = ['#8F3FB5', '#2F80ED', '#E5484D', '#12A594', '#D97706', '#7C5CFC', '#C2417C'];
const MEDAL_COLORS = ['#FFC83D', '#C0C7D1', '#D48A4A'];

function avatarColor(userId: string): string {
  let hash = 0;

  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;

  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// -----------------------------------------------------------------------------
// Pieces
// -----------------------------------------------------------------------------

function LeaderboardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading the leaderboard"
      className="mt-8 grid animate-pulse grid-cols-[minmax(0,1fr)] gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_340px]"
    >
      <div className="min-w-0 space-y-6">
        <div className="h-80 rounded-2xl bg-[#19282E]" />
        <div className="h-96 rounded-2xl bg-[#19282E]" />
      </div>
      <div className="space-y-6">
        <div className="h-64 rounded-2xl bg-[#19282E]" />
        <div className="h-56 rounded-2xl bg-[#19282E]" />
      </div>
    </div>
  );
}

function RankBadge({ rank, zone }: { rank: number; zone: 'up' | 'down' | 'mid' }) {
  if (rank <= 3) {
    return (
      <span
        aria-label={`Rank ${rank}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold text-[#131F24]"
        style={{ backgroundColor: MEDAL_COLORS[rank - 1] }}
      >
        {rank}
      </span>
    );
  }

  return (
    <span
      aria-label={`Rank ${rank}`}
      className={`w-8 shrink-0 text-center font-display text-base font-extrabold ${
        zone === 'up'
          ? 'text-[#58CC02]'
          : zone === 'down'
            ? 'text-[#FF6B6B]'
            : 'text-[#91A4AC]'
      }`}
    >
      {rank}
    </span>
  );
}

function ZoneLabel({ kind }: { kind: 'up' | 'down' }) {
  const up = kind === 'up';
  const Icon = up ? ChevronUp : ChevronDown;

  return (
    <li
      aria-hidden="true"
      className={`flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-extrabold uppercase tracking-wide ${
        up ? 'bg-[#58CC02]/10 text-[#58CC02]' : 'bg-[#FF6B6B]/10 text-[#FF6B6B]'
      }`}
    >
      <Icon className="h-4 w-4" />
      {up ? 'Promotion zone' : 'Demotion zone'}
    </li>
  );
}

function StandingRow({ row, zone }: { row: LeaderboardRow; zone: 'up' | 'down' | 'mid' }) {
  return (
    <li
      aria-current={row.isMe ? 'true' : undefined}
      className={`flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-3.5 ${row.isMe ? 'bg-[#202F35]' : ''}`}
    >
      <RankBadge rank={row.rank} zone={zone} />

      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-lg font-extrabold text-white"
        style={{ backgroundColor: avatarColor(row.userId) }}
      >
        {row.name.charAt(0).toUpperCase()}
      </span>

      <p className="min-w-0 flex-1 truncate text-base font-extrabold text-white">
        {row.name}
        {row.isMe && <span className="ml-2 font-semibold text-[#91A4AC]">(You)</span>}
      </p>

      <p className="shrink-0 text-sm font-extrabold text-[#C8D3DA]">{row.xp} XP</p>
    </li>
  );
}

function LastWeekBanner({ data }: { data: LeaderboardData }) {
  const { lastWeek } = data;

  if (!lastWeek || lastWeek.result === 'STAYED') return null;

  const promoted = lastWeek.result === 'PROMOTED';
  const color = promoted ? '#58CC02' : '#FF6B6B';
  const leagueName = leagueAt(data.leagueIndex).name;

  return (
    <p
      role="status"
      className="mx-auto mt-5 max-w-xl rounded-xl border px-4 py-3 text-sm font-bold text-white"
      style={{ borderColor: `${color}66`, backgroundColor: `${color}1A` }}
    >
      {promoted
        ? `You finished #${lastWeek.rank} last week and moved up to ${leagueName} League!`
        : `You finished #${lastWeek.rank} last week and moved down to ${leagueName} League. Earn some XP to climb back.`}
    </p>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#2D4149] bg-[#131F24]/70 px-2 py-2.5 text-center sm:px-3">
      <p className="truncate font-display text-lg font-extrabold leading-none text-white sm:text-xl">
        {value}
      </p>
      <p className="mt-1.5 truncate text-[11px] font-semibold text-[#91A4AC] sm:text-xs">{label}</p>
    </div>
  );
}

/** Every league, with names. 4 per row on phones, all 8 in one row on wider screens. */
function LeagueGrid({ index }: { index: number }) {
  return (
    <ol aria-label="All leagues" className="grid grid-cols-4 gap-x-1.5 gap-y-3 sm:grid-cols-8">
      {LEAGUES.map((item, position) => {
        const current = position === index;
        const locked = position > index;

        return (
          <li
            key={item.id}
            aria-current={current ? 'true' : undefined}
            className="flex min-w-0 flex-col items-center gap-1 rounded-xl px-0.5 py-2"
            style={
              current
                ? { backgroundColor: `${item.color}1F`, boxShadow: `inset 0 0 0 1.5px ${item.color}66` }
                : undefined
            }
          >
            <LeagueEmblem league={item} size={current ? 50 : 44} locked={locked} />
            <span
              className={`max-w-full truncate text-[11px] font-extrabold sm:text-xs ${
                current ? 'text-white' : locked ? 'text-[#60757E]' : 'text-[#C8D3DA]'
              }`}
            >
              {item.name}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const ZONE_STYLE = {
  up: { color: '#58CC02', icon: ChevronUp },
  mid: { color: '#C8D3DA', icon: Zap },
  down: { color: '#FF6B6B', icon: ChevronDown },
} as const;

function LeagueHero({ data }: { data: LeaderboardData }) {
  const league = leagueAt(data.leagueIndex);
  const next = LEAGUES[data.leagueIndex + 1] ?? null;
  const { promote } = getZoneSizes(data.rows.length);

  const rank = data.joined ? data.myRank : null;
  const zone = rank ? zoneFor(rank, data.rows.length) : null;

  let status = 'Complete a lesson to join this week’s group';
  let statusColor = '#C8D3DA';
  let StatusIcon: typeof Zap = Zap;

  if (zone) {
    ({ color: statusColor, icon: StatusIcon } = ZONE_STYLE[zone]);

    if (zone === 'up' && data.myXp < MIN_XP_TO_PROMOTE) {
      status = `Earn ${MIN_XP_TO_PROMOTE - data.myXp} more XP to move up`;
    } else {
      status =
        zone === 'up'
          ? 'You’re in the promotion zone'
          : zone === 'down'
            ? 'You’re in the demotion zone'
            : 'You’re safe this week';
    }
  }

  return (
    <section
      aria-label="Your league"
      className={`${cardClasses} min-w-0 overflow-hidden px-3 pb-5 pt-7 text-center sm:px-8 sm:pb-6 sm:pt-8`}
      style={{
        backgroundImage: `radial-gradient(ellipse at 50% 0%, ${league.color}40, transparent 65%)`,
      }}
    >
      <div className="flex justify-center">
        <LeagueEmblem league={league} size={112} glow />
      </div>

      <h2 className="mt-4 break-words font-display text-3xl font-extrabold text-white sm:text-4xl">
        {league.name} League
      </h2>

      <p className="mx-auto mt-1.5 max-w-xs text-sm font-semibold text-[#C8D3DA] sm:max-w-none sm:text-base">
        {next
          ? promote > 0
            ? `Top ${promote} move up to ${next.name}`
            : `Finish near the top to reach ${next.name}`
          : 'You’re in the top league'}
      </p>

      <div className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-2">
        <StatChip label={rank ? `Rank of ${data.rows.length}` : 'Rank'} value={rank ? `#${rank}` : '–'} />
        <StatChip label="XP this week" value={String(data.myXp)} />
        <StatChip label="Time left" value={formatTimeLeft(data.endsAt).replace(' left', '')} />
      </div>

      <p
        className="mx-auto mt-4 inline-flex max-w-full items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-extrabold leading-5 sm:text-sm"
        style={{ color: statusColor, backgroundColor: `${statusColor}1A` }}
      >
        <StatusIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0">{status}</span>
      </p>

      <LastWeekBanner data={data} />

      <div className="mt-6 border-t border-[#2D4149] pt-4">
        <LeagueGrid index={data.leagueIndex} />
      </div>
    </section>
  );
}

function Standings({ data }: { data: LeaderboardData }) {
  const { rows } = data;
  const { promote, demote } = getZoneSizes(rows.length);
  const demoteFrom = rows.length - demote;

  if (!data.joined) {
    return (
      <section aria-labelledby="standings-title">
        <h2 id="standings-title" className="mb-4 font-display text-xl font-extrabold text-white sm:text-2xl">
          This week’s standings
        </h2>

        <div className={`${cardClasses} flex flex-col items-center px-5 py-12 text-center`}>
          <span
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#202F35] text-orange shadow-[0_4px_0_#0D161A]"
          >
            <Trophy className="h-6 w-6" />
          </span>

          <h3 className="mt-4 font-display text-lg font-extrabold text-white">
            Complete a lesson to join
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-[#A9BAC0]">
            Earn XP this week and you’ll be placed in a group of learners in
            your league. Everyone starts in {LEAGUES[0].name}.
          </p>

          <Link
            to="/library"
            className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-orange px-5 text-sm font-extrabold text-white shadow-[0_3px_0_#C94713] transition hover:brightness-110 active:translate-y-0.5 active:shadow-none"
          >
            Continue learning
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="standings-title">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id="standings-title" className="font-display text-xl font-extrabold text-white sm:text-2xl">
          This week’s standings
        </h2>

        <p className="text-sm font-semibold text-[#91A4AC]">
          {rows.length} learner{rows.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className={`${cardClasses} overflow-hidden p-0`}>
        <ul className="divide-y divide-[#2D4149]">
          {rows.map((row, index) => {
            const zone = index < promote ? 'up' : demote > 0 && index >= demoteFrom ? 'down' : 'mid';

            return (
              <Fragment key={row.userId}>
                {index === 0 && promote > 0 && <ZoneLabel kind="up" />}
                {demote > 0 && index === demoteFrom && <ZoneLabel kind="down" />}
                <StandingRow row={row} zone={zone} />
              </Fragment>
            );
          })}
        </ul>

        {rows.length === 1 && (
          <p className="border-t border-[#2D4149] px-5 py-4 text-center text-sm text-[#A9BAC0]">
            You’re the first one here this week. Other learners join as they
            earn XP.
          </p>
        )}
      </div>
    </section>
  );
}

function WeekChart({
  stats,
  color,
}: {
  stats: NonNullable<ReturnType<typeof useGamification>['stats']>;
  color: string;
}) {
  const maxDayXp = Math.max(...stats.week.map((day) => day.xp), 1);
  const weekXp = stats.week.reduce((sum, day) => sum + day.xp, 0);

  return (
    <section aria-labelledby="week-title">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id="week-title" className="font-display text-xl font-extrabold text-white">
          Your week
        </h2>

        <p className="text-sm font-semibold text-[#91A4AC]">{weekXp} XP</p>
      </div>

      <div className={`${cardClasses} px-4 py-5`}>
        <div className="flex h-32 items-stretch gap-2">
          {stats.week.map((day) => {
            const height = day.xp > 0 ? `${Math.max(10, (day.xp / maxDayXp) * 100)}%` : '6px';

            return (
              <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 flex-col items-center justify-end">
                  {day.xp > 0 && (
                    <span className="mb-1 text-[11px] font-extrabold text-white">{day.xp}</span>
                  )}

                  <div
                    role="img"
                    aria-label={`${day.label}: ${day.xp} XP`}
                    className="w-full max-w-[30px] rounded-t-lg"
                    style={{
                      height,
                      backgroundColor: day.xp > 0 ? color : day.isFuture ? '#1F3038' : '#2D4149',
                    }}
                  />
                </div>

                <span
                  className={`text-[11px] font-bold ${day.isToday ? 'text-orange' : 'text-[#91A4AC]'}`}
                >
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowLeaguesWork() {
  const items = [
    {
      icon: Zap,
      color: '#FACC15',
      text: `Earn XP from lessons. You’re grouped with up to ${COHORT_SIZE} learners.`,
    },
    {
      icon: ChevronUp,
      color: '#58CC02',
      text: `Top ${PROMOTE_MAX} move up (at least ${MIN_XP_TO_PROMOTE} XP).`,
    },
    { icon: ChevronDown, color: '#FF6B6B', text: `Bottom ${DEMOTE_MAX} move down.` },
    { icon: Clock, color: '#38BDF8', text: 'Weeks reset every Monday at 12:00 AM IST.' },
  ];

  return (
    <section aria-labelledby="how-title">
      <h2 id="how-title" className="mb-4 font-display text-xl font-extrabold text-white">
        How leagues work
      </h2>

      <ul className={`${cardClasses} space-y-4 p-5`}>
        {items.map(({ icon: Icon, color, text }) => (
          <li key={text} className="flex items-center gap-3 text-sm leading-5 text-[#A9BAC0]">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${color}22`, color }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Page (same width, spacing and heading style as Library)
// -----------------------------------------------------------------------------

export default function Leaderboard() {
  const { data, loading, refreshing, error, refresh } = useLeaderboard({
    refreshEvery: 60_000,
  });
  const { stats } = useGamification();
  const { data: profile } = useProfileRecord();
  const { data: account } = useAccountNames();

  const profileId = profile?.id;
  const publicName = account?.fullName || profile?.username?.trim() || '';

  // Put the learner's name on their leaderboard rows so others can see it.
  useEffect(() => {
    if (!profileId) return;

    let cancelled = false;

    void ensureLeaderboardIdentity(profileId, publicName).then((changed) => {
      if (changed && !cancelled) void refresh();
    });

    return () => {
      cancelled = true;
    };
  }, [profileId, publicName, refresh]);

  return (
    <div className="relative min-h-[100dvh]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(56,120,160,0.16),transparent_70%)]"
      />

      <div className="relative mx-auto w-full max-w-[1180px] px-4 pb-12 pt-6 sm:px-7 sm:pt-8 xl:px-9">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-[-0.02em] text-white sm:text-5xl">
              Leaderboard
            </h1>
            <p className="mt-2 text-sm font-medium text-[#A9BAC0] sm:text-base">
              Earn XP from lessons and climb the leagues.
            </p>
          </div>

          {refreshing && (
            <p
              role="status"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#91A4AC]"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Updating
            </p>
          )}
        </header>

        {loading ? (
          <LeaderboardSkeleton />
        ) : error || !data ? (
          <section
            role="alert"
            className="mx-auto flex max-w-lg flex-col items-center py-20 text-center"
          >
            <h2 className="font-display text-2xl font-extrabold text-white">
              We couldn’t load the leaderboard
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#A9BAC0]">
              Your progress is safe. Please try again.
            </p>

            <button
              type="button"
              onClick={() => void refresh()}
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-orange px-5 text-sm font-extrabold text-white shadow-[0_3px_0_#C94713] transition hover:brightness-110 active:translate-y-0.5 active:shadow-none"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          </section>
        ) : (
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] items-start gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6 sm:space-y-8">
              <LeagueHero data={data} />
              <Standings data={data} />
            </div>

            <aside className="min-w-0 space-y-6 sm:space-y-8">
              {stats && <WeekChart stats={stats} color={leagueAt(data.leagueIndex).color} />}
              <HowLeaguesWork />
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}