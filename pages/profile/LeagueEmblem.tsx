import { useId, type ReactNode } from 'react';
import { Lock } from 'lucide-react';

import { LEAGUES, type League } from '../../lib/leagues';

/**
 * League badges: a chunky, raised plate with a symbol from the ocean.
 *
 * The plate shape steps up every two leagues, and each league has its own
 * symbol, so a badge is recognisable by shape, colour and symbol:
 *
 *   Tidepool  pebble    drop
 *   Shallows  pebble    waves
 *   Reef      shield    coral
 *   Lagoon    shield    shell
 *   Current   hexagon   swirl
 *   Deep      hexagon   anchor
 *   Abyss     octagon   jellyfish
 *   Kraken    octagon   octopus, with a crown (top league)
 */

type Plate = 'pebble' | 'shield' | 'hex' | 'octagon';

const PLATE_BY_TIER: Plate[] = [
  'pebble',
  'pebble',
  'shield',
  'shield',
  'hex',
  'hex',
  'octagon',
  'octagon',
];

const CX = 50;
const CY = 46;

/** Points of a regular polygon around the badge centre. */
function ngon(sides: number, radius: number, startDeg: number): string {
  return Array.from({ length: sides }, (_, index) => {
    const angle = ((startDeg + (360 / sides) * index) * Math.PI) / 180;

    return `${(CX + radius * Math.cos(angle)).toFixed(1)},${(CY + radius * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');
}

function polygonPath(points: string): string {
  return `M${points.split(' ').join(' L')} Z`;
}

// Each plate is a path with a thick, round-joined stroke in the same colour,
// which is what rounds its corners. `width` is that stroke width.
const PLATES: Record<Plate, { d: string; width: number }> = {
  pebble: { d: 'M24 20 H76 V72 H24 Z', width: 32 },
  shield: { d: 'M18 21 L34 19 L50 11 L66 19 L82 21 L82 49 L70 67 L50 81 L30 67 L18 49 Z', width: 12 },
  hex: { d: polygonPath(ngon(6, 34, -90)), width: 14 },
  octagon: { d: polygonPath(ngon(8, 37, -67.5)), width: 12 },
};

const LIP = 8; // thickness of the raised edge

function PlateShape({ plate, fill }: { plate: Plate; fill: string }) {
  const { d, width } = PLATES[plate];

  return <path d={d} fill={fill} stroke={fill} strokeWidth={width} strokeLinejoin="round" />;
}

// -----------------------------------------------------------------------------
// Symbols (all drawn around the badge centre, about 44 units wide)
// -----------------------------------------------------------------------------

const RIDGES: [number, number][] = [
  [50, 35],
  [41.2, 36.8],
  [58.8, 36.8],
  [33.7, 41.7],
  [66.3, 41.7],
];

function Symbol({ tier, ink, accent }: { tier: number; ink: string; accent: string }) {
  const line = { fill: 'none', stroke: ink, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

  switch (tier) {
    case 0: // drop
      return (
        <g>
          <path d="M50 26 C57 35 66 42 66 51 A16 16 0 0 1 34 51 C34 42 43 35 50 26 Z" fill={ink} />
          <path d="M42 52 A8 8 0 0 0 49 59" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 1: // waves
      return (
        <g {...line} strokeWidth="6.5">
          <path d="M28 39 Q34 31 40 39 T52 39 T64 39 T72 39" />
          <path d="M28 53 Q34 45 40 53 T52 53 T64 53 T72 53" />
        </g>
      );
    case 2: // coral
      return (
        <g>
          <g {...line} strokeWidth="7">
            <path d="M50 68 V32 M50 58 L34 42 M50 50 L66 34 M38 68 H62" />
          </g>
          <circle cx="50" cy="30" r="4.5" fill={ink} />
          <circle cx="34" cy="40" r="4.5" fill={ink} />
          <circle cx="66" cy="32" r="4.5" fill={ink} />
        </g>
      );
    case 3: // shell
      return (
        <g transform="translate(0 -4)">
          <path d="M27 58 A23 23 0 0 1 73 58 Z" fill={ink} />
          <rect x="41" y="60" width="18" height="6" rx="3" fill={ink} />
          <g stroke={accent} strokeWidth="2.6" strokeLinecap="round">
            {RIDGES.map(([x, y]) => (
              <line key={`${x}-${y}`} x1="50" y1="58" x2={x} y2={y} />
            ))}
          </g>
        </g>
      );
    case 4: // swirl
      return (
        <path
          {...line}
          strokeWidth="6"
          d="M47 46 A4 4 0 0 1 55 46 A8 8 0 0 1 39 46 A12 12 0 0 1 63 46 A16 16 0 0 1 31 46 A20 20 0 0 1 71 46"
        />
      );
    case 5: // anchor
      return (
        <g {...line} strokeWidth="6.5">
          <circle cx="50" cy="30" r="5" />
          <path d="M50 35 V66 M39 44 H61 M30 54 C33 70 67 70 70 54" />
        </g>
      );
    case 6: // jellyfish
      return (
        <g>
          <path d="M31 44 A19 19 0 0 1 69 44 Q60 48 50 45 Q40 48 31 44 Z" fill={ink} />
          <g {...line} strokeWidth="4.5">
            {[38, 46, 54, 62].map((x) => (
              <path key={x} d={`M${x} 50 q -4 5 0 10 t 0 10`} />
            ))}
          </g>
          <circle cx="50" cy="32" r="2.4" fill={accent} />
          <circle cx="42" cy="38" r="2.4" fill={accent} />
          <circle cx="58" cy="38" r="2.4" fill={accent} />
        </g>
      );
    default: // octopus
      return (
        <g>
          <path
            d="M30 44 C30 28 40 24 50 24 C60 24 70 28 70 44 C70 49 66 52 62 52 H38 C34 52 30 49 30 44 Z"
            fill={ink}
          />
          <g {...line} strokeWidth="6">
            <path d="M35 51 C33 61 27 63 25 59" />
            <path d="M44 52 C44 62 38 68 34 66" />
            <path d="M56 52 C56 62 62 68 66 66" />
            <path d="M65 51 C67 61 73 63 75 59" />
          </g>
          <circle cx="42" cy="40" r="4" fill={accent} />
          <circle cx="58" cy="40" r="4" fill={accent} />
          <circle cx="42.8" cy="40.6" r="1.8" fill={ink} />
          <circle cx="58.8" cy="40.6" r="1.8" fill={ink} />
        </g>
      );
  }
}

function Sparkle({ x, y, size }: { x: number; y: number; size: number }) {
  const k = size * 0.28;

  return (
    <path
      d={`M${x} ${y - size} L${x + k} ${y - k} L${x + size} ${y} L${x + k} ${y + k} L${x} ${y + size} L${x - k} ${y + k} L${x - size} ${y} L${x - k} ${y - k} Z`}
      fill="#fff"
    />
  );
}

const CROWN = 'M33 17 L30 1 L41 9 L50 -5 L59 9 L70 1 L67 17 Z';

// -----------------------------------------------------------------------------
// Badge
// -----------------------------------------------------------------------------

export default function LeagueEmblem({
  league,
  size = 56,
  locked = false,
  glow = false,
}: {
  league: League;
  /** Width of the badge in pixels. The height follows. */
  size?: number;
  /** A league the learner hasn't reached yet. */
  locked?: boolean;
  /** Soft coloured glow behind the badge (the current league). */
  glow?: boolean;
}): ReactNode {
  const id = useId().replace(/:/g, '');
  const tier = Math.max(0, LEAGUES.findIndex((item) => item.id === league.id));
  const plate = PLATE_BY_TIER[tier];
  const top = tier === LEAGUES.length - 1;

  const light = locked ? '#4C616B' : league.light;
  const color = locked ? '#3A4D56' : league.color;
  const rim = locked ? '#24343B' : league.rim;
  const ink = locked ? '#1D2B31' : league.rim;
  const accent = locked ? '#3A4D56' : league.light;

  const height = (size * 108) / 100;
  const { d, width } = PLATES[plate];

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height }}
    >
      {glow && !locked && (
        <span
          aria-hidden="true"
          className="absolute rounded-full blur-2xl"
          style={{ inset: '12%', backgroundColor: league.color, opacity: 0.42 }}
        />
      )}

      <svg
        width={size}
        height={height}
        viewBox="0 -6 100 108"
        role="img"
        aria-label={`${league.name} league${locked ? ' (locked)' : ''}`}
        className="relative"
      >
        <defs>
          <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={light} />
            <stop offset="0.65" stopColor={color} />
          </linearGradient>
          <linearGradient id={`${id}-crown`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFF1B8" />
            <stop offset="1" stopColor="#F5B62E" />
          </linearGradient>
          <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="0" y="-6" width="100" height="108">
            <path d={d} fill="#fff" stroke="#fff" strokeWidth={width} strokeLinejoin="round" />
          </mask>
        </defs>

        {/* Raised edge */}
        <g transform={`translate(0 ${LIP})`}>
          <PlateShape plate={plate} fill={rim} />
        </g>

        {/* Face */}
        <PlateShape plate={plate} fill={`url(#${id}-face)`} />

        {/* Soft diagonal shine */}
        <g mask={`url(#${id}-mask)`} opacity={locked ? 0.4 : 1}>
          <path d="M-10 40 L44 -14 L64 -14 L-10 60 Z" fill="#fff" opacity="0.18" />
          <path d="M-10 74 L78 -14 L88 -14 L-10 84 Z" fill="#fff" opacity="0.1" />
        </g>

        {/* Recessed centre */}
        <g transform={`translate(${CX} ${CY}) scale(0.72) translate(${-CX} ${-CY})`}>
          <path d={d} fill={rim} fillOpacity="0.24" stroke={rim} strokeOpacity="0.24" strokeWidth={width} strokeLinejoin="round" />
        </g>

        {/* Symbol, with a light edge underneath so it looks pressed in */}
        <g opacity={locked ? 0.7 : 1}>
          <g transform="translate(0 2.5)" opacity="0.5">
            <Symbol tier={tier} ink={locked ? '#6A808A' : '#fff'} accent={locked ? '#6A808A' : '#fff'} />
          </g>
          <Symbol tier={tier} ink={ink} accent={accent} />
        </g>

        {/* Top league: crown and sparkles */}
        {top && !locked && (
          <g>
            <path d={CROWN} fill={`url(#${id}-crown)`} stroke="#A8680A" strokeWidth="1.6" strokeLinejoin="round" />
            <circle cx="50" cy="12" r="2.6" fill="#FF8A1F" stroke="#fff" strokeWidth="0.8" />
            <Sparkle x={10} y={20} size={6} />
            <Sparkle x={91} y={30} size={4.5} />
            <Sparkle x={90} y={80} size={3.5} />
          </g>
        )}
      </svg>

      {locked && (
        <span
          aria-hidden="true"
          className="absolute bottom-[6%] right-[4%] flex items-center justify-center rounded-full border border-[#37464F] bg-[#131F24]"
          style={{ width: size * 0.32, height: size * 0.32 }}
        >
          <Lock className="text-[#91A4AC]" style={{ width: size * 0.17, height: size * 0.17 }} />
        </span>
      )}
    </span>
  );
}