'use client';

/**
 * ⚠ SCAFFOLDING. The buyer app's half of the prototype mode table.
 *
 * The widget is `ModeSwitch` in `@gaia/ui/dev`; this names the modes reachable
 * from here. Shorter than the ops list because the contractor app genuinely has
 * one surface — everything else on the panel is a jump back to ops, which is a
 * different build on a different port and, in production, a different hostname
 * belonging to a different company. That is the whole reason this is
 * scaffolding: nobody walks between these two apps.
 *
 * Mounted in the ROOT layout, so it is present on `/o/[token]` and `/login`
 * too. Those render no product chrome by design, and a reviewer landing on the
 * tracking link still needs a way out of it.
 */

import { usePathname } from 'next/navigation';
import { ModeSwitch, type Mode } from '@gaia/ui';

const OPS = 'http://localhost:3050';

const MODES: Mode[] = [
  { href: '/orders', label: 'Contractor', match: (p) => !p.startsWith('/o/') && p !== '/login' },
  { href: '/o/tk_9f2a41c7', label: 'Tracking link · no account', match: (p) => p.startsWith('/o/') },
  { href: '/login', label: 'Sign in', match: (p) => p === '/login' },
  { href: `${OPS}/map`, label: 'Coordinator · ops app', external: true },
  { href: `${OPS}/sandbox`, label: 'Sandbox', external: true },
];

export function BuyerModeSwitch() {
  const path = usePathname() ?? '/';
  return <ModeSwitch modes={MODES} path={path} />;
}
