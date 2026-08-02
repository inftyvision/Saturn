# Design system

Live catalogue: **`/sandbox/components`** in the ops app. Every entry there
renders a real specimen next to the rule it enforces. This file is the written
version.

## Three layers

```
@gaia/ui
  primitives/    vendored shadcn — badge, button, input, label, select, table
  system/        the APP vocabulary — typography, layout, card, status, action, people
                 …and the SHELL every surface wears:
                   shell.tsx      frame · header · card · side menu · segments
                   bar.tsx        the one morphing pill
                   chat.tsx       the agent's turn machine + answer renderer
                   app-shell.tsx  the component that wires them together
  token-bridge   design tokens → the shadcn CSS variables primitives read
```

The shell is in the library, not in an app, for the same reason as everything
else: both apps wear it, and the one that forked would be the one nobody looked
at. Full write-up and live specimens: **`/sandbox/app-shell`**.

**The rule: a screen composes `system/`.** It reaches into `primitives/` only for
form controls and tables. Anything a screen styles by hand is a gap in `system/`
— fix it there, not in the screen.

shadcn is *vendored*, not depended on: it is generated source, and only what the
apps use is present. Adding one back is `npx shadcn add`.

## Type — four roles

| | |
|---|---|
| `PageTitle` | one per screen, the thing you navigated to |
| `SectionHeading` | the label above a **group**. An `<h2>`, kicker treatment. |
| `Kicker` | the label above a **field**. Same treatment, not a heading. |
| `ItemTitle` | the name of a row or card. **Not** a kicker. |
| `Num` | any figure compared down a column — mono, tabular |
| `BigNum` | the hero figure. One per screen, maximum. |

**A label above a group is a kicker; a title of a thing is not.** Uppercasing an
item title makes a table of vendor names shout.

**Mono is for figures only.** Never body, never buttons — at reading size a mono
face costs legibility for nothing. `--font-mdio` is what the vendored Button and
Badge carry from the shadcn theme they were generated against, so it must
resolve to the **body** stack.

Faces: **Geist** headings and body, **Geist Mono** figures and kickers. Saturn
adds Kallisto for display.

## Actions — one decision table

| kind | for | |
|---|---|---|
| `primary` | the ONE action the screen exists for | max one per view |
| `secondary` | a real alternative — "Accept fewer", "Export" | |
| `ghost` | navigation and dismissal — "Cancel", "Open" | |
| `danger` | void, delete, revoke | never brand-derived, always red |

**Anything that mutates a docket is `danger`** even when it reads as routine. A
void-and-reissue that looks like every other button is how an immutable record
gets voided by accident.

`tap` sets a 56px floor — every control a worker taps in gloves, in sunlight.

`IconAction` always carries a label and a title. An unlabelled glyph is a guess,
and this product is used by people who open it twice a week.

Buttons carry icons: same action, same glyph, in both apps.

`href` renders a link rather than a button — most `ghost` actions ARE links, and
before it existed every one was a hand-rolled anchor wearing a copy of the
button's classes.

**`BarAction` is not an `Action`.** It is chrome — everything in the bar is
either somewhere to go or the agent, so it has no `kind`. Nothing that voids,
deletes or revokes may ever be one: those are `danger` on the surface that owns
the record, and the bar cannot signal danger because its whole grammar is that
everything in it is safe to press.

## The shell — three destinations and a hairline

One layout, worn by all five surfaces. Left of the hairline is a DESTINATION;
the one thing right of it is the agent, which is a layer raised over wherever
you already are rather than a place you go.

One grammar — **WHERE · WHAT · OWED** — across every surface that runs a
business. The label changes where the word changes; the shape does not.

| | where | what | owed | surface | agent |
|---|---|---|---|---|---|
| coordinator | Map | Work | Money | desk | yes |
| hauler | Map | Work | Money | column | yes |
| contractor | Map | Orders | Money | column | yes |
| worker | — | Today · Summary | — | phone | yes |
| Gaia operator | — | Vendors · Credentials | — | desk | **no** |

`surface` is one axis, not two: `desk` is full width with `lg` controls,
`column` is phone-first with `lg`, `phone` is phone-first with the 56px `tap`
floor. They were two props and were never set independently.

Max three destinations. Everything cut went into a **segment** inside a section
or into the **side menu** behind the account — nothing was deleted, which is the
test.

The operator surface passes no agent at all. Rule 6 keeps `/operator` away from
dockets, captures, slots and statements; an agent reading an org's records
through the caller's context is that reach, one question away. Omitted rather
than disabled — a greyed-out control is a promise it will work later.

Rules, traps and live specimens: **`/sandbox/app-shell`**.

## Status — one vocabulary

Five tones, and every state in the product maps to one:

| tone | meaning | variant |
|---|---|---|
| `live` | happening now, needs no action | primary |
| `settled` | finished and counted | secondary |
| `waiting` | open, someone must act | outline |
| `idle` | exists, nothing to do | ghost |
| `bad` | voided, expired, failed | destructive |

**`settled` is quiet, not loud.** A closed docket is the normal case and there
will be four hundred; making the common state shout leaves nothing to signal the
exception.

Add a state to `system/status.tsx`. Never to a screen.

## Cards — one anatomy

```
┌──────────────────────────────────────────┐
│ KICKER                        [status]   │
│ Title                                    │
│ meta · meta · meta                       │
│ ─────────────────────────────────────    │
│ body                                     │
│ ─────────────────────────────────────    │
│ footer                       [actions]   │
└──────────────────────────────────────────┘
```

- Status goes **top right**. Always. Eyes go there first.
- Actions go **bottom right**, or in a `Menu` past two.
- Meta is **one line**. If it needs two, it is body.
- A card is a **link** or it has **actions** — never both. A clickable card with
  buttons in it is a coin toss about what a tap does.

`Row` is the dense variant. `Stat`/`StatStrip` is the headline figure — four
across maximum, because a fifth means none of them is the number the screen is
about. `Empty` always says what *would* be here **and** what puts it there.

## People

`Avatar` is initials on a deterministic colour. **No photograph slot** — drivers
and site foremen have not uploaded one and will not, so a photo avatar renders
an empty circle for everybody and reads as broken.

**Contact actions belong on ops surfaces only.** A coordinator calls a driver; a
worker does not call themselves; the buyer app never shows the vendor's fleet.
`Person` renders them only when a screen passes a phone, and a screen passes one
only where somebody has a reason to dial.

WhatsApp is not a nicety — it is the channel this market runs on. A number
rendered as plain text is a number somebody retypes into another app, which is
the phone call the product exists to remove.

## Brand tokens

`design-tokens/v2` → `shadcnVars()` → the CSS variables the primitives read.
Both apps use the same mapping; only the token set differs.

Two traps in that mapping, both documented in `token-bridge.ts`:

- **shadcn's `--secondary` and `--accent` are UI roles, not brand roles.**
  `--accent` is the *hover* background. Mapping a brand's accent there puts the
  brand colour behind every hovered table row. Both take the surface colour; the
  brand's accent goes to `--primary` and `--ring`.
- **Foreground contrast is computed, not taken from a token.** The crossover
  where black and white are equally legible is **L ≈ 0.179**, far darker than
  intuition — eyeballing it puts white on a light primary at 2.1:1, which is
  legible on a desk and gone in Guyana sunlight.

Anything hardcoding a colour is a bug, including inside the map.
