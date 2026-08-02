import { DAY, MATERIALS, SITES, RATE_CARD, JOBS, DOCKETS } from './ops';
import type { VehicleClass } from '../types';

/**
 * Buyer-side fixtures — quote requests, quotes, accounts, saved sites, queries.
 *
 * The contractor's world, not the coordinator's: they think in "twenty loads of
 * white sand to the Eccles job, Tuesday morning", never in slots or vehicle
 * classes. Where a class has to appear, it is captioned in vehicle terms — a
 * foreman knows what a tandem carries and does not know what `8x4_chinese` is.
 */

const at = (hhmm: string) => `${DAY}T${hhmm}:00-04:00`;

export type OrderStatus =
  | 'draft'
  | 'requested'
  | 'quoted'
  | 'accepted'
  | 'declined'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export const ORDER_LABEL: Record<OrderStatus, string> = {
  draft: 'Draft',
  requested: 'Awaiting quote',
  quoted: 'Quote received',
  accepted: 'Accepted',
  declined: 'Declined',
  in_progress: 'Delivering',
  completed: 'Complete',
  cancelled: 'Cancelled',
};

/** Plain-language capacity, because a class name means nothing to a foreman. */
export const CLASS_CAPTION: Record<VehicleClass, string> = {
  '6x4': 'Small tipper — tight sites, short runs',
  '8x4_chinese': 'Standard tipper — most jobs',
  '8x4_other': 'Standard tipper — heavier build',
  tandem: 'Large tipper — fewer trips',
  trailer: 'Trailer — bulk, needs turning room',
};

export interface BuyerUser {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  role: string;
}

export const BUYER_ORG = 'org_bk';

export const BUYER_USERS: BuyerUser[] = [
  { id: 'bu_1', orgId: BUYER_ORG, name: 'Andre Khan', phone: '+592 614 8802', role: 'Procurement' },
  { id: 'bu_2', orgId: BUYER_ORG, name: 'Terrence Grant', phone: '+592 677 2109', role: 'Site foreman' },
];

export const CURRENT_BUYER_USER = 'bu_1';

/** A buyer's saved delivery site. `polygonConfirmed` is the gate: a job cannot
 *  dispatch to a site whose polygon the coordinator has not drawn, because an
 *  unconfirmed site has no delivery geofence and its dockets could never close
 *  automatically. */
export interface BuyerSite {
  id: string;
  orgId: string;
  name: string;
  address: string;
  accessNotes: string;
  lastDelivery: string | null;
  polygonConfirmed: boolean;
}

export const BUYER_SITES: BuyerSite[] = [
  {
    id: 'site_eccles',
    orgId: BUYER_ORG,
    name: 'Eccles Housing Scheme — Block C',
    address: 'Eccles, East Bank Demerara',
    accessNotes: 'Gate off the main road, ask for Terrence. Tight turn past the transformer.',
    lastDelivery: DAY,
    polygonConfirmed: true,
  },
  {
    id: 'site_providence',
    orgId: BUYER_ORG,
    name: 'Providence — East Bank Road Widening',
    address: 'Providence, East Bank Demerara',
    accessNotes: 'Site office at the north end. No deliveries before 07:00.',
    lastDelivery: '2026-07-29',
    polygonConfirmed: true,
  },
  {
    id: 'site_mahaica',
    orgId: BUYER_ORG,
    name: 'Mahaica — new depot',
    address: 'Mahaica, East Coast Demerara',
    accessNotes: 'Dropped pin at the gate. Access track is soft after rain.',
    lastDelivery: null,
    polygonConfirmed: false,
  },
];

export const buyerSite = (id: string) => BUYER_SITES.find((s) => s.id === id);

// ── orders ───────────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  buyerOrgId: string;
  coordinatorOrgId: string;
  materialId: string;
  loadsRequested: number;
  vehicleClass: VehicleClass;
  deliverySiteId: string;
  windowDate: string;
  windowPeriod: 'am' | 'pm' | 'all_day';
  notes: string;
  status: OrderStatus;
  submittedAt: string;
  /** Set once the coordinator responds. */
  quote: Quote | null;
  /** Set on acceptance — the Job this became. */
  jobId: string | null;
}

export interface Quote {
  ratePerLoad: number;
  loadsQuoted: number;
  note: string;
  validUntil: string;
  quotedBy: string;
}

const rate = (c: VehicleClass) => RATE_CARD.find((r) => r.class === c)!.ratePerLoad;

