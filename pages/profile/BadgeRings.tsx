import {
  Award,
  BookOpen,
  Check,
  Flame,
  Footprints,
  Medal,
  Star,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import type { Badge, BadgeIcon, BadgeTone } from '../../lib/gamification';

const ICONS: Record<BadgeIcon, LucideIcon> = {
  footprints: Footprints,
  book: BookOpen,
  medal: Medal,
  flame: Flame,
  trophy: Trophy,
  award: Award,
  star: Star,
  zap: Zap,
};

const TONE_COLORS: Record<BadgeTone, string> = {
  emerald: '#34D399',
  teal: '#2DD4BF',
  violet: '#A78BFA',
  orange: '#F4611F',
  gold: '#F59E0B',
  rose: '#FB7185',
  sun: '#FACC15',
  sky: '#38BDF8',
};

const SIZE = 88;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function BadgeRing({ badge }: { badge: Badge }) {
  const Icon = ICONS[badge.icon];
  const color = TONE_COLORS[badge.tone];
  const fraction = badge.target > 0 ? Math.min(badge.value / badge.target, 1) : 0;
  const progressLabel = `${badge.value}/${badge.target}`;

  return (
    <li className="min-w-0">
      <button
        type="button"
        aria-label={`${badge.title}. ${badge.description}. ${
          badge.earned ? 'Earned' : `Progress ${progressLabel}`
        }`}
        className="group relative flex w-full flex-col items-center rounded-2xl border-2 border-[#37464F] bg-[#19282E] px-2 pb-4 pt-5 text-center transition hover:border-[#536871] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
      >
        <span className="relative flex h-[88px] w-[88px] items-center justify-center">
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            aria-hidden="true"
            className="absolute inset-0 -rotate-90"
          >
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="#2D4149"
              strokeWidth={STROKE}
            />
            {fraction > 0 && (
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={color}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
              />
            )}
          </svg>

          <span
            aria-hidden="true"
            className="flex h-[58px] w-[58px] items-center justify-center rounded-full"
            style={{ backgroundColor: badge.earned ? `${color}26` : '#202F35' }}
          >
            <Icon
              className="h-7 w-7"
              style={{ color: badge.earned ? color : '#60757E' }}
            />
          </span>

          {badge.earned && (
            <span
              aria-hidden="true"
              className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#19282E]"
              style={{ backgroundColor: color }}
            >
              <Check className="h-3.5 w-3.5 text-[#131F24]" strokeWidth={4} />
            </span>
          )}
        </span>

        <span
          className={`mt-3 block w-full truncate text-sm font-extrabold ${
            badge.earned ? 'text-white' : 'text-[#C8D3DA]'
          }`}
        >
          {badge.title}
        </span>

        <span
          className="mt-0.5 block text-xs font-bold"
          style={{ color: badge.earned ? color : '#91A4AC' }}
        >
          {badge.earned ? 'Earned' : progressLabel}
        </span>

        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[210px] -translate-x-1/2 rounded-xl border border-[#37464F] bg-[#0D181C] px-3 py-2 text-xs font-semibold leading-5 text-white opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          {badge.description} · {progressLabel}
        </span>
      </button>
    </li>
  );
}

export default function BadgeRings({ badges }: { badges: Badge[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {badges.map((badge) => (
        <BadgeRing key={badge.id} badge={badge} />
      ))}
    </ul>
  );
}