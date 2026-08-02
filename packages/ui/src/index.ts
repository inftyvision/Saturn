/**
 * @gaia/ui — the component library for both apps.
 *
 * Three layers, and the distinction matters:
 *
 *   primitives/  vendored shadcn. Generated source, not a dependency. Only what
 *                is used is here; adding one back is `npx shadcn add`.
 *   system/      the APP vocabulary — typography, layout, cards, status,
 *                actions, people, and the SHELL every surface wears (shell,
 *                bar, chat). This is where consistency is enforced, and where a
 *                screen should reach first.
 *   token-bridge design tokens → the shadcn variables the primitives read.
 *
 * The shell is in here rather than in an app for the same reason everything
 * else is: both apps wear it, and the one that forked would be the one nobody
 * looked at. `system/shell` is the frame, header, card and side menu;
 * `system/bar` is the single morphing pill that is all the global navigation
 * either app has; `system/chat` is the agent conversation and the renderer that
 * turns its answers into these very components.
 *
 * The rule: a screen composes `system/`. It reaches into `primitives/` only for
 * form controls and tables. Anything a screen styles by hand is a gap in
 * `system/` — fix it here, not there.
 *
 * See /sandbox/components in the ops app for the live catalogue and the rules.
 */

// ── primitives ───────────────────────────────────────────────────────────────
export * from './primitives/badge';
export * from './primitives/button';
export * from './primitives/input';
export * from './primitives/label';
export * from './primitives/select';
export * from './primitives/table';
export * from './utils';
export { Icon } from './Icon';
export * from './icons';

// ── system ───────────────────────────────────────────────────────────────────
export * from './system/typography';
export * from './system/layout';
export * from './system/card';
export * from './system/count-up';
export * from './system/chart';
export * from './system/brand';
export * from './system/status';
export * from './system/action';
export * from './system/people';
export * from './system/shell';
export * from './system/bar';
export * from './system/chat';
export * from './system/app-shell';

// ── data surfaces ────────────────────────────────────────────────────────────
export { FleetMap, MapLegend, type MapSite, type MapVehicle } from './FleetMap';

// ── scaffolding ──────────────────────────────────────────────────────────────
// NOT the app vocabulary. Prototype-only, mounted in each app's root layout,
// and one file to delete when auth lands. A screen must never compose from here.
export { ModeSwitch, type Mode } from './dev/ModeSwitch';

// ── tokens ───────────────────────────────────────────────────────────────────
export { shadcnVars, hexToHslTriplet, type TokenVariable } from './token-bridge';
