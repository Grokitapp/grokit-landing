import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  BookOpen,
  Flame,
  Loader2,
  Pencil,
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
import { getProfile } from '../lib/profile';

// Loaded on demand: only needed when the learner opens "Edit profile".
const EditProfileModal = lazy(() => import('./profile/EditProfileModal'));

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
  color,
  filled = false,
}: {
  icon: typeof Flame;
  value: number | string;
  label: string;
  /** Accent colour (hex) for the icon and its soft background. */
  color: string;
  /** Fill the icon shape (e.g. a lit flame). */
  filled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-[#37464F] bg-[#19282E] px-4 py-3.5">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}22` }}
      >
        <Icon
          className="h-7 w-7"
          style={{ color }}
          fill={filled ? color : 'none'}
        />
      </span>

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
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getProfile>>>(null);
  const [editing, setEditing] = useState(false);

  const reloadProfile = useCallback(async () => {
    try {
      setProfile(await getProfile());
    } catch (loadError) {
      console.error('[Profile] Failed to load profile:', loadError);
    }
  }, []);

  useEffect(() => {
    void reloadProfile();
  }, [reloadProfile]);

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

  // The username (when set) is the public-facing name; the email prefix is only a fallback.
  const username = profile?.username?.trim() || '';
  const displayName = username || name;
  const initial = displayName.trim().charAt(0).toUpperCase() || 'Y';

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
              {displayName ? initial : <Loader2 className="h-8 w-8 animate-spin" />}
            </div>

            <h1 className="mt-5 break-words font-display text-3xl font-extrabold text-white">
              {displayName || ' '}
            </h1>

            <p className="mt-1 text-sm text-[#91A4AC]">
              {learningSince
                ? `Learning since ${learningSince}`
                : 'Complete a lesson to start your story'}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={!profile}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#37464F] px-4 text-sm font-bold text-[#C8D3DA] transition hover:border-[#536871] hover:bg-[#26373E] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange disabled:pointer-events-none disabled:opacity-50"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit profile
              </button>
            </div>

            {profile && !username && (
              <p className="mt-3 text-xs text-[#91A4AC]">
                You don’t have a username yet.{' '}
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="font-bold text-orange transition hover:text-white"
                >
                  Add one
                </button>
              </p>
            )}
          </section>

          {/* Statistics */}
          <section aria-labelledby="stats-title">
            <h2 id="stats-title" className={sectionTitleClasses}>
              Statistics
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <StatTile
                icon={Flame}
                color="#F4611F"
                filled={stats.currentStreak > 0}
                value={stats.currentStreak}
                label="Day streak"
              />
              <StatTile
                icon={Zap}
                color="#FACC15"
                filled={stats.totalXp > 0}
                value={stats.totalXp}
                label="Total XP"
              />
              <StatTile
                icon={BookOpen}
                color="#38BDF8"
                value={stats.lessonsCompleted}
                label="Lessons completed"
              />
              <StatTile
                icon={Trophy}
                color="#F59E0B"
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

      {editing && profile && (
        <Suspense fallback={null}>
          <EditProfileModal
            profile={profile}
            onClose={() => setEditing(false)}
            onSaved={reloadProfile}
          />
        </Suspense>
      )}
    </div>
  );
}