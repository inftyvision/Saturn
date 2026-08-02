'use client';

/**
 * `FleetMap` in live mode — the same component class wherever the fleet
 * needs to look like it's moving: the coordinator's map, the hauler's map,
 * and the driver's own A → B transit screen. One wrapper around the
 * simulation, not three copies of it.
 */

import { useRouter } from 'next/navigation';
import { FleetMap, type MapSite, type MapVehicle } from '@gaia/ui';
import type { VehiclePosition } from '@gaia/core';
import { useLiveVehicles } from './useLiveVehicles';

export function LiveFleetMap({
  sites,
  vehicles,
  route,
  fill,
  height,
  linkVehicles,
}: {
  sites: MapSite[];
  vehicles: VehiclePosition[];
  /** Real road geometry, already resolved server-side — see the prop of the
   *  same name on `FleetMap`. */
  route?: [number, number][] | null;
  fill?: boolean;
  height?: number;
  /**
   * Click a vehicle → `/admin/vehicles/[id]`. A boolean rather than a click
   * handler prop, and the router call lives HERE rather than in the caller:
   * this component is already `'use client'` for the ticking simulation, so
   * taking the routing on too means a page that only wants a live map — the
   * hauler's, the driver's — never has to become a client component itself
   * just to hand this one callback across the server/client boundary.
   */
  linkVehicles?: boolean;
}) {
  const router = useRouter();
  const live = useLiveVehicles(vehicles, sites[0], sites[1]);

  return (
    <FleetMap
      sites={sites}
      vehicles={live as MapVehicle[]}
      route={route}
      fill={fill}
      height={height}
      onVehicleClick={linkVehicles ? (id) => router.push(`/admin/vehicles/${id}`) : undefined}
    />
  );
}
