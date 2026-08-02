'use client';

/**
 * The shell. ONE component, worn by every surface in both apps.
 *
 * This is in the library rather than in an app because the rule that governs
 * everything else here governs this too: both apps wear it, so the one that
 * forked would be the one nobody looked at. Coordinator, hauler, worker,
 * operator and contractor differ in DATA — which sections, which size, whether
 * there is an agent and what it may draw — never in layout.
 *
 * What it replaces: five unrelated chromes that shared no component, no gutter
 * and no idea of where the account lives.
 *
 * Ported from Syvon's agent-app `Shell` (beta-v2,
 * `apps/agent/src/components/chrome/Shell.tsx`), with two simplifications worth
 * naming because they look like omissions:
 *
 *  - **No portal.** There, the composer lives in a chat SCREEN on its own route
 *    and must be portalled into a bar owned by the layout. Here the shell owns
 *    both, so the composer is simply what the bar renders in chat mode — and
 *    the whole class of bug their portal comments describe (the slot
 *    unmounting, the composer returning empty) cannot occur.
 *
 *  - **No visual-viewport tracking.** Their header is `position: fixed` and
 *    fights the iOS keyboard for it. This header is a flex row in a column, so
 *    the keyboard cannot move it independently of the card. Revisit when there
 *    is a Capacitor build with a keyboard.
 *
 * ## The three bar modes
 *
 *   sections   the destinations + the agent      — resting
 *   chat       the composer                      — the agent layer is up
 *   isolate    back + what this thing can do     — inside a job
 *
 * One instance, width-animated between them. See `system/bar` for why that is a
 * morph and not three bars that show and hide.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { AgentExchange } from '@gaia/core';
import { starters } from '@gaia/core';
import {
  BarAction,
  BarDivider,
  BarInput,
  FloatingBar,
  useBarWidth,
  type BarSize,
} from './bar';
import {
  AccountButton,
  AppFrame,
  AppHeader,
  CARD_FILL_OPAQUE,
  HeaderBreadcrumb,
  HeaderTitle,
  PageCard,
  Segments,
  SideMenu,
  SideMenuGroup,
  SideMenuItem,
  SideMenuProfile,
  type FrameWidth,
  type Presence,
} from './shell';
import { ChatLog, Starters, useAgentThread, type AnswerComponents } from './chat';

// ── the data the shell is driven by ─────────────────────────────────────────

/**
 * ONE row per route that behaves in any way of its own.
 *
 * This replaced three props — `sections`, `segments` and `fillPaths` — plus a
 * standalone `isolate` matcher. All four were answering the same question,
 * "what is special about this path", in four different shapes, and the answers
 * for one route were spread across all of them: Map was a section here and a
 * fill-path there, Work was a section here and a segment group there.
 *
 * Now a route says everything about itself in one place. A row with no `label`
 * is not a destination at all — just a path with behaviour, which is exactly
 * what the worker's `/job` is: nothing in the bar, but entering it morphs the
 * bar to isolate.
 *
 * Plain data, not resolvers: a layout is a Server Component and a function
 * cannot cross that boundary.
 */
export interface ShellRoute {
  /** Route prefix. Also the active test — `/work` matches `/work/jobs/j_1`. */
  href: string;
  /** Present → it is a destination in the bar. Absent → behaviour only. */
  label?: string;
  icon?: string;
  /** The screen IS the card: no scroll, no reserved bar lane. The map. */
  fill?: boolean;
  /** Sub-navigation. The cost of a three-icon bar, paid in one control. */
  segments?: { href: string; label: string; count?: number }[];
  /** Entering this path morphs the bar to a back arrow. */
  isolate?: { backHref: string; label: string };
}

export interface ShellMenuGroup {
  label?: string;
  items: { href?: string; label: string; sub?: string; icon: string; badge?: number; danger?: boolean }[];
}

