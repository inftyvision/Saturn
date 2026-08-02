import type {
  Docket,
  Driver,
  DeviceRec,
  ExceptionRec,
  Job,
  Material,
  Org,
  Site,
  Slot,
  Statement,
  Vehicle,
  VehicleClass,
} from '../types';
import { VEHICLE_CLASS_LABEL, type DocketStatus } from '../types';

/**
 * A day in the life of Saturn's fleet, Guyana.
 *
 * Grounded on purpose — real corridors (Soesdyke–Linden for sand, Eccles and
 * Providence for delivery), plausible plates, GYD rates from spec §14's
 * "GYD 500–1,000 on a GYD 37,000 load". Generic placeholder data would let a
 * layout look fine while hiding that a plate column is too narrow or that
 * GYD totals run to seven figures.
 *
 * Fixed clock: every timestamp derives from `DAY` below, so screenshots are
 * reproducible and nothing depends on when the dev server started.
 */

/** The prototype's "today", 06:00 local (Guyana is UTC-4, no DST). */
export const DAY = '2026-08-03';
const at = (hhmm: string) => `${DAY}T${hhmm}:00-04:00`;

export const NOW = at('11:20');

// ── orgs ─────────────────────────────────────────────────────────────────────

export const ORGS: Org[] = [
  { id: 'org_saturn', name: 'Saturn Mining & Haulage', kinds: ['coordinator', 'hauler'], brandColor: '#FF6A00' },
  { id: 'org_rampersaud', name: 'Rampersaud Vehicleing', kinds: ['hauler'] },
  { id: 'org_bk', name: 'BK Construction', kinds: ['buyer'] },
  { id: 'org_nordstar', name: 'NordStar Aggregates', kinds: ['coordinator'] },
];

export const COORDINATOR_ORG = 'org_saturn';

export const orgName = (id: string | null) => ORGS.find((o) => o.id === id)?.name ?? '—';

// ── sites ────────────────────────────────────────────────────────────────────

export const SITES: Site[] = [
  {
    id: 'site_yarrowkabra',
    orgId: null,
    kind: 'pit',
    name: 'Yarrowkabra Sand Pit',
    lat: 6.4531,
    lng: -58.2694,
    loadRatePerHour: 6,
    observedRatePerHour: 5.2,
  },
  {
    id: 'site_kuru',
    orgId: null,
    kind: 'pit',
    name: 'Kuru Kururu Pit',
    lat: 6.4008,
    lng: -58.2211,
    loadRatePerHour: 4,
    observedRatePerHour: null,
  },
  {
    id: 'site_eccles',
    orgId: 'org_bk',
    kind: 'delivery',
    name: 'Eccles Housing Scheme — Block C',
    lat: 6.8342,
    lng: -58.1783,
    loadRatePerHour: null,
    observedRatePerHour: null,
  },
  {
    id: 'site_providence',
    orgId: 'org_bk',
    kind: 'delivery',
    name: 'Providence — East Bank Road Widening',
    lat: 6.8611,
    lng: -58.1697,
    loadRatePerHour: null,
    observedRatePerHour: null,
  },
];

export const site = (id: string) => SITES.find((s) => s.id === id);
export const siteName = (id: string) => site(id)?.name ?? '—';

// ── materials ────────────────────────────────────────────────────────────────

export const MATERIALS: Material[] = [
  { id: 'mat_white', code: 'WS', name: 'White sand' },
  { id: 'mat_builders', code: 'BS', name: "Builder's sand" },
  { id: 'mat_loam', code: 'LM', name: 'Loam' },
  { id: 'mat_crusher', code: 'CR', name: 'Crusher run' },
  { id: 'mat_half', code: 'ST12', name: 'Stone ½"' },
];

export const materialName = (id: string) => MATERIALS.find((m) => m.id === id)?.name ?? '—';

// ── fleet ────────────────────────────────────────────────────────────────────

