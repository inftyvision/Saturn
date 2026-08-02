import { AccumulationChart, Num, PageHead, Person, SLOT_FILL, SectionHeading, Stat, Status, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, type AccumulationPoint, type MapSite, type MapVehicle } from '@gaia/ui';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { VehicleLinkedMap } from '@/features/map/VehicleLinkedMap';
import { fetchRoute } from '@/lib/route';
import {
  job as findJob,
  slotsForJob,
  siteName,
  materialName,
  vehiclePlate,
  driver as findDriver,
  clock,
  gyd,
  DOCKETS,
  site,
  vehiclePositions,
  jobSites,
} from '@gaia/core';
import { SLOT_LABEL, type SlotStatus } from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * §3 `/(coordinator)/jobs/[id]` — slot grid, assignments, live dockets.
 *
 * The grid is the screen. §10's premise is that arrivals get spread across the
 * day instead of everyone showing at eight, and the only way a coordinator can
 * tell whether that is happening is to see the whole window at once: what is
 * claimed, what is running, what nobody took, and where the released no-shows
 * left holes.
 *
 * Released slots are given the loud tone deliberately. An unclaimed gap in the
 * middle of the day is lost capacity, and it is the actionable thing on this
 * page — the coordinator can offer it to whoever is waiting at the pit.
 */
export default async function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = findJob(id);
  if (!job) notFound();

  const slots = slotsForJob(job);
  const pit = site(job.pickupSiteId);
  const dockets = DOCKETS.filter((d) => d.jobId === job.id && !d.voided).slice(-12).reverse();
  const jobSitesList = jobSites(job.id);
  const route =
    jobSitesList[0] && jobSitesList[1] ? await fetchRoute(jobSitesList[0], jobSitesList[1]) : null;

  const count = (s: SlotStatus) => slots.filter((x) => x.status === s).length;

  // ── what has actually landed, in order ──────────────────────────────────
  // Every close is a real deposit, not a smooth trickle — so the chart steps
  // at each `dumpedAt` rather than interpolating between them. Value is the
  // docket's OWN rate, not an estimate; the target line uses the same 8×4
  // approximation the Value stat above already does, for the same reason.
  const toMinutes = (iso: string) => {
    const d = new Date(iso);
    return d.getHours() * 60 + d.getMinutes();
  };
  const closes = DOCKETS.filter(
    (d) => d.jobId === job.id && d.status === 'closed' && !d.voided && d.dumpedAt,
  ).sort((a, b) => a.dumpedAt!.localeCompare(b.dumpedAt!));
  let earned = 0;
  const earningsPoints: AccumulationPoint[] = [
    { x: toMinutes(job.windowStart), y: 0, label: clock(job.windowStart) },
    ...closes.map((d): AccumulationPoint => {
      earned += d.ratePerLoad;
      return { x: toMinutes(d.dumpedAt!), y: earned, label: clock(d.dumpedAt) };
    }),
  ];

  return (
    <>
      <PageHead
        description={`${siteName(job.pickupSiteId)} → ${siteName(job.deliverySiteId)}`}
        actions={<Status state={job.status} />}
      />

      <div className="grid grid-cols-2 border-b lg:grid-cols-5">
        <Stat label="Ordered" value={String(job.loadsOrdered)} />
        <Stat label="Delivered" value={String(job.loadsDone)} sub="closed dockets" />
        <Stat label="Slots" value={String(slots.length)} sub={pit ? `${(60 / (pit.observedRatePerHour ?? pit.loadRatePerHour ?? 4)).toFixed(0)} min apart` : undefined} />
        <Stat label="Released" value={String(count('released'))} sub="no-shows" tone={count('released') ? 'warn' : 'default'} />
        <Stat label="Value" value={gyd(job.loadsDone * 37_000)} sub="at 8×4 rate" />
      </div>

      {/* ── earnings, climbing toward the target ────────────────────────── */}
      <section className="border-b px-6 py-5">
        <SectionHeading className="mb-3">Earnings today</SectionHeading>
        <AccumulationChart
          points={earningsPoints}
          target={job.loadsOrdered * 37_000}
          targetLabel="Target — 8×4 rate"
          unit="money"
        />
      </section>

      {/* ── the day ─────────────────────────────────────────────────────── */}
      <section className="border-b px-6 py-5">
        <div className="mb-3 flex flex-wrap items-center gap-4">
          <SectionHeading>The day</SectionHeading>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {(['done', 'running', 'claimed', 'open', 'released'] as SlotStatus[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={`inline-block h-3 w-3 rounded-sm ${SLOT_FILL[s].split(' ')[0]}`} />
                {SLOT_LABEL[s]} <Num>{count(s)}</Num>
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {slots.map((s) => (
            <div
              key={s.id}
              title={`${clock(s.targetTime)} · ${SLOT_LABEL[s.status]}${
                s.vehicleId ? ` · ${vehiclePlate(s.vehicleId)}` : ''
              }`}
              className={`flex h-12 w-14 flex-col items-center justify-center rounded text-[10px] leading-tight ${SLOT_FILL[s.status]}`}
            >
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{clock(s.targetTime)}</span>
              {s.vehicleId && <span className="opacity-70">{vehiclePlate(s.vehicleId).split(' ')[1]}</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ── where they are ──────────────────────────────────────────────── */}
      <section className="border-b px-6 py-5">
        <SectionHeading className="mb-3">On the ground</SectionHeading>
        <VehicleLinkedMap
          height={340}
          sites={jobSitesList.map(
            (s): MapSite => ({ id: s.id, name: s.name, kind: s.kind === 'pit' ? 'pit' : 'delivery', lat: s.lat, lng: s.lng, confirmed: true }),
          )}
          vehicles={vehiclePositions(job.id) as MapVehicle[]}
          route={route}
        />
      </section>

      {/* ── live dockets ────────────────────────────────────────────────── */}
      <section className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <SectionHeading>Dockets</SectionHeading>
          <Link href="/work/dockets" className="text-xs text-muted-foreground hover:text-foreground">
            Full feed →
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">No.</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Loaded</TableHead>
              <TableHead>Dumped</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dockets.map((d) => {
              const dr = findDriver(d.driverId);
              return (
                <TableRow key={d.id}>
                  <TableCell>
                    <Num>{d.number}</Num>
                  </TableCell>
                  <TableCell>
                    <Num>{vehiclePlate(d.vehicleId)}</Num>
                  </TableCell>
                  <TableCell>
                    <Person name={dr?.name ?? '—'} phone={dr?.phone} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <Num>{clock(d.loadedAt)}</Num>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <Num>{clock(d.dumpedAt)}</Num>
                  </TableCell>
                  <TableCell>
                    <Status state={d.status} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>
    </>
  );
}
