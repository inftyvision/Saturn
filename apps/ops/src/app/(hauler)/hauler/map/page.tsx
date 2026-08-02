import { MapLegend, Num, Person, Stat, StatStrip, type MapSite } from '@gaia/ui';
import { vehiclePositions, jobSites, JOBS, COORDINATOR_ORG, DOCKETS, materialName, DRIVERS } from '@gaia/core';
import { LiveFleetMap } from '@/features/map/LiveFleetMap';
import { fetchRoute } from '@/lib/route';

export const dynamic = 'force-dynamic';

/**
 * Where the hauler's OWN trucks are.
 *
 * New with the three-slot grammar, and it earns the slot rather than filling
 * it: a hauler's first question of the day is where its trucks are and which
 * are earning, and until now the surface had no way to ask. It had a list of
 * available work and a list of closed dockets — both answers to "what
 * happened", neither to "where is it".
 *
 * ⚠ PROTOTYPE SCOPE. Saturn holds coordinator AND hauler simultaneously (§"Who
 * uses it"), so in phase 1 this shows the same fleet the coordinator's map
 * does. A subcontractor sees the identical screen scoped to its own org — the
 * filter below is on `haulerOrgId`, which is the real boundary, so nothing
 * about this screen changes when that day arrives except which rows come back.
 *
 * Same derivation rule as everywhere: positions come from each vehicle's LIVE
 * DOCKET, never stored separately. A hauler's map and the coordinator's cannot
 * disagree, because they are reading the same rows.
 */
export default async function HaulerMapPage() {
  const job = JOBS.find((j) => j.status === 'active')!;
  const sites = jobSites(job.id);
  const route = sites[0] && sites[1] ? await fetchRoute(sites[0], sites[1]) : null;

  // Scoped to this hauler's own dockets. Today that is every one of them.
  const mine = new Set(
    DOCKETS.filter((d) => d.haulerOrgId === COORDINATOR_ORG).map((d) => d.vehicleId),
  );
  const vehicles = vehiclePositions(job.id).filter((v) => mine.has(v.vehicleId));

  const mapSites: MapSite[] = sites.map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.kind === 'pit' ? 'pit' : 'delivery',
    lat: s.lat,
    lng: s.lng,
    confirmed: true,
  }));

  const earning = vehicles.filter((v) => v.docketNumber !== null);
  const stale = vehicles.filter((v) => v.ageMin > 15);

  return (
    <>
      <div className="shrink-0">
        <StatStrip>
          <Stat label="On a docket" value={String(earning.length)} sub="earning now" />
          <Stat label="Idle" value={String(vehicles.length - earning.length)} />
          <Stat
            label="No recent fix"
            value={String(stale.length)}
            sub="over 15 min"
            tone={stale.length ? 'warn' : 'default'}
          />
        </StatStrip>
        <p className="px-5 py-2 text-xs text-muted-foreground lg:px-6">
          {materialName(job.materialId)} — {sites[0]?.name} to {sites[1]?.name}
        </p>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <LiveFleetMap sites={mapSites} vehicles={vehicles} route={route} fill />
        <MapLegend />

        {stale.length > 0 && (
          <div
            className="absolute bottom-5 right-5 z-10 hidden max-w-[300px] rounded-lg px-3.5 py-3 backdrop-blur-md lg:block"
            style={{ background: 'color-mix(in srgb, hsl(var(--background)) 70%, transparent)' }}
          >
            <p className="kicker">Not reporting</p>
            <ul className="mt-1.5 divide-y">
              {stale.map((v) => {
                const dr = DRIVERS.find((d) => d.vehicleId === v.vehicleId);
                return (
                  <li key={v.vehicleId} className="py-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <Num>{v.plate}</Num>
                      <Person name={v.driverName} phone={dr?.phone} size={20} />
                    </div>
                    <span className="block text-muted-foreground">
                      last fix <Num>{v.ageMin}</Num> min ago
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