export const VEHICLES: Vehicle[] = [
  { id: 'trk_47', orgId: 'org_saturn', plate: 'GRR 4471', class: '8x4_chinese', active: true },
  { id: 'trk_12', orgId: 'org_saturn', plate: 'GWW 1120', class: '8x4_chinese', active: true },
  { id: 'trk_08', orgId: 'org_saturn', plate: 'GXX 0813', class: '6x4', active: true },
  { id: 'trk_31', orgId: 'org_saturn', plate: 'GPP 3106', class: 'tandem', active: true },
  { id: 'trk_55', orgId: 'org_saturn', plate: 'GRR 5502', class: '8x4_other', active: true },
  { id: 'trk_63', orgId: 'org_saturn', plate: 'GTT 6390', class: '6x4', active: false },
  { id: 'trk_r1', orgId: 'org_rampersaud', plate: 'GLL 2288', class: 'trailer', active: true },
];

export const vehicle = (id: string) => VEHICLES.find((t) => t.id === id);
export const vehiclePlate = (id: string) => vehicle(id)?.plate ?? '—';

export const DRIVERS: Driver[] = [
  { id: 'drv_a', orgId: 'org_saturn', name: 'Ravi Persaud', phone: '+592 612 4471', licenceNo: 'GY-118422', licenceExpiry: '2027-03-14', vehicleId: 'trk_47' },
  { id: 'drv_b', orgId: 'org_saturn', name: 'Devon Adams', phone: '+592 641 9022', licenceNo: 'GY-104883', licenceExpiry: '2026-09-02', vehicleId: 'trk_12' },
  { id: 'drv_c', orgId: 'org_saturn', name: 'Shivnarine Bhola', phone: '+592 683 1147', licenceNo: 'GY-127004', licenceExpiry: '2028-01-20', vehicleId: 'trk_08' },
  { id: 'drv_d', orgId: 'org_saturn', name: 'Marlon Fraser', phone: '+592 620 7735', licenceNo: 'GY-099411', licenceExpiry: '2026-08-28', vehicleId: 'trk_31' },
  { id: 'drv_e', orgId: 'org_saturn', name: 'Kelvin Singh', phone: '+592 655 3390', licenceNo: 'GY-131255', licenceExpiry: '2027-11-05', vehicleId: 'trk_55' },
];

export const driver = (id: string) => DRIVERS.find((d) => d.id === id);
export const driverName = (id: string) => driver(id)?.name ?? '—';

/** The signed-in driver for the prototype's driver route group. */
export const CURRENT_DRIVER = 'drv_a';

/**
 * The person at the desk for the coordinator and hauler route groups — same
 * person, both hats, matching §"Who uses it": Saturn holds both roles, and
 * one dispatcher works both screens. Distinct from `ORGS`'s Saturn record on
 * purpose: `AppShell`'s `identity` is WHICH ORG a screen is scoped to (used
 * in the header's breadcrumb fallback and the bar itself), never who is
 * sitting at it — conflating the two is what made the menu profile show an
 * org's name over an avatar as if a COMPANY had logged in.
 */
export const CURRENT_COORDINATOR_USER = 'Priya Sookdeo';

export const DEVICES: DeviceRec[] = [
  { id: 'dev_1', orgId: 'org_saturn', driverId: 'drv_a', platform: 'android', osVersion: '13', lastSyncAt: at('11:04'), blockRemaining: 38, blockRange: '4501–4550' },
  { id: 'dev_2', orgId: 'org_saturn', driverId: 'drv_b', platform: 'android', osVersion: '12', lastSyncAt: at('10:52'), blockRemaining: 41, blockRange: '4551–4600' },
  { id: 'dev_3', orgId: 'org_saturn', driverId: 'drv_c', platform: 'android', osVersion: '13', lastSyncAt: at('08:31'), blockRemaining: 12, blockRange: '4601–4650' },
  { id: 'dev_4', orgId: 'org_saturn', driverId: 'drv_d', platform: 'android', osVersion: '11', lastSyncAt: null, blockRemaining: 50, blockRange: '4651–4700' },
  { id: 'dev_5', orgId: 'org_saturn', driverId: 'drv_e', platform: 'android', osVersion: '13', lastSyncAt: at('11:12'), blockRemaining: 27, blockRange: '4701–4750' },
];

// ── rates ────────────────────────────────────────────────────────────────────

export const RATE_CARD: Array<{ class: VehicleClass; ratePerLoad: number }> = [
  { class: '6x4', ratePerLoad: 28_000 },
  { class: '8x4_chinese', ratePerLoad: 37_000 },
  { class: '8x4_other', ratePerLoad: 39_000 },
  { class: 'tandem', ratePerLoad: 46_000 },
  { class: 'trailer', ratePerLoad: 62_000 },
];

