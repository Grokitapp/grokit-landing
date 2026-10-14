import { useId } from 'react';
import { Lock } from 'lucide-react';

import { LEAGUES, type League } from '../../lib/leagues';

/**
 * One shield for every league. The silhouette never changes; each tier adds
 * something, so progress reads at a glance:
 *
 *   Bronze    one chevron
 *   Silver    two chevrons
 *   Gold      three chevrons + wings
 *   Sapphire  gem + fuller wings
 *   Ruby      + small crown
 *   Emerald   + full wings
 *   Amethyst  + royal crown and a halo
 *   Diamond   + jewelled crown and sparkles
 */

interface TierArt {
  chevrons: number;
  wings: 0 | 1 | 2 | 3;
  crown: 0 | 3 | 5;
  halo: boolean;
  sparkle: boolean;
}

const TIER_ART: TierArt[] = [
  { chevrons: 1, wings: 0, crown: 0, halo: false, sparkle: false },
  { chevrons: 2, wings: 0, crown: 0, halo: false, sparkle: false },
  { chevrons: 3, wings: 1, crown: 0, halo: false, sparkle: false },
  { chevrons: 0, wings: 2, crown: 0, halo: false, sparkle: false },
  { chevrons: 0, wings: 2, crown: 3, halo: false, sparkle: false },
  { chevrons: 0, wings: 3, crown: 3, halo: false, sparkle: false },
  { chevrons: 0, wings: 3, crown: 5, halo: true, sparkle: false },
  { chevrons: 0, wings: 3, crown: 5, halo: true, sparkle: true },
];

// The canvas is 120 x 124. The shield (80 x 96) sits inside it at (20, 22),
// leaving room for wings at the sides, a crown on top and a halo around it.
const CANVAS_H = 124;
const SHIELD_W = 64; // visible width of the shield, used to size the emblem

const SHIELD = 'M40 4 L72 15 V44 C72 66 58 80 40 88 C22 80 8 66 8 44 V15 Z';
const FACE_TRANSFORM = 'translate(40 47) scale(0.8) translate(-40 -47)';

const GEM = 'M27 38 L34 29 H46 L53 38 L40 59 Z';
const GEM_FACETS = ['M27 38 H53', 'M34 29 L40 38 L46 29', 'M34 38 L40 59', 'M46 38 L40 59'];

// Right-hand wing feathers (canvas coordinates). The left wing is a mirror.
const FEATHER_TOP = 'M90 58 C98 44 108 38 117 36 C114 48 104 58 90 66 Z';
const FEATHER_MID = 'M90 66 C98 56 107 52 115 52 C112 62 103 70 90 76 Z';
const FEATHER_LOW = 'M90 76 C97 69 104 66 111 67 C108 75 100 81 90 85 Z';
const WING_SETS: string[][] = [
  [],
  [FEATHER_MID],
  [FEATHER_MID, FEATHER_LOW],
  [FEATHER_TOP, FEATHER_MID, FEATHER_LOW],
];

const CROWN_3 = 'M46 31 L44 18 L52 24 L60 12 L68 24 L76 18 L74 31 Z';
const CROWN_5 = 'M38 31 L36 20 L44 26 L49 15 L55 24 L60 9 L65 24 L71 15 L76 26 L84 20 L82 31 Z';
const CROWN_5_JEWELS: [number, number][] = [
  [36, 20],
  [49, 15],
  [60, 9],
  [71, 15],
  [84, 20],
];

function Chevrons({ count, color, shadow }: { count: number; color: string; shadow: string }) {
  const lines = Array.from({ length: count }, (_, index) => {
    const y = 47 - (count - 1) * 6 - 6 + index * 12;

    return `28,${y} 40,${y + 11} 52,${y}`;
  });

  return (
    <g fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      <g stroke={shadow} opacity="0.55" transform="translate(0 2.5)">
        {lines.map((points) => (
          <polyline key={points} points={points} />
        ))}
      </g>
      <g stroke={color}>
        {lines.map((points) => (
          <polyline key={points} points={points} />
        ))}
      </g>
    </g>
  );
}

function Gem({ fill, shadow, facet }: { fill: string; shadow: string; facet: string }) {
  return (
    <g>
      <path d={GEM} fill={shadow} opacity="0.5" transform="translate(0 2.5)" />
      <path d={GEM} fill={fill} />
      {GEM_FACETS.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke={facet}
          strokeWidth="1.6"
          strokeLinejoin="round"
          opacity="0.55"
        />
      ))}
    </g>
  );
}

function Sparkle({ x, y, size, fill }: { x: number; y: number; size: number; fill: string }) {
  const s = size;
  const k = size * 0.28;
  const d = `M${x} ${y - s} L${x + k} ${y - k} L${x + s} ${y} L${x + k} ${y + k} L${x} ${y + s} L${x - k} ${y + k} L${x - s} ${y} L${x - k} ${y - k} Z`;

  return <path d={d} fill={fill} />;
}

