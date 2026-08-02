import { Badge, Button, Icon, Num, PageHead, Stat } from '@gaia/ui';
import { EXCEPTIONS, clock, overrideRate, closedDockets } from '@gaia/core';
import { EXCEPTION_LABEL } from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * §3 `/(coordinator)/exceptions`.
 *
 * This is the health surface for the entire product, not a tidy-up queue.
 *
 * §8 claims geofence-verified counting makes the tally indisputable, and §11
 * gives every automatic transition a manual override. Both are correct and they
 * are in tension: the override rate is exactly the share of the tally that was
 * asserted rather than verified. At 5% the claim holds; at 30% you have a
 * slightly better paper book. So the rate is the headline here, above the list.
 *
 * §6 disagreements carry BOTH versions and are never silently overwritten —
 * which is why these rows state what the client said and what the server
 * derived, rather than presenting a resolved answer.
 */
export default function ExceptionsPage() {
  const open = EXCEPTIONS.filter((e) => e.status === 'open');
  const resolved = EXCEPTIONS.filter((e) => e.status === 'resolved');
  const rate = overrideRate();
  const closed = closedDockets();

  return (
    <>
      <PageHead
        description="Nothing here is an error. These are the dockets the count cannot vouch for on its own."
      />

      <div className="grid grid-cols-2 border-b lg:grid-cols-4">
        <Stat
          label="Taken by hand"
          value={`${Math.round(rate * 100)}%`}
          sub={`${closed.filter((d) => d.manualOverride).length} of ${closed.length} closed`}
          tone={rate > 0.1 ? 'warn' : 'default'}
        />
        <Stat label="Open" value={String(open.length)} />
        <Stat label="Resolved today" value={String(resolved.length)} />
        <Stat label="Unused numbers" value="1" sub="soft signal only" />
      </div>

      <ul className="divide-y">
        {[...open, ...resolved].map((e) => (
          <li key={e.id} className="flex flex-wrap items-start gap-4 px-6 py-4">
            <div className="w-40 shrink-0">
              <Badge variant={e.status === 'open' ? 'outline' : 'ghost'}>
                {EXCEPTION_LABEL[e.kind]}
              </Badge>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm">
                {e.entity} <Num className="text-muted-foreground">{e.entityId}</Num>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{e.detail}</p>
            </div>

            <div className="shrink-0 text-xs text-muted-foreground">
              <Num>{clock(e.occurredAt)}</Num>
            </div>

            <div className="w-28 shrink-0 text-right">
              {e.status === 'open' ? (
                <Button size="sm" variant="secondary">
            <Icon name="fact_check" size={16} />
            Review
          </Button>
              ) : (
                <span className="text-xs text-muted-foreground">Resolved</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="px-6 py-5 text-xs text-muted-foreground">
        Gaps in the number sequence are expected — a block is allocated to a phone and not every
        number gets burned. Paper books have gaps too.
      </p>
    </>
  );
}