export interface ShellAgent {
  /** The canned exchanges. See `@gaia/core`'s `agent.ts`. */
  script: AgentExchange[];
  /** What this app is willing to let the agent draw. An omission is a refusal. */
  answers: AnswerComponents;
  placeholder: string;
  /** One line on what it will and will not do. Shown above the starter chips. */
  blurb: string;
}

/** Does this path sit under this href? */
const under = (path: string, href: string) => path === href || path.startsWith(href + '/');

/**
 * Which route owns a path — LONGEST match wins.
 *
 * Longest, not first: once routes and their behaviour live in one table, a
 * nested row (`/hauler/work`) and its parent-ish sibling can both prefix-match,
 * and declaration order should not be what decides. Longest is the only answer
 * that stays right however the table is sorted.
 */
export function routeFor(routes: ShellRoute[], path: string): ShellRoute | null {
  return (
    routes
      .filter((r) => under(path, r.href))
      .sort((a, b) => b.href.length - a.href.length)[0] ?? null
  );
}

// ── the shell ───────────────────────────────────────────────────────────────

export function AppShell({
  children,
  routes,
  identity,
  title,
  headerActions,
  banner,
  menu,
  menuExtra,
  agent,
  accountBadge,
  brandMark,
  personName,
  company,
  surface = 'desk',
}: {
  children: ReactNode;
  /** The whole of this surface's navigation and per-path behaviour. */
  routes: ShellRoute[];
  /** WHICH ORG a screen is scoped to — drives the bar, the breadcrumb
   *  fallback, and (unless `personName` overrides it) the menu profile's
   *  name. Not necessarily a person: the coordinator and hauler pass their
   *  ORG here, because that is what the header and breadcrumb need to say. */
  identity: { name: string; role: string };
  title?: ReactNode;
  headerActions?: ReactNode;
  /**
   * A strip PINNED at the top of the card, above the scrolling body.
   *
   * The worker's sync banner is the reason this exists and the only thing that
   * has earned it: §15 makes offline load-bearing, so a driver is routinely
   * producing dockets the server has never seen, and "3 entries saved on this
   * phone" is not information that may scroll away. Anything that can scroll
   * belongs in `children`.
   */
  banner?: ReactNode;
  menu: ShellMenuGroup[];
  /** Anything in the menu that is not a row — the worker's prototype condition
   *  strip, which is a set of controls rather than a list of destinations. */
  menuExtra?: ReactNode;
  /** Omit for no agent at all. */
  agent?: ShellAgent;
  accountBadge?: number;
  /** Gaia's own squircle, carrying the vendor's mark in place of the plain
   *  initials avatar — see `AccountButton`. Ops passes this; the buyer app
   *  doesn't, because it already wears the vendor's brand end to end. */
  brandMark?: ReactNode;
  /** The menu profile's name, when it should be a PERSON rather than
   *  `identity.name` — which is often an org (see `identity` above). Omit to
   *  show `identity.name` there, as before. */
  personName?: string;
  /** The menu profile's "works for" line — `identity.name` when `personName`
   *  overrides the default, or any other company line worth showing. Omit
   *  for no line at all. */
  company?: string;
  /**
   * WHO is holding the screen. One axis, because the two it replaced were never
   * set independently:
   *
   *   desk    full width, `lg` controls   — the coordinator
   *   column  phone-first, `lg` controls  — contractor, hauler
   *   phone   phone-first, `tap` controls — the worker
   *
   * `width="phone" size="lg"` was expressible and meaningless; `width="desk"
   * size="tap"` was expressible and wrong. Two props that must agree are one
   * prop with a bug waiting in it.
   */
  surface?: FrameWidth;
}) {
  const path = usePathname() ?? '/';
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  // The one piece of state in this shell that is set rather than derived —
  // see the note on `Presence` in `system/shell`.
  const [presence, setPresence] = useState<Presence>('online');
  // The agent's two detents, as beta-v2 models them: `open` is the composer
  // with the surface untouched; `expanded` is the transcript over it. Opening
  // goes straight to expanded — pressing "Agent" and getting a composer with no
  // visible conversation was the bug that pattern fixes.
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentExpanded, setAgentExpanded] = useState(false);
  const [draft, setDraft] = useState('');

  // Hooks cannot be conditional, so the thread is always built. With no agent
  // configured it is a thread over an empty script that nothing can reach.
  // The bar's control size follows the surface. The worker is the only one that
  // moves off `lg`, and it moves because of the 56px `tap` floor — gloves, in
  // sunlight — not because the screen is small.
  const size: BarSize = surface === 'phone' ? 'tap' : 'lg';

  const thread = useAgentThread(agent?.script ?? []);
  const chips = useMemo(() => (agent ? starters(agent.script) : []), [agent]);

  /** The one row that owns where you are. Everything below reads from it. */
  const here = routeFor(routes, path);
  /** What the bar offers — the rows that chose to be destinations. */
  const sections = useMemo(() => routes.filter((r) => r.label && r.icon), [routes]);

  const isolate = here?.isolate ?? null;
  const inIsolate = !!isolate;
  const inChat = !!agent && agentOpen && !inIsolate;
  /** The DESTINATION lit in the bar. A behaviour-only row (the worker's /job)
   *  lights nothing, which is right — you are not at a destination. */
  const active = here?.label ? here.href : null;
  const strip = here?.segments?.length ? here.segments : null;
  const fill = !!here?.fill;

  /**
   * STICKY SEGMENTS — the tap the short bar would otherwise cost.
   *
   * Three destinations bought a legible bar by nesting four surfaces under
   * Work. Paid naively that is a tap every single time: Map → Work → *Requests*
   * → Dockets, for someone who lives in Dockets and never looks at Requests.
   *
   * So a section remembers the segment you were last on and returns you there.
   * Nothing is added to the screen — the fix is that the bar stops forgetting.
   *
   * Two deliberate limits:
   *
   *  - It remembers the SEGMENT, never a record. From `/work/jobs/j_1`, Work
   *    returns to the jobs list, not to that job. Coming back to a section is
   *    "where was I working", not "re-open the row I had open", and a bar that
   *    reopened a docket you had finished with would be worse than one tap.
   *  - Tapping the section you are ALREADY on resets it to the first segment.
   *    That is the way back to the default, and it costs no chrome — the same
   *    gesture a tab bar has meant for fifteen years.
   *
   * In memory, not storage: it is about the trip you are on. Restoring
   * yesterday's segment after a reload is a surprise, not a convenience.
   */
  const lastSegment = useRef<Record<string, string>>({});
  useEffect(() => {
    if (!active || !strip) return;
    const seg = strip.find((s) => under(path, s.href));
    if (seg) lastSegment.current[active] = seg.href;
  }, [active, strip, path]);

  const goToSection = (href: string) => {
    // Re-tapping the current section is the reset.
    if (href === active) {
      delete lastSegment.current[href];
      router.push(href);
      return;
    }
    router.push(lastSegment.current[href] ?? href);
  };

  /**
   * WHERE YOU ARE, in the header, derived rather than passed.
   *
   * Every screen used to open with its own `PageHeader` saying its own name,
   * directly under a chrome header saying the org's. Two titles, six pixels
   * apart, and the one that answered "where am I" was the smaller of them.
   *
   * The deepest thing that is true wins: a segment names the screen more
   * precisely than its section does, so Work → Dockets reads "Dockets". Falls
   * back to the identity on a surface outside every section.
   */
  const segmentLabel = strip?.find((s) => under(path, s.href))?.label;
  const title_ = segmentLabel ?? here?.label ?? identity.name;
  /** The breadcrumb's parent crumb — only when a segment is actually showing
   *  a deeper name than its section; see `HeaderBreadcrumb`. */
  const crumbParent =
    segmentLabel && here?.label ? { label: here.label, onClick: () => goToSection(here.href) } : undefined;

  // A route change closes everything transient. Without this, navigating out of
  // a job mid-isolate leaves the pill on a back arrow pointing at a screen
  // nobody is on, and the menu stays open over a surface it was not opened from.
  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  // Esc steps DOWN one detent rather than closing outright: expanded →
  // composer → closed. The same as the back gesture everywhere else — undo the
  // last thing you opened, not everything at once.
  useEffect(() => {
    if (!agentOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (agentExpanded) setAgentExpanded(false);
      else setAgentOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [agentOpen, agentExpanded]);

  const closeAgent = () => {
    setAgentOpen(false);
    setAgentExpanded(false);
  };

  const toggleAgent = () => {
    if (agentOpen) return closeAgent();
    setAgentOpen(true);
    setAgentExpanded(true);
  };

  const submit = () => {
    if (!draft.trim() || thread.busy) return;
    setAgentExpanded(true);
    thread.send(draft);
    setDraft('');
  };

  // Measured so the pill fits its contents exactly at any rem.
  const bar = useBarWidth([inChat, inIsolate, active, sections.length, surface, !!agent]);
  // In chat mode the bar's own buttons stay at a thumb size even on the worker
  // surface: `tap` renders its label under the glyph, and a composer with two
  // captioned buttons either side of the input is a composer with no input.
  const barSize: BarSize = size === 'tap' && inChat ? 'lg' : size;

  return (
    <AppFrame width={surface}>
      <AppHeader
        leading={
          <AccountButton
            name={identity.name}
            open={menuOpen}
            badge={menuOpen ? undefined : accountBadge}
            brandMark={brandMark}
            onClick={() => setMenuOpen((v) => !v)}
          />
        }
        title={
          menuOpen ? (
            <HeaderTitle kicker={identity.role} title="Menu" />
          ) : (
            (title ?? <HeaderBreadcrumb parent={crumbParent} current={title_} />)
          )
        }
        actions={menuOpen ? undefined : headerActions}
      />

      <PageCard>
        {banner && !menuOpen && <div className="shrink-0">{banner}</div>}

        {/* The section's own segments — the cost of a three-icon bar, paid once
            in one control instead of as a different tab strip per screen. */}
        {strip && !menuOpen && (
          <Segments
            items={strip.map((s) => ({ key: s.href, label: s.label, badge: s.count }))}
            active={strip.find((s) => under(path, s.href))?.href ?? strip[0]!.href}
            onSelect={(href) => router.push(href)}
          />
        )}

        {/* `fill` is for a surface that IS the card — the map. It gets no
            scroll and no bottom padding, because there is nothing to scroll
            past and the bar floats over it by design. Everything else scrolls
            and reserves the bar's lane, so the last row of a list is never
            parked under the glass. */}
        {fill ? (
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-[88px]">{children}</div>
        )}

        {/* ── the agent layer ──────────────────────────────────────────────
            INSIDE the card, so the conversation lives in the same frame as
            every other surface and the bar floats over it. Mounted outside, it
            was a viewport-wide sheet that covered its own composer. */}
        {agent && agentOpen && (
          <>
            {/* Detent 2's backdrop is the card's OWN fill, composited opaque —
                not a scrim. A conversation is a surface; at 86% glass its
                colour is whatever happened to be behind it. Click drops back to
                the composer, for a look at what you were doing. */}
            {agentExpanded && (
              <div
                aria-hidden
                className="absolute inset-0 z-[21]"
                style={{ background: CARD_FILL_OPAQUE }}
                onClick={() => setAgentExpanded(false)}
              />
            )}
            <div
              className="gaia-layer absolute inset-0 z-[22] flex flex-col pb-[84px]"
              // `visibility`, not unmounting: collapsing to the composer must
              // not tear down an in-flight reply, which is exactly the state
              // you are in when you glance back at the map.
              style={{ visibility: agentExpanded ? 'visible' : 'hidden' }}
            >
              <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-4 lg:px-6">
                <HeaderTitle kicker="Agent" title="Reads and drafts. Never commits." />
                <BarAction
                  icon="close"
                  label="Close the conversation"
                  variant="plain"
                  size="md"
                  onClick={closeAgent}
                />
              </div>
              <ChatLog
                turns={thread.turns}
                thinking={thread.thinking}
                components={agent.answers}
                empty={
                  <div className="flex flex-col gap-3 pb-2">
                    <p className="text-sm text-muted-foreground">{agent.blurb}</p>
                    <Starters items={chips} onPick={(q) => thread.send(q)} />
                  </div>
                }
              />
            </div>
          </>
        )}

        {/* ── the side menu ───────────────────────────────────────────────── */}
        {menuOpen && (
          <SideMenu title="Menu" onClose={() => setMenuOpen(false)}>
            <SideMenuProfile
              name={personName ?? identity.name}
              role={identity.role}
              company={company}
              presence={presence}
              onPresenceChange={setPresence}
            />
            {menu.map((g, i) => (
              <SideMenuGroup key={g.label ?? i} label={g.label}>
                {g.items.map((it) => (
                  <SideMenuItem
                    key={it.label}
                    icon={it.icon}
                    label={it.label}
                    sub={it.sub}
                    badge={it.badge}
                    danger={it.danger}
                    active={it.href ? path.startsWith(it.href) : false}
                    onClick={it.href ? () => router.push(it.href!) : undefined}
                  />
                ))}
              </SideMenuGroup>
            ))}
            {menuExtra}
          </SideMenu>
        )}

        {/* ── THE bar ─────────────────────────────────────────────────────
            Hidden, never unmounted, while the menu is up: the menu covers the
            card, and a pill floating over it would read as belonging to it. */}
        <FloatingBar
          visible={!menuOpen}
          bottom={inChat ? '18px' : '20px'}
          width={inChat ? 'min(640px, 100%)' : bar.width}
        >
          {inChat ? (
            <div className="flex w-full min-w-0 items-center gap-2">
              {/* Back to the sections. `active` because this is the control
                  holding the bar in this mode. */}
              <BarAction
                icon="chevron_left"
                label="Back to sections"
                variant="plain"
                size={barSize}
                active
                onClick={closeAgent}
              />
              <BarInput
                value={draft}
                onChange={setDraft}
                onSubmit={submit}
                placeholder={agent!.placeholder}
                disabled={thread.busy}
              />
              {/* Send lands exactly where the Agent button was — so that button
                  is not replaced, it BECOMES Send. */}
              <BarAction
                icon="arrow_upward"
                label="Send"
                size={barSize}
                disabled={!draft.trim() || thread.busy}
                onClick={submit}
              />
            </div>
          ) : inIsolate ? (
            <div ref={bar.ref} className="mx-auto flex items-center gap-1">
              <BarAction
                icon="arrow_back"
                label={isolate.label}
                variant="plain"
                size={size}
                onClick={() => router.push(isolate.backHref)}
              />
              {agent && (
                <>
                  <BarDivider />
                  <BarAction icon="neurology" label="Agent" variant="plain" size={size} onClick={toggleAgent} />
                </>
              )}
            </div>
          ) : (
            <div ref={bar.ref} className="mx-auto flex items-center gap-1">
              {sections.map((s) => (
                <BarAction
                  key={s.href}
                  icon={s.icon!}
                  label={s.label!}
                  active={s.href === active}
                  size={size}
                  onClick={() => goToSection(s.href)}
                />
              ))}
              {/* The hairline. Everything left of it is a DESTINATION; the one
                  thing right of it is the agent, which is a layer over wherever
                  you already are — not a fifth place that never highlights. */}
              {agent && (
                <>
                  <BarDivider />
                  <BarAction
                    icon="neurology"
                    label="Agent"
                    variant="plain"
                    active={agentOpen}
                    size={size}
                    onClick={toggleAgent}
                  />
                </>
              )}
            </div>
          )}
        </FloatingBar>
      </PageCard>
    </AppFrame>
  );
}
