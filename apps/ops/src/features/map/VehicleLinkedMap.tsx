'use client';

/**
 * `FleetMap` with vehicle markers wired to `/admin/vehicles/[id]`.
 *
 * For screens that want click-through but not the live-tracking simulation
 * `LiveFleetMap` runs — a static docket-derived snapshot is enough here. A
 * tiny client boundary rather than converting the whole page: the callers are
 * async Server Components reading fixtures directly, and a function prop like
 * `onVehicleClick` can't cross from server to client.
 */

import { useRouter } from 'next/navigation';
import { FleetMap, type MapSite, type MapVehicle } from '@gaia/ui';

export function VehicleLinkedMap({
  sites,
  vehicles,
  route,
  height,
  fill,
}: {
  sites: MapSite[];
  vehicles: MapVehicle[];
  /** Real road geometry, already resolved server-side — see the prop of the
   *  same name on `FleetMap`. */
  route?: [number, number][] | null;
  height?: number;
  fill?: boolean;
}) {
  const router = useRouter();

  return (
    <FleetMap
      sites={sites}
      vehicles={vehicles}
      route={route}
      height={height}
      fill={fill}
      onVehicleClick={(vehicleId) => router.push(`/admin/vehicles/${vehicleId}`)}
    />
  );
}
