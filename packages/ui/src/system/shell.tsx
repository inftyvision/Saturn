'use client';

/**
 * The app shell. ONE layout, worn by every surface in both apps.
 *
 * What this replaces: four unrelated chromes — a coordinator sidebar, a driver
 * phone column, a hauler tab strip and a buyer top nav — that shared no
 * component, no gutter and no idea of where the account lives. Same product,
 * four layouts, and a change to any of them changed one.
 *
 * The structure, top to bottom:
 *
 *   AppFrame        the viewport. Owns the gutters and the safe-area insets.
 *     AppHeader     a lane on the BODY background, above the card
 *     PageCard      the surface. Rounded, tinted, and it CROPS — the bar, the
 *                   agent layer and the side menu are all inside it
 *
 * The header sits outside the card rather than inside it because the card is
 * the content and the header is not. It is also what makes one button able to
 * open the side menu and close it: the menu fills the card, the header stays
 * above, so the control that opened it is still on screen.
 *
 * ## Why a flex column and not `position: fixed`
 *
 * Syvon's version pins the header to the visual viewport so the iOS keyboard
 * cannot slide it into the card, and pays for it with a resize listener, a set
 * of CSS custom properties and a `translateZ` trap that pins any `fixed`
 * descendant. None of that is load-bearing here yet, and a flex column gets the
 * identical layout with nothing to go stale. Revisit when the Capacitor build
 * has a keyboard to fight.
 */

import { useEffect, type ReactNode } from 'react';
import { Icon } from '../Icon';
import { Avatar } from './people';
import { Kicker } from './typography';
import { Count } from './status';

/** The card's fill — the background lifted 2% toward the foreground. A tint,
 *  not a border: the card IS the surface, not a box drawn on one. */
export const CARD_FILL = 'color-mix(in srgb, hsl(var(--background)) 70%, hsl(var(--foreground)) 2%)';

/** The same fill composited OPAQUE, for a layer that must hide what is under
 *  it. A conversation raised over the map is a surface, not a scrim — at 86%
 *  glass its colour is whatever happened to be behind it. */
export const CARD_FILL_OPAQUE =
  'color-mix(in srgb, hsl(var(--background)) 98%, hsl(var(--foreground)) 2%)';

// ── the frame ───────────────────────────────────────────────────────────────

/**
 * `width` is the one genuine ergonomic difference between the surfaces.
 *
 *   desk    the coordinator and the operator, at a screen with a keyboard,
 *           watching a day unfold across wide tables
 *   column  the contractor and the hauler — phone-first surfaces opened a few
 *           times a week, which must not stretch to 1400px on a review machine
 *           and look fine while hiding that
 *   phone   the worker, one thumb, in sunlight
 *
 * Centred either way, with the rest of the viewport as backdrop.
 */
export type FrameWidth = 'desk' | 'column' | 'phone';

const FRAME_MAX: Record<FrameWidth, string> = {
  desk: '',
  column: 'max-w-3xl',
  phone: 'max-w-[520px]',
};

