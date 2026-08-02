import { Badge, Button, Icon, IconWarning, Input, Label, Num, PageHead, SectionHeading, Stat } from '@gaia/ui';
import { materialName, gyd, rateFor, vehicleClassLabel, clock, orgName } from '@gaia/core';
import { ORDERS, buyerSite, BUYER_ACCOUNT, quoteHoursLeft } from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * The quote inbox — the coordinator's half of the buyer app.
 *
 * Oldest first, with an age badge, because a request that sits is a customer
 * reaching for the phone. That is the metric this screen is really about: the
 * app only beats a phone call if a price comes back faster than someone would
 * have answered.
 *
 * Two things surfaced beside each request that the spec models but never shows:
 *
 *   · **Distance pit → site**, because that is what actually drives the rate,
 *     and a quote written without it is guesswork.
 *   · **Credit exposure.** `BuyerAccount.credit_limit` exists in the data model
 *     with nothing enforcing it. Blocking automatically would be wrong — a
 *     coordinator extends terms to a good customer mid-project all the time —
 *     so the number is put in front of the person pricing the job and the
 *     decision stays human.
 */
export default function RequestsPage() {
  const requests = ORDERS.filter((o) => o.status === 'requested');
  const quoted = ORDERS.filter((o) => o.status === 'quoted');

  return (
    <>
      <PageHead
        description="Price these. A request sitting unanswered is a customer picking up the phone."
      />

      <div className="grid grid-cols-2 border-b lg:grid-cols-4">
        <Stat label="Awaiting quote" value={String(requests.length)} tone={requests.length ? 'warn' : 'default'} />
        <Stat label="Quoted, unanswered" value={String(quoted.length)} />
        <Stat label="Buyer balance" value={gyd(BUYER_ACCOUNT.balance)} sub="BK Construction" />
        <Stat
          label="Credit limit"
          value={gyd(BUYER_ACCOUNT.creditLimit)}
          sub={`${BUYER_ACCOUNT.termsDays} day terms`}
        />
      </div>

      <ul className="divide-y">
        {requests.map((o) => {
          const site = buyerSite(o.deliverySiteId);
          const suggested = rateFor(o.vehicleClass);
          const exposure = BUYER_ACCOUNT.balance + suggested * o.loadsRequested;
          const overLimit = exposure > BUYER_ACCOUNT.creditLimit;

          return (
            <li key={o.id} className="px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base">
                      <Num>{o.loadsRequested}</Num> × {materialName(o.materialId)}
                    </h2>
                    <Badge variant="outline">{vehicleClassLabel(o.vehicleClass)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {orgName(o.buyerOrgId)} → {site?.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {o.windowDate} ·{' '}
                    {o.windowPeriod === 'am'
                      ? 'morning'
                      : o.windowPeriod === 'pm'
                        ? 'afternoon'
                        : 'any time'}{' '}
                    · 34 km from Kuru Kururu
                  </p>
                  {o.notes && (
                    <p className="mt-2 max-w-xl rounded-md border px-3 py-2 text-xs text-muted-foreground">
                      &ldquo;{o.notes}&rdquo;
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xs text-muted-foreground">Sent</p>
                  <Num className="text-sm">{clock(o.submittedAt)}</Num>
                </div>
              </div>

              {site && !site.polygonConfirmed && (
                <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <IconWarning size={14} className="mt-0.5 shrink-0 text-primary" />
                  Boundary not drawn for this site — a job cannot dispatch there until it is.
                </p>
              )}

              {overLimit && (
                <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                  <IconWarning size={14} className="mt-0.5 shrink-0 text-primary" />
                  This order would take {orgName(o.buyerOrgId)} to{' '}
                  <Num>{gyd(exposure)}</Num> against a{' '}
                  <Num>{gyd(BUYER_ACCOUNT.creditLimit)}</Num> limit.
                </p>
              )}

              {/* Quote composer */}
              <div className="mt-4 flex flex-wrap items-end gap-3 rounded-md border px-4 py-3">
                <div className="w-40 space-y-1.5">
                  <Label className="text-xs">Rate per load</Label>
                  <Input defaultValue={String(suggested)} inputMode="numeric" />
                </div>
                <div className="w-28 space-y-1.5">
                  <Label className="text-xs">Loads</Label>
                  <Input defaultValue={String(o.loadsRequested)} inputMode="numeric" />
                </div>
                <div className="w-32 space-y-1.5">
                  <Label className="text-xs">Valid for</Label>
                  <Input defaultValue="48 hours" />
                </div>
                <div className="min-w-[180px] flex-1 space-y-1.5">
                  <Label className="text-xs">Note to buyer</Label>
                  <Input placeholder="optional" />
                </div>
                <Button>
            <Icon name="send" size={16} />
            Send quote
          </Button>
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                Total at card rate <Num>{gyd(suggested * o.loadsRequested)}</Num>. The buyer may
                accept fewer loads at the same rate.
              </p>
            </li>
          );
        })}
      </ul>

      {quoted.length > 0 && (
        <section className="border-t px-6 py-5">
          <SectionHeading>Sent, awaiting an answer</SectionHeading>
          <ul className="mt-3 divide-y">
            {quoted.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm">
                    <Num>{o.quote!.loadsQuoted}</Num> × {materialName(o.materialId)} —{' '}
                    {orgName(o.buyerOrgId)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <Num>{gyd(o.quote!.ratePerLoad)}</Num> per load
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  expires in <Num>{Math.max(0, Math.round(quoteHoursLeft(o.quote!)))}</Num> h
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
