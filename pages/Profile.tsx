import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  BookOpen,
  Flame,
  Loader2,
  RefreshCw,
  Trophy,
  Zap,
} from 'lucide-react';
import { fetchUserAttributes } from 'aws-amplify/auth';

import {
  BadgeGrid,
  StreakCalendar,
  StreakCard,
  cardClasses,
} from './learn/components/GamificationCards';
import { useGamification } from '../lib/gamification';

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const sectionTitleClasses =
  'mb-4 font-display text-xl font-extrabold text-white sm:text-2xl';

// -----------------------------------------------------------------------------
// Small pieces
// -----------------------------------------------------------------------------

function StatTile({
  icon: Icon,
  value,
  label,
  accent = false,
}: {
  icon: typeof Flame;
  value: number | string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-[#37464F] px-4 py-3.5">
      <Icon
        aria-hidden="true"
        className={`h-7 w-7 shrink-0 ${
          accent ? 'fill-orange text-orange' : 'text-orange'
        }`}
      />

      <div className="min-w-0">
        <p className="font-display text-xl font-extrabold leading-none text-white">
          {value}
        </p>
        <p className="mt-1 text-sm text-[#91A4AC]">{label}</p>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading your profile"
      className="animate-pulse space-y-6"
    >
      <div className="h-72 rounded-2xl bg-[#19282E]" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-[72px] rounded-2xl bg-[#19282E]" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-[#19282E]" />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function Profile() {
  const { stats, loading, error, refresh } = useGamification();
  const [name, setName] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadName = async () => {
      try {
        const attributes = await fetchUserAttributes();

        if (cancelled) return;

        setName(
          attributes.name ||
            attributes.preferred_username ||
            attributes.email?.split('@')[0] ||
            'You',
        );
      } catch {
        if (!cancelled) setName('You');
      }
    };

    void loadName();

    return () => {
      cancelled = true;
    };
  }, []);

  const initial = name.trim().charAt(0).toUpperCase() || 'Y';

  const learningSince = stats?.firstActivityAt?.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[860px] px-4 py-6 sm:px-7 sm:py-10">
      {loading || (!stats && !error) ? (
        <ProfileSkeleton />
      ) : error || !stats ? (
        <section
          role="alert"
          className="mx-auto flex max-w-lg flex-col items-center py-20 text-center"
        >
          <h1 className="font-display text-2xl font-extrabold text-white">
            We couldn’t load your profile
          </h1>

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
          {/* Hero */}
          <section className={`${cardClasses} px-5 py-8 text-center sm:px-8`}>
            <div
              aria-hidden="true"
              className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#8F3FB5] font-display text-5xl font-extrabold text-white shadow-[0_6px_0_#6B2A88]"
            >
              {name ? initial : <Loader2 className="h-8 w-8 animate-spin" />}
            </div>

            <h1 className="mt-5 break-words font-display text-3xl font-extrabold text-white">
              {name || ' '}
            </h1>

            <p className="mt-1 text-sm text-[#91A4AC]">
              {learningSince
                ? `Learning since ${learningSince}`
                : 'Complete a lesson to start your story'}
            </p>

            {/* Level */}
            <div className="mx-auto mt-6 max-w-sm text-left">
              <div className="flex items-baseline justify-between text-sm">
                <p className="font-display font-extrabold text-white">
                  Level {stats.level}
                </p>
                <p className="text-[#91A4AC]">
                  {stats.levelXp}/{stats.levelSize} XP
                </p>
              </div>

              <div
                role="progressbar"
                aria-label="Progress to next level"
                aria-valuemin={0}
                aria-valuemax={stats.levelSize}
                aria-valuenow={stats.levelXp}
                className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#0D181C]"
              >
                <div
                  className="h-full rounded-full bg-orange transition-[width] duration-700 ease-out"
                  style={{
                    width: `${(stats.levelXp / stats.levelSize) * 100}%`,
                  }}
                />
              </div>
            </div>
          </section>

          {/* Statistics */}
          <section aria-labelledby="stats-title">
            <h2 id="stats-title" className={sectionTitleClasses}>
              Statistics
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <StatTile
                icon={Flame}
                accent={stats.currentStreak > 0}
                value={stats.currentStreak}
                label="Day streak"
              />
              <StatTile icon={Zap} value={stats.totalXp} label="Total XP" />
              <StatTile
                icon={BookOpen}
                value={stats.lessonsCompleted}
                label="Lessons completed"
              />
              <StatTile
                icon={Trophy}
                value={stats.longestStreak}
                label="Longest streak"
              />
            </div>
          </section>

          {/* Streak + calendar */}
          <section
            aria-label="Streak and activity"
            className="grid gap-4 md:grid-cols-2"
          >
            <StreakCard stats={stats} />
            <StreakCalendar stats={stats} />
          </section>

          {/* Badges */}
          <section aria-labelledby="badges-title">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 id="badges-title" className="font-display text-xl font-extrabold text-white sm:text-2xl">
                Badges
              </h2>

              <p className="text-sm font-semibold text-[#91A4AC]">
                {stats.badges.filter((badge) => badge.earned).length} of{' '}
                {stats.badges.length} earned
              </p>
            </div>

            <BadgeGrid badges={stats.badges} />
          </section>

          {stats.lessonsCompleted === 0 && (
            <p className="text-center text-sm text-[#91A4AC]">
              Nothing here yet.{' '}
              <Link
                to="/create"
                className="font-bold text-orange transition hover:text-white"
              >
                Start a journey
              </Link>{' '}
              and your streak, XP and badges will show up.
            </p>
          )}
        </div>
      )}
    </div>
  );
}