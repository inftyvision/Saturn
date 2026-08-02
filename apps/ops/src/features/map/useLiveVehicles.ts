'use client';

/**
 * Client-side simulation of a moving vehicle.
 *
 * Same reasoning as `features/driver/sim.tsx`: there is no backend pushing
 * real fixes, so "live" has to be ticked here rather than read from a
 * subscription. Only vehicles `in_transit` move — everything at a site, still
 * loading, or on the return leg holds exactly the position
 * `vehiclePositions()` already derived for it.
 *
 * Loops back near the delivery end rather than sitting at the destination
 * forever, so the map stays watchable without waiting on a real docket
 * transition. Looping clears that vehicle's trail — a breadcrumb line is
 * supposed to be honest about where the vehicle has been, and jumping back to
 * the pit is not a return trip.
 */

import { useEffect, useRef, useState } from 'react';
import { along, type VehiclePosition } from '@gaia/core';
import type { MapVehicle } from '@gaia/ui';

type LatLng = { lat: number; lng: number };

const TICK_MS = 2_500;
const STEP = 0.02;
const TRAIL_MAX = 40;
const LOOP_AT = 0.97;
const RESTART_AT = 0.1;

export function useLiveVehicles(
  base: VehiclePosition[],
  origin?: LatLng,
  dest?: LatLng,
): MapVehicle[] {
  const [, setTick] = useState(0);
  const t = useRef<Record<string, number>>({});
  const trail = useRef<Record<string, [number, number][]>>({});

  useEffect(() => {
    if (!origin || !dest) return;

    const iv = setInterval(() => {
      let moved = false;
      for (const v of base) {
        if (v.state !== 'in_transit') continue;
        moved = true;

        const prev = t.current[v.vehicleId] ?? 0.55;
        const next = prev >= LOOP_AT ? RESTART_AT : prev + STEP;
        if (next === RESTART_AT) trail.current[v.vehicleId] = [];
        t.current[v.vehicleId] = next;

        const p = along(origin, dest, next);
        const line = (trail.current[v.vehicleId] ??= []);
        line.push([p.lng, p.lat]);
        if (line.length > TRAIL_MAX) line.splice(0, line.length - TRAIL_MAX);
      }
      if (moved) setTick((n) => n + 1);
    }, TICK_MS);

    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, origin, dest]);

  return base.map((v) => {
    if (v.state !== 'in_transit' || !origin || !dest) return v;
    const vt = t.current[v.vehicleId];
    if (vt === undefined) return v;
    const p = along(origin, dest, vt);
    return { ...v, lat: p.lat, lng: p.lng, trail: trail.current[v.vehicleId] };
  });
}
