import { useId, useMemo, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import {
  parseNumeric,
  type Visual,
} from '../../../amplify/functions/shared/lesson-content';
import { COLORS, TINTS } from './lessonTheme';

/**
 * Draws a lesson visual from plain data (no images, no model-written SVG), so
 * every visual matches the app's look and can never contain unsafe markup.
 */

export default function LessonVisual({ visual }: { visual: Visual }) {
  let body: ReactNode = null;

  switch (visual.type) {
    case 'stats':
      body = <StatsVisual visual={visual} />;
      break;
    case 'cycle':
      body = <CycleVisual visual={visual} />;
      break;
    case 'line':
    case 'bar':
      body = <ChartVisual visual={visual} />;
      break;
    case 'compare':
      body = <CompareVisual visual={visual} />;
      break;
    case 'steps':
      body = <StepsVisual visual={visual} />;
      break;
  }

  if (!body) return null;

  return (
    <figure className="my-6 rounded-3xl border border-[#2C3E4A] bg-[#18252C] p-4 sm:p-6">
      {visual.title && (
        <figcaption className="mb-4 text-center font-display text-[17px] font-bold text-white">
          {visual.title}
        </figcaption>
      )}
      {body}
      {visual.caption && (
        <p className="mx-auto mt-4 max-w-md text-center text-sm font-semibold leading-6 text-[#91A4AC]">
          {visual.caption}
        </p>
      )}
    </figure>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function StatsVisual({ visual }: { visual: Visual }) {
  const reduceMotion = useReducedMotion();
  const items = visual.items;

  // Three tiles read best as one wide tile over two narrow ones.
  const wideFirst = items.length === 3;

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item, index) => {
        const tint = TINTS[index % TINTS.length];

        return (
          <motion.div
            key={`${item.label}-${index}`}
            className={`rounded-2xl border-2 px-4 py-3.5 ${wideFirst && index === 0 ? 'col-span-2' : ''}`}
            style={{ backgroundColor: tint.bg, borderColor: tint.line }}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : index * 0.08, duration: 0.25 }}
          >
            <p className="font-display text-3xl font-extrabold leading-none text-white">{item.value}</p>
            <p className="mt-1.5 text-sm font-bold text-[#D5DEE3]">{item.label}</p>
            {item.note && <p className="mt-0.5 text-xs leading-5 text-[#91A4AC]">{item.note}</p>}
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Cycle ────────────────────────────────────────────────────────────────────

const CYCLE_W = 360;
const CYCLE_H = 250;
const CYCLE_CX = CYCLE_W / 2;
const CYCLE_CY = CYCLE_H / 2;
const CYCLE_RX = 128;
const CYCLE_RY = 78;
const NODE_H = 32;

interface CycleNode {
  label: string;
  x: number;
  y: number;
  w: number;
  angle: number;
}

function pointOnEllipse(angle: number): { x: number; y: number } {
  return {
    x: CYCLE_CX + CYCLE_RX * Math.cos(angle),
    y: CYCLE_CY + CYCLE_RY * Math.sin(angle),
  };
}

function insideNode(point: { x: number; y: number }, node: CycleNode, pad: number): boolean {
  return (
    Math.abs(point.x - node.x) <= node.w / 2 + pad && Math.abs(point.y - node.y) <= NODE_H / 2 + pad
  );
}

function CycleVisual({ visual }: { visual: Visual }) {
  const reduceMotion = useReducedMotion();
  const markerId = useId().replace(/:/g, '');

  const { nodes, arrows, minX, width } = useMemo(() => {
    const count = visual.items.length;

    const built: CycleNode[] = visual.items.map((item, index) => {
      // Start at the top and travel clockwise.
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
      const { x, y } = pointOnEllipse(angle);
      const label = item.label.length > 22 ? `${item.label.slice(0, 21)}…` : item.label;

      return { label, x, y, w: Math.min(160, 26 + label.length * 7.4), angle };
    });

    const paths = built.map((from, index) => {
      const to = built[(index + 1) % count];
      const span = ((to.angle - from.angle + 2 * Math.PI) % (2 * Math.PI)) || 2 * Math.PI;

      // Walk along the loop and keep the stretch that sits between the two boxes.
      const steps = 80;
      let start: { x: number; y: number } | null = null;
      let end: { x: number; y: number } | null = null;

      for (let step = 0; step <= steps; step += 1) {
        const point = pointOnEllipse(from.angle + (span * step) / steps);

        if (!start && !insideNode(point, from, 5)) start = point;
        if (start && !insideNode(point, to, 7)) end = point;
        if (start && insideNode(point, to, 7)) break;
      }

      if (!start || !end) return '';

      return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} A ${CYCLE_RX} ${CYCLE_RY} 0 0 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
    });

    // Widen the drawing if a long label would stick out past the edge.
    const minX = Math.min(0, ...built.map((node) => node.x - node.w / 2 - 10));
    const maxX = Math.max(CYCLE_W, ...built.map((node) => node.x + node.w / 2 + 10));

    return { nodes: built, arrows: paths, minX, width: maxX - minX };
  }, [visual.items]);

  return (
    <svg
      viewBox={`${minX} 0 ${width} ${CYCLE_H}`}
      className="mx-auto block h-auto w-full max-w-[420px]"
      role="img"
      aria-label={visual.title || 'Cycle diagram'}
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#91A4AC" />
        </marker>
      </defs>

      {arrows.map((path, index) =>
        path ? (
          <motion.path
            key={index}
            d={path}
            fill="none"
            stroke="#91A4AC"
            strokeWidth="2"
            strokeLinecap="round"
            markerEnd={`url(#${markerId})`}
            // Fade (not draw) so the arrowhead and its line always appear together.
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduceMotion ? 0 : 0.25 + index * 0.15, duration: 0.3 }}
          />
        ) : null,
      )}

      {nodes.map((node, index) => {
        const tint = TINTS[index % TINTS.length];

        return (
          <motion.g
            key={`${node.label}-${index}`}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ transformOrigin: `${node.x}px ${node.y}px` }}
            transition={{ delay: reduceMotion ? 0 : index * 0.12, duration: 0.25 }}
          >
            <rect
              x={node.x - node.w / 2}
              y={node.y - NODE_H / 2}
              width={node.w}
              height={NODE_H}
              rx={12}
              fill={tint.bg}
              stroke={tint.line}
              strokeWidth="2"
            />
            <text
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
              fontSize="13.5"
              fontWeight="700"
              fill="#FFFFFF"
              fontFamily="Nunito, system-ui, sans-serif"
            >
              {node.label}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────

const CHART_W = 360;
const CHART_H = 240;
const CHART_LEFT = 40;
const CHART_RIGHT = 30;
const CHART_TOP = 30;
const CHART_BOTTOM = 40;

/**
 * Picks a round step so the axis has four equal intervals (for example
 * 0, 10, 20, 30, 40 rather than 0, 12.5, 25, 37.5, 50).
 */
function niceStep(max: number): number {
  if (max <= 0) return 1;

  const raw = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));

  for (const factor of [1, 2, 2.5, 5, 10]) {
    if (factor * magnitude >= raw) return factor * magnitude;
  }

  return 10 * magnitude;
}

function formatTick(value: number): string {
  if (Number.isInteger(value)) return String(value);

  return String(Number(value.toFixed(2)));
}

function ChartVisual({ visual }: { visual: Visual }) {
  const reduceMotion = useReducedMotion();
  const isBar = visual.type === 'bar';

  const points = useMemo(
    () =>
      visual.items.map((item) => ({
        label: item.label.length > 11 ? `${item.label.slice(0, 10)}…` : item.label,
        shown: item.value,
        value: parseNumeric(item.value) ?? 0,
      })),
    [visual.items],
  );

  const step = niceStep(Math.max(...points.map((point) => point.value), 0));
  const top = step * 4;
  const plotW = CHART_W - CHART_LEFT - CHART_RIGHT;
  const plotH = CHART_H - CHART_TOP - CHART_BOTTOM;

  const xAt = (index: number) =>
    isBar
      ? CHART_LEFT + (plotW / points.length) * (index + 0.5)
      : CHART_LEFT + (plotW / Math.max(points.length - 1, 1)) * index;
  const yAt = (value: number) => CHART_TOP + plotH - (value / top) * plotH;

  const ticks = [0, 1, 2, 3, 4].map((multiple) => step * multiple);
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xAt(index).toFixed(1)} ${yAt(point.value).toFixed(1)}`)
    .join(' ');

  const barWidth = Math.min(44, (plotW / points.length) * 0.6);

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="mx-auto block h-auto w-full max-w-[440px]"
      role="img"
      aria-label={visual.title || 'Chart'}
    >
      {visual.unit && (
        <text x={CHART_LEFT} y={14} fontSize="11.5" fontWeight="700" fill="#91A4AC" fontFamily="Nunito, system-ui, sans-serif">
          {visual.unit}
        </text>
      )}

      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={CHART_LEFT}
            x2={CHART_W - CHART_RIGHT}
            y1={yAt(tick)}
            y2={yAt(tick)}
            stroke="#2C3E4A"
            strokeWidth="1"
            strokeDasharray={tick === 0 ? undefined : '4 5'}
          />
          <text
            x={CHART_LEFT - 8}
            y={yAt(tick) + 4}
            textAnchor="end"
            fontSize="11"
            fill="#91A4AC"
            fontFamily="Nunito, system-ui, sans-serif"
          >
            {formatTick(tick)}
          </text>
        </g>
      ))}

      {isBar ? (
        points.map((point, index) => (
          // Grow from the baseline with a scale, so the bar's own position stays
          // a plain attribute (x/y on motion elements are transforms, not attributes).
          <motion.g
            key={index}
            style={{ transformOrigin: `${xAt(index)}px ${yAt(0)}px` }}
            initial={reduceMotion ? false : { scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: reduceMotion ? 0 : index * 0.08, duration: 0.4 }}
          >
            <rect
              x={xAt(index) - barWidth / 2}
              y={yAt(point.value)}
              width={barWidth}
              height={Math.max(yAt(0) - yAt(point.value), 0)}
              rx={6}
              fill={index === points.length - 1 ? COLORS.orange : '#5BC0EB'}
            />
          </motion.g>
        ))
      ) : (
        <motion.path
          d={linePath}
          fill="none"
          stroke="#5BC0EB"
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={reduceMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      )}

      {points.map((point, index) => (
        <g key={`label-${index}`}>
          {!isBar && (
            <motion.circle
              cx={xAt(index)}
              cy={yAt(point.value)}
              r={5.5}
              fill="#131F24"
              stroke={index === points.length - 1 ? COLORS.orange : '#5BC0EB'}
              strokeWidth="3"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.3 + index * 0.12 }}
            />
          )}
          <text
            x={xAt(index)}
            y={yAt(point.value) - 10}
            textAnchor="middle"
            fontSize="12.5"
            fontWeight="800"
            fill="#FFFFFF"
            fontFamily="Nunito, system-ui, sans-serif"
          >
            {point.shown}
          </text>
          <text
            x={xAt(index)}
            y={CHART_H - CHART_BOTTOM + 20}
            textAnchor="middle"
            fontSize="11.5"
            fill="#91A4AC"
            fontFamily="Nunito, system-ui, sans-serif"
          >
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Compare ──────────────────────────────────────────────────────────────────

function CompareVisual({ visual }: { visual: Visual }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {visual.columns.map((column, index) => {
        const highlighted = index === 1;

        return (
          <div
            key={`${column.heading}-${index}`}
            className="rounded-2xl border-2 p-4"
            style={{
              backgroundColor: highlighted ? '#38271F' : '#1D2A33',
              borderColor: highlighted ? '#6B3F2B' : '#2C3E4A',
            }}
          >
            <p className="font-display text-base font-extrabold text-white">{column.heading}</p>
            <ul className="mt-2.5 space-y-2">
              {column.points.map((point, pointIndex) => (
                <li key={pointIndex} className="flex gap-2.5 text-sm leading-5 text-[#D5DEE3]">
                  <span
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: highlighted ? COLORS.orange : '#91A4AC' }}
                    aria-hidden="true"
                  />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function StepsVisual({ visual }: { visual: Visual }) {
  const reduceMotion = useReducedMotion();

  return (
    <ol className="space-y-0">
      {visual.items.map((item, index) => {
        const last = index === visual.items.length - 1;

        return (
          <motion.li
            key={`${item.label}-${index}`}
            className="relative flex gap-3.5 pb-4 last:pb-0"
            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reduceMotion ? 0 : index * 0.1, duration: 0.25 }}
          >
            {!last && (
              <span className="absolute left-[15px] top-8 h-[calc(100%-1.25rem)] w-0.5 bg-[#2C3E4A]" aria-hidden="true" />
            )}
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F4611F] font-display text-sm font-extrabold text-white">
              {index + 1}
            </span>
            <div className="pt-0.5">
              <p className="font-display text-base font-bold leading-6 text-white">{item.label}</p>
              {item.note && <p className="text-sm leading-6 text-[#91A4AC]">{item.note}</p>}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}