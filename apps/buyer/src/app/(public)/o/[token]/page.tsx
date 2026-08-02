import { IconCamera, IconCheck, IconVehicle, Num, SectionHeading } from '@gaia/ui';
import { notFound } from 'next/navigation';
import {
  JOBS,
  DOCKETS,
  materialName,
  siteName,
  vehiclePlate,
  clock,
  liveDockets,
} from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * §3 `/o/[token]` — per-order tracking. No install, no account.
 *
 * The buyer is a contractor waiting on sand, and the question is always the
 * same: how much has arrived and when does the rest get here. So the count is
 * the page, and everything below it is evidence for that count.
 *
 * Deliberately absent: money. §17 puts account balances out of scope, and a
 * delivery-tracking link that opens on a running bill changes what the page is
 * for. The contractor's arrangement is with the coordinator.
 *
 * Read-only by construction — the token names ONE order. There is no navigation
 * to another, because the buyer has no account and the link is shared over
 * WhatsApp, where it will end up in more hands than the recipient's.
 */
export default async function TrackOrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const job = JOBS.find((j) => j.trackToken === token);
  if (!job) notFound();

  const dockets = DOCKETS.filter((d) => d.jobId === job.id && d.status === 'closed' && !d.voided);
  const live = liveDockets().filter((d) => d.jobId === job.id);
  const pct = Math.round((dockets.length / job.loadsOrdered) * 100);

  return (
    <>
      <section className="border-b px-5 py-6">
        <p className="text-sm text-muted-foreground">{materialName(job.materialId)}</p>
        <p className="mt-1 text-sm text-muted-foreground">{siteName(job.deliverySiteId)}</p>

        <p className="mt-5 leading-none">
          <span
            className="font-display text-primary"
            style={{ fontSize: 'clamp(3rem, 16vw, 4.5rem)', fontVariantNumeric: 'tabular-nums' }}
          >
            {dockets.length}
          </span>
          <span className="ml-2 text-xl text-muted-foreground">of {job.loadsOrdered} loads</span>
        </p>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {job.status === 'closed'
            ? 'Complete.'
            : `Delivering ${clock(job.windowStart)}–${clock(job.windowEnd)} today.`}
        </p>
      </section>

      {live.length > 0 && (
        <section className="border-b px-5 py-5">
          <SectionHeading>On the way now</SectionHeading>
          <ul className="mt-3 space-y-2">
            {live.map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                <IconVehicle size={18} className="shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <Num>{vehiclePlate(d.vehicleId)}</Num>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {d.status === 'in_transit'
                      ? 'Loaded and on the road'
                      : d.status === 'at_site'
                        ? 'Arrived at your site'
                        : 'Loading at the pit'}
                  </p>
                </div>
                <Num className="shrink-0 text-xs text-muted-foreground">#{d.number}</Num>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="px-5 py-5">
        <SectionHeading>Delivered</SectionHeading>
        <ul className="mt-3 divide-y">
          {[...dockets].reverse().map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-3">
              <IconCheck size={18} className="shrink-0 text-primary" />
              <div className="flex shrink-0 gap-1">
                {[d.loadPhoto, d.dumpPhoto].map((p, i) => (
                  <div
                    key={i}
                    className="flex h-10 w-12 items-center justify-center rounded border bg-secondary text-muted-foreground"
                  >
                    {p ? <IconCamera size={14} /> : <span className="text-[10px]">—</span>}
                  </div>
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  Docket <Num>{d.number}</Num>
                </p>
                <p className="text-xs text-muted-foreground">
                  <Num>{vehiclePlate(d.vehicleId)}</Num> · delivered <Num>{clock(d.dumpedAt)}</Num>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
