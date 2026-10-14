import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Lock,
  Zap,
} from 'lucide-react';

import { dayKey, type GamificationStats } from '../../../lib/gamification';
import type { ProfileBadge } from '../../../lib/badges';
import { BADGE_ICONS } from '../../profile/badgeStyle';

// -----------------------------------------------------------------------------
// Shared styles
// -----------------------------------------------------------------------------

export const cardClasses =
  'rounded-2xl border border-[#37464F] bg-[#19282E] p-5';

const cardTitleClasses = 'font-display text-lg font-extrabold text-white';

const ORANGE = { from: '#FF8A3D', to: '#F4611F', edge: '#C94713' };

const activeDayStyle = {
  backgroundImage: `linear-gradient(to bottom, ${ORANGE.from}, ${ORANGE.to})`,
  boxShadow: `0 3px 0 ${ORANGE.edge}`,
};

/** Icons that look better with a soft fill once the badge is earned. */
const FILLED_ICONS: ReadonlySet<ProfileBadge['icon']> = new Set([
  'flame',
  'star',
  'zap',
]);

/**
 * Colours per badge tone: gradient top/bottom, the darker "edge" used for the
 * 3D bottom shadow, and the main accent for glows, rings and progress bars.
 */
const TONES: Record<
  ProfileBadge['tone'],
  { from: string; to: string; edge: string; main: string }
> = {
  emerald: { from: '#4ADE80', to: '#16A34A', edge: '#0F7A37', main: '#22C55E' },
  teal: { from: '#2DD4BF', to: '#0D9488', edge: '#0A6B62', main: '#14B8A6' },
  violet: { from: '#C084FC', to: '#8B3FD9', edge: '#6226A0', main: '#A855F7' },
  orange: { from: '#FF8A3D', to: '#F4611F', edge: '#C94713', main: '#F4611F' },
  gold: { from: '#FFB020', to: '#E08A00', edge: '#A86500', main: '#F59E0B' },
  rose: { from: '#FF7A93', to: '#E5365B', edge: '#A8203F', main: '#F43F5E' },
  sun: { from: '#FDE047', to: '#EAB308', edge: '#A37A05', main: '#FACC15' },
  sky: { from: '#60C5FF', to: '#1D8FE1', edge: '#1366A8', main: '#38BDF8' },
  indigo: { from: '#A5B4FC', to: '#6366F1', edge: '#4338CA', main: '#818CF8' },
  pink: { from: '#F9A8D4', to: '#EC4899', edge: '#BE185D', main: '#F472B6' },
  lime: { from: '#BEF264', to: '#65A30D', edge: '#4D7C0F', main: '#A3E635' },
  cyan: { from: '#67E8F9', to: '#06B6D4', edge: '#0E7490', main: '#22D3EE' },
};

// -----------------------------------------------------------------------------
// Compact stat chip (top bars, sidebar)
// -----------------------------------------------------------------------------

export function StatChip({
  kind,
  value,
  active = true,
  className = '',
}: {
  kind: 'streak' | 'xp';
  value: number;
  active?: boolean;
  className?: string;
}) {
  const Icon = kind === 'streak' ? Flame : Zap;

  return (
    <span
      className={`inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#37464F] bg-[#19282E] px-2.5 font-display text-sm font-extrabold ${
        active ? 'text-white' : 'text-[#78909A]'
      } ${className}`}
      title={kind === 'streak' ? 'Day streak' : 'Total XP'}
    >
      <Icon
        aria-hidden="true"
        className={`h-4 w-4 ${
          active ? 'fill-orange text-orange' : 'text-[#60757E]'
        }`}
      />
      <span className="sr-only">
        {kind === 'streak' ? 'Day streak:' : 'Total XP:'}
      </span>
      {value}
    </span>
  );
}

// -----------------------------------------------------------------------------
// Streak card (this week)
// -----------------------------------------------------------------------------