export const ORDERS: Order[] = [
  {
    id: 'ord_1',
    buyerOrgId: BUYER_ORG,
    coordinatorOrgId: 'org_saturn',
    materialId: 'mat_white',
    loadsRequested: 20,
    vehicleClass: '8x4_chinese',
    deliverySiteId: 'site_eccles',
    windowDate: DAY,
    windowPeriod: 'all_day',
    notes: 'Foundation pour Thursday, need it all in before Wednesday close.',
    status: 'in_progress',
    submittedAt: '2026-08-01T09:12:00-04:00',
    quote: {
      ratePerLoad: rate('8x4_chinese'),
      loadsQuoted: 20,
      note: 'Yarrowkabra sand, standard tipper.',
      validUntil: '2026-08-03T09:12:00-04:00',
      quotedBy: 'Saturn',
    },
    jobId: 'job_1',
  },
  {
    id: 'ord_2',
    buyerOrgId: BUYER_ORG,
    coordinatorOrgId: 'org_saturn',
    materialId: 'mat_crusher',
    loadsRequested: 36,
    vehicleClass: '8x4_chinese',
    deliverySiteId: 'site_providence',
    windowDate: '2026-07-29',
    windowPeriod: 'all_day',
    notes: '',
    status: 'completed',
    submittedAt: '2026-07-27T14:40:00-04:00',
    quote: {
      ratePerLoad: rate('8x4_chinese'),
      loadsQuoted: 36,
      note: '',
      validUntil: '2026-07-29T14:40:00-04:00',
      quotedBy: 'Saturn',
    },
    jobId: 'job_2',
  },
  {
    id: 'ord_3',
    buyerOrgId: BUYER_ORG,
    coordinatorOrgId: 'org_saturn',
    materialId: 'mat_half',
    loadsRequested: 12,
    vehicleClass: 'tandem',
    deliverySiteId: 'site_eccles',
    windowDate: '2026-08-05',
    windowPeriod: 'am',
    notes: 'Driveway base. Morning only — concrete going down after lunch.',
    status: 'quoted',
    submittedAt: at('08:40'),
    quote: {
      ratePerLoad: rate('tandem'),
      loadsQuoted: 12,
      note: 'Half-inch stone. Tandem is the efficient size for twelve loads.',
      validUntil: '2026-08-04T08:40:00-04:00',
      quotedBy: 'Saturn',
    },
    jobId: null,
  },
  {
    id: 'ord_4',
    buyerOrgId: BUYER_ORG,
    coordinatorOrgId: 'org_saturn',
    materialId: 'mat_loam',
    loadsRequested: 8,
    vehicleClass: '6x4',
    deliverySiteId: 'site_mahaica',
    windowDate: '2026-08-06',
    windowPeriod: 'pm',
    notes: 'Levelling the yard. Small vehicles — the track is soft.',
    status: 'requested',
    submittedAt: at('10:05'),
    quote: null,
    jobId: null,
  },
];

export const order = (id: string) => ORDERS.find((o) => o.id === id);

/** Loads actually delivered against an order, via its Job's closed dockets. */
export function deliveredFor(o: Order): number {
  if (!o.jobId) return 0;
  return DOCKETS.filter((d) => d.jobId === o.jobId && d.status === 'closed' && !d.voided).length;
}

export function orderDockets(o: Order) {
  if (!o.jobId) return [];
  return DOCKETS.filter((d) => d.jobId === o.jobId && !d.voided);
}

/** Hours left on a quote, negative once expired. */
export function quoteHoursLeft(q: Quote): number {
  return (new Date(q.validUntil).getTime() - new Date(`${DAY}T11:20:00-04:00`).getTime()) / 3_600_000;
}

// ── account ──────────────────────────────────────────────────────────────────

export interface BuyerAccount {
  coordinatorOrgId: string;
  buyerOrgId: string;
  statementPeriod: string;
  creditLimit: number;
  termsDays: number;
  balance: number;
  nextStatement: string;
}

export const BUYER_ACCOUNT: BuyerAccount = {
  coordinatorOrgId: 'org_saturn',
  buyerOrgId: BUYER_ORG,
  statementPeriod: 'Monthly',
  creditLimit: 20_000_000,
  termsDays: 30,
  balance: 15_466_000,
  nextStatement: '2026-08-31',
};

export interface DocketQuery {
  id: string;
  docketId: string;
  raisedBy: string;
  text: string;
  status: 'open' | 'resolved';
  resolution: string | null;
  raisedAt: string;
}

