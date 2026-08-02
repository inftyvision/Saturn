# Decisions

The ones with reasoning worth keeping, and the ones expensive to reverse.

---

## Gaia is its own repository

Prototyped inside the Syvon monorepo, extracted 2026-08-02 before any backend
existed.

**Why.** Count what was actually shared: the docket kernel, geofencing, slot
generation, RLS, offline sync, telemetry, PostGIS, the native shell — none of it
touches Syvon. The only genuine overlap was brand theming, and that is ~400
lines. Call it 5% shared, 95% not.

**Why then.** Moving fixtures and screens is days; moving a schema, RLS
policies, a worker, CI and store credentials is weeks with correctness risk.
Extraction was cheapest at exactly the moment there was no backend.

The strongest evidence it was right: an entire access-control mechanism
(`assertSurface`) deleted itself, because it only existed to keep two products
out of each other's routes.

---

## Two apps, not one, not three

Ops and buyer differ in the one place that matters — ops resolves one brand,
buyer resolves a brand per request. Everything else follows from that.

A third app for the Gaia operator surface was considered and rejected: it is a
handful of tables and a review queue, and a separate deployment would need its
own auth, build and deploy for no isolation a role grant does not already give.
Revisit if it grows billing or support tooling.

---

## Native is the ops app, and it is one binary

**Why native at all.** A browser freezes the page on screen lock, and the phone
is in a pocket for the whole leg between origin and destination — so geofence
transitions stop, which is the one thing the count depends on. Native also
unlocks the platform geofencing APIs, which wake a terminated app on a boundary
crossing for a fraction of the battery polling costs.

**Why phase 1 and not later.** Phase 1's goal is to prove the count. Proving it
on a surface that drops transitions when a driver pockets the phone proves the
wrong thing, and then you rebuild the thing you just earned trust with.

**Why one binary.** Ops is product-branded, so there is a single App Store
record — which also sidesteps the template-app rule a per-vendor build would run
into. The white-labelled half is a website.

**The ping queue belongs in the plugin, not the webview.** Android kills webviews
under memory pressure on low-end phones, and a JS-side queue dies with it.

---

## The buyer app is white-labelled by hostname

`app.saturn.gy`, `app.nordstar.gy` — one deployment, many brands. Onboarding a
vendor is a DNS record and a row.

**An unclaimed hostname renders no brand.** This was a bug once: the resolver
correctly returned null for an unknown host and the caller fell back to the env
pin one line later, so a stray CNAME would have been served Saturn's identity.

Brand has two tiers by design — a colour and a logo on the vendor record is the
floor, enough for a vendor with no design system; a vendor with a real token
source gets full palette and fonts. Requiring the second would make onboarding a
design project.

---

## The component system is the consistency

Built after a week of per-screen styling produced four treatments of the same
thing. The rule — *a screen composes `system/`; anything styled by hand is a gap
in the library* — exists because the alternative was tried and failed.

See `design-system.md`.

---

## Front end first, backend after approval

No database, no auth, no telemetry, no worker. Screens run off fixtures.

**Why.** The spec moved three times while the prototype was being built (v5 → v7
renamed the lifecycle, generalised the attestation model, added credentials and
an agent layer). Every one of those would have been a migration. Fixtures cost
nothing to change.

The backend design is written up in `/sandbox` — tenancy, number blocks,
geofence authority, slot spacing, the attestation seam, the operator surface,
the agent layer. Argue with it there.

---

## Rules from Build Spec v7 that are product, not preference

1. **`org_id` on every table, RLS enabled.** Service layer is the enforcement;
   RLS is the backstop. A policy that is the sole guard fails silently the day
   someone adds a raw query.
2. **An assignment links a job owned by org A to a resource owned by org B.**
   Same org for Saturn today. Never assume it.
3. **Closed dockets are immutable.** Void and reissue.
4. **Every transition writes to `Event`.** Append-only.
5. **The agent may never commit.** The moment an agent can write proof, the proof
   stops being evidence — and the evidence is the product.
6. **Nothing under `/operator` touches a docket.** A platform operator who can
   reach into the record makes it a record about Gaia's honesty rather than
   about what happened.

---

## Open — decide before the first migration

- **The override rate has no target.** It is the share of the tally that was
  *asserted* rather than verified. At 5% "indisputable" holds; at 30% it is a
  slightly better paper book. Instrument from the first commit.
- **`attestation_types[]` lost its waypoint scoping** between v2 and v7. Capture
  differs per end — a loaded bed at origin, a dump at destination — and a flat
  array on the Job cannot say which applies where.
- **Credentials expiring mid-shift.** Automatic removal from dispatch is right
  for assignment. Undecided for an OPEN docket when a licence lapses at 23:59.
- **PostGIS is not on the provisioned database.** Free to switch while it is
  empty; a data migration afterwards.
- **No per-category vocabulary layer.** Core says `resource`; a driver's screen
  must say *vehicle* and a janitorial one *team*. `ServiceItem.unit` carries the
  unit and nothing carries the rest.
- **Vendors without a domain have no path.** A Gaia-hosted subdomain fallback
  (`acme.gaia.gy`) works with zero code change; deferred until one shows up.
