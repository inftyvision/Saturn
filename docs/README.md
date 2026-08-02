# docs/ — index

**Last verified:** 2026-08-02. Read this before citing anything in here.

| File | What it holds |
|---|---|
| `architecture.md` | The two apps, the packages, what talks to what, and why it is split this way |
| `flows.md` | Three maps — the shell as a state machine, where you can go, how an agent answer is built |
| `design-system.md` | The component library, the rules it enforces, and how brand tokens reach it |
| `decisions.md` | Decisions with their reasoning — the ones expensive to reverse |
| `status.md` | What is built, what is not, and what is deliberately deferred |

## Where truth lives

Three surfaces, one job each.

| | owns |
|---|---|
| `docs/` | Durable enumerations — structure, ports, rules, decisions. A table belongs here and nowhere else. |
| `CLAUDE.md` | Traps: what you will get wrong, plus one anchor. Never a count, never a route list — it links out. |
| ops `/sandbox` | The derived, interactive view — the component catalogue and the backend design. The only surface allowed to render a live specimen, because it renders the real thing. |

## The one-line version

A **docket** is one unit of completed work — authorised before, geofence-verified
during, evidenced at both ends, immutable once closed. Everything else exists to
produce and count dockets.

Two apps: **ops** (`app.gaia.gy` — coordinator, hauler, worker) and **buyer**
(`app.<vendor>.gy` — contractors, white-labelled per vendor).

**Front end only.** No database, no auth, no telemetry. That is the current
phase, not an omission.
