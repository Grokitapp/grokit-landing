import { useId } from 'react';
import { Lock } from 'lucide-react';

import type { League } from '../../lib/leagues';

const SHIELD =
  'M40 4 L72 15 V44 C72 66 58 80 40 88 C22 80 8 66 8 44 V15 Z';

// The face is the same shield, a little smaller, so the rim shows as a bevel.
const FACE_TRANSFORM = 'translate(40 47) scale(0.8) translate(-40 -47)';

const GEM = 'M27 38 L34 29 H46 L53 38 L40 59 Z';
const GEM_FACETS = ['M27 38 H53', 'M34 29 L40 38 L46 29', 'M34 38 L40 59', 'M46 38 L40 59'];

/** Rank chevrons (Bronze 1, Silver 2, Gold 3). */
function Chevrons({ count, stroke, opacity }: { count: number; stroke: string; opacity: number }) {
  return (
    <g fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity={opacity}>
      {Array.from({ length: count }, (_, index) => {
        const y = 47 - (count - 1) * 6 - 6 + index * 12;

        return <polyline key={index} points={`28,${y} 40,${y + 11} 52,${y}`} />;
      })}
    </g>
  );
}

function Gem({ stroke, fill, opacity }: { stroke: string; fill: string; opacity: number }) {
  return (
    <g opacity={opacity}>
      <path d={GEM} fill={fill} />
      {GEM_FACETS.map((facet) => (
        <path key={facet} d={facet} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" opacity="0.55" />
      ))}
    </g>
  );
}

function Sparkle({ x, y, size, fill }: { x: number; y: number; size: number; fill: string }) {
  const d = `M${x} ${y - size} L${x + size * 0.28} ${y - size * 0.28} L${x + size} ${y} L${x + size * 0.28} ${y + size * 0.28} L${x} ${y + size} L${x - size * 0.28} ${y + size * 0.28} L${x - size} ${y} L${x - size * 0.28} ${y - size * 0.28} Z`;

  return <path d={d} fill={fill} />;
}

const CHEVRON_COUNT: Record<string, number> = { bronze: 1, silver: 2, gold: 3 };

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
  const height = (size * 96) / 80;

  const light = locked ? '#41555E' : league.light;
  const color = locked ? '#2E4048' : league.color;
  const rim = locked ? '#1C2A30' : league.rim;
  const glyph = locked ? '#8FA5AE' : '#FFFFFF';
  const glyphOpacity = locked ? 0.22 : 1;

  const chevrons = CHEVRON_COUNT[league.id];
  const isDiamond = league.id === 'diamond';

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height }}
    >
      {glow && !locked && (
        <span
          aria-hidden="true"
          className="absolute rounded-full blur-2xl"
          style={{
            inset: '-18%',
            backgroundColor: league.color,
            opacity: 0.38,
          }}
        />
      )}

      <svg
        width={size}
        height={height}
        viewBox="0 0 80 96"
        role="img"
        aria-label={`${league.name} league${locked ? ' (locked)' : ''}`}
        className="relative"
      >
        <defs>
          <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={light} />
            <stop offset="1" stopColor={rim} />
          </linearGradient>
          <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={light} />
            <stop offset="0.55" stopColor={color} />
            <stop offset="1" stopColor={rim} />
          </linearGradient>
          <clipPath id={`${id}-clip`}>
            <path d={SHIELD} transform={FACE_TRANSFORM} />
          </clipPath>
        </defs>

        {/* Soft shadow under the shield */}
        <path d={SHIELD} fill="#000" opacity="0.3" transform="translate(0 4)" />

        {/* Bevelled rim */}
        <path d={SHIELD} fill={`url(#${id}-rim)`} />
        <path d={SHIELD} fill="none" stroke="#fff" strokeOpacity={locked ? 0.05 : 0.35} strokeWidth="1.2" />

        {/* Face */}
        <path d={SHIELD} fill={`url(#${id}-face)`} transform={FACE_TRANSFORM} />

        {/* Shine across the top of the face */}
        <g clipPath={`url(#${id}-clip)`}>
          <path
            d="M0 0 H80 V38 C58 30 22 30 0 46 Z"
            fill="#fff"
            opacity={locked ? 0.04 : 0.2}
          />
        </g>

        {/* Symbol */}
        {chevrons ? (
          <Chevrons count={chevrons} stroke={glyph} opacity={glyphOpacity} />
        ) : (
          <>
            <Gem stroke={rim} fill={glyph} opacity={glyphOpacity} />
            {isDiamond && (
              <>
                <Sparkle x={58} y={26} size={6} fill={glyph} />
                <Sparkle x={23} y={64} size={4.5} fill={glyph} />
              </>
            )}
          </>
        )}
      </svg>

      {locked && (
        <span
          aria-hidden="true"
          className="absolute bottom-[10%] right-[6%] flex items-center justify-center rounded-full border border-[#37464F] bg-[#131F24]"
          style={{ width: size * 0.34, height: size * 0.34 }}
        >
          <Lock className="text-[#91A4AC]" style={{ width: size * 0.18, height: size * 0.18 }} />
        </span>
      )}
    </span>
  );
}