'use client';

/**
 * The fleet map.
 *
 * Built on MapLibre rather than Mapbox despite the spec naming Mapbox, for one
 * practical reason: MapLibre is the open fork of Mapbox GL with the same API, so
 * it renders today with no access token and no account, and swapping to Mapbox
 * later is a style URL and an import. Prototyping behind a credential nobody has
 * yet means the map is a placeholder for weeks.
 *
 * The basemap is real vector tiles now, not a raster placeholder — a
 * self-hosted Protomaps PMTiles extract (`workers/protomaps-tool`), styled
 * with Protomaps' own dark theme rather than a hand-tuned one. Same reasoning
 * as OSRM below: free forever, no account, no per-tile cost, and it happens
 * to look considerably less like a placeholder than a CDN raster tile did.
 *

 * ## What it deliberately does not do
 *
 * No ETAs, no traffic, no turn-by-turn — this is a lens on where the fleet
 * is, never a navigation surface. Routing itself is now real, not implied:
 * the `route` prop carries actual road geometry from a self-hosted OSRM
 * (`workers/osrm`) when the caller resolved one, and the corridor renders
 * that — solid, because it IS the road. Without a resolved route it falls
 * back to the honest straight line between the two sites, dashed, because
 * pretending to know the road when there is no routing engine behind it is
 * how a map starts making promises the product does not keep.
 */

import { useEffect, useRef, useState } from 'react';
import {
  Map as MlMap,
  Marker,
  Popup,
  AttributionControl,
  LngLatBounds,
  addProtocol,
  type GeoJSONSource,
} from 'maplibre-gl';
import { Protocol as PmtilesProtocol } from 'pmtiles';
import { layers as protomapsLayers, DARK as PROTOMAPS_DARK } from '@protomaps/basemaps';

/**
 * Registered once per page load, not once per map — `addProtocol` is global
 * state on the `maplibre-gl` module, and a second registration on a second
 * `FleetMap` mount is a harmless no-op, but only if it never runs from
 * inside the component. Module scope, guarded, so React Strict Mode's
 * double-invoke and every extra `FleetMap` on a page all share the one
 * registration.
 */
let pmtilesRegistered = false;
function ensurePmtilesProtocol() {
  if (pmtilesRegistered || typeof window === 'undefined') return;
  addProtocol('pmtiles', new PmtilesProtocol().tile);
  pmtilesRegistered = true;
}

export interface MapSite {
  id: string;
  name: string;
  kind: 'pit' | 'delivery';
  lat: number;
  lng: number;
  /** False → the coordinator has not drawn the boundary. Rendered dashed,
   *  because a site without a polygon cannot gate a capture and every docket
   *  there will fall to the manual override path. */
  confirmed?: boolean;
}

export interface MapVehicle {
  vehicleId: string;
  plate: string;
  lat: number;
  lng: number;
  state: string;
  docketNumber: number | null;
  driverName: string;
  ageMin: number;
  accuracy: number;
  /** Chronological `[lng, lat]` pings actually reported, oldest first — the
   *  breadcrumb behind a moving vehicle. Not a route: it is only ever where the
   *  vehicle has already been, same honesty rule as the corridor line below. */
  trail?: [number, number][];
}

/** Metres → degrees, near enough at Guyana's latitude for a 250 m boundary. */
const M_PER_DEG = 111_320;

/**
 * Read a colour off the live brand rather than hardcoding one.
 *
 * MapLibre paints with real values, not CSS variables, so the map cannot simply
 * inherit. Hardcoding the hex is how the map ended up amber after the brand went
 * lime — the one surface in the product that silently ignored a token change.
 */
function brandColor(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  // Tokens land as bare HSL triplets ("78 100% 45%"), which CSS understands
  // inside hsl() but MapLibre does not.
  return v ? (/^[\d.]+\s/.test(v) ? `hsl(${v})` : v) : fallback;
}

