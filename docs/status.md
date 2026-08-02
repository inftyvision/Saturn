# Status

**As of 2026-08-02.** Front end on fixtures. No database, no auth, no telemetry,
no worker — deliberately.

## Built

| Surface | Routes | |
|---|---|---|
| Coordinator | 13 | fleet map · quote inbox · jobs (+ live slot spacing) · slot grid · docket feed · exceptions · statements · buyers · admin ×6 |
| Worker | 5 | today · pit · transit · dump · summary, with a condition strip that moves the vehicle in and out of the geofence, drops signal and weakens the fix |
| Hauler | 4 | available work · vehicles · own docket record · owed & paid |
| Gaia operator | 2 | vendors · credentials |
| Buyer | 8 | orders · order detail · new request · sites · docket detail · account · login · public track link |
| Sandbox | 5 | components · docket kernel · attestation seam · operator surface · agent layer |

**Component library** — `@gaia/ui`, three layers, catalogued at
`/sandbox/components`.

**Brand pipeline** — both apps, workspace tokens → `shadcnVars` → components.
Geist + Geist Mono in the `gaia` and `saturn` workspaces.

**Map** — MapLibre, positions derived from live dockets, brand-coloured at
runtime. On `/map`, `/jobs/[id]`, `/job/[id]/transit`, and the buyer's order page.

## Not built, on purpose

| | |
|---|---|
| `packages/db` | schema, migrations, `withOrgContext` |
| `workers/` | geofence reconciliation, slot release, observed-rate recalc, credential expiry |
| `packages/agent` | tool definitions, permission-scoped |
| auth | phone OTP, sessions, `RoleGrant` |
| telemetry | ping ingest, offline queue, sync |
| native shell | Capacitor config exists; no build has run |

## Known gaps in what IS built

- **Several screens still carry hand-rolled layout** rather than composing
  `Section`/`Card`. The library exists; the migration is partial.
- **Maps are display-only.** Polygon drawing on `/admin/sites` is a placeholder.
- **The hauler route group sits at `/hauler/*`** rather than sharing paths with
  the coordinator as the spec has it — no auth yet to switch roles on.
- **Role switching is a prototype widget**, bottom-right, deliberately outside
  the product chrome.
- **`/sandbox/attestation-seam`** documents a vocabulary layer that does not
  exist yet.

## Next, in order

1. **PostGIS** on the database while it is still empty.
2. **Play background-location declaration** — latency, not work, and it can be
   rejected. Start it in parallel with everything else.
3. **Finish the component migration** — the remaining hand-rolled screens.
4. **`packages/db`** — schema, RLS, `withOrgContext`. Four non-negotiables:
   transaction-scoped `set_config`, pooler in transaction mode, an app role
   without `BYPASSRLS`, migrations under a separate role.
5. **Auth** — phone OTP, `RoleGrant`, and the real role landing that replaces
   the prototype switch.

## Running it

```bash
pnpm install
pnpm dev:ops     # 3050
pnpm dev:buyer   # 3051
pnpm -r typecheck
```

To see the buyer app's white-labelling resolve by hostname, add to your hosts
file:

```
127.0.0.1  app.saturn.gy app.nordstar.gy app.unclaimed.gy
```

`app.saturn.gy:3051` renders Saturn; `app.unclaimed.gy:3051` renders neutral,
proving an unclaimed host never inherits somebody else's brand.
