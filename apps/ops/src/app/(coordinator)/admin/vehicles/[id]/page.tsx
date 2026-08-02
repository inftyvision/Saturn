import { notFound } from 'next/navigation';
import {
  Badge,
  FleetMap,
  Num,
  PageHead,
  Person,
  SectionHeading,
  Stat,
  StatStrip,
  Status,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type MapSite,
  type MapVehicle,
} from '@gaia/ui';
import {
  vehicle as findVehicle,
  DRIVERS,
  DOCKETS,
  JOBS,
  DAY,
  clock,
  gyd,
  orgName,
  rateFor,
  vehicleClassLabel,
  driver as findDriver,
  driverStatus,
  vehiclePositions,
  jobSites,
} from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * `/admin/vehicles/[id]` — a vehicle and whoever is driving it, in one place.
 *
 * Reached by clicking a vehicle wherever the fleet map shows one. Combined
 * rather than split into a separate driver page: the question behind a click
 * on a marker is "who is this and what's the truck doing", not "show me an
 * org chart" — one page answers both without a second click.
 */
export default async function VehicleDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = findVehicle(id);
  if (!v) notFound();

  const d = DRIVERS.find((dr) => dr.vehicleId === v.id);
  const dockets = DOCKETS.filter((dk) => dk.vehicleId === v.id && !dk.voided).slice(-12).reverse();
  const closedCount = dockets.filter((dk) => dk.status === 'closed').length;

  const job = JOBS.find((j) => j.status === 'active');
  const position = job ? vehiclePositions(job.id).find((p) => p.vehicleId === v.id) : undefined;
  const sites = job ? jobSites(job.id) : [];

  const licenceDaysLeft = d
    ? Math.round((new Date(d.licenceExpiry).getTime() - new Date(DAY).getTime()) / 86_400_000)
    : null;
  const licenceSoon = licenceDaysLeft !== null && licenceDaysLeft < 60;

  return (
    <>
      <PageHead
        title={v.plate}
        description={`${vehicleClassLabel(v.class)} · ${orgName(v.orgId)}`}
        actions={<Badge variant={v.active ? 'outline' : 'ghost'}>{v.active ? 'Active' : 'Off road'}</Badge>}
      />

      <StatStrip>
        <Stat label="Closed today" value={String(closedCount)} />
        <Stat label="Earned today" value={gyd(closedCount * rateFor(v.class))} sub="at card rate" />
        <Stat label="Rate / load" value={gyd(rateFor(v.class))} />
      </StatStrip>

      <section className="border-b px-6 py-5">
        <SectionHeading className="mb-3">Driver</SectionHeading>
        {d ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Person name={d.name} phone={d.phone} sub={<Num>{d.licenceNo}</Num>} />
            <div className="flex items-center gap-2">
              <Badge variant={licenceSoon ? 'outline' : 'ghost'}>
                {licenceSoon ? `Licence — ${licenceDaysLeft} days` : `Licence to ${d.licenceExpiry}`}
              </Badge>
              <Status state={driverStatus(d.id)} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No driver currently assigned.</p>
        )}
      </section>

      {position && sites.length >= 2 && (
        <section className="border-b px-6 py-5">
          <SectionHeading className="mb-3">Last known position</SectionHeading>
          <FleetMap
            height={280}
            sites={sites.map(
              (s): MapSite => ({
                id: s.id,
                name: s.name,
                kind: s.kind === 'pit' ? 'pit' : 'delivery',
                lat: s.lat,
                lng: s.lng,
                confirmed: true,
              }),
            )}
            vehicles={[position] as MapVehicle[]}
          />
        </section>
      )}

      <section className="p-6">
        <SectionHeading className="mb-3">Recent dockets</SectionHeading>
        {dockets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No dockets against this vehicle yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">No.</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Loaded</TableHead>
                <TableHead>Dumped</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dockets.map((dk) => {
                const dkDriver = findDriver(dk.driverId);
                return (
                <TableRow key={dk.id}>
                  <TableCell>
                    <Num>{dk.number}</Num>
                  </TableCell>
                  <TableCell>
                    <Person name={dkDriver?.name ?? '—'} phone={dkDriver?.phone} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <Num>{clock(dk.loadedAt)}</Num>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <Num>{clock(dk.dumpedAt)}</Num>
                  </TableCell>
                  <TableCell>
                    <Status state={dk.status} />
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>
    </>
  );
}
