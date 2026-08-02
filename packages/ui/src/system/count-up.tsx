'use client';

/**
 * A number counting up from zero to its value, once, when it first appears.
 *
 * `useCountUp` is the primitive; `parseNumericLabel` is what lets `Stat` (in
 * `system/card`) animate without every call site changing how it passes a
 * value in. Callers already hand `Stat` a finished string — `gyd(629_000)`,
 * `${pct}%`, `String(n)` — because that string is also what a screenshot or a
 * non-JS render needs to show. Re-deriving a raw number at dozens of call
 * sites just to satisfy an animation would be the tail wagging the dog, so
 * instead the formatted string is parsed back into a number, animated, and
 * re-formatted the same way on every frame.
 */

import { useEffect, useRef, useState } from 'react';

const DURATION_MS = 700;

/** Fast start, settles into place — reads as "arriving", not a linear tick
 *  that never seems to slow down. */
function ease(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** 0 → `target`, once, on mount or whenever `target` changes. Jumps straight
 *  there for `prefers-reduced-motion` rather than skip the motion silently —
 *  respecting the setting IS the feature, not a degraded version of it. */
export function useCountUp(target: number, durationMs = DURATION_MS): number {
  const [value, setValue] = useState(0);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (reduceMotion.current || !Number.isFinite(target)) {
      setValue(target);
      return;
    }
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setValue(target * ease(t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}

export interface NumericLabel {
  prefix: string;
  suffix: string;
  target: number;
  decimals: number;
}

/**
 * Pulls the ONE numeric run out of a formatted label — `"G$629,000"` →
 * prefix `"G$"`, target `629000`, 0 decimals — so it can be re-assembled at
 * every frame of the count. Anything that is not exactly one numeric run
 * (a time, a plate, a docket range, a licence number) fails to match and
 * `Stat` falls back to rendering the string as-is: correctness over cleverness
 * when the shape is ambiguous.
 */
export function parseNumericLabel(s: string): NumericLabel | null {
  const m = s.match(/^([^\d-]*)(-?[\d,]+(?:\.\d+)?)([^\d]*)$/);
  if (!m) return null;
  const [, prefix, numStr, suffix] = m;
  const decimals = numStr.includes('.') ? numStr.split('.')[1]!.length : 0;
  const target = parseFloat(numStr.replace(/,/g, ''));
  if (!Number.isFinite(target)) return null;
  return { prefix, suffix, target, decimals };
}

function formatCounted(n: number, decimals: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** The animated label itself — a tiny component so `useCountUp` only mounts
 *  for values that parsed as numeric. */
export function CountUpLabel({ prefix, suffix, target, decimals }: NumericLabel) {
  const n = useCountUp(target);
  return (
    <>
      {prefix}
      {formatCounted(n, decimals)}
      {suffix}
    </>
  );
}
