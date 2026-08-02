'use client';

/**
 * The bar. ONE per app, and it is the only global navigation either app has.
 *
 * Ported from Syvon's `FloatingBarShell` / `StudioIconButton` (beta-v2,
 * `packages/studio-ui`) and reconciled with this product's rules. It is a single
 * instance that MORPHS between modes rather than three bars that show and hide:
 *
 *   sections   the destinations, plus the Agent            — the resting state
 *   chat       the composer, when the agent layer is up
 *   isolate    a back arrow plus the surface's own actions — a photo, a docket
 *
 * The morph is the point. A bar that unmounts and remounts is three separate
 * controls that happen to sit in one place; a bar that animates its width
 * between contents is one control that changed shape, and the eye tracks it. It
 * also means the Send button in chat mode lands where the Agent button was, so
 * that button does not get replaced — it BECOMES Send.
 *
 * ## `BarAction` is chrome, not a decision
 *
 * `Action` is the decision table — primary, secondary, ghost, danger — and it
 * belongs on a PAGE, where the reader is choosing what to do. The bar is not
 * that: everything in it is either somewhere to go or the agent, and neither is
 * a decision with consequences. So `BarAction` has no `kind`.
 *
 * **Nothing that voids, deletes or revokes may ever be a `BarAction`.** Those
 * are `Action kind="danger"` on the surface that owns the record. A destructive
 * control sitting in the same pill as the section run, one slot from Map, is
 * exactly the accident the `danger` variant exists to prevent — and the bar
 * cannot signal it, because the bar's whole grammar is that everything in it is
 * safe to press.
 *
 * ## No hardcoded colour, including the bloom
 *
 * Syvon's bar draws its anchoring glow as `rgba(255,255,255,0.14)`, which is a
 * white bloom regardless of the brand under it. Here it is mixed from
 * `--foreground`, so the buyer app's light-on-dark vendor brand and any future
 * dark-on-light one both get a glow made of their own ink. Same rule as
 * `FleetMap` reading `--primary` at runtime: a hardcoded hex silently ignores a
 * brand change, and the failure looks like a design choice.
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Icon } from '../Icon';
import { Count } from './status';

// ── the pill ────────────────────────────────────────────────────────────────

/**
 * The glass container. `contained` anchors it to the page card rather than the
 * viewport, so the card crops it — which is what lets a side menu slide over
 * the card and cover the bar with it.
 */
