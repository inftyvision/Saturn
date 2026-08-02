'use client';

/**
 * The accumulation chart. One shape, for the one story this product tells
 * with a graph: a total climbing through a day toward a number someone
 * ordered or is owed.
 *
 * Deliberately narrow. This is not a charting library — there is exactly one
 * form here, a cumulative step chart, because that is the one honest shape
 * for "how much has landed so far": earnings and loads arrive in discrete
 * closed dockets, not continuously, so the line steps flat between events and
 * jumps at each one rather than interpolating a smooth curve that implies
 * money trickling in. The target line — loads ordered, or a statement total —
 * is what turns "a total" into "progress toward a number", which is the
 * gamified read that was asked for: the fill visibly closing the gap to a
 * dashed line, not a bare total sitting still.
 *
 * Colours read off the live brand tokens directly in the SVG's `style`
 * attributes (`hsl(var(--primary))` etc.) rather than through
 * `getComputedStyle`, unlike `FleetMap`. MapLibre paints WebGL with resolved
 * values and cannot follow a CSS variable; plain SVG can, so it does.
 */

import { useMemo, useRef, useState } from 'react';

export interface AccumulationPoint {
  /** Minutes since midnight, or any consistent ascending unit — only order
   *  and relative spacing matter, the axis never prints raw units. */
  x: number;
  /** The running total AT this point, not a delta. */
  y: number;
  /** X-axis / tooltip text. Falls back to the raw `x` value when omitted —
   *  callers should always set this, since `x`'s unit is theirs alone. */
  label?: string;
}

const W = 600;
const PAD_L = 6;
const PAD_R = 6;
const PAD_T = 18;
const PAD_B = 26;

/** Money or a plain count — a fixed enum rather than a formatter FUNCTION
 *  prop, because every caller of this chart is an async Server Component
 *  reading fixtures directly, and a function can't cross that boundary to a
 *  `'use client'` component. `gyd()` lives in `@gaia/core`, which this
 *  package does not depend on, so `'money'` reimplements its exact format
 *  (`G$` + thousands) rather than importing it. */
export type AccumulationUnit = 'count' | 'money';

function formatByUnit(unit: AccumulationUnit, n: number): string {
  const rounded = Math.round(n);
  return unit === 'money' ? `G$${rounded.toLocaleString('en-GY')}` : rounded.toLocaleString();
}