export const DOCKET_QUERIES: DocketQuery[] = [
  {
    id: 'dq_1',
    docketId: 'dk_4504',
    raisedBy: 'bu_2',
    text: 'This one came in short — bed was maybe two-thirds. Photo looks light too.',
    status: 'open',
    resolution: null,
    raisedAt: at('09:40'),
  },
];

/** Materials the coordinator sells, in the buyer's terms. */
export const CATALOGUE = MATERIALS;

/** Delivery sites this buyer can order to. */
export const ORDERABLE_SITES = BUYER_SITES;


// ── operator fixtures ────────────────────────────────────────────────────────
// The Gaia-side view: vendors provisioned onto the platform, and the credential
// queue whose entire value is that Gaia — not the vendor — is the verifier.

export type CredentialStatus = 'pending' | 'verified' | 'expiring' | 'expired';

export interface VendorRec {
  id: string;
  name: string;
  category: string;
  hostname: string | null;
  brandColor: string;
  /** A workspace slug when the vendor has a real design system; null → the
   *  three brand fields are the whole identity. */
  tokenSource: string | null;
  showPoweredBy: boolean;
  onboardedBy: string;
  onboardedAt: string;
  coordinators: number;
  docketsThisMonth: number;
}

export const VENDORS: VendorRec[] = [
  {
    id: 'org_saturn',
    name: 'Saturn Mining & Haulage',
    category: 'aggregate',
    hostname: 'app.saturn.gy',
    brandColor: '#FF6A00',
    tokenSource: 'saturn',
    showPoweredBy: true,
    onboardedBy: 'R. Futterer',
    onboardedAt: '2026-07-14',
    coordinators: 2,
    docketsThisMonth: 418,
  },
  {
    id: 'org_nordstar',
    name: 'NordStar Aggregates',
    category: 'aggregate',
    hostname: null,
    brandColor: '#2E5AAC',
    tokenSource: null,
    showPoweredBy: true,
    onboardedBy: 'R. Futterer',
    onboardedAt: '2026-08-01',
    coordinators: 1,
    docketsThisMonth: 0,
  },
];

export interface CredentialRec {
  id: string;
  orgId: string;
  subjectType: 'org' | 'resource' | 'person';
  subject: string;
  kind: string;
  status: CredentialStatus;
  expiresAt: string | null;
  /** Null while unverified. The whole point of the queue. */
  verifierOrgId: string | null;
  verifiedAt: string | null;
}

export const CREDENTIALS: CredentialRec[] = [
  { id: 'cr_1', orgId: 'org_saturn', subjectType: 'org', subject: 'Saturn Mining & Haulage', kind: 'Public liability insurance', status: 'verified', expiresAt: '2027-01-31', verifierOrgId: 'org_gaia', verifiedAt: '2026-07-15' },
  { id: 'cr_2', orgId: 'org_saturn', subjectType: 'org', subject: 'Saturn Mining & Haulage', kind: 'Tax compliance certificate', status: 'expiring', expiresAt: '2026-08-19', verifierOrgId: 'org_gaia', verifiedAt: '2026-02-19' },
  { id: 'cr_3', orgId: 'org_nordstar', subjectType: 'org', subject: 'NordStar Aggregates', kind: 'Public liability insurance', status: 'pending', expiresAt: null, verifierOrgId: null, verifiedAt: null },
  { id: 'cr_4', orgId: 'org_nordstar', subjectType: 'org', subject: 'NordStar Aggregates', kind: 'Local content certificate', status: 'pending', expiresAt: null, verifierOrgId: null, verifiedAt: null },
  { id: 'cr_5', orgId: 'org_saturn', subjectType: 'resource', subject: 'GRR 4471', kind: 'Vehicle inspection', status: 'verified', expiresAt: '2026-11-02', verifierOrgId: 'org_saturn', verifiedAt: '2026-05-02' },
  { id: 'cr_6', orgId: 'org_saturn', subjectType: 'person', subject: 'Devon Adams', kind: 'Worker licence', status: 'expiring', expiresAt: '2026-09-02', verifierOrgId: 'org_saturn', verifiedAt: '2025-09-02' },
  { id: 'cr_7', orgId: 'org_saturn', subjectType: 'resource', subject: 'GTT 6390', kind: 'Vehicle inspection', status: 'expired', expiresAt: '2026-07-20', verifierOrgId: 'org_saturn', verifiedAt: '2025-07-20' },
];

export const GAIA_ORG = 'org_gaia';