export function StreakCard({ stats }: { stats: GamificationStats }) {
  const hasStreak = stats.currentStreak > 0;

  const message = !hasStreak
    ? 'Finish a lesson today to start a streak.'
    : stats.streakActiveToday
      ? 'You’re on a roll. See you tomorrow!'
      : 'Finish a lesson today to keep it going.';

  return (
    <section
      className={`${cardClasses} overflow-hidden`}
      style={
        hasStreak
          ? {
              backgroundImage:
                'radial-gradient(120% 90% at 0% 0%, rgba(244,97,31,0.16), transparent 60%)',
            }
          : undefined
      }
      aria-label="Day streak"
    >
      <div className="flex items-center gap-3.5">
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center">
          {hasStreak && (
            <span
              aria-hidden="true"
              className="absolute inset-1 rounded-full bg-orange opacity-40 blur-xl"
            />
          )}

          <span
            className={`relative flex h-14 w-14 items-center justify-center rounded-2xl ${
              hasStreak ? '' : 'bg-[#202F35] shadow-[0_3px_0_#0D161A]'
            }`}
            style={hasStreak ? activeDayStyle : undefined}
          >
            <Flame
              aria-hidden="true"
              className={`h-8 w-8 ${
                hasStreak ? 'fill-white/30 text-white' : 'text-[#60757E]'
              }`}
            />
          </span>
        </span>

        <div className="min-w-0">
          <p className="font-display text-3xl font-extrabold leading-none text-white">
            {stats.currentStreak}
            <span className="ml-1.5 text-base font-bold text-[#C8D3DA]">
              day streak
            </span>
          </p>
          <p className="mt-1.5 text-xs leading-5 text-[#91A4AC]">{message}</p>
        </div>
      </div>

      <ol className="mt-5 grid grid-cols-7 gap-1">
        {stats.week.map((day) => (
          <li key={day.key} className="flex flex-col items-center gap-1.5">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                day.active
                  ? 'text-white'
                  : day.isToday
                    ? 'border-2 border-orange bg-orange/10'
                    : day.isFuture
                      ? 'bg-[#1D2D34]'
                      : 'bg-[#202F35]'
              }`}
              style={day.active ? activeDayStyle : undefined}
            >
              {day.active && (
                <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
              )}
            </span>

            <span
              className={`text-[11px] font-semibold ${
                day.isToday ? 'text-white' : 'text-[#78909A]'
              }`}
            >
              {day.label}
            </span>

            <span className="sr-only">
              {day.active ? 'completed' : day.isFuture ? 'upcoming' : 'missed'}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Badges
// -----------------------------------------------------------------------------

/**
 * The round badge artwork. Earned: the badge's own colour, glow and icon.
 * Not earned: the same icon, greyed out, with a small lock.
 */
function BadgeMedal({
  badge,
  size = 'lg',
}: {
  badge: ProfileBadge;
  size?: 'md' | 'lg';
}) {
  const tone = TONES[badge.tone];
  const Icon = BADGE_ICONS[badge.icon];
  const dimension = size === 'lg' ? 'h-16 w-16' : 'h-14 w-14';
  const iconSize = size === 'lg' ? 'h-7 w-7' : 'h-6 w-6';

  return (
    <span className="relative inline-flex shrink-0">
      {badge.earned && (
        <span
          aria-hidden="true"
          className="absolute inset-1 rounded-full opacity-40 blur-xl"
          style={{ backgroundColor: tone.main }}
        />
      )}

      <span
        className={`relative flex items-center justify-center rounded-full ${dimension}`}
        style={
          badge.earned
            ? {
                backgroundImage: `linear-gradient(to bottom, ${tone.from}, ${tone.to})`,
                boxShadow: `0 4px 0 ${tone.edge}`,
              }
            : { backgroundColor: '#202F35', boxShadow: '0 4px 0 #0D161A' }
        }
      >
        <Icon
          aria-hidden="true"
          className={`${iconSize} ${
            badge.earned ? 'text-white drop-shadow-sm' : 'text-[#4F646D]'
          }`}
          fill={
            badge.earned && FILLED_ICONS.has(badge.icon)
              ? 'rgba(255,255,255,0.35)'
              : 'none'
          }
        />
      </span>

      {!badge.earned && (
        <span
          aria-hidden="true"
          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#16242A] bg-[#2A3B43] text-[#8CA0A8]"
        >
          <Lock className="h-3 w-3" />
        </span>
      )}
    </span>
  );
}

export function BadgeTile({ badge }: { badge: ProfileBadge }) {
  const tone = TONES[badge.tone];
  const ratio = badge.target > 0 ? Math.min(1, Math.max(0, badge.value / badge.target)) : 0;

  return (
    <li
      className={`flex flex-col items-center rounded-2xl border p-4 text-center transition-colors ${
        badge.earned ? '' : 'border-[#2D3C43] bg-[#16242A]'
      }`}
      style={
        badge.earned
          ? {
              borderColor: `${tone.main}55`,
              backgroundColor: `${tone.main}14`,
            }
          : undefined
      }
    >
      <BadgeMedal badge={badge} />

      <p
        className={`mt-3 font-display text-sm font-extrabold ${
          badge.earned ? 'text-white' : 'text-[#78909A]'
        }`}
      >
        {badge.title}
      </p>

      <p
        className={`mt-1 text-xs leading-5 ${
          badge.earned ? 'text-[#A9BAC0]' : 'text-[#60757E]'
        }`}
      >
        {badge.description}
      </p>

      {badge.earned ? (
        <p
          className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold"
          style={{ color: tone.main }}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
          Earned
        </p>
      ) : (
        <div className="mt-3 w-full">
          <div
            role="progressbar"
            aria-label={`${badge.title} progress`}
            aria-valuemin={0}
            aria-valuemax={badge.target}
            aria-valuenow={badge.value}
            className="h-1.5 overflow-hidden rounded-full bg-[#0D181C]"
          >
            <div
              className="h-full rounded-full opacity-70"
              style={{ width: `${ratio * 100}%`, backgroundColor: tone.main }}
            />
          </div>
          <p className="mt-1.5 text-[11px] font-semibold text-[#60757E]">
            {badge.value}/{badge.target}
          </p>
        </div>
      )}
    </li>
  );
}

export function BadgeGrid({ badges }: { badges: ProfileBadge[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {badges.map((badge) => (
        <BadgeTile key={badge.id} badge={badge} />
      ))}
    </ul>
  );
}

/** Tiny medal used in the rail's badge collection preview. */
function MiniMedal({ badge }: { badge: ProfileBadge }) {
  const tone = TONES[badge.tone];
  const Icon = BADGE_ICONS[badge.icon];

  return (
    <li
      title={`${badge.title}${badge.earned ? ' (earned)' : ' (locked)'}`}
      className="flex h-8 w-8 items-center justify-center rounded-full"
      style={
        badge.earned
          ? {
              backgroundImage: `linear-gradient(to bottom, ${tone.from}, ${tone.to})`,
              boxShadow: `0 2px 0 ${tone.edge}`,
            }
          : { backgroundColor: '#202F35', boxShadow: '0 2px 0 #0D161A' }
      }
    >
      <Icon
        aria-hidden="true"
        className={`h-4 w-4 ${badge.earned ? 'text-white' : 'text-[#4F646D]'}`}
      />
      <span className="sr-only">
        {badge.title}: {badge.earned ? 'earned' : 'locked'}
      </span>
    </li>
  );
}

// -----------------------------------------------------------------------------
// Next badge card (journey sidebar)
// -----------------------------------------------------------------------------

export function NextBadgeCard({ badges }: { badges: ProfileBadge[] }) {
  const earnedCount = badges.filter((badge) => badge.earned).length;

  // Show the closest unearned milestone first.
  const next = [...badges]
    .filter((badge) => !badge.earned)
    .sort((a, b) => {
      const aProgress = a.value / Math.max(a.target, 1);
      const bProgress = b.value / Math.max(b.target, 1);
      return bProgress - aProgress;
    })[0];

  const ratio = next
    ? Math.min(1, Math.max(0, next.value / Math.max(next.target, 1)))
    : 1;

  // Show a limited preview in the sidebar; the full collection stays on Profile.
  const visibleBadges = badges.slice(0, 8);
  const remainingBadges = Math.max(0, badges.length - visibleBadges.length);

  const ringSize = 72;
  const ringStroke = 4;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringLength = 2 * Math.PI * ringRadius;

  return (
    <section className={cardClasses} aria-label="Badges">
      <div className="flex items-center justify-between gap-3">
        <h2 className={cardTitleClasses}>Badges</h2>
        <span className="text-xs font-bold text-[#91A4AC]">
          {earnedCount} of {badges.length} earned
        </span>
      </div>

      {next ? (
        <div className="mt-4 flex items-center gap-4">
          <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center">
            <svg
              viewBox={`0 0 ${ringSize} ${ringSize}`}
              className="absolute inset-0 h-full w-full -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                fill="none"
                stroke="#26373E"
                strokeWidth={ringStroke}
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                fill="none"
                stroke={TONES[next.tone].main}
                strokeWidth={ringStroke}
                strokeLinecap="round"
                strokeDasharray={ringLength}
                strokeDashoffset={ringLength * (1 - ratio)}
                className="transition-[stroke-dashoffset] duration-700 ease-out"
              />
            </svg>

            <BadgeMedal badge={next} size="md" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#78909A]">Next badge</p>
            <p className="text-sm font-extrabold text-white">{next.title}</p>
            <p className="mt-0.5 text-xs text-[#91A4AC]">
              {next.description}
            </p>

            <p
              className="mt-1 text-xs font-extrabold"
              style={{ color: TONES[next.tone].main }}
            >
              {next.value}/{next.target}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[#C8D3DA]">
          {badges.length > 0
            ? 'You’ve earned every badge. Legend!'
            : 'Your badge journey starts with your first lesson.'}
        </p>
      )}

      <ul
        className="mt-5 flex flex-wrap items-center gap-2"
        aria-label={`Badge collection: ${badges.length} badges`}
      >
        {visibleBadges.map((badge) => (
          <MiniMedal key={badge.id} badge={badge} />
        ))}

        {remainingBadges > 0 && (
          <li
            className="flex h-8 min-w-8 items-center justify-center rounded-full border border-[#37464F] bg-[#202F35] px-2 text-[10px] font-extrabold text-[#C8D3DA]"
            title={`${remainingBadges} more badges`}
            aria-label={`${remainingBadges} more badges`}
          >
            +{remainingBadges}
          </li>
        )}
      </ul>

      {badges.length > 0 && (
        <p className="mt-2 text-[11px] text-[#78909A]">
          {remainingBadges > 0
            ? `${visibleBadges.length} shown · ${remainingBadges} more to discover`
            : `${badges.length} badges to collect`}
        </p>
      )}

      <Link
        to="/profile"
        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-orange transition hover:text-white"
      >
        View all badges
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Month calendar of active days
// -----------------------------------------------------------------------------

const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function StreakCalendar({ stats }: { stats: GamificationStats }) {
  const [monthOffset, setMonthOffset] = useState(0);

  const todayKey = dayKey(new Date());

  const { monthStart, title, cells } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const daysInMonth = new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      0,
    ).getDate();

    // Monday-first grid.
    const leading = (start.getDay() + 6) % 7;

    return {
      monthStart: start,
      title: start.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
      cells: [
        ...Array.from({ length: leading }, () => null),
        ...Array.from({ length: daysInMonth }, (_, index) => {
          const date = new Date(
            start.getFullYear(),
            start.getMonth(),
            index + 1,
          );
          return { day: index + 1, key: dayKey(date) };
        }),
      ] as ({ day: number; key: string } | null)[],
    };
  }, [monthOffset]);

  const activeThisMonth = cells.filter(
    (cell) => cell !== null && stats.activeDays.has(cell.key),
  ).length;

  const earliest = stats.firstActivityAt;
  const canGoBack =
    earliest !== null &&
    monthStart >
      new Date(earliest.getFullYear(), earliest.getMonth(), 1);

  const navButtonClasses =
    'flex h-8 w-8 items-center justify-center rounded-lg text-[#91A4AC] transition hover:bg-[#26373E] hover:text-white disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange';

  return (
    <section className={cardClasses} aria-label="Activity calendar">
      <div className="flex items-center justify-between gap-2">
        <h2 className={cardTitleClasses}>{title}</h2>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            disabled={!canGoBack}
            onClick={() => setMonthOffset((value) => value - 1)}
            className={navButtonClasses}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label="Next month"
            disabled={monthOffset >= 0}
            onClick={() => setMonthOffset((value) => value + 1)}
            className={navButtonClasses}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-1.5 text-center">
        {WEEKDAY_INITIALS.map((initial, index) => (
          <span
            key={index}
            className="text-[11px] font-bold text-[#78909A]"
          >
            {initial}
          </span>
        ))}

        {cells.map((cell, index) => {
          if (cell === null) return <span key={`blank-${index}`} />;

          const active = stats.activeDays.has(cell.key);

          return (
            <span
              key={cell.key}
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                active
                  ? 'text-white'
                  : cell.key === todayKey
                    ? 'border-2 border-orange bg-orange/10 text-white'
                    : 'text-[#91A4AC]'
              }`}
              style={active ? activeDayStyle : undefined}
              aria-label={`${cell.key}${active ? ', lesson completed' : ''}`}
            >
              {cell.day}
            </span>
          );
        })}
      </div>

      <p className="mt-4 text-xs font-semibold text-[#78909A]">
        {activeThisMonth === 0
          ? 'No active days this month yet.'
          : `${activeThisMonth} active ${
              activeThisMonth === 1 ? 'day' : 'days'
            } this month`}
      </p>
    </section>
  );
}