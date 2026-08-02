'use client';

/**
 * §3 `/(driver)/job/[id]/transit` — loaded, on the way to the delivery site.
 *
 * §5 requires the docket number to stay visible through the run: it is what
 * the driver quotes at both ends and what the receiving contractor writes down.
 *
 * `in_transit` is a geofence EXIT from the pit (§11), so there is nothing to
 * tap here in the normal case. The screen exists to hold the number and the
 * destination, and to offer the escape hatch when the exit never fires.
 *
 * Split from `page.tsx`: this needs `useSim()`, a client-only context, so it
 * can't be the Server Component that fetches the real route — `page.tsx`
 * does that (it already gets `jobId` from `params` for free) and hands the
 * result down as a plain prop.
 */

import { Button, IconArrow, IconVehicle, type MapSite } from '@gaia/ui';
import { useRouter } from 'next/navigation';
import { useSim } from '@/features/driver/sim';
import { LiveFleetMap } from '@/features/map/LiveFleetMap';
import { DocketNumber, CycleRail, Fact } from '@/features/driver/DocketCard';
import {
  JOBS,
  siteName,
  materialName,
  vehicle,
  driver,
  CURRENT_DRIVER,
  vehiclePositions,
  jobSites,
} from '@gaia/core';

export function TransitScreen({ jobId, route }: { jobId: string; route: [number, number][] | null }) {
  const router = useRouter();
  const { docketNumber, status, fence, advance } = useSim();

  const job = JOBS.find((j) => j.id === jobId) ?? JOBS[0];
  const me = driver(CURRENT_DRIVER)!;
  const myVehicle = vehicle(me.vehicleId!)!;

  // Leaving the pit polygon is the in_transit transition; arriving at the
  // delivery polygon is at_site. Both are automatic — see §11.
  if (fence === 'travelling' && status === 'loaded') advance('in_transit');
  const atSite = fence === 'in_delivery';
  if (atSite && (status === 'in_transit' || status === 'loaded')) advance('at_site');

  return (
    <>
      <div className="border-b px-4 pb-3 pt-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconVehicle size={16} />
          <span>Loaded — {myVehicle.plate}</span>
        </div>
      </div>

      <DocketNumber number={docketNumber} status={status} />
      <CycleRail status={status} />

      <div className="mt-2 border-y">
        <Fact label="Carrying" value={materialName(job.materialId)} />
        <Fact label="Deliver to" value={siteName(job.deliverySiteId)} sub="~28 min" />
      </div>

      <div className="mx-4 mt-4">
        <LiveFleetMap
          height={180}
          sites={jobSites(job.id).map(
            (s): MapSite => ({ id: s.id, name: s.name, kind: s.kind === 'pit' ? 'pit' : 'delivery', lat: s.lat, lng: s.lng, confirmed: true }),
          )}
          vehicles={vehiclePositions(job.id).filter((v) => v.vehicleId === myVehicle.id)}
          route={route}
        />
      </div>

      <div className="mt-auto space-y-2 p-4">
        <Button
          className="tap-target w-full text-base"
          size="lg"
          disabled={!atSite}
          onClick={() => router.push(`/job/${job.id}/dump`)}
        >
          {atSite ? 'At the site — dump photo' : 'Arriving unlocks the next step'}
          {atSite && <IconArrow size={18} />}
        </Button>
        {!atSite && (
          <p className="px-1 text-center text-xs text-muted-foreground">
            Nothing to do until you reach {siteName(job.deliverySiteId)}.
          </p>
        )}
      </div>
    </>
  );
}
