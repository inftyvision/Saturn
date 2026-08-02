'use client';

/**
 * §3 `/(driver)/job/[id]/dump` — the geofence-gated dump photo, and close.
 *
 * §11: `dumped` on photo inside the delivery fence, `closed` on fence exit —
 * and closing is what makes the load count toward the tally and become
 * immutable. This screen is therefore the moment the driver gets paid for,
 * which is why the confirmation states the running total rather than just
 * saying "done".
 */

import { Button, IconCheck, IconPin } from '@gaia/ui';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSim } from '@/features/driver/sim';
import { DocketNumber, CycleRail } from '@/features/driver/DocketCard';
import { CameraGate } from '@/features/driver/CameraGate';
import {
  JOBS,
  siteName,
  vehicle,
  driver,
  CURRENT_DRIVER,
  gyd,
  rateFor,
} from '@gaia/core';

export default function DumpPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { docketNumber, status, advance, closeDocket, closedToday, online } = useSim();
  const [closed, setClosed] = useState(false);

  const job = JOBS.find((j) => j.id === id) ?? JOBS[0];
  const me = driver(CURRENT_DRIVER)!;
  const myVehicle = vehicle(me.vehicleId!)!;
  const rate = rateFor(myVehicle.class);

  if (closed) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
          <IconCheck size={32} />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Docket closed</p>
        <p
          className="selectable font-display leading-none text-primary"
          style={{ fontSize: 'clamp(3rem, 18vw, 4.5rem)', fontVariantNumeric: 'tabular-nums' }}
        >
          {docketNumber - 1}
        </p>

        <div className="mt-6 w-full rounded-lg border">
          <div className="flex justify-between border-b px-4 py-3 text-sm">
            <span className="text-muted-foreground">Loads today</span>
            <span>{closedToday}</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">Earned today</span>
            <span>{gyd(closedToday * rate)}</span>
          </div>
        </div>

        {!online && (
          <p className="mt-4 text-xs text-muted-foreground">
            Saved on this phone. It will send when you get signal — the number is already yours.
          </p>
        )}

        <div className="mt-auto w-full space-y-2 py-6">
          <Button className="tap-target w-full text-base" size="lg" onClick={() => router.push('/today')}>
            Next load
          </Button>
          <Button
            asChild
            variant="ghost"
            className="tap-target w-full text-muted-foreground"
          >
            <a href="/summary">Finish for the day</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border-b px-4 pb-3 pt-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconPin size={16} />
          <span>{siteName(job.deliverySiteId)}</span>
        </div>
      </div>

      <DocketNumber number={docketNumber} status={status} />
      <CycleRail status={status} />

      <CameraGate
        need="in_delivery"
        plate={myVehicle.plate}
        captionOpen="Photograph the dumped load where it lies. This is the contractor's proof of delivery."
        onCapture={(opts) => {
          advance('dumped', opts);
          closeDocket();
          setClosed(true);
        }}
      />
    </>
  );
}