export const rateFor = (c: VehicleClass) => RATE_CARD.find((r) => r.class === c)?.ratePerLoad ?? 0;

// ── jobs ─────────────────────────────────────────────────────────────────────

export const JOBS: Job[] = [
  {
    id: 'job_1',
    coordinatorOrgId: 'org_saturn',
    buyerOrgId: 'org_bk',
    materialId: 'mat_white',
    pickupSiteId: 'site_yarrowkabra',
    deliverySiteId: 'site_eccles',
    windowStart: at('08:00'),
    windowEnd: at('17:00'),
    loadsOrdered: 54,
    loadsDone: 17,
    status: 'active',
    trackToken: 'tk_9f2a41c7',
    rates: RATE_CARD,
  },
  {
    id: 'job_2',
    coordinatorOrgId: 'org_saturn',
    buyerOrgId: 'org_bk',
    materialId: 'mat_crusher',
    pickupSiteId: 'site_kuru',
    deliverySiteId: 'site_providence',
    windowStart: at('07:00'),
    windowEnd: at('16:00'),
    loadsOrdered: 36,
    loadsDone: 36,
    status: 'closed',
    trackToken: 'tk_4b81de20',
    rates: RATE_CARD,
  },
  {
    id: 'job_3',
    coordinatorOrgId: 'org_saturn',
    buyerOrgId: null,
    materialId: 'mat_builders',
    pickupSiteId: 'site_yarrowkabra',
    deliverySiteId: 'site_providence',
    windowStart: `2026-08-04T08:00:00-04:00`,
    windowEnd: `2026-08-04T17:00:00-04:00`,
    loadsOrdered: 40,
    loadsDone: 0,
    status: 'open',
    trackToken: 'tk_77c0aa19',
    rates: RATE_CARD,
  },
  {
    id: 'job_4',
    coordinatorOrgId: 'org_saturn',
    buyerOrgId: null,
    materialId: 'mat_loam',
    pickupSiteId: 'site_kuru',
    deliverySiteId: 'site_eccles',
    windowStart: `2026-08-05T08:00:00-04:00`,
    windowEnd: `2026-08-05T15:00:00-04:00`,
    loadsOrdered: 20,
    loadsDone: 0,
    status: 'draft',
    trackToken: 'tk_1de55b03',
    rates: RATE_CARD,
  },
];

export const job = (id: string) => JOBS.find((j) => j.id === id);

// ── slots (§10) ──────────────────────────────────────────────────────────────

/**
 * Slot generation, per §10: spacing is `60 / load_rate` minutes across the
 * window, and the OBSERVED rate replaces the entered one once a pit has enough
 * dockets behind it.
 *
 * Implemented properly rather than hardcoded, because the count it produces is
 * the thing a coordinator sanity-checks when posting a job — "6/hour over 9
 * hours yields 54 slots at 10-minute intervals" is the spec's own worked
 * example, and a screen that quietly disagrees with it is worse than no screen.
 */
export function generateSlots(j: Job): Slot[] {
  const pit = site(j.pickupSiteId);
  const rate = pit?.observedRatePerHour ?? pit?.loadRatePerHour ?? 4;
  const spacingMin = 60 / rate;
  const start = new Date(j.windowStart).getTime();
  const end = new Date(j.windowEnd).getTime();
  const count = Math.floor((end - start) / (spacingMin * 60_000));

  return Array.from({ length: count }, (_, i) => {
    const t = new Date(start + i * spacingMin * 60_000);
    return {
      id: `${j.id}_slot_${i + 1}`,
      jobId: j.id,
      targetTime: t.toISOString(),
      haulerOrgId: null,
      vehicleId: null,
      status: 'open' as const,
    };
  });
}

/** The active job's slots, with a plausible morning already behind them. */
export function slotsForJob(j: Job): Slot[] {
  const slots = generateSlots(j);
  if (j.status !== 'active') return slots;
  const fleet = VEHICLES.filter((t) => t.orgId === 'org_saturn' && t.active);
  return slots.map((s, i) => {
    const t = new Date(s.targetTime).getTime();
    const now = new Date(NOW).getTime();
    if (i === 9) return { ...s, status: 'released', haulerOrgId: 'org_saturn', vehicleId: null };
    if (t < now - 20 * 60_000) {
      return { ...s, status: 'done', haulerOrgId: 'org_saturn', vehicleId: fleet[i % fleet.length].id };
    }
    if (t < now + 30 * 60_000) {
      return { ...s, status: 'running', haulerOrgId: 'org_saturn', vehicleId: fleet[i % fleet.length].id };
    }
    if (i % 3 !== 2) {
      return { ...s, status: 'claimed', haulerOrgId: 'org_saturn', vehicleId: fleet[i % fleet.length].id };
    }
    return s;
  });
}

