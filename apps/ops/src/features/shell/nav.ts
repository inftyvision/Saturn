/**
 * What each ops role's bar offers, and how each path behaves.
 *
 * NO `'use client'` in this file, and that is load-bearing rather than tidy: a
 * Server Component cannot read a client module's exports — they arrive as
 * client *references*, not values, so a lookup like `routes.find(…)` in a
 * layout reads `undefined` and the page 500s at render with nothing in the type
 * system to warn you. A shared table goes in a module with no directive.
 *
 * ## One grammar: WHERE · WHAT · OWED
 *
 * Every surface that runs a business fills the same three slots with its own
 * nouns — where the trucks are, what is happening, what is owed. The
 * coordinator and the hauler both read Map · Work · Money; the contractor's app
 * reads Map · Orders · Money because "orders" is the word a contractor uses for
 * the same slot.
 *
 * That is worth more than a shared component: someone who holds two roles —
 * Saturn holds coordinator AND hauler — does not learn two bars.
 *
 * The worker is the one surface that breaks the grammar, and it breaks it for
 * a reason: it is a linear task surface, not a place to browse, so it has no
 * "what" and no "owed" to show.
 *
 * The coordinator breaks the three-destination COUNT on purpose: Operations
 * (vehicles, drivers, devices, sites, rates, subcontractor operators) turned
 * out to be a screen a coordinator opens every day, not a monthly errand — a
 * side-menu item nobody taps daily is dead weight, and a fourth bar icon that
 * earns its place beats a rule that forces it into hiding. It is named
 * Operations rather than Admin for the same reason: this is fleet work, not
 * back-office configuration.
 *
 * ## Nothing was deleted to make room
 *
 * Everything cut from a bar went into a SEGMENT inside a section or into the
 * SIDE MENU behind the account. And the segment nesting costs no taps after the
 * first: a section remembers the segment you were last on — see the shell.
 */

import type { ShellRoute } from '@gaia/ui';

/** Type-only import, so nothing from a `'use client'` module is pulled into
 *  this one at runtime — types are erased, values would not be. */
export type Route = ShellRoute;

/** A count the layout resolves. Named as a KEY rather than held as a number so
 *  this module stays a plain table a Server Component can read. */
export type CountKey = 'exceptions' | 'requests';

// ── coordinator ─────────────────────────────────────────────────────────────

/**
 * Exceptions is a segment of Work rather than its own bar icon: it is the
 * number that decides whether the tally can be trusted, so its count also
 * rides on the account avatar, where it is legible from the map.
 */
export function coordinatorRoutes(counts: Record<CountKey, number>): Route[] {
  return [
    // The map IS the card — no scroll, no reserved bar lane, the legend and the
    // stale-fix queue floating over it.
    { href: '/map', label: 'Map', icon: 'pin_drop', fill: true },
    {
      href: '/work',
      label: 'Work',
      icon: 'assignment',
      segments: [
        { href: '/work/requests', label: 'Requests', count: counts.requests },
        { href: '/work/jobs', label: 'Jobs' },
        { href: '/work/dockets', label: 'Dockets' },
        { href: '/work/exceptions', label: 'Exceptions', count: counts.exceptions },
      ],
    },
    {
      href: '/money',
      label: 'Money',
      icon: 'payments',
      segments: [
        { href: '/money/statements', label: 'Statements' },
        { href: '/money/buyers', label: 'Buyers' },
      ],
    },
    {
      href: '/admin',
      label: 'Operations',
      icon: 'build',
      segments: [
        { href: '/admin/vehicles', label: 'Vehicles' },
        { href: '/admin/drivers', label: 'Drivers' },
        { href: '/admin/devices', label: 'Devices' },
        { href: '/admin/sites', label: 'Sites' },
        { href: '/admin/rates', label: 'Rates' },
        { href: '/admin/operators', label: 'Operators' },
      ],
    },
  ];
}

// ── hauler ──────────────────────────────────────────────────────────────────

/**
 * The same slots as the coordinator, against the hauler's own org — same bar
 * SHAPE for a reason: Saturn holds both roles at once, and a user who
 * switches between them should not learn two bars. That is also why
 * Operations sits here even though it holds one page today — the coordinator
 * side of the same idea has six; the shape stays identical and grows into
 * itself rather than appearing later as a surprise 4th icon.
 *
 * The map is new here and earns its slot: a hauler's first question is where
 * its own trucks are, and it had no way to ask. Money has no segments because a
 * hauler has one money screen — a section MAY have segments, it does not have
 * to.
 */
export const HAULER_ROUTES: Route[] = [
  { href: '/hauler/map', label: 'Map', icon: 'pin_drop', fill: true },
  {
    href: '/hauler/work',
    label: 'Work',
    icon: 'assignment',
    segments: [
      { href: '/hauler/work/available', label: 'Available' },
      { href: '/hauler/work/dockets', label: 'My dockets' },
    ],
  },
  { href: '/hauler/money', label: 'Money', icon: 'payments' },
  { href: '/hauler/vehicles', label: 'Operations', icon: 'build' },
];

// ── worker ──────────────────────────────────────────────────────────────────

/**
 * Two destinations, at `tap` size, and a third row that is not one.
 *
 * A driver's app is not a place to browse — it is today's work and what today
 * came to. `/job` carries no label, so it never appears in the bar; entering it
 * morphs the bar to a back arrow, because mid-load the only navigation that
 * makes sense is out of it.
 */
export const WORKER_ROUTES: Route[] = [
  { href: '/today', label: 'Today', icon: 'today' },
  { href: '/summary', label: 'Summary', icon: 'done_all' },
  { href: '/job', isolate: { backHref: '/today', label: 'Back to today' } },
];

// ── the agent's copy ────────────────────────────────────────────────────────

export const OPS_AGENT_COPY = {
  placeholder: 'Ask about a plate, a docket, an exception…',
  blurb:
    'I can read this org’s jobs, dockets, positions, exceptions and statements, and I can draft. I can’t close, void, verify or price anything — those are yours.',
};
