'use client';

/**
 * §3 `/(driver)/job/[id]/pit` — the geofence-gated load photo.
 *
 * §11: `at_pit` on geofence enter, `loaded` when the load photo is captured
 * inside the fence. The number is already burned from the device's block (§5),
 * so the driver can quote it to the pit operator the moment they pull up —
 * offline, before anything has synced. That is the paper-book parity that makes
 * the app adoptable.
 */

import { useRouter, useParams } from 'next/navigation';
import { useSim } from '@/features/driver/sim';
import { DocketNumber, CycleRail } from '@/features/driver/DocketCard';
import { CameraGate } from '@/features/driver/CameraGate';
import { IconPin } from '@gaia/ui';
import { JOBS, siteName, vehicle, driver, CURRENT_DRIVER } from '@gaia/core';

export default function PitPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { docketNumber, status, fence, advance } = useSim();

  const job = JOBS.find((j) => j.id === id) ?? JOBS[0];
  const me = driver(CURRENT_DRIVER)!;
  const myVehicle = vehicle(me.vehicleId!)!;

  const arrived = fence === 'in_pit';
  // §11 — arriving inside the pit polygon IS the at_pit transition. The client
  // takes it optimistically so the screen is right offline; the server
  // re-derives from the ping stream and wins (§6).
  if (arrived && status === 'issued') advance('at_pit');

  return (
    <>
      <div className="border-b px-4 pb-3 pt-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconPin size={16} />
          <span>{siteName(job.pickupSiteId)}</span>
        </div>
      </div>

      <DocketNumber number={docketNumber} status={status} />
      <CycleRail status={status} />

      <p className="px-4 pb-3 text-sm text-muted-foreground">
        Give docket <span className="text-foreground">{docketNumber}</span> to the loader operator.
      </p>

      <CameraGate
        need="in_pit"
        plate={myVehicle.plate}
        captionOpen="Frame the full bed inside the guide — the same way every time, so loads stay comparable."
        onCapture={(opts) => {
          advance('loaded', opts);
          router.push(`/job/${job.id}/transit`);
        }}
      />
    </>
  );
}
