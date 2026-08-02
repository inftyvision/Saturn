'use client';

/**
 * The docket number, and where the load is in its cycle.
 *
 * The number is the largest thing on the screen because of what it is FOR: the
 * driver reads it aloud to the pit operator, who writes it in their own book.
 * That exchange is the product replacing the paper billbook, so the number has
 * to be legible at arm's length, in sunlight, through a windscreen — and
 * available offline, which is the whole reason §5 pre-allocates blocks.
 *
 * Tabular figures so digits don't shift width between 4518 and 4519; a number
 * that reflows as it increments is harder to read back correctly.
 */

import type { DocketStatus } from '@gaia/core';
import { DOCKET_FLOW } from '@gaia/core';

const STEP_LABEL: Record<DocketStatus, string> = {
  issued: 'Issued',
  at_pit: 'At pit',
  loaded: 'Loaded',
  in_transit: 'In transit',
  at_site: 'At site',
  dumped: 'Dumped',
  closed: 'Closed',
};

export function DocketNumber({ number, status }: { number: number; status: DocketStatus }) {
  return (
    <div className="px-4 pt-2">
      <p className="kicker">Docket</p>
      <p
        className="selectable font-display leading-none text-primary"
        style={{ fontSize: 'clamp(3.5rem, 22vw, 5.5rem)', fontVariantNumeric: 'tabular-nums' }}
      >
        {number}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{STEP_LABEL[status]}</p>
    </div>
  );
}

/**
 * The cycle rail. Deliberately shows every step including the ones still ahead
 * — a driver mid-run needs to know how many stages are left before the load
 * counts, because a docket that never reaches `closed` never reaches the tally
 * and never gets paid.
 */
export function CycleRail({ status }: { status: DocketStatus }) {
  const idx = DOCKET_FLOW.indexOf(status);
  return (
    <div className="px-4 py-3">
      <div className="flex gap-1">
        {DOCKET_FLOW.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              i < idx ? 'bg-primary/50' : i === idx ? 'bg-primary' : 'bg-secondary'
            }`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>{STEP_LABEL[DOCKET_FLOW[0]]}</span>
        <span>{STEP_LABEL[DOCKET_FLOW[DOCKET_FLOW.length - 1]]}</span>
      </div>
    </div>
  );
}

/** A labelled fact — material, pit, destination, rate. Big enough to read
 *  without focusing, because most of these are checked at a glance. */
export function Fact({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border-b px-4 py-3 last:border-b-0">
      <p className="kicker">{label}</p>
      <p className="mt-0.5 text-base">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