export function AppFrame({ children, width = 'desk' }: { children: ReactNode; width?: FrameWidth }) {
  return (
    <div className="flex h-dvh w-full justify-center overflow-hidden bg-background">
      <div
        className={`flex h-dvh w-full flex-col overflow-hidden px-3 pb-[max(env(safe-area-inset-bottom,0px),12px)] text-foreground lg:px-5 lg:pb-5 ${FRAME_MAX[width]}`}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * The header lane. Leading edge is CONTEXT, trailing edge is ACTIONS.
 *
 *   [account] [title] ·············· [what this screen can do]
 *
 * The account lives here, not in the bar. It is a once-a-month destination and
 * it was occupying the best thumb real estate on the pill; the agent took that
 * slot, which is the trade this layout exists to make.
 */
export function AppHeader({
  leading,
  title,
  actions,
}: {
  leading?: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex h-[52px] shrink-0 items-center justify-between gap-3 pt-[env(safe-area-inset-top,0px)] lg:h-16">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {leading}
        <div className="min-w-0 flex-1">{title}</div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}

/** What the header's title slot usually holds: where you are, and what it is. */
export function HeaderTitle({ kicker, title }: { kicker?: string; title: ReactNode }) {
  return (
    <div className="min-w-0">
      {kicker && <Kicker className="leading-none">{kicker}</Kicker>}
      <p className="truncate text-sm leading-tight">{title}</p>
    </div>
  );
}

/**
 * The header's default title slot: section › segment, not a second line
 * repeating who you are. It used to be a kicker reading `Coordinator ·
 * Saturn Mining & Haulage` over the page name — dead weight now that the
 * account control itself shows whose desk this is (`BrandBadge`), and it
 * never told you where you actually were the way this does.
 *
 * `parent` is the SECTION (Work, Money, Operations) — omitted on a surface
 * with no segments, like Map, where the current crumb IS the section and a
 * separator with nothing behind it would be a chevron pointing at air.
 * `current` is the SEGMENT when there is one, else the section itself.
 */
export function HeaderBreadcrumb({
  parent,
  current,
}: {
  parent?: { label: string; onClick?: () => void };
  current: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      {parent && (
        <>
          {parent.onClick ? (
            <button
              type="button"
              onClick={parent.onClick}
              className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {parent.label}
            </button>
          ) : (
            <span className="shrink-0 text-sm text-muted-foreground">{parent.label}</span>
          )}
          <Icon name="chevron_right" size={16} className="shrink-0 text-muted-foreground" aria-hidden />
        </>
      )}
      <p className="truncate text-sm leading-tight">{current}</p>
    </div>
  );
}

/**
 * The surface. Everything that floats — the bar, the agent layer, the side
 * menu — is a child of this, so the card crops all of it and nothing bleeds
 * into the gutter.
 */
export function PageCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-row">
      <div
        className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[24px] lg:rounded-[28px]"
        style={{ background: CARD_FILL }}
      >
        {children}
      </div>
    </div>
  );
}

// ── account ─────────────────────────────────────────────────────────────────

/**
 * The account control, leading edge of the header.
 *
 * It opens the SIDE MENU rather than navigating to a page, and that is the
 * whole reorganisation in one control: everything that is not a destination —
 * admin, settings, the things a coordinator touches monthly — lives one slide
 * away behind the person you are, instead of doubling the length of the nav.
 *
 * `badge` is for a count that must not hide. Open exceptions ride here when
 * Exceptions is not itself in the bar: it is the number that decides whether
 * the tally can be trusted, and a coordinator should never go looking for it.
 *
 * `brandMark` swaps the plain initials avatar for Gaia's own squircle,
 * carrying the vendor's mark where the initials used to sit — see
 * `system/brand`. It is opt-in: the container drops its circular crop for
 * it, because `BrandBadge` draws its own squircle shape and the corner stays
 * reserved for the ONE overlay this control has — the unread-count `Count`
 * below, never a second badge competing with it.
 */
export function AccountButton({
  name,
  open,
  badge,
  brandMark,
  onClick,
}: {
  name: string;
  /** The menu is up — the glyph becomes the cross that closes it. */
  open?: boolean;
  badge?: number;
  brandMark?: ReactNode;
  onClick: () => void;
}) {
  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        aria-label={open ? 'Close menu' : `Account — ${name}`}
        aria-expanded={open}
        title={open ? 'Close menu' : name}
        onClick={onClick}
        className={`flex size-8 items-center justify-center transition-all active:opacity-70 ${
          brandMark ? '' : 'overflow-hidden rounded-full hover:ring-1 hover:ring-foreground/25'
        } ${open ? 'rounded-full ring-1 ring-foreground/40' : ''}`}
        style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
      >
        {open ? <Icon name="close" size={18} /> : brandMark ?? <Avatar name={name} size={32} />}
      </button>
      {!open && <Count n={badge} corner />}
    </span>
  );
}

// ── presence ────────────────────────────────────────────────────────────────

/**
 * WHO holds the screen sets this about themselves — separate from `Status` in
 * `system/status.tsx`, which is a record's state, derived and read-only. This
 * is a person's own, and it is the one piece of state in the whole shell that
 * is genuinely un-derivable: nothing about a docket or a device says whether a
 * coordinator wants to be interrupted right now.
 *
 * Same three words as a driver's derived status — online, busy, inactive — on
 * purpose, so the dot means the same thing wherever it appears. But this one
 * is SET, not computed, and setting it here never writes back to
 * `driverStatus()`; the two are namesakes, not the same fact.
 *
 * Held in `AppShell`'s own state rather than a prop, same as `menuOpen` and
 * `agentOpen` — there is no backend to persist it to, and a prototype value
 * that outlives the tab is a value someone will build on.
 */
export type Presence = 'online' | 'busy' | 'inactive';

const PRESENCE_LABEL: Record<Presence, string> = {
  online: 'Online',
  busy: 'Busy',
  inactive: 'Inactive',
};

/** Busy reads as live as online does — both mean "here" — inactive is the one
 *  that goes quiet. Same read as `Status`'s tone table, one level down. */
const PRESENCE_DOT: Record<Presence, string> = {
  online: 'bg-[hsl(var(--primary))]',
  busy: 'bg-[hsl(var(--primary))]',
  inactive: 'bg-muted-foreground',
};

/** A WhatsApp-style tap-to-set, not a form. `<details>` again — see `Menu` in
 *  `system/action` for the same call: three items and no click-away is a
 *  fair trade against pulling in a menu library for this. */
