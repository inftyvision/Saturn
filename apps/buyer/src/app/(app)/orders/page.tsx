import { Badge, Button, IconArrow, IconClock, IconWarning, Num, SectionHeading } from '@gaia/ui';
import Link from 'next/link';
import { materialName, gyd, vehicleClassLabel } from '@gaia/core';
import {
  ORDERS,
  ORDER_LABEL,
  BUYER_ACCOUNT,
  buyerSite,
  deliveredFor,
  quoteHoursLeft,
} from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * The buyer's home — active orders, quotes waiting, balance, and one tap to
 * order again.
 *
 * §Dashboard and §/orders in the spec are nearly the same screen (active subset
 * vs filterable list), and both claim a route the prototype index also wants.
 * Merged here, at `/orders`, with `/` redirecting.
 *
 * ## Reorder
 *
 * Not in the spec, and it should be. The stated user orders "several times a
 * week during active projects", which means the fastest useful path is *same as
 * last time* — one tap against a six-field form. It is cheaper to build than
 * most of what is specced and it is the difference between an app a foreman
 * opens and one they abandon for the phone. It pre-fills the request; it does
 * not submit, because material and window still change.
 */
export default function BuyerOrdersPage() {
  const active = ORDERS.filter((o) => o.status === 'in_progress' || o.status === 'accepted');
  const quoted = ORDERS.filter((o) => o.status === 'quoted');
  const waiting = ORDERS.filter((o) => o.status === 'requested');
  const past = ORDERS.filter((o) => o.status === 'completed');

  return (
    <>
      {/* ── quotes first: they expire ─────────────────────────────────── */}
      {quoted.length > 0 && (
        <section className="border-b px-5 py-5">
          <SectionHeading>Waiting on you</SectionHeading>
          <ul className="mt-3 space-y-2">
            {quoted.map((o) => {
              const h = quoteHoursLeft(o.quote!);
              const urgent = h < 12;
              return (
                <li key={o.id}>
                  <Link
                    href={`/orders/${o.id}`}
                    className="flex items-center gap-3 rounded-lg border border-[hsl(var(--primary))]/40 bg-primary/5 px-4 py-3.5 transition-colors hover:bg-primary/10"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        {o.quote!.loadsQuoted} loads of {materialName(o.materialId)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <Num>{gyd(o.quote!.ratePerLoad)}</Num> per load ·{' '}
                        <Num>{gyd(o.quote!.ratePerLoad * o.quote!.loadsQuoted)}</Num> total
                      </p>
                    </div>
                    <span
                      className={`flex shrink-0 items-center gap-1 text-xs ${
                        urgent ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <IconClock size={14} />
                      {h > 0 ? `${Math.round(h)}h left` : 'expired'}
                    </span>
                    <IconArrow size={16} className="shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ── in progress ───────────────────────────────────────────────── */}
      <section className="border-b px-5 py-5">
        <div className="flex items-center justify-between">
          <SectionHeading>Active</SectionHeading>
          <Button asChild size="sm">
            <Link href="/order/new">Order material</Link>
          </Button>
        </div>

        {active.length === 0 && waiting.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing on the way. Ordering takes about a minute.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {active.map((o) => {
              const done = deliveredFor(o);
              const pct = Math.round((done / o.loadsRequested) * 100);
              const stalled = done > 0 && done < o.loadsRequested;
              return (
                <li key={o.id}>
                  <Link
                    href={`/orders/${o.id}`}
                    className="block rounded-lg border px-4 py-3.5 transition-colors hover:bg-accent/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm">{materialName(o.materialId)}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {buyerSite(o.deliverySiteId)?.name}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm">
                        <Num className="text-primary">{done}</Num>
                        <span className="text-muted-foreground"> of {o.loadsRequested}</span>
                      </p>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    {stalled && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <IconWarning size={13} />
                        {o.loadsRequested - done} still to come
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}

            {waiting.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3.5 transition-colors hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm">
                      {o.loadsRequested} loads of {materialName(o.materialId)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {buyerSite(o.deliverySiteId)?.name}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {ORDER_LABEL[o.status]}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── order again ───────────────────────────────────────────────── */}
      {past.length > 0 && (
        <section className="border-b px-5 py-5">
          <SectionHeading>Order again</SectionHeading>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Same material, same site — you can change anything before sending.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {past.slice(0, 3).map((o) => (
              <Link
                key={o.id}
                href={`/order/new?from=${o.id}`}
                className="rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                {o.loadsRequested} × {materialName(o.materialId)}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {buyerSite(o.deliverySiteId)?.name.split(' — ')[0]}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── account ───────────────────────────────────────────────────── */}
      <section className="border-b px-5 py-5">
        <div className="flex items-end justify-between">
          <div>
            <SectionHeading>Balance</SectionHeading>
            <Num className="text-xl">{gyd(BUYER_ACCOUNT.balance)}</Num>
            <p className="text-xs text-muted-foreground">
              Statement {BUYER_ACCOUNT.nextStatement} · {BUYER_ACCOUNT.termsDays} day terms
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/money">Statement</Link>
          </Button>
        </div>
      </section>

      {/* ── history ───────────────────────────────────────────────────── */}
      <section className="px-5 py-5">
        <SectionHeading>Past orders</SectionHeading>
        <ul className="mt-2 divide-y">
          {past.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orders/${o.id}`}
                className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-primary"
              >
                <div className="min-w-0">
                  <p className="text-sm">{materialName(o.materialId)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {vehicleClassLabel(o.vehicleClass)} · {buyerSite(o.deliverySiteId)?.name}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <Num className="text-sm">{deliveredFor(o)} loads</Num>
                  <p className="text-xs text-muted-foreground">{o.windowDate}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
