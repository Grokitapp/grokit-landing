import { useId } from 'react';
import { Lock } from 'lucide-react';

import type { League } from '../../lib/leagues';

const SHIELD =
  'M32 3 L58 13 V35 C58 51 46 63 32 69 C18 63 6 51 6 35 V13 Z';

// A five-point star centred in the shield.
const STAR = Array.from({ length: 10 }, (_, index) => {
  const radius = index % 2 === 0 ? 12 : 5;
  const angle = (Math.PI / 5) * index - Math.PI / 2;

  return `${(32 + radius * Math.cos(angle)).toFixed(2)},${(
    36 +
    radius * Math.sin(angle)
  ).toFixed(2)}`;
}).join(' ');

export default function LeagueEmblem({
  league,
  size = 48,
  locked = false,
  glow = false,
}: {
  league: League;
  size?: number;
  /** A league the learner hasn't reached yet. */
  locked?: boolean;
  /** Soft coloured glow behind the emblem (current league). */
  glow?: boolean;
}) {
  const id = useId().replace(/:/g, '');

  const light = locked ? '#3A4D56' : league.light;
  const color = locked ? '#2A3C44' : league.color;
  const rim = locked ? '#1B2A31' : league.rim;

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: (size * 72) / 64,
        filter:
          glow && !locked ? `drop-shadow(0 0 ${size * 0.22}px ${league.color}88)` : undefined,
      }}
    >
      <svg
        width={size}
        height={(size * 72) / 64}
        viewBox="0 0 64 72"
        role="img"
        aria-label={`${league.name} league${locked ? ' (locked)' : ''}`}
      >
        <defs>
          <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={light} />
            <stop offset="1" stopColor={color} />
          </linearGradient>
        </defs>

        <path d={SHIELD} fill={rim} />
        <path
          d={SHIELD}
          fill={`url(#${id}-face)`}
          transform="translate(32 34) scale(0.84) translate(-32 -36)"
        />

        {!locked && <polygon points={STAR} fill="#FFFFFF" fillOpacity="0.92" />}
      </svg>

      {locked && (
        <Lock
          aria-hidden="true"
          className="absolute text-[#60757E]"
          style={{ width: size * 0.32, height: size * 0.32 }}
        />
      )}
    </span>
  );
}