// ── dockets ──────────────────────────────────────────────────────────────────

const DOCKET_SEED: Array<[number, string, string, string, string | null, boolean]> = [
  // number, vehicle, driver, closedAt (or in-flight status), photo label, override
  [4501, 'trk_47', 'drv_a', '08:14', 'load', false],
  [4502, 'trk_12', 'drv_b', '08:26', 'load', false],
  [4503, 'trk_08', 'drv_c', '08:41', 'load', false],
  [4504, 'trk_31', 'drv_d', '08:58', 'load', true],
  [4505, 'trk_55', 'drv_e', '09:09', 'load', false],
  [4506, 'trk_47', 'drv_a', '09:22', 'load', false],
  [4507, 'trk_12', 'drv_b', '09:35', 'load', false],
  [4508, 'trk_08', 'drv_c', '09:47', 'load', false],
  [4509, 'trk_31', 'drv_d', '10:02', 'load', false],
  [4510, 'trk_55', 'drv_e', '10:15', 'load', false],
  [4511, 'trk_47', 'drv_a', '10:28', 'load', false],
  [4512, 'trk_12', 'drv_b', '10:39', 'load', true],
  [4513, 'trk_08', 'drv_c', '10:51', 'load', false],
  [4514, 'trk_31', 'drv_d', '11:03', 'load', false],
  [4515, 'trk_55', 'drv_e', '11:11', 'load', false],
];

function closedDocket([number, vehicleId, driverId, hhmm, , override]: (typeof DOCKET_SEED)[number]): Docket {
  const t = vehicle(vehicleId)!;
  const loadedAt = at(hhmm);
  const dumpedAt = at(addMin(hhmm, 42));
  return {
    id: `dk_${number}`,
    number,
    jobId: 'job_1',
    vehicleId,
    driverId,
    haulerOrgId: t.orgId,
    status: 'closed',
    vehicleClass: t.class,
    ratePerLoad: rateFor(t.class),
    pitArrivedAt: at(addMin(hhmm, -11)),
    loadedAt,
    siteArrivedAt: at(addMin(hhmm, 36)),
    dumpedAt,
    loadPhoto: `pit/${number}`,
    dumpPhoto: `dump/${number}`,
    voided: false,
    voidReason: null,
    manualOverride: override,
  };
}

