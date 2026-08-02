import 'server-only';

/**
 * The real road between two points — read `workers/osrm/README.md` first.
 *
 * A self-hosted OSRM instance, not a product dependency: `FleetMap` draws
 * its honest straight "not a route" line by default, and this only replaces
 * that line when a route actually resolves. Nothing here assumes the
 * container is running — a coordinator's map must not go blank because a
 * dev-only routing engine isn't up on this particular machine.
 */

const OSRM_URL = process.env.OSRM_URL ?? 'http://localhost:5555';

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * The route geometry between `a` and `b`, as `[lng, lat]` pairs in travel
 * order — the shape `FleetMap`'s `route` prop and GeoJSON both already use.
 * `null` on anything short of a full, valid OSRM response: unreachable
 * container, a 4xx/5xx, no route found, malformed geometry. The caller's job
 * is to fall back, not to know why.
 */
export async function fetchRoute(a: LatLng, b: LatLng): Promise<[number, number][] | null> {
  const url = `${OSRM_URL}/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      code?: string;
      routes?: { geometry?: { coordinates?: unknown } }[];
    };
    if (data.code !== 'Ok') return null;
    const coords = data.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return null;
    return coords as [number, number][];
  } catch {
    // Container not running, network hiccup, malformed JSON — all the same
    // outcome from here: no route this time.
    return null;
  }
}
