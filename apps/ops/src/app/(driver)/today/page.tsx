'use client';

/**
 * §3 `/(driver)/today` — the job, and the next slot time.
 *
 * A driver runs one job at a time (§"Who uses it"), so this screen answers four
 * questions and stops: what am I carrying, where from, where to, and when am I
 * due at the pit. Everything else is one tap away.
 *
 * The slot time is the part that is new to the driver's world. §10's whole
 * premise is arrivals spread across the day instead of everyone showing at
 * eight — which only works if the driver is told a time and can see how long
 * the drive takes.
 */

import { Button, IconArrow, IconClock, IconPin, Person } from '@gaia/ui';
import Link from 'next/link';
import { useSim } from '@/features/driver/sim';
import { DocketNumber, CycleRail, Fact } from '@/features/driver/DocketCard';
import {
  JOBS,
  materialName,
  siteName,
  vehicle,
  driver,
  CURRENT_DRIVER,
  gyd,
  rateFor,
  clock,
} from '@gaia/core';

export default function TodayPage() {
  const { docketNumber, status, closedToday } = useSim();
  const job = JOBS.find((j) => j.status === 'active')!;
  const me = driver(CURRENT_DRIVER)!;
  const myVehicle = vehicle(me.vehicleId!)!;
  const rate = rateFor(myVehicle.class);

  // §10 — the next slot this driver is due at. Real implementation reads the
  // claimed Slot row; the shape is the same.
  const nextSlot = '11:40';

  const inFlight = status !== 'issued';

  return (
    <>
      <div className="border-b px-4 pb-3 pt-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Person
              name={me.name}
              sub={`${myVehicle.plate} · ${closedToday} ${closedToday === 1 ? 'load' : 'loads'} done`}
              size={38}
            />
          </div>
        </div>
      </div>

      <DocketNumber number={docketNumber} status={status} />
      <CycleRail status={status} />

      {/* The slot. Given its own block rather than a row in the fact list —
          it is the only thing on this screen that expires. */}
      <div className="mx-4 mb-1 flex items-center gap-3 rounded-lg border border-[hsl(var(--primary))]/30 bg-primary/5 px-3 py-3">
        <IconClock size={20} className="text-primary" />
        <div className="flex-1">
          <p className="text-sm">
            Next slot <span className="text-primary">{nextSlot}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            ~35 min to {siteName(job.pickupSiteId).replace(/ Sand Pit| Pit/, '')} — leave by 11:05
          </p>
        </div>
      </div>

      <div className="mt-2 border-y">
        <Fact label="Material" value={materialName(job.materialId)} />
        <Fact
          label="Pit"
          value={siteName(job.pickupSiteId)}
          sub={`Loading ${clock(job.windowStart)}–${clock(job.windowEnd)}`}
        />
        <Fact label="Deliver to" value={siteName(job.deliverySiteId)} />
        <Fact label="Your rate" value={`${gyd(rate)} per load`} sub={`${myVehicle.plate} · 8×4`} />
      </div>

      <div className="mt-auto space-y-2 p-4">
        <Button asChild className="tap-target w-full text-base" size="lg">
          <Link href={`/job/${job.id}/${inFlight ? statusRoute(status) : 'pit'}`}>
            {inFlight ? 'Continue run' : 'Start run'}
            <IconArrow size={18} />
          </Link>
        </Button>
        <Button asChild variant="ghost" className="tap-target w-full text-muted-foreground">
          <Link href="/summary">
            <IconPin size={16} />
            Day summary
          </Link>
        </Button>
      </div>
    </>
  );
}

/** Where a mid-cycle docket resumes. */
function statusRoute(status: string): string {
  if (status === 'at_pit' || status === 'issued') return 'pit';
  if (status === 'loaded' || status === 'in_transit') return 'transit';
  return 'dump';
}
