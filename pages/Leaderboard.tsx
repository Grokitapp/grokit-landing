import { Fragment, useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronDown, ChevronUp, RefreshCw, Trophy } from 'lucide-react';

import { cardClasses } from './learn/components/GamificationCards';
import { useGamification } from '../lib/gamification';
import {
  ensureLeaderboardIdentity,
  getZoneSizes,
  useLeaderboard,
  type LeaderboardData,
  type LeaderboardRow,
} from '../lib/leaderboard';
import { LEAGUES, leagueAt } from '../lib/leagues';
import { useAccountNames, useProfileRecord } from '../lib/profile';
import LeagueEmblem from './profile/LeagueEmblem';

const sectionTitleClasses =
  'mb-4 font-display text-xl font-extrabold text-white sm:text-2xl';

const AVATAR_COLORS = ['#8F3FB5', '#2F80ED', '#E5484D', '#12A594', '#D97706', '#7C5CFC', '#C2417C'];

function avatarColor(userId: string): string {
  let hash = 0;

  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;

  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function timeLeft(endsAt: Date): string {
  const ms = endsAt.getTime() - Date.now();

  if (ms <= 0) return 'Ending soon';

  const days = Math.floor(ms / 86_400_000);

  if (days >= 1) return `${days} day${days === 1 ? '' : 's'} left`;

  const hours = Math.max(1, Math.floor(ms / 3_600_000));

  return `${hours} hour${hours === 1 ? '' : 's'} left`;
}

const MEDAL_COLORS = ['#FFC83D', '#C0C7D1', '#D48A4A'];

// -----------------------------------------------------------------------------
// Pieces
// -----------------------------------------------------------------------------

function LeaderboardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading the leaderboard"
      className="animate-pulse space-y-6"
    >
      <div className="h-72 rounded-2xl bg-[#19282E]" />
      <div className="h-96 rounded-2xl bg-[#19282E]" />
    </div>
  );
}

