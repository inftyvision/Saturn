import { MapLegend, Num, Person, Stat, StatStrip, type MapSite } from '@gaia/ui';
import { vehiclePositions, jobSites, JOBS, materialName, DRIVERS } from '@gaia/core';
import { LiveFleetMap } from '@/features/map/LiveFleetMap';
import { fetchRoute } from '@/lib/route';

export const dynamic = 'force-dynamic';

/**
 * Where the fleet is. The first surface, and the one a coordinator leaves open.
 *
 * Worth being explicit that this was OUT OF SCOPE in spec v5 and is not listed
 * in v7's coordinator screens — the argument being that a tally you can trust
 * beats a map you can watch, and a live map invites the dispatch-optimisation
 * work the scope section refuses. That argument still holds for what this is
 * ALLOWED to become: no ETAs, no assignment from the map. Routing is the one
 * exception — the corridor now draws a real road when `workers/osrm` is up,
 * because a coordinator seeing where the road actually runs is triage, not
 * dispatch; it still falls back to the honest straight line when it isn't.
 *
 * What it does earn is exception triage. A stale fix, a vehicle sitting outside
 * a boundary it claims to be inside, a gap in the corridor — those are far
 * faster to see than to read, and they are already exception rows. The map is a
 * lens on the queue, not a control surface.
 *
 * Position is DERIVED from each vehicle's live docket rather than stored
 * separately. A map whose markers disagree with the docket feed is worse than
 * no map.
 *
 * ## The layout
 *
 * Four figures pinned at the top, and the map takes every pixel below them. It
 * used to be a 520px box inside a padded page, under a title that repeated what
 * the chrome already said — which framed the fleet as an illustration rather
 * than as the thing the screen is for.
 *
 * The two paragraphs that used to sit under the map are gone with it. One
 * explained where positions come from and one explained why there is no route
 * line; both are permanent facts about the map, and a permanent fact restated
 * under every render is a caption nobody reads twice. They live in
 * `docs/architecture.md` and in this comment, which is where the person who
 * needs them is.
 *
 * The stale-fix list survived, because it is not a caption — it is the exception
 * queue, on the surface where you would spot it.
 */
export default async function FleetMapPage() {
  const job = JOBS.find((j) => j.status === 'active')!;
  const vehicles = vehiclePositions(job.id);
  const sites = jobSites(job.id);
  const route = sites[0] && sites[1] ? await fetchRoute(sites[0], sites[1]) : null;

  const mapSites: MapSite[] = sites.map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.kind === 'pit' ? 'pit' : 'delivery',
    lat: s.lat,
    lng: s.lng,
    confirmed: true,
  }));

  const stale = vehicles.filter((v) => v.ageMin > 15);
  const moving = vehicles.filter((v) => v.state === 'in_transit');
  const atSite = vehicles.filter((v) => v.state === 'at_pit' || v.state === 'at_site');

  return (
    <>
      <div className="shrink-0">
        <StatStrip>
          <Stat label="On the road" value={String(moving.length)} />
          <Stat label="At a site" value={String(atSite.length)} sub="loading or dumping" />
          <Stat label="Returning" value={String(vehicles.length - moving.length - atSite.length)} />
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

      {/* The overlays are positioned against the MAP, not the card — anchored
          to the card they sat on top of the stats strip, which is above it. */}
      <div className="relative flex min-h-0 flex-1 flex-col">
      <LiveFleetMap sites={mapSites} vehicles={vehicles} route={route} fill linkVehicles />

      <MapLegend />

      {/* The exception queue, over the map on the right. Not a caption — these
          are the rows a coordinator is scanning the map to find. Bottom right
          clears the bar (which is centred) and the zoom controls (top right). */}
      {stale.length > 0 && (
        <div
          className="absolute bottom-5 right-5 z-10 hidden max-w-[320px] rounded-lg px-3.5 py-3 backdrop-blur-md lg:block"
          style={{ background: 'color-mix(in srgb, hsl(var(--background)) 70%, transparent)' }}
        >
          <p className="kicker">No recent fix</p>
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
                    last fix <Num>{v.ageMin}</Num> min ago · ±<Num>{Math.round(v.accuracy)}</Num> m
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
