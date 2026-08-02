import { FleetMap, MapLegend, Meter, Num, Stat, StatStrip, type MapSite, type MapVehicle } from '@gaia/ui';
import {
  vehiclePositions,
  jobSites,
  JOBS,
  ORDERS,
  deliveredFor,
  materialName,
  buyerSite,
} from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * Where the contractor's delivery is.
 *
 * The single most-asked question this product exists to answer, and until now
 * the app could not answer it — only the WhatsApp tracking link could. That was
 * backwards: `/o/[token]` exists so somebody WITHOUT an account can see this,
 * not so the account holder has to go find their own link.
 *
 * Taking the "where" slot cost nothing. Sites moved to the side menu, where it
 * belongs — a contractor adds a delivery site once and then orders to it for
 * months, so it is a management surface, not a destination.
 *
 * ## What it must not become
 *
 * No ETA, anywhere. The agent's own script refuses this in words ("I can tell
 * you where the trucks are, not when they will be with you") and the map must
 * not contradict it by drawing a route with a time on it. In a
 * supply-constrained market an over-promising surface is worse than none: it
 * converts a scheduling problem into a broken commitment, and the VENDOR wears
 * it, under the vendor's own brand.
 *
 * So: positions, a count, and the pattern so far. No line that implies a road,
 * no number that implies an arrival.
 */
export default function BuyerMapPage() {
  const order = ORDERS.find((o) => o.jobId)!;
  const job = JOBS.find((j) => j.id === order.jobId)!;
  const sites = jobSites(job.id);
  const vehicles = vehiclePositions(job.id);
  const site = buyerSite(order.deliverySiteId);
  /**
   * The count comes from the ORDER, not the job.
   *
   * A job is the yard's unit of work and can carry several buyers' orders — 54
   * loads here, of which this contractor's order is 20. Reading `job.loadsDone`
   * would have shown a contractor somebody else's deliveries, and made this
   * screen disagree with the Orders list two taps away. On a product whose
   * whole proposition is a count you can trust, two screens disagreeing about
   * the count is the worst bug available.
   *
   * `deliveredFor` is the same helper the Orders list uses, for that reason.
   */
  const done = deliveredFor(order);

  const mapSites: MapSite[] = sites.map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.kind === 'pit' ? 'pit' : 'delivery',
    lat: s.lat,
    lng: s.lng,
    confirmed: true,
  }));

  const mapVehicles: MapVehicle[] = vehicles.map((v) => ({
    vehicleId: v.vehicleId,
    plate: v.plate,
    lat: v.lat,
    lng: v.lng,
    state: v.state,
    docketNumber: v.docketNumber,
    driverName: v.driverName,
    ageMin: v.ageMin,
    accuracy: v.accuracy,
  }));

  const onRoad = vehicles.filter((v) => v.state === 'in_transit');
  const atSite = vehicles.filter((v) => v.state === 'at_pit' || v.state === 'at_site');

  return (
    <>
      <div className="shrink-0">
        <StatStrip>
          <Stat label="Delivered" value={String(done)} sub={`of ${order.loadsRequested}`} />
          <Stat label="On the road" value={String(onRoad.length)} />
          <Stat label="At a site" value={String(atSite.length)} sub="loading or dumping" />
        </StatStrip>
        <div className="px-5 py-3 lg:px-6">
          <p className="mb-2 text-xs text-muted-foreground">
            {materialName(job.materialId)} to {site?.name ?? '—'}
          </p>
          <Meter
            value={done}
            max={order.loadsRequested}
            caption={
              <>
                <Num>{order.loadsRequested - done}</Num> still to come. Every load is photographed
                at the pit and at your site.
              </>
            }
          />
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <FleetMap sites={mapSites} vehicles={mapVehicles} fill />
        {/* No boundary row: a contractor is not the one who draws polygons, and
            a legend entry for a state they cannot act on is noise. */}
        <MapLegend boundaries={false} />
      </div>
    </>
  );
}
