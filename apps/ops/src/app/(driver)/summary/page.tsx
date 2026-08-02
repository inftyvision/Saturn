'use client';

/**
 * §3 `/(driver)/summary` — the day tally.
 *
 * This is the driver's own record, and it matters for the same reason §"Hauler"
 * gives the operator an independent docket list: a count you can check is what
 * makes the app trustworthy rather than merely mandatory. The numbers here must
 * be derivable by the driver on paper, or the screen is worse than useless.
 */

import { Button, IconCheck, IconWarning } from '@gaia/ui';
import Link from 'next/link';
import { useSim } from '@/features/driver/sim';
import {
  DOCKETS,
  CURRENT_DRIVER,
  driver,
  vehicle,
  gyd,
  rateFor,
  clock,
  siteName,
  JOBS,
} from '@gaia/core';

export default function SummaryPage() {
  const { closedToday, queued, overrides } = useSim();
  const me = driver(CURRENT_DRIVER)!;
  const myVehicle = vehicle(me.vehicleId!)!;
  const rate = rateFor(myVehicle.class);
  const job = JOBS.find((j) => j.status === 'active')!;

  const mine = DOCKETS.filter(
    (d) => d.driverId === CURRENT_DRIVER && d.status === 'closed' && !d.voided,
  );

  return (
    <>
      <div className="border-b px-4 pb-3 pt-1">
        <p className="kicker">Day summary</p>
        <p className="mt-0.5 text-lg">{me.name}</p>
        <p className="text-sm text-muted-foreground">{myVehicle.plate}</p>
      </div>

      <div className="grid grid-cols-2 border-b">
        <div className="border-r px-4 py-5">
          <p className="kicker">Loads</p>
          <p
            className="font-display leading-none text-primary"
            style={{ fontSize: '2.75rem', fontVariantNumeric: 'tabular-nums' }}
          >
            {closedToday}
          </p>
        </div>
        <div className="px-4 py-5">
          <p className="kicker">Earned</p>
          <p className="mt-2 text-2xl" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {gyd(closedToday * rate)}
          </p>
          <p className="text-xs text-muted-foreground">{gyd(rate)} × {closedToday}</p>
        </div>
      </div>

      {(queued > 0 || overrides.length > 0) && (
        <div className="space-y-2 border-b px-4 py-3">
          {queued > 0 && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <IconWarning size={14} className="mt-0.5 shrink-0" />
              <span>{queued} not sent yet — they are saved on this phone.</span>
            </div>
          )}
          {overrides.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <IconWarning size={14} className="mt-0.5 shrink-0" />
              <span>
                {overrides.length} recorded by hand — the office will check{' '}
                {overrides.length === 1 ? 'it' : 'them'}.
              </span>
            </div>
          )}
        </div>
      )}

      <ul className="divide-y">
        {mine.map((d) => (
          <li key={d.id} className="flex items-center gap-3 px-4 py-3">
            <IconCheck size={16} className="shrink-0 text-primary" />
            <span
              className="selectable w-14 shrink-0 text-sm"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {d.number}
            </span>
            <span className="flex-1 truncate text-xs text-muted-foreground">
              {siteName(job.deliverySiteId)}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">{clock(d.dumpedAt)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto p-4">
        <Button asChild variant="secondary" className="tap-target w-full">
          <Link href="/today">Back to today</Link>
        </Button>
      </div>
    </>
  );
}
