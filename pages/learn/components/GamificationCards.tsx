import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  Award,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Footprints,
  Lock,
  Medal,
  Star,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';

import {
  GOAL_OPTIONS,
  dayKey,
  type Badge,
  type BadgeIcon,
  type GamificationStats,
} from '../../../lib/gamification';

// -----------------------------------------------------------------------------
// Shared styles
// -----------------------------------------------------------------------------

export const cardClasses =
  'rounded-2xl border border-[#37464F] bg-[#19282E] p-5';

const cardTitleClasses = 'font-display text-lg font-extrabold text-white';

const iconMap: Record<BadgeIcon, typeof Award> = {
  footprints: Footprints,
  book: BookOpen,
  medal: Medal,
  flame: Flame,
  trophy: Trophy,
  award: Award,
  star: Star,
  zap: Zap,
  target: Target,
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
  const message =
    stats.currentStreak === 0
      ? 'Finish a lesson today to start a streak.'
      : stats.streakActiveToday
        ? 'You’re on a roll. See you tomorrow!'
        : 'Finish a lesson today to keep it going.';

  return (
    <section className={cardClasses} aria-label="Day streak">
      <div className="flex items-center gap-3">
        <Flame
          aria-hidden="true"
          className={`h-10 w-10 shrink-0 ${
            stats.currentStreak > 0
              ? 'fill-orange text-orange'
              : 'text-[#60757E]'
          }`}
        />

        <div className="min-w-0">
          <p className="font-display text-2xl font-extrabold leading-none text-white">
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
              className={`flex h-7 w-7 items-center justify-center rounded-full ${
                day.active
                  ? 'bg-orange text-white'
                  : day.isToday
                    ? 'border-2 border-orange'
                    : 'bg-[#202F35]'
              }`}
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
// Daily goal card
// -----------------------------------------------------------------------------

function GoalRing({ value, goal }: { value: number; goal: number }) {
  const size = 112;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = goal > 0 ? Math.min(1, value / goal) : 0;
  const done = value >= goal;

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#26373E"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={done ? '#34D399' : '#F4611F'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {done ? (
          <Check
            className="h-9 w-9 text-emerald-300"
            strokeWidth={3}
            aria-hidden="true"
          />
        ) : (
          <>
            <span className="font-display text-xl font-extrabold leading-none text-white">
              {Math.min(value, goal)}/{goal}
            </span>
            <span className="mt-1 text-xs font-semibold text-[#91A4AC]">
              XP
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function DailyGoalCard({
  stats,
  onChangeGoal,
}: {
  stats: GamificationStats;
  /** When provided, the goal can be changed right on the card. */
  onChangeGoal?: (goal: number) => void;
}) {
  const remaining = Math.max(0, stats.goal - stats.todayXp);

  return (
    <section className={cardClasses} aria-label="Daily goal">
      <h2 className={cardTitleClasses}>Today’s goal</h2>

      <div className="mt-4 flex items-center gap-5">
        <GoalRing value={stats.todayXp} goal={stats.goal} />

        <p className="min-w-0 text-sm leading-6 text-[#C8D3DA]">
          {stats.goalMet
            ? 'Goal complete! Nice work today.'
            : stats.todayXp === 0
              ? `Earn ${stats.goal} XP today. Each lesson is worth 10.`
              : `${remaining} XP to go. Almost there.`}
        </p>
      </div>

      {onChangeGoal ? (
        <div className="mt-5">
          <p className="text-xs font-semibold text-[#91A4AC]">
            Daily XP goal
          </p>

          <div className="mt-2 grid grid-cols-4 gap-2" role="radiogroup" aria-label="Daily XP goal">
            {GOAL_OPTIONS.map((option) => {
              const selected = option === stats.goal;

              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChangeGoal(option)}
                  className={`min-h-10 rounded-xl border-2 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange ${
                    selected
                      ? 'border-orange bg-orange/10 text-orange'
                      : 'border-[#37464F] text-[#C8D3DA] hover:border-[#536871]'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <Link
          to="/profile"
          className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-orange transition hover:text-white"
        >
          Change goal
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------
// Badges
// -----------------------------------------------------------------------------

export function BadgeTile({ badge }: { badge: Badge }) {
  const Icon = iconMap[badge.icon];
  const ratio = badge.target > 0 ? badge.value / badge.target : 0;

  return (
    <li
      className={`flex flex-col items-center rounded-2xl border p-4 text-center ${
        badge.earned
          ? 'border-orange/30 bg-orange/[0.06]'
          : 'border-[#2D3C43] bg-[#16242A]'
      }`}
    >
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-full ${
          badge.earned
            ? 'bg-gradient-to-b from-[#FF8A3D] to-orange text-white shadow-[0_4px_0_#C94713]'
            : 'bg-[#202F35] text-[#60757E] shadow-[0_4px_0_#0D161A]'
        }`}
      >
        {badge.earned ? (
          <Icon className="h-7 w-7" aria-hidden="true" />
        ) : (
          <Lock className="h-6 w-6" aria-hidden="true" />
        )}
      </span>

      <p
        className={`mt-3 font-display text-sm font-extrabold ${
          badge.earned ? 'text-white' : 'text-[#91A4AC]'
        }`}
      >
        {badge.title}
      </p>

      <p className="mt-1 text-xs leading-5 text-[#78909A]">
        {badge.description}
      </p>

      {badge.earned ? (
        <p className="mt-2 text-xs font-bold text-orange">Earned</p>
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
              className="h-full rounded-full bg-orange"
              style={{ width: `${ratio * 100}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] font-semibold text-[#78909A]">
            {badge.value}/{badge.target}
          </p>
        </div>
      )}
    </li>
  );
}

export function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {badges.map((badge) => (
        <BadgeTile key={badge.id} badge={badge} />
      ))}
    </ul>
  );
}

/** The closest unearned badge, shown in the journey page rail. */
export function NextBadgeCard({ badges }: { badges: Badge[] }) {
  const earnedCount = badges.filter((badge) => badge.earned).length;

  const next = badges
    .filter((badge) => !badge.earned)
    .sort((a, b) => b.value / b.target - a.value / a.target)[0];

  const Icon = next ? iconMap[next.icon] : Trophy;

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
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#202F35] text-[#91A4AC] shadow-[0_4px_0_#0D161A]">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-white">{next.title}</p>
            <p className="mt-0.5 text-xs text-[#91A4AC]">{next.description}</p>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#0D181C]">
              <div
                className="h-full rounded-full bg-orange"
                style={{ width: `${(next.value / next.target) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[#C8D3DA]">
          You’ve earned every badge. Legend!
        </p>
      )}

      <Link
        to="/profile"
        className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-orange transition hover:text-white"
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
          const date = new Date(start.getFullYear(), start.getMonth(), index + 1);
          return { day: index + 1, key: dayKey(date) };
        }),
      ] as ({ day: number; key: string } | null)[],
    };
  }, [monthOffset]);

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

        {cells.map((cell, index) =>
          cell === null ? (
            <span key={`blank-${index}`} />
          ) : (
            <span
              key={cell.key}
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                stats.activeDays.has(cell.key)
                  ? 'bg-orange text-white'
                  : cell.key === todayKey
                    ? 'border-2 border-orange text-white'
                    : 'text-[#91A4AC]'
              }`}
              aria-label={`${cell.key}${
                stats.activeDays.has(cell.key) ? ', lesson completed' : ''
              }`}
            >
              {cell.day}
            </span>
          ),
        )}
      </div>
    </section>
  );
}