function PresencePicker({ value, onChange }: { value: Presence; onChange: (p: Presence) => void }) {
  return (
    <details className="relative shrink-0">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/30 [&::-webkit-details-marker]:hidden">
        <span className={`inline-block h-2 w-2 rounded-full ${PRESENCE_DOT[value]}`} />
        {PRESENCE_LABEL[value]}
        <Icon name="expand_more" size={14} />
      </summary>
      <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border bg-card p-1 shadow-lg">
        {(Object.keys(PRESENCE_LABEL) as Presence[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent"
          >
            <span className={`inline-block h-2 w-2 rounded-full ${PRESENCE_DOT[p]}`} />
            {PRESENCE_LABEL[p]}
          </button>
        ))}
      </div>
    </details>
  );
}

/**
 * The menu's opening row: who you are, wearing the same avatar the header's
 * account button does, with your own presence beside it. Everything below
 * this in the menu is a destination or an action; this is neither — it is the
 * person, which is why the menu exists behind THIS control and not a "Menu"
 * label.
 */
export function SideMenuProfile({
  name,
  role,
  company,
  presence,
  onPresenceChange,
}: {
  name: string;
  role: string;
  /** Who `name` works for — Saturn Mining & Haulage, say. Omit when there is
   *  no distinct company (the buyer app's identity already IS the brand). */
  company?: string;
  presence: Presence;
  onPresenceChange: (p: Presence) => void;
}) {
  return (
    <div className="mb-2 flex items-center gap-3 border-b px-3 pb-4 pt-1">
      <Avatar name={name} size={44} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {role}
          {company && ` · ${company}`}
        </p>
      </div>
      <PresencePicker value={presence} onChange={onPresenceChange} />
    </div>
  );
}

// ── the side menu ───────────────────────────────────────────────────────────

/**
 * Everything that is not a destination, one slide from the right.
 *
 * Full width over the card, deliberately: the header sits above the card, so a
 * panel that fills it still leaves the account button visible — which is what
 * lets that one button be both the opener and the cross. No backdrop to tap at
 * full width, and none needed.
 *
 * No title inside the panel. The header already says where you are; repeating
 * it six pixels below is the same word twice. `title` still names the dialog
 * for assistive tech.
 */
export function SideMenu({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="gaia-side-panel absolute inset-0 z-30 overflow-y-auto px-2 pb-6 pt-3"
      style={{ background: CARD_FILL_OPAQUE }}
    >
      {/* A COLUMN, not the full card. The panel fills the card so that the
          header's one button can be both the opener and the cross, but a list
          of six one-word rows stretched across a 1400px desk is a list nobody
          can scan — the label and its badge end up a hand-span apart. */}
      <div className="mx-auto flex w-full max-w-md flex-col">{children}</div>
    </div>
  );
}

/** A labelled run inside the menu. The label is a kicker because it is above a
 *  GROUP — the one place in this layout where that rule bites. */
export function SideMenuGroup({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="pb-2">
      {label && <Kicker className="px-3 pb-1 pt-3">{label}</Kicker>}
      {children}
    </div>
  );
}

/**
 * One row. Full-width target, glyph leading.
 *
 * `danger` is the same decision `Action` makes and for the same reason: colour
 * is the only warning a one-line row can carry, and anything that voids,
 * deletes or revokes gets it even when it reads as routine.
 */
export function SideMenuItem({
  icon,
  label,
  sub,
  badge,
  active,
  href,
  onClick,
  danger,
}: {
  icon: string;
  label: string;
  sub?: string;
  badge?: number;
  active?: boolean;
  /** Renders an `<a>`, so Cmd-click works and a document opens in a tab. */
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const cls = `flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-muted/30 active:opacity-70 ${
    active ? 'bg-muted/30' : ''
  }`;
  const tone = danger ? 'text-[hsl(var(--destructive))]' : active ? 'text-foreground' : 'text-muted-foreground';

  const inner = (
    <>
      <Icon name={icon} size={19} className={tone} />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm ${danger ? 'text-[hsl(var(--destructive))]' : ''}`}>
          {label}
        </span>
        {sub && <span className="block truncate text-xs text-muted-foreground">{sub}</span>}
      </span>
      <Count n={badge} />
    </>
  );

  return href ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

// ── sub-navigation ──────────────────────────────────────────────────────────

/**
 * The segments inside a section.
 *
 * The bar carries THREE destinations, so Work holds requests, jobs, dockets and
 * exceptions, and Money holds statements and buyers. That nesting is the cost
 * of a short bar, and this is where it is paid — once, in one control, rather
 * than as a different tab strip on each screen.
 *
 * A segment is a link, not a filter: each one is its own route, so a coordinator
 * can send someone a URL that lands on the exceptions list rather than on Work
 * with instructions.
 */
export function Segments({
  items,
  active,
  onSelect,
}: {
  items: { key: string; label: string; badge?: number }[];
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex shrink-0 gap-1 overflow-x-auto px-4 pb-1 pt-3 lg:px-6">
      {items.map((it) => {
        const on = it.key === active;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onSelect(it.key)}
            aria-current={on ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors ${
              on
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
            }`}
          >
            {it.label}
            <Count n={it.badge} inverse={on} />
          </button>
        );
      })}
    </div>
  );
}