function addMin(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + mins;
  const hh = Math.floor(total / 60) % 24;
  return `${String(hh).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Two dockets mid-cycle right now — the live rows a coordinator watches. */
const IN_FLIGHT: Docket[] = [
  {
    id: 'dk_4516',
    number: 4516,
    jobId: 'job_1',
    vehicleId: 'trk_47',
    driverId: 'drv_a',
    haulerOrgId: 'org_saturn',
    status: 'in_transit',
    vehicleClass: '8x4_chinese',
    ratePerLoad: 37_000,
    pitArrivedAt: at('11:02'),
    loadedAt: at('11:14'),
    siteArrivedAt: null,
    dumpedAt: null,
    loadPhoto: 'pit/4516',
    dumpPhoto: null,
    voided: false,
    voidReason: null,
    manualOverride: false,
  },
  {
    id: 'dk_4517',
    number: 4517,
    jobId: 'job_1',
    vehicleId: 'trk_12',
    driverId: 'drv_b',
    haulerOrgId: 'org_saturn',
    status: 'at_pit',
    vehicleClass: '8x4_chinese',
    ratePerLoad: 37_000,
    pitArrivedAt: at('11:17'),
    loadedAt: null,
    siteArrivedAt: null,
    dumpedAt: null,
    loadPhoto: null,
    dumpPhoto: null,
    voided: false,
    voidReason: null,
    manualOverride: false,
  },
];

const VOIDED: Docket = {
  ...closedDocket([4498, 'trk_08', 'drv_c', '07:52', 'load', false]),
  id: 'dk_4498',
  number: 4498,
  voided: true,
  voidReason: 'Wrong delivery site — reissued as 4503',
};

export const DOCKETS: Docket[] = [VOIDED, ...DOCKET_SEED.map(closedDocket), ...IN_FLIGHT];

export const closedDockets = () => DOCKETS.filter((d) => d.status === 'closed' && !d.voided);
export const liveDockets = () => DOCKETS.filter((d) => d.status !== 'closed' && !d.voided);

/** A driver has never reported a status field of its own — it is derived, same
 *  rule as vehicle position, so it cannot disagree with the docket feed or the
 *  device's own sync clock. `DEVICE_STALE_MIN` is a longer window than the
 *  GPS-fix staleness the map uses: a device that hasn't synced in half an hour
 *  is a different, slower kind of "gone quiet" than a 15-minute-old GPS fix. */
const DEVICE_STALE_MIN = 30;

export function driverStatus(driverId: string): 'online' | 'busy' | 'inactive' {
  if (liveDockets().some((d) => d.driverId === driverId)) return 'busy';
  const dev = DEVICES.find((dv) => dv.driverId === driverId);
  if (!dev?.lastSyncAt) return 'inactive';
  const ageMin = (new Date(NOW).getTime() - new Date(dev.lastSyncAt).getTime()) / 60_000;
  return ageMin <= DEVICE_STALE_MIN ? 'online' : 'inactive';
}

/** §5/§11 — the number that decides whether "an indisputable tally" is true. */
export function overrideRate(): number {
  const closed = closedDockets();
  if (!closed.length) return 0;
  return closed.filter((d) => d.manualOverride).length / closed.length;
}

// ── exceptions ───────────────────────────────────────────────────────────────

export const EXCEPTIONS: ExceptionRec[] = [
  { id: 'ex_1', kind: 'geofence_disagreement', entity: 'Docket', entityId: '4512', detail: 'Client reported at_pit 10:31, server derived 10:36 from ping stream', occurredAt: at('10:39'), status: 'open' },
  { id: 'ex_2', kind: 'manual_override', entity: 'Docket', entityId: '4504', detail: 'Driver closed manually — reason: "no signal at dump, geofence never fired"', occurredAt: at('09:02'), status: 'open' },
  { id: 'ex_3', kind: 'no_show', entity: 'Slot', entityId: 'job_1_slot_10', detail: 'Target 09:30, no vehicle on the ground by 09:50 — released', occurredAt: at('09:50'), status: 'resolved' },
  { id: 'ex_4', kind: 'stale_gps', entity: 'Vehicle', entityId: 'GPP 3106', detail: 'No ping for 34 minutes; last fix 3.1 km from Yarrowkabra', occurredAt: at('10:44'), status: 'open' },
  { id: 'ex_5', kind: 'unused_number', entity: 'DocketBlock', entityId: '4601–4650', detail: '4602 allocated 08:20, never burned. Soft signal — paper books have gaps too.', occurredAt: at('11:00'), status: 'open' },
  { id: 'ex_6', kind: 'low_accuracy', entity: 'Docket', entityId: '4515', detail: 'Load photo fix accuracy 78 m — recorded, no transition triggered', occurredAt: at('11:11'), status: 'resolved' },
];

// ── statements ───────────────────────────────────────────────────────────────

export const STATEMENTS: Statement[] = [
  { id: 'st_1', issuerOrgId: 'org_saturn', counterpartyOrgId: 'org_rampersaud', periodStart: '2026-07-01', periodEnd: '2026-07-31', docketCount: 212, total: 7_844_000, status: 'issued' },
  { id: 'st_2', issuerOrgId: 'org_saturn', counterpartyOrgId: 'org_bk', periodStart: '2026-07-01', periodEnd: '2026-07-31', docketCount: 418, total: 15_466_000, status: 'paid' },
  { id: 'st_3', issuerOrgId: 'org_saturn', counterpartyOrgId: 'org_rampersaud', periodStart: '2026-08-01', periodEnd: '2026-08-31', docketCount: 24, total: 888_000, status: 'draft' },
];

// ── formatting ───────────────────────────────────────────────────────────────

/** GYD, integers, no decimals. §12 — money never becomes a float, including
 *  in the formatter, so this takes the integer straight to a group-separated
 *  string rather than dividing by 100 anywhere. */
export function gyd(amount: number): string {
  return `G$${amount.toLocaleString('en-GY')}`;
}

export function clock(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Guyana',
  });
}

export function vehicleClassLabel(c: VehicleClass): string {
  return VEHICLE_CLASS_LABEL[c];
}

// ── positions ────────────────────────────────────────────────────────────────

/**
 * Where each vehicle is right now.
 *
 * Derived from its live docket rather than stored: a vehicle at `at_origin` is
 * inside the pit polygon, one `in_transit` is somewhere along the corridor, one
 * `at_dest` is on the delivery site. That coupling is deliberate — a map whose
 * markers disagree with the docket feed is worse than no map, and inventing
 * free-floating coordinates is exactly how the two drift.
 *
 * Real positions arrive as `LocationPing` rows from phone or tracker. The shape
 * here is what the map consumes either way.
 */
export interface VehiclePosition {
  vehicleId: string;
  plate: string;
  lat: number;
  lng: number;
  /** The docket state this position was derived from. */
  state: DocketStatus;
  docketNumber: number | null;
  driverName: string;
  /** Minutes since the last fix. Stale positions are a real exception kind. */
  ageMin: number;
  accuracy: number;
}

/** Linear interpolation between two points — good enough at this scale, and
 *  honest about being a straight line rather than a routed path. Exported so
 *  the live-tracking simulation can advance a vehicle along the same corridor
 *  rather than re-deriving the lerp client-side. Takes anything with a
 *  lat/lng rather than a full `Site` — it never read the other fields. */
export function along(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  t: number,
): { lat: number; lng: number } {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

/** Small deterministic offset so two vehicles at the same site don't stack into
 *  one marker. Seeded by id — never random, so screenshots reproduce. */
function jitter(id: string, m = 0.0012): { dLat: number; dLng: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return { dLat: ((h % 17) / 17 - 0.5) * m, dLng: (((h * 7) % 19) / 19 - 0.5) * m };
}

export function vehiclePositions(jobId = 'job_1'): VehiclePosition[] {
  const j = job(jobId);
  if (!j) return [];
  const origin = site(j.pickupSiteId);
  const dest = site(j.deliverySiteId);
  if (!origin || !dest) return [];

  const live = DOCKETS.filter((d) => d.jobId === jobId && d.status !== 'closed' && !d.voided);

  // Closed dockets whose vehicle has gone back for another load — they are on
  // the return leg, which is most of the fleet most of the day.
  const returning = VEHICLES.filter(
    (v) => v.orgId === COORDINATOR_ORG && v.active && !live.some((d) => d.vehicleId === v.id),
  );

  const out: VehiclePosition[] = [];

  for (const d of live) {
    const v = vehicle(d.vehicleId);
    if (!v) continue;
    const t =
      d.status === 'issued' || d.status === 'at_pit' || d.status === 'loaded'
        ? 0
        : d.status === 'in_transit'
          ? 0.55
          : 1;
    const base = along(origin, dest, t);
    const { dLat, dLng } = jitter(v.id);
    out.push({
      vehicleId: v.id,
      plate: v.plate,
      lat: base.lat + dLat,
      lng: base.lng + dLng,
      state: d.status,
      docketNumber: d.number,
      driverName: driverName(d.driverId),
      ageMin: 1,
      accuracy: 9,
    });
  }

  returning.forEach((v, i) => {
    // Spread the return leg so they are not all on top of each other.
    const base = along(dest, origin, 0.25 + (i % 4) * 0.18);
    const { dLat, dLng } = jitter(v.id);
    // One vehicle with a deliberately stale fix — the exception queue has a
    // stale-GPS row for GPP 3106 and the map should agree with it.
    const stale = v.plate === 'GPP 3106';
    out.push({
      vehicleId: v.id,
      plate: v.plate,
      lat: base.lat + dLat,
      lng: base.lng + dLng,
      state: 'closed',
      docketNumber: null,
      driverName: DRIVERS.find((dr) => dr.vehicleId === v.id)?.name ?? '—',
      ageMin: stale ? 34 : 2,
      accuracy: stale ? 180 : 11,
    });
  });

  return out;
}

/** The two sites a job runs between, for drawing boundaries. */
export function jobSites(jobId = 'job_1') {
  const j = job(jobId);
  if (!j) return [];
  return [site(j.pickupSiteId), site(j.deliverySiteId)].filter(Boolean) as Site[];
}