export function AccumulationChart({
  points,
  target,
  targetLabel,
  unit = 'count',
  height = 200,
  className = '',
}: {
  points: AccumulationPoint[];
  /** The number this total is climbing toward — loads ordered, a statement
   *  total. Omit for a plain running total with no goal to show progress against. */
  target?: number;
  targetLabel?: string;
  unit?: AccumulationUnit;
  height?: number;
  className?: string;
}) {
  const formatValue = (n: number) => formatByUnit(unit, n);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const H = height;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const { px, py, linePath, areaPath, ticksY, last } = useMemo(() => {
    if (points.length === 0) {
      return { px: () => 0, py: () => 0, linePath: '', areaPath: '', ticksY: [] as number[], last: null };
    }
    const xs = points.map((p) => p.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const maxY = Math.max(target ?? 0, ...points.map((p) => p.y)) || 1;

    const px = (x: number) => PAD_L + ((x - minX) / (maxX - minX || 1)) * plotW;
    const py = (y: number) => PAD_T + plotH - (y / maxY) * plotH;

    // Step-after: flat between events, a vertical jump AT each one — the
    // shape that tells the truth about money arriving in discrete closes.
    let line = `M ${px(points[0]!.x)} ${py(points[0]!.y)}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]!;
      const cur = points[i]!;
      line += ` L ${px(cur.x)} ${py(prev.y)} L ${px(cur.x)} ${py(cur.y)}`;
    }
    const lastPt = points[points.length - 1]!;
    const baseY = py(0);
    const area = `${line} L ${px(lastPt.x)} ${baseY} L ${px(points[0]!.x)} ${baseY} Z`;

    const ticks = target ? [0, target, maxY] : [0, maxY / 2, maxY];

    return { px, py, linePath: line, areaPath: area, ticksY: Array.from(new Set(ticks)), last: lastPt };
  }, [points, target, plotW, plotH]);

  const hoverPoint = hover !== null ? points[hover] : null;

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(px(p.x) - relX);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setHover(best);
  };

  if (points.length === 0 || !last) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground ${className}`}
        style={{ height }}
      >
        Nothing closed yet today.
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
        role="img"
        aria-label={`Running total, currently ${formatValue(last.y)}${target ? ` of a ${formatValue(target)} target` : ''}`}
      >
        {/* gridlines — hairline, solid, recessive */}
        {ticksY.map((t) => (
          <line
            key={t}
            x1={PAD_L}
            x2={W - PAD_R}
            y1={py(t)}
            y2={py(t)}
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity={0.15}
            strokeWidth={1}
          />
        ))}
        {ticksY.map((t) => (
          <text
            key={`label-${t}`}
            x={PAD_L}
            y={py(t) - 4}
            fontSize={9}
            className="fill-muted-foreground"
          >
            {formatValue(t)}
          </text>
        ))}

        {/* the target — dashed, same honesty rule FleetMap's corridor line
            uses: this is a REFERENCE, not a measured fact. */}
        {target !== undefined && (
          <>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={py(target)}
              y2={py(target)}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              strokeWidth={1.2}
            />
            {targetLabel && (
              <text x={W - PAD_R} y={py(target) - 4} textAnchor="end" fontSize={9} className="fill-muted-foreground">
                {targetLabel}
              </text>
            )}
          </>
        )}

        {/* the fill — a wash, never a saturated block */}
        <path d={areaPath} fill="hsl(var(--primary))" fillOpacity={0.1} stroke="none" />
        {/* the line itself */}
        <path
          d={linePath}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* the crosshair + hovered point */}
        {hoverPoint && (
          <line
            x1={px(hoverPoint.x)}
            x2={px(hoverPoint.x)}
            y1={PAD_T}
            y2={H - PAD_B}
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity={0.4}
            strokeWidth={1}
          />
        )}

        {/* the end-of-line marker — value at the end, per the mark spec */}
        <circle cx={px(last.x)} cy={py(last.y)} r={5} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2} />
        <text
          x={px(last.x)}
          y={py(last.y) - 10}
          textAnchor="end"
          fontSize={12}
          className="fill-foreground"
          style={{ fontFamily: 'var(--gaia-font-mono, ui-monospace)' }}
        >
          {formatValue(last.y)}
        </text>

        {/* x-axis — first and last label only; a mid-chart cannot fit more
            without collisions, and the tooltip carries the rest on hover. */}
        <text x={PAD_L} y={H - 8} fontSize={9} className="fill-muted-foreground">
          {points[0]!.label ?? String(points[0]!.x)}
        </text>
        <text x={W - PAD_R} y={H - 8} textAnchor="end" fontSize={9} className="fill-muted-foreground">
          {last.label ?? String(last.x)}
        </text>

        {/* the hit layer — bigger than the mark, per the hover-target rule */}
        <rect
          x={PAD_L}
          y={0}
          width={plotW}
          height={H}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>

      {hoverPoint && (
        <div
          className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border px-2 py-1 text-xs backdrop-blur-md"
          style={{
            left: `${(px(hoverPoint.x) / W) * 100}%`,
            background: 'color-mix(in srgb, hsl(var(--background)) 85%, transparent)',
          }}
        >
          <span className="text-muted-foreground">{hoverPoint.label ?? String(hoverPoint.x)}</span>{' '}
          <span className="font-medium text-foreground">{formatValue(hoverPoint.y)}</span>
        </div>
      )}
    </div>
  );
}
