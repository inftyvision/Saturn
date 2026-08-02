'use client';

/**
 * ⚠ SCAFFOLDING. Not part of the product. One file to delete.
 *
 * Jumps between every mode the prototype can be in — the four ops roles, the
 * contractor app, and the sandbox — because there is no auth yet to land you on
 * the right one. In production which surface you get comes from your
 * `RoleGrant`, and someone holding two (Saturn holds coordinator AND hauler)
 * gets a real switcher behind the account avatar. This is not that, and it says
 * so on the panel.
 *
 * It lives in `dev/` rather than `system/` deliberately: `system/` is the app
 * vocabulary and a screen composing from it should never be able to reach this
 * by accident. It is in the LIBRARY rather than in one app only because both
 * apps mount it and a second copy would be a second thing to delete.
 *
 * ## Why draggable
 *
 * It is pinned over the app, so wherever it rests it covers something — the
 * map's legend, a table's last row, the bar itself. A fixed corner just moves
 * which thing is obscured. Dragging makes that the reader's problem to solve in
 * one gesture rather than a layout decision nobody can win, and the position
 * persists so it only has to be solved once.
 *
 * Cross-app links are absolute (`localhost:3050` / `:3051`) because ops and
 * buyer are two builds on two ports and a relative href cannot reach the other.
 * That is also why this is scaffolding: in production they are two hostnames
 * and nobody walks between them.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface Mode {
  label: string;
  href: string;
  /** True when the current path is this mode. */
  match?: (path: string) => boolean;
  /** A full URL — the other app, on its own port. */
  external?: boolean;
}

const STORAGE_KEY = 'gaia.modeswitch.pos';
/** Enough movement to mean "drag", not a shaky click. */
const DRAG_THRESHOLD = 4;
const MARGIN = 12;

interface Pos {
  x: number;
  y: number;
}

export function ModeSwitch({ modes, path }: { modes: Mode[]; path: string }) {
  const [pos, setPos] = useState<Pos | null>(null);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  /** Pointer offset within the puck, and whether we passed the threshold. */
  const grab = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);

  const current = modes.find((m) => m.match?.(path));

  /** Keep the puck on screen — restored from a bigger window, or after a
   *  resize, it would otherwise sit outside the viewport with no way back. */
  const clamp = useCallback((p: Pos): Pos => {
    const el = ref.current;
    const w = el?.offsetWidth ?? 120;
    const h = el?.offsetHeight ?? 40;
    return {
      x: Math.min(Math.max(MARGIN, p.x), window.innerWidth - w - MARGIN),
      y: Math.min(Math.max(MARGIN, p.y), window.innerHeight - h - MARGIN),
    };
  }, []);

  // Restore, or start bottom-right. Done in an effect rather than in the
  // initial state so the server and the first client render agree — reading
  // localStorage during render is a hydration mismatch.
  useEffect(() => {
    let start: Pos | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) start = JSON.parse(raw) as Pos;
    } catch {
      /* a corrupt entry is not worth a crash */
    }
    // Default: RIGHT EDGE, vertically centred. Every corner is already spoken
    // for — the bar is bottom-centre, the map's legend top-left, its stale-fix
    // queue bottom-right, MapLibre's zoom controls top-right, and Next's
    // dev-tools badge bottom-left. The right edge at mid-height is the one
    // place that lands on nothing, and from there it is one drag anywhere.
    setPos(clamp(start ?? { x: window.innerWidth - 170, y: Math.round(window.innerHeight / 2) }));
  }, [clamp]);

  useEffect(() => {
    const onResize = () => setPos((p) => (p ? clamp(p) : p));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clamp]);


  // Pointer move/up live on the WINDOW, not the puck: a fast drag outruns the
  // element and the pointer leaves it, which would strand the puck mid-gesture.
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const g = grab.current;
      if (!g) return;
      const next = { x: e.clientX - g.dx, y: e.clientY - g.dy };
      if (!g.moved && Math.hypot(next.x - (pos?.x ?? 0), next.y - (pos?.y ?? 0)) > DRAG_THRESHOLD) {
        g.moved = true;
      }
      setPos(clamp(next));
    };
    const onUp = () => {
      setDragging(false);
      const g = grab.current;
      grab.current = null;
      // A press that never moved is a CLICK. Handling it here rather than with
      // an onClick means a drag that ends over the puck does not also toggle
      // the panel.
      if (g && !g.moved) setOpen((v) => !v);
      setPos((p) => {
        if (p) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
          } catch {
            /* private mode — the position just does not persist */
          }
        }
        return p;
      });
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, pos, clamp]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const glass = {
    background: 'color-mix(in srgb, hsl(var(--background)) 82%, transparent)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid color-mix(in srgb, hsl(var(--foreground)) 12%, transparent)',
  };

  return (
    /*
     * Always mounted, INVISIBLE until placed.
     *
     * The clamp needs the puck's real width, and the label varies a lot —
     * "Worker" against "Tracking link · no account" is nearly double. Returning
     * null until `pos` resolves meant the ref was empty exactly when the first
     * clamp ran, so it guessed 120px and the wide labels hung off the right
     * edge. Rendering it hidden gives the effect something to measure, and
     * `opacity` (not `display`) is what keeps the box real.
     */
    <div
      ref={ref}
      className="fixed z-[60] print:hidden"
      style={{
        left: pos?.x ?? 0,
        top: pos?.y ?? 0,
        touchAction: 'none',
        opacity: pos ? 1 : 0,
        pointerEvents: pos ? undefined : 'none',
      }}
    >
      {/* The panel opens AWAY from the nearest edges. Fixed to `bottom-full
          left-0` it hung off the screen as soon as the puck was dragged to the
          right or the top — which, since it defaults to the right edge, was its
          resting state. */}
      {open && pos && (
        <div
          className={`absolute mb-2 mt-2 w-52 rounded-xl p-1.5 shadow-lg ${
            (pos?.x ?? 0) > window.innerWidth / 2 ? 'right-0' : 'left-0'
          } ${(pos?.y ?? 0) > window.innerHeight / 2 ? 'bottom-full' : 'top-full'}`}
          style={glass}
        >
          {/* Short, because the kicker's tracking is wide and this panel is
              narrow — the full sentence wrapped to three ragged lines. */}
          <p className="kicker px-2 pb-1 pt-1.5">Prototype mode</p>
          {modes.map((m) => {
            const on = !!m.match?.(path);
            return (
              <a
                key={m.href}
                href={m.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-2.5 py-2 text-xs transition-colors ${
                  on
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                }`}
              >
                {m.label}
                {m.external && <span className="ml-1.5 opacity-60">↗</span>}
              </a>
            );
          })}
          <p className="px-2 pb-1 pt-1.5 text-[10px] leading-relaxed text-muted-foreground">
            Stands in for a role grant. Drag the puck to move it.
          </p>
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        aria-label={`Prototype mode — ${current?.label ?? 'unknown'}`}
        aria-expanded={open}
        title="Drag to move · click to switch mode"
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          grab.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false };
          setDragging(true);
        }}
        // The pointer path handles activation, so the keyboard needs its own —
        // otherwise this control is reachable by tab and does nothing.
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className={`flex select-none items-center gap-2 rounded-full px-3 py-2 text-xs shadow-lg transition-opacity ${
          dragging ? 'cursor-grabbing opacity-90' : 'cursor-grab'
        }`}
        style={glass}
      >
        <span className="inline-block size-2 shrink-0 rounded-full bg-primary" />
        <span className="whitespace-nowrap">{current?.label ?? 'Mode'}</span>
      </div>
    </div>
  );
}
