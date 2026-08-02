# Working in this repo

Gaia — verified execution for dispatched services, Guyana. Read `docs/README.md`
for the map. These are the rules that are expensive to learn by getting them
wrong.

## This is a prototype. There is no backend.

Every screen runs off `packages/core/src/fixtures`. No database, no auth, no
telemetry, no worker. That is deliberate and it is the current phase: **UX
first, backend once the flows are approved.**

Do not add a database, a Prisma schema or an API route because a screen "needs"
data. It needs a fixture. `packages/db` and `workers/` are empty on purpose.

The backend design is written up in the ops sandbox (`/sandbox`) — argue with it
there, not in a migration.

## The component system is the product's consistency

`@gaia/ui` has three layers and the distinction is load-bearing:

```
primitives/   vendored shadcn — form controls and tables ONLY
system/       the app vocabulary — typography, layout, card, status, action,
              people, AND the shell every surface wears (shell, bar, chat,
              app-shell)
token-bridge  design tokens → the shadcn variables primitives read
```

**A screen composes `system/`. If a screen styles something by hand, that is a
gap in the library — fix it in `system/`, never in the screen.**

This rule exists because it was broken for a week: buttons, cards and headings
were written per-screen and the same thing ended up with four treatments. See
`/sandbox/components` for the live catalogue and every rule.

Specific traps:

- **`Action`, not `Button`.** `Button` is a primitive; `Action` encodes the
  decision — `primary` (one per screen), `secondary`, `ghost`, `danger`.
  Anything that voids, deletes or revokes is `danger` **always**, even when it
  reads as routine.
- **`Status`, not a per-entity badge.** One vocabulary for docket, job, slot,
  order and credential. Add a state to `system/status.tsx`, not to a screen.
- **A label above a GROUP is a kicker; a title OF a thing is not.** Uppercasing
  an item title makes a table of vendor names shout.
- **Mono is for figures only.** Never body, never buttons. `--font-mdio` is what
  the vendored Button and Badge carry — point it at the BODY stack or every
  control turns monospace.

## One shell, and the bar holds three things

Every surface in both apps wears `AppShell` from `@gaia/ui`. It replaced five
unrelated chromes. Roles differ in DATA — which sections, which width, whether
there is an agent — never in layout. `/sandbox/app-shell` is the write-up.

- **A screen does not title itself.** The header derives "where you are" from the
  section and segment. A `PageHead` with a title under that chrome is two titles
  six pixels apart. Pass one only for a THING the nav cannot know — a docket
  number, an order.
- **Max three destinations in the bar.** A fourth means one belongs in a segment
  or the side menu. Nothing gets deleted to make room.
- **Left of the hairline is a place; right of it is the agent.** The agent is a
  layer over where you are, not a section — it never highlights as one.
- **Never put a destructive control in the bar.** `Action kind="danger"` on the
  surface that owns the record. The bar's grammar is that everything in it is
  safe to press, so it has no way to say otherwise.

## Both apps share the system. Only the tokens differ.

`apps/ops` wears Gaia's brand, `apps/buyer` wears the vendor's — same reader,
same `shadcnVars` mapping, same components. Two token sets, one design system.

Anything hardcoding a colour is a bug. `FleetMap` reads `--primary` off the live
brand at runtime for exactly this reason: it was hardcoded amber and silently
ignored a brand change.

## Ops is one brand. Buyer is many.

| | brand from | hostname |
|---|---|---|
| `apps/ops` | `GAIA_OPS_WS` — always Gaia | irrelevant |
| `apps/buyer` | the Host header | `app.<vendor>.gy` |

**An unclaimed hostname must render NO brand** — never whichever one the env
happens to name. A stray CNAME pointed at the buyer deployment being served
somebody else's identity is the failure this guards.

Onboarding a vendor is a DNS record plus a row. `GAIA_HOST_MAP` is a dev
stand-in; production should read domains off the vendor record.

## Workspaces live outside this repo

Brand tokens and fonts are read from `D:/syvon/Content/workspaces/<slug>` —
`gaia` for ops, `saturn` (and later others) for buyer. Editing a brand in this
repo does not change what an app renders.

Those checkouts sync to Syvon's production R2. **Never run `ws push` from here.**
Local edits are fine; pushing is not ours to do.

The three path constants in `apps/*/src/lib/workspace.ts` are the whole contract
with that layout. The durable fix is a brand-tokens endpoint on brain — one
resolved payload over HTTP and no layout knowledge on this side.

## Rules from the spec that are not negotiable

These come from Build Spec v7 and are the product, not preferences:

1. **`org_id` on every table, RLS enabled**, service layer never issues an
   unscoped query. RLS is the backstop, not the enforcement.
2. **An assignment links a job owned by org A to a resource owned by org B.**
   Same org for Saturn today. Never assume it.
3. **Closed dockets are immutable.** Corrections are void-and-reissue.
4. **Every state transition writes to `Event`.** Append-only.
5. **The agent may never commit.** Read and draft only; a `Proposal` is a row a
   human accepts. The moment an agent can write proof, the proof stops being
   evidence — and the evidence is the product.

Money is GYD integers. No floats, anywhere, including formatters.

## Two things that will bite

**Server Components cannot read a `'use client'` module's exports.** They arrive
as client *references*, not values — so a shared lookup map in a client file
reads `undefined` and the page 500s at render with nothing in the type system to
warn you. Shared data goes in a module with no `'use client'`.

**`data-icons` is owned by the boot script, not React.** Material Symbols are
ligatures: with the font missing the browser paints the literal word
`photo_camera`. The script sets and clears the attribute at parse time; render
it in JSX and you get an unfixable hydration mismatch.

That first rule is why `features/shell/nav.ts` in both apps carries no
directive, and why the shell takes segments as `{ section, items }` DATA rather
than a resolver function — a layout is a Server Component and a function cannot
cross that boundary either.

**A `fill` map must wait for its box.** MapLibre sizes its canvas at
construction. As a flex child that box may not have resolved on the frame the
effect runs, and the map comes up blank. It also needs a `ResizeObserver`:
opening the side menu changes the container with no window resize event.

## Ports

ops **3050** · buyer **3051**. Sandbox is at `/sandbox` in ops.
