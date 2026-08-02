import { Badge, Button, IconCamera, IconCheck, Num } from '@gaia/ui';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  DOCKETS,
  vehiclePlate,
  clock,
  gyd,
  siteName,
  job as findJob,
  vehicleClassLabel,
} from '@gaia/core';
import { DOCKET_QUERIES } from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * One docket, from the buyer's side.
 *
 * The spec calls this screen the product, and it is right: it is what replaces
 * the argument at month end. A contractor disputing a delivery currently has a
 * memory and a paper slip; here they have a number, two photographs, a plate, a
 * time, and a rate — all captured at the moment, not reconstructed after.
 *
 * "Raise a query" is deliberately prominent rather than buried. The evidence is
 * only worth something if disagreeing with it is easy; a dispute path that
 * takes three taps to find is a phone call.
 */
export default async function BuyerDocketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = DOCKETS.find((x) => x.id === id);
  if (!d) notFound();

  const job = findJob(d.jobId);
  const query = DOCKET_QUERIES.find((q) => q.docketId === d.id);

  return (
    <div className="px-5 py-5">
      <Link href="/orders" className="text-xs text-muted-foreground hover:text-foreground">
        ← Orders
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <p className="kicker">Docket</p>
          <p
            className="selectable font-display leading-none text-primary"
            style={{ fontSize: 'clamp(2.5rem, 14vw, 3.5rem)', fontVariantNumeric: 'tabular-nums' }}
          >
            {d.number}
          </p>
        </div>
        {d.voided ? (
          <Badge variant="destructive">Voided</Badge>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-primary">
            <IconCheck size={16} />
            Delivered
          </span>
        )}
      </div>

      {/* Both photos, side by side and large — this is the evidence. */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        {[
          ['At the pit', d.loadPhoto],
          ['At your site', d.dumpPhoto],
        ].map(([label, p]) => (
          <figure key={label as string}>
            <div className="flex aspect-[4/3] items-center justify-center rounded-lg border bg-secondary text-muted-foreground">
              {p ? <IconCamera size={24} /> : <span className="text-xs">Not captured</span>}
            </div>
            <figcaption className="mt-1.5 text-xs text-muted-foreground">{label as string}</figcaption>
          </figure>
        ))}
      </div>

      <dl className="mt-5 divide-y rounded-lg border">
        {[
          ['Vehicle', `${vehiclePlate(d.vehicleId)} · ${vehicleClassLabel(d.vehicleClass)}`],
          ['Loaded', `${clock(d.loadedAt)} · ${job ? siteName(job.pickupSiteId) : '—'}`],
          ['Delivered', `${clock(d.dumpedAt)} · ${job ? siteName(job.deliverySiteId) : '—'}`],
          ['Rate', gyd(d.ratePerLoad)],
        ].map(([k, v]) => (
          <div key={k as string} className="flex justify-between px-4 py-2.5">
            <dt className="text-sm text-muted-foreground">{k as string}</dt>
            <dd className="text-sm">
              <Num>{v as string}</Num>
            </dd>
          </div>
        ))}
      </dl>

      {d.voided && d.voidReason && (
        <p className="mt-3 rounded-md border px-3 py-2 text-xs text-muted-foreground">
          Voided — {d.voidReason}. It does not count toward your order or your statement.
        </p>
      )}

      {query ? (
        <div className="mt-5 rounded-lg border border-[hsl(var(--primary))]/40 bg-primary/5 px-4 py-3">
          <p className="text-sm">Query raised</p>
          <p className="mt-1 text-xs text-muted-foreground">&ldquo;{query.text}&rdquo;</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Sent {clock(query.raisedAt)} · {query.status === 'open' ? 'awaiting a reply' : 'resolved'}
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          <Button variant="secondary" className="tap-target w-full">
            Raise a query on this docket
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Short load, wrong material, damaged site — it goes to the yard with the photos attached.
          </p>
        </div>
      )}
    </div>
  );
}
