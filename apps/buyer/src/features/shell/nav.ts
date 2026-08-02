/**
 * What the contractor's bar offers, and how each path behaves.
 *
 * No `'use client'` — a Server Component reads this table, and a client
 * module's exports arrive as client *references* rather than values. See the
 * same note in the ops app's `nav.ts`.
 *
 * ## The same three slots: WHERE · WHAT · OWED
 *
 *   Map      where the delivery is
 *   Orders   what is coming and what came      ← the "what" slot, in the
 *                                                contractor's own noun
 *   Money    what is owed
 *   ┊
 *   Agent
 *
 * One grammar across the coordinator, the hauler and the contractor. The label
 * differs where the word differs — a yard says "work", a contractor says
 * "orders" — but the shape is identical, which is what someone actually learns.
 *
 * ## What moved, and what is deliberately not here
 *
 * **Sites went to the side menu.** A contractor adds a delivery site once and
 * then orders to it for months; it is a management surface, not a destination.
 * Giving up that slot is what bought the map — and the map answers the question
 * this whole product is asked most.
 *
 * **"Order material" is not in the bar.** It was a tab, and it should not have
 * been: the bar's grammar is that everything left of the hairline is a place,
 * and a creation flow is not a place. It is the `primary` action on the Orders
 * screen instead — which is what `primary` is for, "the ONE action the screen
 * exists for", and more prominent there than as the second of four tabs.
 */

import type { ShellRoute } from '@gaia/ui';

export type Route = ShellRoute;

export const BUYER_ROUTES: Route[] = [
  { href: '/map', label: 'Map', icon: 'pin_drop', fill: true },
  { href: '/orders', label: 'Orders', icon: 'inventory_2' },
  { href: '/money', label: 'Money', icon: 'payments' },
];
