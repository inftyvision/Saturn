'use client';

/**
 * ⚠ SCAFFOLDING. The prototype's mode list, and where it is mounted.
 *
 * The widget itself is `ModeSwitch` in `@gaia/ui/dev` — a draggable puck, since
 * anything pinned over the app covers something wherever it rests and a fixed
 * corner only chooses which thing. This file is just the ops app's half of the
 * table: which modes exist and how to tell which one you are in.
 *
 * Spec: coordinator, hauler and worker are route groups inside ONE app, not
 * separate builds. In production which one you land on comes from your
 * `RoleGrant`, and someone holding two — Saturn holds coordinator and hauler
 * simultaneously — gets a real switch behind the account avatar. This is not
 * that, and the panel says so.
 *
 * It briefly also existed as a block in the side menu. Two ways to do one thing
 * is worse than either, and the menu is product chrome: a prototype affordance
 * sewn into it is one somebody eventually ships. The puck is unmistakably not
 * part of the app, which is the point.
 */

import { usePathname } from 'next/navigation';
import { ModeSwitch, type Mode } from '@gaia/ui';

/** The buyer app is a second build on a second port — see the note in
 *  `ModeSwitch` about why this is absolute and why that makes it scaffolding. */
const BUYER = 'http://localhost:3051/orders';

function isWorker(p: string) {
  return p === '/today' || p === '/summary' || p.startsWith('/job/');
}

const MODES: Mode[] = [
  {
    href: '/map',
    label: 'Coordinator',
    match: (p) => !p.startsWith('/hauler') && !isWorker(p) && !p.startsWith('/sandbox'),
  },
  { href: '/hauler/map', label: 'Hauler', match: (p) => p.startsWith('/hauler') },
  { href: '/today', label: 'Worker', match: isWorker },
  { href: '/sandbox', label: 'Sandbox', match: (p) => p.startsWith('/sandbox') },
  { href: BUYER, label: 'Contractor · buyer app', external: true },
];

export function RoleSwitch() {
  const path = usePathname() ?? '/';
  return <ModeSwitch modes={MODES} path={path} />;
}
