import { Badge, Button, FleetMap, Icon, IconCamera, IconCheck, IconClock, IconVehicle, IconWarning, Num, SectionHeading, type MapSite, type MapVehicle } from '@gaia/ui';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  materialName,
  vehiclePlate,
  clock,
  gyd,
  vehicleClassLabel,
  vehiclePositions,
  jobSites,
} from '@gaia/core';
import {
  order as findOrder,
  ORDER_LABEL,
  buyerSite,
  deliveredFor,
  orderDockets,
  quoteHoursLeft,
} from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * The order screen — state-dependent, and the core of the app.
 *
 * Four genuinely different screens behind one route, because a contractor
 * thinks in one object ("my sand order") that happens to move through states.
 * Splitting them into separate URLs would make them navigate to find out what
 * changed.
 *
 * ## The order-level query
 *
 * Not in the spec, which puts queries on individual dockets. But "you delivered
 * eighteen of twenty and stopped" is one of the top reasons a contractor
 * reaches for the phone, and no docket is wrong — the ORDER is incomplete. A
 * per-docket query cannot express that, so the app would lose the call it was
 * built to prevent.
 */
export default async function BuyerOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = findOrder(id);
  if (!o) notFound();

  const site = buyerSite(o.deliverySiteId);
  const done = deliveredFor(o);
  const dockets = orderDockets(o);
  const live = dockets.filter((d) => d.status !== 'closed');
  const closed = dockets.filter((d) => d.status === 'closed');

  return (
    <>
      <section className="border-b px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-lg">{materialName(o.materialId)}</h1>
            <p className="truncate text-sm text-muted-foreground">{site?.name}</p>
          </div>
          <Badge variant={o.status === 'completed' ? 'secondary' : 'outline'} className="shrink-0">
            {ORDER_LABEL[o.status]}
          </Badge>
        </div>
      </section>

      {/* ── awaiting a quote ──────────────────────────────────────────── */}
      {o.status === 'requested' && (
        <section className="border-b px-5 py-6">
          <p className="text-sm">
            You asked for <Num>{o.loadsRequested}</Num> loads,{' '}
            {vehicleClassLabel(o.vehicleClass).toLowerCase()}, for {o.windowDate}.
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <IconClock size={16} />
            Sent {clock(o.submittedAt)} — waiting on a price.
          </p>
          {o.notes && (
            <p className="mt-3 rounded-md border px-3 py-2 text-xs text-muted-foreground">
              &ldquo;{o.notes}&rdquo;
            </p>
          )}
        </section>
      )}

      {/* ── quoted: the decision ──────────────────────────────────────── */}
      {o.status === 'quoted' && o.quote && (
        <section className="border-b px-5 py-6">
          <div className="rounded-lg border border-[hsl(var(--primary))]/40 bg-primary/5 px-4 py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Rate per load</span>
              <Num className="text-lg">{gyd(o.quote.ratePerLoad)}</Num>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">
                {o.quote.loadsQuoted} loads, {vehicleClassLabel(o.vehicleClass).toLowerCase()}
              </span>
              <Num className="text-xl text-primary">
                {gyd(o.quote.ratePerLoad * o.quote.loadsQuoted)}
              </Num>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconClock size={13} />
              Valid {Math.max(0, Math.round(quoteHoursLeft(o.quote)))} more hours
            </p>
          </div>

          {o.quote.note && (
            <p className="mt-3 text-xs text-muted-foreground">&ldquo;{o.quote.note}&rdquo;</p>
          )}

          <div className="mt-4 space-y-2">
            <Button className="tap-target w-full text-base" size="lg">
              Accept — {o.quote.loadsQuoted} loads
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" className="tap-target flex-1">
                Accept fewer
              </Button>
              <Button variant="ghost" className="tap-target flex-1 text-muted-foreground">
                Decline
              </Button>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Accepting is the commitment. Nothing is booked until you do.
          </p>
        </section>
      )}

      {/* ── in progress / complete: the tracking view ─────────────────── */}
      {(o.status === 'in_progress' || o.status === 'completed') && (
        <>
          <section className="border-b px-5 py-6">
            <p className="leading-none">
              <span
                className="font-display text-primary"
                style={{ fontSize: 'clamp(2.75rem, 15vw, 4rem)', fontVariantNumeric: 'tabular-nums' }}
              >
                {done}
              </span>
              <span className="ml-2 text-lg text-muted-foreground">
                of {o.loadsRequested} loads
              </span>
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.round((done / o.loadsRequested) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {o.status === 'completed'
                ? 'Complete.'
                : `${o.loadsRequested - done} to come — expected to finish today.`}
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
                          ? 'Loaded, on the road'
                          : d.status === 'at_site'
                            ? 'Arrived at your site'
                            : 'Loading at the pit'}
                      </p>
                    </div>
                    <Num className="shrink-0 text-xs text-muted-foreground">#{d.number}</Num>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex h-32 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                Vehicles on this order — Mapbox
              </div>
            </section>
          )}

          <section className="border-b px-5 py-5">
            <SectionHeading>Delivered</SectionHeading>
            <ul className="mt-2 divide-y">
              {[...closed].reverse().map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/dockets/${d.id}`}
                    className="flex items-center gap-3 py-3 transition-colors hover:text-primary"
                  >
                    <IconCheck size={17} className="shrink-0 text-primary" />
                    <div className="flex shrink-0 gap-1">
                      {[d.loadPhoto, d.dumpPhoto].map((p, i) => (
                        <div
                          key={i}
                          className="flex h-9 w-11 items-center justify-center rounded border bg-secondary text-muted-foreground"
                        >
                          {p ? <IconCamera size={13} /> : <span className="text-[10px]">—</span>}
                        </div>
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        Docket <Num>{d.number}</Num>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <Num>{vehiclePlate(d.vehicleId)}</Num> · <Num>{clock(d.dumpedAt)}</Num>
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {/* ── the escape hatch that isn't the phone ─────────────────────── */}
      <section className="px-5 py-5">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed px-4 py-3">
          <IconWarning size={16} className="shrink-0 text-muted-foreground" />
          <p className="min-w-0 flex-1 text-xs text-muted-foreground">
            Something not right with this order — short, late, or wrong material?
          </p>
          <Button variant="secondary" size="sm">
            <Icon name="flag" size={16} />
            Raise it
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Goes straight to {o.quote?.quotedBy ?? 'the coordinator'} with the order attached. No
          phone call needed.
        </p>
      </section>
    </>
  );
}