function Wing({ count, fill, stroke }: { count: 0 | 1 | 2 | 3; fill: string; stroke: string }) {
  return (
    <g fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round">
      {WING_SETS[count].map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  );
}

export default function LeagueEmblem({
  league,
  size = 48,
  locked = false,
  glow = false,
}: {
  league: League;
  /** Width of the shield in pixels. Wings and crown are drawn around it. */
  size?: number;
  /** A league the learner hasn't reached yet. */
  locked?: boolean;
  /** Soft coloured glow behind the emblem (current league). */
  glow?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const tier = Math.max(0, LEAGUES.findIndex((item) => item.id === league.id));
  const art = TIER_ART[tier];

  const light = locked ? '#41555E' : league.light;
  const color = locked ? '#2E4048' : league.color;
  const rim = locked ? '#1C2A30' : league.rim;
  const glyph = locked ? '#6F858E' : '#FFFFFF';

  // Crop the canvas to what this tier actually draws so small emblems stay tight.
  const wide = art.wings > 0;
  const vbX = wide ? 0 : 22;
  const vbW = wide ? 120 : 76;
  const vbY = art.crown > 0 ? 4 : 20;
  const vbH = CANVAS_H - vbY;

  const scale = size / SHIELD_W;
  const width = vbW * scale;
  const height = vbH * scale;

  const ref = (name: string) => `url(#${id}-${name})`;

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width, height }}
    >
      {glow && !locked && (
        <span
          aria-hidden="true"
          className="absolute rounded-full blur-2xl"
          style={{ inset: '8% 12%', backgroundColor: league.color, opacity: 0.4 }}
        />
      )}

      <svg
        width={width}
        height={height}
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
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
          <linearGradient id={`${id}-wing`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={color} />
            <stop offset="1" stopColor={rim} />
          </linearGradient>
          <linearGradient id={`${id}-crown`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={locked ? light : '#FFF1B8'} />
            <stop offset="0.5" stopColor={locked ? color : '#FFC83D'} />
            <stop offset="1" stopColor={locked ? rim : '#B8801A'} />
          </linearGradient>
          <linearGradient id={`${id}-gem`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={locked ? glyph : '#FFFFFF'} />
            <stop offset="1" stopColor={locked ? glyph : light} />
          </linearGradient>
          <clipPath id={`${id}-clip`}>
            <path d={SHIELD} transform={FACE_TRANSFORM} />
          </clipPath>
        </defs>

        {/* Halo (top tiers) */}
        {art.halo && (
          <g fill="none" stroke={light} strokeLinecap="round" opacity={locked ? 0.15 : 0.6}>
            <circle cx="60" cy="68" r="55" strokeWidth="1" opacity="0.4" />
            <circle cx="60" cy="68" r="55" strokeWidth="2" strokeDasharray="0.5 7" />
          </g>
        )}

        {/* Wings sit behind the shield */}
        {art.wings > 0 && (
          <g opacity={locked ? 0.45 : 1}>
            <Wing count={art.wings} fill={ref('wing')} stroke={rim} />
            <g transform="translate(120 0) scale(-1 1)">
              <Wing count={art.wings} fill={ref('wing')} stroke={rim} />
            </g>
          </g>
        )}

        <g transform="translate(20 22)">
          {/* Soft shadow under the shield */}
          <path d={SHIELD} fill="#000" opacity="0.3" transform="translate(0 4)" />

          {/* Bevelled rim */}
          <path d={SHIELD} fill={ref('rim')} />
          <path d={SHIELD} fill="none" stroke="#fff" strokeOpacity={locked ? 0.05 : 0.35} strokeWidth="1.2" />

          {/* Face */}
          <path d={SHIELD} fill={ref('face')} transform={FACE_TRANSFORM} />
          <path
            d={SHIELD}
            fill="none"
            stroke="#fff"
            strokeOpacity={locked ? 0.04 : 0.22}
            strokeWidth="0.8"
            transform="translate(40 47) scale(0.7) translate(-40 -47)"
          />

          {/* Shine across the top of the face */}
          <g clipPath={`url(#${id}-clip)`}>
            <path d="M0 0 H80 V38 C58 30 22 30 0 46 Z" fill="#fff" opacity={locked ? 0.04 : 0.2} />
          </g>

          {/* Symbol */}
          <g opacity={locked ? 0.5 : 1}>
            {art.chevrons > 0 ? (
              <Chevrons count={art.chevrons} color={glyph} shadow={rim} />
            ) : (
              <Gem fill={ref('gem')} shadow={rim} facet={rim} />
            )}
          </g>
        </g>

        {/* Crown sits over the top edge of the shield */}
        {art.crown > 0 && (
          <g opacity={locked ? 0.5 : 1}>
            <path
              d={art.crown === 5 ? CROWN_5 : CROWN_3}
              fill={ref('crown')}
              stroke={locked ? rim : '#8A5A0F'}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            {art.crown === 5 &&
              CROWN_5_JEWELS.map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill={locked ? glyph : league.light} stroke="#fff" strokeWidth="0.8" />
              ))}
          </g>
        )}

        {/* Sparkles (Diamond) */}
        {art.sparkle && !locked && (
          <g>
            <Sparkle x={101} y={30} size={6} fill="#fff" />
            <Sparkle x={15} y={44} size={4.5} fill="#fff" />
            <Sparkle x={96} y={96} size={3.5} fill="#fff" />
          </g>
        )}
      </svg>

      {locked && (
        <span
          aria-hidden="true"
          className="absolute bottom-[8%] right-[10%] flex items-center justify-center rounded-full border border-[#37464F] bg-[#131F24]"
          style={{ width: size * 0.44, height: size * 0.44 }}
        >
          <Lock className="text-[#91A4AC]" style={{ width: size * 0.24, height: size * 0.24 }} />
        </span>
      )}
    </span>
  );
}