function circle(lng: number, lat: number, radiusM: number, steps = 48) {
  const coords: [number, number][] = [];
  const dLat = radiusM / M_PER_DEG;
  const dLng = radiusM / (M_PER_DEG * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    coords.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return coords;
}

/** A stale fix is not a position — it is a question. 15 min is the threshold the
 *  exception queue uses, so the map and the queue agree. */
const STALE_MIN = 15;

/** Compass bearing (0° = north, clockwise) from `a` to `b` — the same
 *  convention CSS `rotate()` uses, so the truck glyph's own artwork can point
 *  north and need no offset to line up with it. */
function bearingDeg(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const [lng1, lat1] = [toRad(a[0]), toRad(a[1])];
  const [lng2, lat2] = [toRad(b[0]), toRad(b[1])];
  const dLng = lng2 - lng1;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** A truck, seen from above — cab leading, box trailing — drawn pointing
 *  north (0°) so a caller can rotate the whole thing to a bearing with no
 *  correction. Filled, not outlined: at marker scale a stroke reads as fuzz. */
function truckSvg(color: string, stale: boolean): string {
  return `<svg width="18" height="22" viewBox="0 0 18 22" style="${stale ? 'opacity:.55' : ''}">
    <rect x="4" y="8" width="10" height="13" rx="1.5" fill="${color}"/>
    <rect x="5" y="1" width="8" height="8" rx="1.5" fill="${color}" opacity=".82"/>
  </svg>`;
}

export function FleetMap({
  sites,
  vehicles,
  route,
  height = 420,
  fill = false,
  showRoute = true,
  onVehicleClick,
}: {
  sites: MapSite[];
  vehicles: MapVehicle[];
  /**
   * Real road geometry between the first two `sites`, `[lng, lat]` pairs in
   * travel order — from `apps/ops/src/lib/route.ts`, which talks to a
   * self-hosted OSRM. Omit (or pass `null`, its fail-soft return) to fall
   * back to the straight-line corridor; nothing here fetches on its own,
   * since a map component reaching out to a routing engine mid-render is a
   * network call with no loading state to show for it.
   */
  route?: [number, number][] | null;
  height?: number;
  /**
   * Take every pixel the parent has left instead of a fixed height.
   *
   * The map is the coordinator's first surface — the screen they leave open —
   * and a 520px box floating in a page treats it as an illustration of the
   * fleet rather than as the fleet. Filling also drops the border and the
   * corner radius: the card already has both, and a rounded rectangle inside a
   * rounded rectangle is a picture frame.
   */
  fill?: boolean;
  showRoute?: boolean;
  /**
   * Makes a vehicle marker a link to its record instead of a dead pin.
   *
   * Opt-in: a screen that hands this in is choosing to be a doorway to detail,
   * which not every caller wants — the buyer's map and the driver's own transit
   * map have no vehicle record to send anyone to. When passed, the popup is
   * skipped for that marker; a popup that is about to be replaced by a
   * navigation is dead weight.
   */
  onVehicleClick?: (vehicleId: string) => void;
}) {
  const el = useRef<HTMLDivElement | null>(null);
  const map = useRef<MlMap | null>(null);
  const resizeObs = useRef<ResizeObserver | null>(null);
  /** Trail source/layer ids currently on the map, so a stale one can be
   *  pruned when a vehicle's trail disappears rather than left behind. */
  const trailIds = useRef<Set<string>>(new Set());
  /** Bumped once the container has a box, to re-run the init effect. */
  const [ready, setReady] = useState(0);
  /** Pending teardown from a cleanup that may turn out to be React Strict
   *  Mode's synchronous mount→cleanup→mount rehearsal rather than a real
   *  unmount — see below. */
  const removeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (removeTimer.current) {
      /**
       * Strict Mode ran this effect's cleanup and is now re-running the
       * effect, all in the same tick. Cancel the scheduled teardown and reuse
       * the map that's already there instead of destroying and rebuilding it.
       *
       * Rebuilding here used to orphan MapLibre's shared worker pool
       * mid-request: the new map's GeoJSON sources (site boundaries, the
       * corridor, vehicle trails) went permanently stuck "loading" with no
       * error, while the base raster layer — which needs no worker — kept
       * rendering fine. That split is exactly what made it easy to miss: the
       * map LOOKED like it worked.
       */
      clearTimeout(removeTimer.current);
      removeTimer.current = null;
      return;
    }
    if (!el.current || map.current) return;

    /**
     * Do not construct the map until the container has a real box.
     *
     * MapLibre sizes its canvas at construction and warns on a zero-size
     * container. With a fixed `height` that could not happen; with `fill` the
     * map is a flex child whose height depends on a parent chain that may not
     * have resolved on the frame this effect runs. Cheap to guard, and the
     * failure it guards against is a map that comes up blank.
     */
    const box = el.current.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) {
      const wait = new ResizeObserver((entries) => {
        const r = entries[0]?.contentRect;
        if (!r || r.width < 1 || r.height < 1) return;
        wait.disconnect();
        // Re-run this effect's body now that there is a box. `map.current` is
        // still null, so the guard above lets it through.
        setReady((n) => n + 1);
      });
      wait.observe(el.current);
      resizeObs.current = wait;
      return () => wait.disconnect();
    }

    const pts = [...sites, ...vehicles].map((p) => [p.lng, p.lat] as [number, number]);
    const bounds = pts.reduce(
      (b, p) => b.extend(p),
      new LngLatBounds(pts[0] ?? [-58.25, 6.6], pts[0] ?? [-58.25, 6.6]),
    );

    ensurePmtilesProtocol();

    const accent = brandColor('--primary', '#9AE600');
    const muted = brandColor('--muted-foreground', '#6B7280');
    const positive = brandColor('--primary', '#9AE600');
    const ground = brandColor('--background', '#0B0D10');

    const m = new MlMap({
      container: el.current,
      style: {
        version: 8,
        sources: {
          // Self-hosted vector tiles, not a raster basemap — real roads,
          // real place labels, styleable, and free forever: a Guyana-only
          // PMTiles extract (`workers/protomaps-tool`, see its README)
          // served as a static file from THIS app, no CDN account and no
          // per-tile cost. Same file, same origin, in both apps' `public/`.
          protomaps: {
            type: 'vector',
            url: `pmtiles://${window.location.origin}/tiles/guyana.pmtiles`,
            attribution: '© OpenStreetMap',
          },
        },
        // Protomaps' own dark theme, not a hand-rolled one — a validated,
        // professionally-designed palette beats guessing at ~70 layer
        // colours (water, parks, road casings, label halos…) from three
        // brand tokens. `layers()` generates the full stack for our source.
        layers: protomapsLayers('protomaps', PROTOMAPS_DARK, { lang: 'en' }),
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sprite: 'https://protomaps.github.io/basemaps-assets/sprites/v4/dark',
      },
      bounds,
      fitBoundsOptions: { padding: 56, maxZoom: 12 },
      attributionControl: false,
    });
    map.current = m;
    if (typeof window !== 'undefined') (window as any).__debugMap = m;
    m.on('error', (e) => console.error('[FleetMap] maplibre error', e.error, e.error?.stack));
    for (const evt of ['styledata', 'sourcedata', 'dataloading', 'style.load', 'idle', 'render']) {
      let count = 0;
      m.on(evt as any, () => {
        count++;
        if (count <= 3) console.log(`[FleetMap] event ${evt} #${count}`);
      });
    }
    // No zoom/compass widget — MapLibre's stock control is unstyled chrome
    // that doesn't wear the app's design at all, and pinch/scroll already
    // zoom without it. Attribution stays: it's the one control here that's
    // not decoration, it's the licence term for the free OSM data.
    m.addControl(new AttributionControl({ compact: true }));

    // The 2.5D tilt, applied AFTER construction rather than as a constructor
    // option. Passing `pitch` alongside `bounds` corrupts the initial camera
    // fit in this MapLibre version — the transform ends up in a state where
    // tile coverage computes to nothing and the basemap never loads, even
    // though markers (projected independently) still look fine. Levelling the
    // bounds fit first, then tilting the settled camera, avoids it. Bearing
    // stays 0 — this is still an ops tool read north-up, not a flythrough.
    m.jumpTo({ pitch: 50 });

    /**
     * Re-measure whenever the container's box changes.
     *
     * MapLibre only re-reads its canvas size on an explicit `resize()` or a
     * window resize event. A `fill` map changes size without either: opening
     * the side menu, the segment strip appearing, the sync banner growing a
     * second line. Any of those and the canvas keeps the old dimensions while
     * the container has new ones.
     *
     * Re-fits the bounds as well as resizing. A canvas that changes aspect
     * ratio keeps its centre and zoom, which on a wide desk screen leaves the
     * fleet clustered in the middle of a lot of empty water.
     */
    const ro = new ResizeObserver(() => {
      m.resize();
      if (pts.length) m.fitBounds(bounds, { padding: 56, maxZoom: 12, animate: false });
    });
    ro.observe(el.current);
    resizeObs.current = ro;

    m.on('load', () => {
      // ── site boundaries ────────────────────────────────────────────────
      m.addSource('sites', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: sites.map((s) => ({
            type: 'Feature',
            properties: { name: s.name, confirmed: s.confirmed !== false, kind: s.kind },
            geometry: { type: 'Polygon', coordinates: [circle(s.lng, s.lat, 260)] },
          })),
        },
      });
      m.addLayer({
        id: 'site-fill',
        type: 'fill',
        source: 'sites',
        paint: { 'fill-color': accent, 'fill-opacity': 0.12 },
      });
      m.addLayer({
        id: 'site-line',
        type: 'line',
        source: 'sites',
        paint: {
          'line-color': accent,
          'line-width': 1.5,
          // Dashed = boundary not drawn. Visually distinct because a job
          // cannot dispatch to one.
          'line-dasharray': ['case', ['get', 'confirmed'], ['literal', [1, 0]], ['literal', [2, 2]]],
        },
      });
      m.addLayer({
        id: 'site-label',
        type: 'symbol',
        source: 'sites',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-offset': [0, 2.4],
          'text-anchor': 'top',
        },
        paint: { 'text-color': muted, 'text-halo-color': ground, 'text-halo-width': 1.4 },
      });

      // ── the corridor ───────────────────────────────────────────────────
      if (showRoute && sites.length >= 2) {
        const hasRoute = !!route && route.length >= 2;
        m.addSource('corridor', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              // The real road when there is one; the straight line between
              // the two sites otherwise. Same source either way — only the
              // paint below tells them apart.
              coordinates: hasRoute ? route! : sites.slice(0, 2).map((s) => [s.lng, s.lat]),
            },
          },
        });
        m.addLayer({
          id: 'corridor',
          type: 'line',
          source: 'corridor',
          paint: hasRoute
            ? // Solid: this IS the road, from a real routing engine.
              { 'line-color': accent, 'line-width': 2.5, 'line-opacity': 0.8 }
            : // Dashed: a straight line between two sites, not a route.
              // Drawing it solid would imply we know the road.
              { 'line-color': muted, 'line-width': 1.2, 'line-dasharray': [3, 3] },
        }, 'site-fill');
      }
    });

    return () => {
      // Deferred rather than immediate — see the Strict Mode note at the top
      // of this effect. A real unmount still tears down normally, just one
      // tick later; a Strict Mode rehearsal cancels this before it fires.
      removeTimer.current = setTimeout(() => {
        resizeObs.current?.disconnect();
        resizeObs.current = null;
        m.remove();
        map.current = null;
        removeTimer.current = null;
      }, 0);
    };
    // Sites and the route are fixed for a given screen; vehicles update below.
    // `ready` re-runs this once the container has a box — see the top.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // ── vehicle markers ──────────────────────────────────────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const markers: Marker[] = [];

    for (const v of vehicles) {
      const stale = v.ageMin > STALE_MIN;
      const moving = v.state === 'in_transit';

      const accent = brandColor('--primary', '#9AE600');
      const muted = brandColor('--muted-foreground', '#6B7280');
      const ground = brandColor('--background', '#0B0D10');

      // Facing where it's going, not just sitting there — the bearing between
      // the last two breadcrumb points. No trail (parked, or nothing recorded
      // yet) means no known heading, so the glyph just points north rather
      // than guess.
      const trail = v.trail;
      const heading =
        trail && trail.length >= 2 ? bearingDeg(trail[trail.length - 2]!, trail[trail.length - 1]!) : 0;

      const node = document.createElement('div');
      node.style.cssText = `display:flex;align-items:center;gap:5px;cursor:${onVehicleClick ? 'pointer' : 'default'}`;
      node.innerHTML = `
        <span style="display:inline-flex;transform:rotate(${heading}deg);transform-origin:50% 50%;filter:drop-shadow(0 0 2px ${ground})">
          ${truckSvg(stale ? muted : accent, stale)}
        </span>
        <span style="font:500 10px/1 var(--gaia-font-mono, ui-monospace);color:#E7EAEE;
          background:${ground}d9;padding:3px 5px;border-radius:4px;
          white-space:nowrap">${v.plate}</span>`;

      if (onVehicleClick) {
        node.addEventListener('click', (e) => {
          e.stopPropagation();
          onVehicleClick(v.vehicleId);
        });
      }

      const marker = new Marker({ element: node }).setLngLat([v.lng, v.lat]);

      // A popup about to be replaced by a navigation is dead weight — see the
      // prop doc above.
      if (!onVehicleClick) {
        const popup = new Popup({ offset: 14, closeButton: false }).setHTML(
          `<div style="font:12px/1.5 system-ui;color:#0B0D10">
             <strong>${v.plate}</strong><br/>
             ${v.driverName}<br/>
             ${v.docketNumber ? `Docket ${v.docketNumber}<br/>` : ''}
             ${stale ? `<span style="color:#8a6d1f">No fix for ${v.ageMin} min</span>` : `±${Math.round(v.accuracy)} m`}
           </div>`,
        );
        marker.setPopup(popup);
      }

      markers.push(marker.addTo(m));
    }

    // ── breadcrumb trails ────────────────────────────────────────────────
    // Sources persist across renders (updated via setData) so a growing trail
    // doesn't flicker; only pruned when a vehicle's trail actually disappears.
    const paintTrails = () => {
      const accent = brandColor('--primary', '#9AE600');
      const active = new Set<string>();

      for (const v of vehicles) {
        if (!v.trail || v.trail.length < 2) continue;
        const id = `trail-${v.vehicleId}`;
        active.add(id);
        const data = {
          type: 'Feature' as const,
          properties: {},
          geometry: { type: 'LineString' as const, coordinates: v.trail },
        };
        const src = m.getSource(id) as GeoJSONSource | undefined;
        if (src) {
          src.setData(data);
        } else {
          m.addSource(id, { type: 'geojson', data });
          m.addLayer({
            id,
            type: 'line',
            source: id,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': accent, 'line-width': 2.5, 'line-opacity': 0.85 },
          });
        }
      }

      for (const id of trailIds.current) {
        if (active.has(id)) continue;
        if (m.getLayer(id)) m.removeLayer(id);
        if (m.getSource(id)) m.removeSource(id);
      }
      trailIds.current = active;
    };

    if (m.isStyleLoaded()) paintTrails();
    else m.once('load', paintTrails);

    return () => markers.forEach((mk) => mk.remove());
  }, [vehicles, onVehicleClick]);

  return (
    <div
      ref={el}
      style={fill ? undefined : { height }}
      className={`w-full overflow-hidden [&_.maplibregl-ctrl-attrib]:text-[10px] ${
        fill ? 'min-h-0 flex-1' : 'rounded-lg border'
      }`}
    />
  );
}

