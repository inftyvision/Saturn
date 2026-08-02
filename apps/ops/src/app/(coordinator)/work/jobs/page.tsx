import { AccumulationChart, Button, Num, PageHead, SectionHeading, Stat, Status, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, type AccumulationPoint } from '@gaia/ui';
import Link from 'next/link';
import {
  JOBS,
  materialName,
  siteName,
  clock,
  closedDockets,
  liveDockets,
  overrideRate,
  gyd,
  rateFor,
} from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * §3 `/(coordinator)/jobs` — the board, by status.
 *
 * The stat strip leads with today's count because that is the number the whole
 * product exists to make indisputable. The override rate sits beside it on
 * purpose: a tally is only as trustworthy as the share of it that was taken by
 * hand, and burying that figure would let the headline number look better than
 * it is. §5/§11 make overrides mandatory; this is where their cost shows.
 */
export default function JobsPage() {
  const closed = closedDockets();
  const live = liveDockets();
  const rate = overrideRate();
  const revenue = closed.reduce((sum, d) => sum + d.ratePerLoad, 0);

  // ── the whole fleet's earnings, in the order they actually closed ──────
  const toMinutes = (iso: string) => {
    const d = new Date(iso);
    return d.getHours() * 60 + d.getMinutes();
  };
  const closedByTime = [...closed]
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
        description="Today — Saturn's own fleet"
        actions={
          <Button asChild>
            <Link href="/work/jobs/new">New job</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 border-b lg:grid-cols-4">
        <Stat label="Closed today" value={String(closed.length)} sub="counted, immutable" />
        <Stat label="In flight" value={String(live.length)} sub="not yet counted" />
        <Stat
          label="Taken by hand"
          value={`${Math.round(rate * 100)}%`}
          sub="of closed dockets"
          tone={rate > 0.1 ? 'warn' : 'default'}
        />
        <Stat label="Hauled value" value={gyd(revenue)} sub="at card rates" />
      </div>

      <section className="border-b px-6 py-5">
        <SectionHeading className="mb-3">Hauled value today</SectionHeading>
        <AccumulationChart points={earningsPoints} unit="money" />
      </section>

      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Pit → Site</TableHead>
              <TableHead>Window</TableHead>
              <TableHead className="text-right">Loads</TableHead>
              <TableHead className="text-right">8×4 rate</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {JOBS.map((j) => (
              <TableRow key={j.id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/work/jobs/${j.id}`} className="hover:text-primary">
                    {materialName(j.materialId)}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {siteName(j.pickupSiteId).replace(/ Sand Pit| Pit/, '')} →{' '}
                  {siteName(j.deliverySiteId).split(' — ')[0]}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Num>
                    {clock(j.windowStart)}–{clock(j.windowEnd)}
                  </Num>
                </TableCell>
                <TableCell className="text-right">
                  <Num>
                    {j.loadsDone}/{j.loadsOrdered}
                  </Num>
                </TableCell>
                <TableCell className="text-right">
                  <Num>{gyd(rateFor('8x4_chinese'))}</Num>
                </TableCell>
                <TableCell>
                  <Status state={j.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
