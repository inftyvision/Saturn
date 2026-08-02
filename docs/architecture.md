# Architecture

## Two apps

| | Port | Domain | Brand | Users |
|---|---|---|---|---|
| `apps/ops` | 3050 | `app.gaia.gy` | Gaia's own, from `GAIA_OPS_WS` | coordinator · hauler · worker · Gaia operator |
| `apps/buyer` | 3051 | `app.<vendor>.gy` | the vendor's, **by hostname** | contractors |

### Why two and not one

They differ in the one place that matters: **ops resolves one brand, buyer
resolves a brand per request.** One app doing both meant a surface flag threaded
through every module and an `assertSurface()` guard on every route group whose
only job was stopping two products serving each other's pages. Two builds, and
that machinery disappears.

Ops is also the one that goes native — a single Capacitor binary, one App Store
record, because nobody using it is a customer of a vendor and a hauler working
for two coordinators should not need two apps. The buyer app is web only, which
is why onboarding a vendor costs a CNAME rather than a store submission.

## Packages

```
packages/ui/     the component library — primitives, system, token bridge, map
packages/core/   domain types and fixtures
packages/db/     Prisma schema, migrations, withOrgContext        (EMPTY)
packages/config/ shared tsconfig / eslint                          (EMPTY)
workers/         geofence reconciliation, slot release, rate recalc (EMPTY)
```

`packages/db` and `workers/` are empty deliberately — see `status.md`.

## Route map

Routes follow the **bar**, and every surface that runs a business fills the same
three slots — **WHERE · WHAT · OWED**. The coordinator and the hauler read
Map · Work · Money; the contractor reads Map · Orders · Money, because that is
the word a contractor uses for the same slot. Someone holding two roles — Saturn
holds coordinator AND hauler — does not learn two bars.

The two surfaces that break the grammar break it for a reason: the worker's is a
linear task surface, and the operator's may not touch a docket at all (rule 6),
so it has no "what" and no "owed" to show. See `/sandbox/app-shell`.

### ops (3050)

```
/                        → /map

(coordinator)             bar: Map · Work · Money ┊ Agent
  /map                   fleet — positions derived from live dockets
  /work                  → /work/requests
    /work/requests         quote inbox
    /work/jobs  /work/jobs/new  /work/jobs/[id]
    /work/dockets
    /work/exceptions
  /money                 → /money/statements
    /money/statements
    /money/buyers
  /admin/{vehicles,drivers,devices,sites,rates,operators}   side menu

(hauler)                  bar: Map · Work · Money ┊ Agent
  /hauler                → /hauler/map
  /hauler/map              its OWN trucks, scoped by haulerOrgId
  /hauler/work           → /hauler/work/available
    /hauler/work/available
    /hauler/work/dockets
  /hauler/money            no segments — a hauler has one money screen
  /hauler/vehicles         side menu

(driver)                  bar: Today · Summary ┊ Agent, at `tap` size
  /today  /summary
  /job/[id]/{pit,transit,dump}    bar goes ISOLATE — back, and nothing else

(operator)                bar: Vendors · Credentials — NO agent
  /operator/{vendors,credentials}

/sandbox                 app-shell · components · docket-kernel ·
                         attestation-seam · operator-surface · agent-layer
```

`/work` and `/money` are sections, not screens: each redirects to its first
segment. A section with segments has no page of its own — an overview above four
segments is a fifth thing to read before reaching the one you came for.

Hauler sits under `/hauler/*` rather than sharing `/dockets` with the
coordinator. The spec puts both at the same URL with the role deciding; Next
cannot have two groups own one path, and there is no auth yet to switch on.

### buyer (3051)

```
/                        → /orders

(app)                     bar: Map · Orders · Money ┊ Agent
  /map                   where the delivery is — NO ETA, ever
  /orders  /orders/[id]  /order/new
  /money                 balance, statements, payments
  /sites                 delivery sites             side menu
  /account               people on the account      side menu
  /dockets/[id]

(public)                  NO chrome at all
  /o/[token]             per-order tracking, no account required
  /login
```

`/o/[token]` is the link that arrives over WhatsApp. It needs no session, and it
is in `(public)` rather than hiding the nav from inside it: the rule belongs in
the structure, not in a `usePathname` check. It lands in more hands than the
recipient's.

**"Order material" is not in the bar.** It was a tab, and a creation flow is not
a place — it is the `primary` action on the Orders screen, which is both where it
belongs and more prominent than it was as the second of four tabs.

## Brand resolution

Both apps run the same reader (`src/lib/{mode,workspace,tokens}.ts`) over the
same token pipeline. The only difference is which workspace:

```
ops     GAIA_OPS_WS=gaia                    always Gaia
buyer   Host header → GAIA_HOST_MAP         app.saturn.gy → saturn
```

Workspaces live at `D:/syvon/Content/workspaces/<slug>` and hold
`config/design-tokens.json`, `config/text-styles.json`, `assets/fonts/`.

**An unclaimed hostname resolves to NO brand.** Falling back to the env pin would
mean any stray CNAME gets served whichever brand the env names.

## The map

`FleetMap` is MapLibre with dark raster tiles — no token, no account, and
swapping to Mapbox later is a style URL and an import.

**Vehicle positions are derived from each live docket**, not stored separately. A
map whose markers disagree with the docket feed is worse than no map. It reads
`--primary` off the live brand at runtime, because MapLibre paints with values
rather than CSS variables and a hardcoded hex silently ignores a brand change.

No routing, no ETAs on the map, no traffic. The line between two sites is drawn
as a straight line, because a map that draws a road implies it knows the traffic
on it — and navigation is out of scope.

## What this repo does NOT depend on

Gaia was prototyped inside the Syvon monorepo and was extracted. It carries no
`@syvon/*` package. The only live coupling is:

- **workspace brand files**, read as three path constants in
  `apps/*/src/lib/workspace.ts`
- **`SYVON_BRAIN_URL`**, unused today, reserved for the agent layer's metered
  model egress

Both are replaceable by a brand-tokens endpoint on brain — one resolved payload
over HTTP and no layout knowledge on this side.