/**
 * The marker legend, over the map it explains.
 *
 * Three surfaces draw a fleet now — the coordinator's, the hauler's and the
 * contractor's — and the legend is identical on all three because the marker
 * colours are. Copied it would be three chances to explain the same dot three
 * different ways.
 *
 * Positioned TOP left by the caller, not bottom: the bottom-left corner is not
 * ours. Next's dev-tools badge parks there, and on a phone that is where the
 * home indicator lives.
 *
 * The swatches are the only hardcoded colours in the library, and they are the
 * same constants the markers are drawn with — a legend that read `--primary`
 * while the markers were drawn green would be a legend that lies. When these
 * move to brand tokens, both move together.
 */
export function MapLegend({ boundaries = true }: { boundaries?: boolean }) {
  const rows: [string, string, boolean?][] = [
    ['#22C55E', 'At a site'],
    ['#E8A33D', 'In transit'],
    ['#6B7280', 'No recent fix'],
  ];
  return (
    <div
      className="pointer-events-none absolute left-5 top-5 z-10 hidden flex-col gap-1.5 rounded-lg px-3 py-2.5 text-[11px] text-muted-foreground backdrop-blur-md sm:flex"
      style={{ background: 'color-mix(in srgb, hsl(var(--background)) 70%, transparent)' }}
    >
      {rows.map(([colour, label]) => (
        <span key={label} className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: colour, opacity: label === 'No recent fix' ? 0.6 : 1 }}
          />
          {label}
        </span>
      ))}
      {boundaries && (
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm border border-dashed border-[#E8A33D]" />
          Boundary not drawn
        </span>
      )}
    </div>
  );
}