function RankBadge({ rank, zone }: { rank: number; zone: 'up' | 'down' | 'mid' }) {
  if (rank <= 3) {
    return (
      <span
        aria-label={`Rank ${rank}`}
        className="flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-extrabold text-[#131F24]"
        style={{ backgroundColor: MEDAL_COLORS[rank - 1] }}
      >
        {rank}
      </span>
    );
  }

  return (
    <span
      aria-label={`Rank ${rank}`}
      className={`w-8 text-center font-display text-base font-extrabold ${
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
      className={`flex items-center justify-center gap-1.5 border-y border-[#37464F] px-5 py-2 text-xs font-extrabold uppercase tracking-wide ${
        up ? 'bg-[#58CC02]/10 text-[#58CC02]' : 'bg-[#FF6B6B]/10 text-[#FF6B6B]'
      }`}
    >
      <Icon className="h-4 w-4" />
      {up ? 'Promotion zone' : 'Demotion zone'}
    </li>
  );
}

function StandingRow({
  row,
  zone,
}: {
  row: LeaderboardRow;
  zone: 'up' | 'down' | 'mid';
}) {
  return (
    <li
      aria-current={row.isMe ? 'true' : undefined}
      className={`flex items-center gap-4 px-5 py-3.5 ${
        row.isMe ? 'bg-[#202F35]' : ''
      }`}
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

      <p className="text-sm font-extrabold text-[#C8D3DA]">{row.xp} XP</p>
    </li>
  );
}

function LastWeekBanner({ data }: { data: LeaderboardData }) {
  const { lastWeek } = data;

  if (!lastWeek || lastWeek.result === 'STAYED') return null;

  const promoted = lastWeek.result === 'PROMOTED';
  const color = promoted ? '#58CC02' : '#FF6B6B';

  return (
    <p
      role="status"
      className="mt-5 rounded-xl border px-4 py-3 text-sm font-bold text-white"
      style={{ borderColor: `${color}66`, backgroundColor: `${color}1A` }}
    >
      {promoted
        ? `You finished #${lastWeek.rank} last week and moved up to ${leagueAt(data.leagueIndex).name} League!`
        : `You finished #${lastWeek.rank} last week and moved down to ${leagueAt(data.leagueIndex).name} League. Earn some XP to climb back.`}
    </p>
  );
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function Leaderboard() {
  const { data, loading, error, refresh } = useLeaderboard();
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
    <div className="mx-auto min-h-[100dvh] w-full max-w-[860px] px-4 py-6 sm:px-7 sm:py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-extrabold text-white">
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-[#91A4AC]">
          Earn XP from lessons and climb the leagues.
        </p>
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

          <p className="mt-3 text-sm leading-6 text-[#91A4AC]">
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
        <div className="space-y-10">
          <LeagueHero data={data} />
          <Standings data={data} />

          {stats && (
            <section aria-labelledby="week-title">
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2
                  id="week-title"
                  className="font-display text-xl font-extrabold text-white sm:text-2xl"
                >
                  Your week
                </h2>

                <p className="text-sm font-semibold text-[#91A4AC]">
                  {stats.week.reduce((sum, day) => sum + day.xp, 0)} XP
                </p>
              </div>

              <WeekChart stats={stats} color={leagueAt(data.leagueIndex).color} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function LeagueHero({ data }: { data: LeaderboardData }) {
  const league = leagueAt(data.leagueIndex);
  const next = LEAGUES[data.leagueIndex + 1] ?? null;
  const { promote } = getZoneSizes(data.rows.length);

  return (
    <section
      aria-label="Your league"
      className={`${cardClasses} overflow-hidden px-5 py-8 text-center sm:px-8`}
      style={{
        backgroundImage: `radial-gradient(circle at 50% 0%, ${league.color}30, transparent 65%)`,
      }}
    >
      <ol
        aria-label="All leagues"
        className="flex items-end gap-3 overflow-x-auto pb-2 sm:justify-center"
      >
        {LEAGUES.map((item, index) => (
          <li key={item.id} className="shrink-0" title={`${item.name} League`}>
            <LeagueEmblem
              league={item}
              size={index === data.leagueIndex ? 68 : 38}
              locked={index > data.leagueIndex}
              glow={index === data.leagueIndex}
            />
          </li>
        ))}
      </ol>

      <h2 className="mt-5 font-display text-3xl font-extrabold text-white">
        {league.name} League
      </h2>

      <p className="mt-2 text-sm font-semibold text-[#C8D3DA]">
        {next
          ? promote > 0
            ? `Top ${promote} advance to ${next.name} League`
            : `Finish near the top to advance to ${next.name} League`
          : 'You’re in the top league'}
      </p>

      <p className="mt-1 text-sm font-extrabold" style={{ color: league.color }}>
        {timeLeft(data.endsAt)}
      </p>

      <LastWeekBanner data={data} />
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
        <h2 id="standings-title" className={sectionTitleClasses}>
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

          <p className="mt-2 max-w-md text-sm leading-6 text-[#91A4AC]">
            Earn XP this week and you’ll be placed in a group of learners in
            your league. Everyone starts in Bronze.
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
        <h2
          id="standings-title"
          className="font-display text-xl font-extrabold text-white sm:text-2xl"
        >
          This week’s standings
        </h2>

        <p className="text-sm font-semibold text-[#91A4AC]">
          {rows.length} learner{rows.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className={`${cardClasses} overflow-hidden p-0`}>
        <ul className="divide-y divide-[#2D4149]">
          {rows.map((row, index) => {
            const zone = index < promote ? 'up' : index >= demoteFrom && demote > 0 ? 'down' : 'mid';

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
          <p className="border-t border-[#2D4149] px-5 py-4 text-center text-sm text-[#91A4AC]">
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

  return (
    <div className={`${cardClasses} px-4 py-5 sm:px-6`}>
      <div className="flex h-36 items-stretch gap-2 sm:gap-4">
        {stats.week.map((day) => {
          const height =
            day.xp > 0 ? `${Math.max(10, (day.xp / maxDayXp) * 100)}%` : '6px';

          return (
            <div
              key={day.key}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <div className="flex w-full flex-1 flex-col items-center justify-end">
                {day.xp > 0 && (
                  <span className="mb-1 text-[11px] font-extrabold text-white">
                    {day.xp}
                  </span>
                )}

                <div
                  role="img"
                  aria-label={`${day.label}: ${day.xp} XP`}
                  className="w-full max-w-[44px] rounded-t-lg"
                  style={{
                    height,
                    backgroundColor:
                      day.xp > 0 ? color : day.isFuture ? '#1F3038' : '#2D4149',
                  }}
                />
              </div>

              <span
                className={`text-xs font-bold ${
                  day.isToday ? 'text-orange' : 'text-[#91A4AC]'
                }`}
              >
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}