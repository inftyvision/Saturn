/**
 * Prototype fixtures — shapes only, no persistence.
 *
 * These mirror spec §12's data model closely enough that screens built against
 * them port to real queries without a redesign, but they are NOT the schema.
 * Deliberate differences: ids are readable strings, timestamps are ISO, money
 * is already GYD integers (§12: "Money in GYD, integers" — no floats anywhere,
 * including here, so the formatting code is exercised correctly).
 *
 * When the backend lands these types get replaced by generated ones. Nothing
 * in a screen should read a field that does not exist in §12.
 */

export type VehicleClass = '6x4' | '8x4_chinese' | '8x4_other' | 'tandem' | 'trailer';

export const VEHICLE_CLASS_LABEL: Record<VehicleClass, string> = {
  '6x4': '6×4',
  '8x4_chinese': '8×4 Chinese',
  '8x4_other': '8×4 Other',
  tandem: 'Tandem',
  trailer: 'Trailer',
};

export type DocketStatus =
  | 'issued'
  | 'at_pit'
  | 'loaded'
  | 'in_transit'
  | 'at_site'
  | 'dumped'
  | 'closed';

/** §11 — the order matters: progress bars and step indicators derive from it. */
export const DOCKET_FLOW: DocketStatus[] = [
  'issued',
  'at_pit',
  'loaded',
  'in_transit',
  'at_site',
  'dumped',
  'closed',
];

export type JobStatus = 'draft' | 'open' | 'active' | 'closed';
export type SlotStatus = 'open' | 'claimed' | 'running' | 'done' | 'released';

/**
 * Slot presentation, kept HERE rather than beside the components that use it.
 *
 * Not a style choice — a constraint. These maps are read by Server Components,
 * and a `'use client'` module's exports arrive at the server as client
 * REFERENCES, not values: `SLOT_TONE[s]` reads `undefined` and the page 500s at
 * render with nothing in the type system to warn you. Shared lookup data has to
 * live in a module with no `'use client'` directive.
 *
 * `released` is deliberately the loud one. A no-show nobody picked up is lost
 * capacity for the day, and it is the actionable thing on the job page.
 */
export const SLOT_TONE: Record<SlotStatus, string> = {
  open: 'bg-secondary text-muted-foreground',
  claimed: 'bg-primary/25 text-foreground',
  running: 'bg-primary text-primary-foreground',
  done: 'bg-primary/10 text-muted-foreground',
  released: 'bg-destructive/25 text-foreground',
};

export const SLOT_LABEL: Record<SlotStatus, string> = {
  open: 'Open',
  claimed: 'Claimed',
  running: 'Running',
  done: 'Done',
  released: 'Released',
};

export interface Org {
  id: string;
  name: string;
  kinds: Array<'coordinator' | 'hauler' | 'buyer'>;
  brandColor?: string;
}

export interface Site {
  id: string;
  orgId: string | null;
  kind: 'pit' | 'delivery';
  name: string;
  /** Centroid, for the stubbed map. Real polygons land with PostGIS. */
  lat: number;
  lng: number;
  loadRatePerHour: number | null;
  /** §10 — replaces the entered rate once enough dockets have been observed. */
  observedRatePerHour: number | null;
}

export interface Material {
  id: string;
  code: string;
  name: string;
}

export interface Vehicle {
  id: string;
  orgId: string;
  plate: string;
  class: VehicleClass;
  active: boolean;
}

export interface Driver {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  licenceNo: string;
  licenceExpiry: string;
  vehicleId: string | null;
}

export interface DeviceRec {
  id: string;
  orgId: string;
  driverId: string;
  platform: 'android' | 'ios';
  osVersion: string;
  lastSyncAt: string | null;
  /** §5 — remaining numbers in the device's current block. */
  blockRemaining: number;
  blockRange: string;
}

export interface Job {
  id: string;
  coordinatorOrgId: string;
  buyerOrgId: string | null;
  materialId: string;
  pickupSiteId: string;
  deliverySiteId: string;
  windowStart: string;
  windowEnd: string;
  loadsOrdered: number;
  loadsDone: number;
  status: JobStatus;
  trackToken: string;
  rates: Array<{ class: VehicleClass; ratePerLoad: number }>;
}

export interface Slot {
  id: string;
  jobId: string;
  targetTime: string;
  haulerOrgId: string | null;
  vehicleId: string | null;
  status: SlotStatus;
}

export interface Docket {
  id: string;
  number: number;
  jobId: string;
  vehicleId: string;
  driverId: string;
  haulerOrgId: string;
  status: DocketStatus;
  vehicleClass: VehicleClass;
  ratePerLoad: number;
  pitArrivedAt: string | null;
  loadedAt: string | null;
  siteArrivedAt: string | null;
  dumpedAt: string | null;
  loadPhoto: string | null;
  dumpPhoto: string | null;
  voided: boolean;
  voidReason: string | null;
  /** True when a transition was taken by hand rather than by geofence.
   *  §5/§11 — the override rate is the health metric for the whole product. */
  manualOverride: boolean;
}

export type ExceptionKind =
  | 'geofence_disagreement'
  | 'manual_override'
  | 'stale_gps'
  | 'unused_number'
  | 'no_show'
  | 'low_accuracy';

export interface ExceptionRec {
  id: string;
  kind: ExceptionKind;
  entity: string;
  entityId: string;
  detail: string;
  occurredAt: string;
  status: 'open' | 'resolved';
}

export const EXCEPTION_LABEL: Record<ExceptionKind, string> = {
  geofence_disagreement: 'Geofence disagreement',
  manual_override: 'Manual override',
  stale_gps: 'Stale GPS',
  unused_number: 'Unused number',
  no_show: 'No-show released',
  low_accuracy: 'Low accuracy fix',
};

export interface Statement {
  id: string;
  issuerOrgId: string;
  counterpartyOrgId: string;
  periodStart: string;
  periodEnd: string;
  docketCount: number;
  total: number;
  status: 'draft' | 'issued' | 'paid';
}