export function FloatingBar({
  children,
  width,
  bottom = '20px',
  visible = true,
  contained = true,
}: {
  children: ReactNode;
  /** CSS width. Transitions between values — this is the morph. */
  width?: string | number;
  bottom?: string;
  /** Fades and disables without unmounting. Unmounting would destroy the
   *  composer's portal target and bring it back empty. */
  visible?: boolean;
  contained?: boolean;
}) {
  const position = contained ? 'absolute' : 'fixed';

  return (
    <>
      {/* The bloom that anchors the pill to the bottom of the card. Mixed from
          --foreground so it is the brand's own ink, never a white wash. */}
      <div
        aria-hidden
        style={{
          position,
          bottom,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(800px, 100%)',
          height: 220,
          zIndex: 19,
          pointerEvents: 'none',
          opacity: visible ? 1 : 0,
          transition: 'opacity 250ms ease',
          filter: 'blur(32px)',
          background:
            'radial-gradient(ellipse at bottom, color-mix(in srgb, hsl(var(--foreground)) 14%, transparent) 0%, color-mix(in srgb, hsl(var(--foreground)) 5%, transparent) 35%, transparent 100%)',
        }}
      />
      <div
        style={{
          position,
          bottom,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 25,
          width: width ?? 'fit-content',
          maxWidth: 'calc(100% - 24px)',
          // The width tween IS the morph. The 80ms delay lets the outgoing
          // content fade before the pill starts resizing around the new one.
          transition: 'width 200ms ease 80ms, opacity 250ms ease',
          background: 'color-mix(in srgb, hsl(var(--background)) 70%, transparent)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid color-mix(in srgb, hsl(var(--foreground)) 8%, transparent)',
          borderRadius: 32,
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        <div className="flex items-center gap-2 p-2">{children}</div>
      </div>
    </>
  );
}

/**
 * Measures its own content so the pill fits it exactly.
 *
 * A constant cannot work: the rem differs between phone and desk, so any fixed
 * width is right at one breakpoint and leaves dead glass at the other. Returns
 * an explicit px rather than `fit-content` because `fit-content` does not
 * animate — and the animation is the whole design.
 *
 * `deps` re-measures when the CONTENT changes (a mode switch, a badge
 * appearing); the ResizeObserver catches the rest, including the icon font
 * landing after the first measure and widening every glyph at once.
 */
export function useBarWidth(deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // +16 for the pill's own p-2 either side.
    const measure = () => setWidth(Math.ceil(el.getBoundingClientRect().width) + 16);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ref, width };
}

// ── the controls in it ──────────────────────────────────────────────────────

export type BarSize = 'md' | 'lg' | 'tap';

const SIZE: Record<BarSize, { box: string; icon: number; text: string }> = {
  md: { box: 'size-8', icon: 18, text: 'text-[10px]' },
  lg: { box: 'size-10', icon: 22, text: 'text-[11px]' },
  // The worker's floor. §`tap` — every control a driver presses in gloves, in
  // sunlight. The bar is not exempt: it is the only navigation on that surface.
  tap: { box: 'size-14', icon: 28, text: 'text-xs' },
};

/**
 * One control in the bar.
 *
 * ALWAYS carries a label, like `IconAction` — an unlabelled glyph is a guess,
 * and this product is opened twice a week by people who will not build muscle
 * memory. On the bar the label also RENDERS under the glyph at `tap` size,
 * because the worker surface has four icons total and room to say what they are.
 */
export function BarAction({
  icon,
  label,
  active,
  disabled,
  size = 'lg',
  variant = 'default',
  badge,
  onClick,
  children,
}: {
  icon?: string;
  label: string;
  /** This is where you are (a section) or this is raised (the agent). */
  active?: boolean;
  disabled?: boolean;
  size?: BarSize;
  /** `plain` never takes a filled background — for a control that is an action
   *  rather than a destination, so "where I am" stays unambiguous. */
  variant?: 'default' | 'plain';
  /** A count that must not hide. 0 renders nothing; over 99 reads "99+". */
  badge?: number;
  onClick?: () => void;
  /** A custom glyph, for the two-bars-into-a-cross control. Overrides `icon`. */
  children?: ReactNode;
}) {
  const cfg = SIZE[size];
  const showText = size === 'tap';

  const state = disabled
    ? 'text-muted-foreground/30 cursor-not-allowed'
    : active
      ? variant === 'plain'
        ? 'text-foreground'
        : 'bg-foreground text-background'
      : variant === 'plain'
        ? 'text-muted-foreground hover:text-foreground'
        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground';

  const button = (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active || undefined}
      title={label}
      className={`shrink-0 rounded-full transition-all ${
        showText ? `flex h-14 min-w-14 flex-col items-center justify-center gap-0.5 px-2` : `flex ${cfg.box} items-center justify-center`
      } ${state}`}
    >
      {children ?? (icon && <Icon name={icon} size={cfg.icon} className="shrink-0" />)}
      {showText && <span className={`${cfg.text} leading-none`}>{label}</span>}
    </button>
  );

  // The count rides OUTSIDE the button: the icon-only layout gives the button no
  // positioning context, and adding one would change how the tap label lays out.
  if (typeof badge === 'number' && badge > 0) {
    return (
      <span className="relative inline-flex">
        {button}
        <Count n={badge} corner />
      </span>
    );
  }

  return button;
}

/**
 * The hairline in the section run.
 *
 * Everything left of it is a DESTINATION; the one thing right of it is an
 * ACTION. The agent is not a place you go — it is a layer raised over wherever
 * you already are — and that difference has to be visible in the bar or the
 * agent reads as a fifth section that never highlights.
 */
export function BarDivider() {
  return <span aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-foreground/15" />;
}

/**
 * The composer's text input, styled to disappear into the pill.
 *
 * Here rather than in each app because both apps' agent composers are the same
 * control, and the one that drifted would be the one nobody looked at.
 */
export function BarInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <input
      className="min-w-0 flex-1 border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
      placeholder={placeholder}
      aria-label={placeholder}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onSubmit();
        }
      }}
    />
  );
}

/** The two-bars-into-a-cross glyph. One button opens the menu and closes it,
 *  so there is never a second close control inside the panel. */
export function CrossBars({ open, style }: { open: boolean; style?: CSSProperties }) {
  return (
    <span aria-hidden className="relative flex size-[18px] items-center justify-center" style={style}>
      <span
        className="absolute h-[1.5px] w-full rounded-full bg-current transition-transform duration-200"
        style={{ transform: open ? 'rotate(45deg)' : 'translateY(-3.5px)' }}
      />
      <span
        className="absolute h-[1.5px] w-full rounded-full bg-current transition-transform duration-200"
        style={{ transform: open ? 'rotate(-45deg)' : 'translateY(3.5px)' }}
      />
    </span>
  );
}
