import { AccumulationChart, Badge, Button, Num, PageHead, SectionHeading, Stat, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, type AccumulationPoint } from '@gaia/ui';
import { STATEMENTS, COORDINATOR_ORG, orgName, gyd, clock, closedDockets } from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * §3 `/(hauler)/statements` — owed and paid.
 *
 * The counterpart to `/hauler/work/dockets`: that screen is the operator's own
 * count, this one is what the coordinator says they owe against it. Keeping
 * them one tab apart is the point — reconciliation is comparing two numbers,
 * and the product's value is that both parties can see both.
 *
 * The unstated line at the bottom is same-day settlement (§14). It is the
 * strongest adoption hook for a subcontractor and it depends on bank API access
 * nobody has verified yet, so it is described rather than promised.
 */
export default function HaulerStatementsPage() {
  const mine = STATEMENTS.filter((s) => s.counterpartyOrgId !== COORDINATOR_ORG);
  const outstanding = mine
    .filter((s) => s.status !== 'paid')
    .reduce((sum, s) => sum + s.total, 0);
  const thisPeriod = closedDockets();

  // ── what you've earned so far, in the order it closed ───────────────────
  const toMinutes = (iso: string) => {
    const d = new Date(iso);
    return d.getHours() * 60 + d.getMinutes();
  };
  const closedByTime = [...thisPeriod]
    .filter((d) => d.dumpedAt)
    .sort((a, b) => a.dumpedAt!.localeCompare(b.dumpedAt!));
  let earned = 0;
  const earningsPoints: AccumulationPoint[] = [
    { x: 0, y: 0, label: '00:00' },
    ...closedByTime.map((d): AccumulationPoint => {
      earned += d.ratePerLoad;
      return { x: toMinutes(d.dumpedAt!), y: earned, label: clock(d.dumpedAt) };
    }),
  ];

  return (
    <>
      <PageHead
        description="What each coordinator says you are due. Check it against your own dockets."
        actions={
          <Button variant="secondary" asChild>
            <a href="/hauler/work/dockets">My dockets</a>
          </Button>
        }
      />

      <div className="grid grid-cols-2 border-b lg:grid-cols-3">
        <Stat label="Outstanding" value={gyd(outstanding)} sub="issued, unpaid" tone="warn" />
        <Stat
          label="This period"
          value={String(thisPeriod.length)}
          sub="dockets not yet statemented"
        />
        <Stat
          label="Value"
          value={gyd(thisPeriod.reduce((s, d) => s + d.ratePerLoad, 0))}
          sub="at card rates"
        />
      </div>

      <section className="border-b px-6 py-5">
        <SectionHeading className="mb-3">Earned today</SectionHeading>
        <AccumulationChart points={earningsPoints} unit="money" />
      </section>

      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Their count</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mine.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{orgName(s.issuerOrgId)}</TableCell>
                <TableCell className="text-muted-foreground">
                  <Num>
                    {s.periodStart} → {s.periodEnd}
                  </Num>
                </TableCell>
                <TableCell className="text-right">
                  <Num>{s.docketCount}</Num>
                </TableCell>
                <TableCell className="text-right">
                  <Num>{gyd(s.total)}</Num>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      s.status === 'paid' ? 'secondary' : s.status === 'issued' ? 'outline' : 'ghost'
                    }
                    className="capitalize"
                  >
                    {s.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <p className="mt-4 text-xs text-muted-foreground">
          Where a count disagrees with yours, the docket numbers are the argument — both sides hold
          the same list, and voided numbers are still on it.
        </p>
      </div>
    </>
  );
}
