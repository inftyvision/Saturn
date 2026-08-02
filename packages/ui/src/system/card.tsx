/**
 * Cards. ONE anatomy, everywhere.
 *
 *   ┌──────────────────────────────────────────┐
 *   │ KICKER            (optional)   [status]  │
 *   │ Title                                    │
 *   │ meta · meta · meta                       │
 *   │ ────────────────────────────────────────  │
 *   │ body                                     │
 *   │ ────────────────────────────────────────  │
 *   │ footer                        [actions]  │
 *   └──────────────────────────────────────────┘
 *
 * Every list row in both apps is this shape. Before it existed, an order card,
 * a job row, a docket row and a vendor row each invented their own arrangement
 * of the same four facts — which is why scanning between screens felt like
 * moving between products.
 *
 * The rules:
 *   · Status goes TOP RIGHT. Always. It is the thing eyes go to first.
 *   · Actions go BOTTOM RIGHT, or in a Menu if there are more than two.
 *   · Meta is one line. If it needs two, it is not meta — it is body.
 *   · A card is a link OR it has actions. Never both: a clickable card with
 *     buttons in it is a coin toss about what a tap does.
 */

'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Kicker, Meta } from './typography';
import { CountUpLabel, parseNumericLabel } from './count-up';

export function Card({
  kicker,
  title,
  meta,
  status,
  actions,
  footer,
  href,
  children,
  className = '',
}: {
  kicker?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  /** Makes the whole card the target. Mutually exclusive with `actions`. */
  href?: string;
  children?: ReactNode;
  className?: string;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {kicker && <Kicker>{kicker}</Kicker>}
          <div className="mt-0.5 text-sm">{title}</div>
          {meta && <Meta className="mt-0.5">{meta}</Meta>}
        </div>
        {status && <div className="shrink-0">{status}</div>}
      </div>

      {children && <div className="mt-3">{children}</div>}

      {(footer || actions) && (
        <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
          <div className="min-w-0 text-xs text-muted-foreground">{footer}</div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
    </>
  );

  const base = `rounded-lg border px-4 py-3.5 ${className}`;

  return href ? (
    <Link href={href} className={`${base} block transition-colors hover:bg-accent/40`}>
      {inner}
    </Link>
  ) : (
    <div className={base}>{inner}</div>
  );
}

/**
 * A row in a dense list — same anatomy, no border, tighter.
 * Used where a table would be too heavy and a card too loose.
 */
export function Row({
  leading,
  title,
  meta,
  trailing,
  href,
}: {
  leading?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  href?: string;
}) {
  const inner = (
    <>
      {leading && <span className="shrink-0">{leading}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{title}</span>
        {meta && <span className="block truncate text-xs text-muted-foreground">{meta}</span>}
      </span>
      {trailing && <span className="shrink-0 text-right">{trailing}</span>}
    </>
  );
  const cls = 'flex items-center gap-3 py-3';
  return href ? (
    <Link href={href} className={`${cls} transition-colors hover:text-primary`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/**
 * A headline figure with a caption. Four across a strip is the maximum — a
 * fifth means none of them is the number the screen is about.
 *
 * Counts up from zero on mount when `value` is a plain number or a string
 * that is exactly one formatted number — `gyd(x)`, `${pct}%`, `String(n)` —
 * which covers every current call site with no change at the call site. A
 * value that is not that shape (a date, a plate, JSX) renders as handed in,
 * unanimated. See `system/count-up` for why it works this way round.
 *
 * `font-display`, not `.figure`. A stat is the number the screen leads with —
 * a hero figure, not a row in a column — and tabular mono is for the OTHER
 * case, digits that must line up against the row above and below them. At
 * display size tabular-nums pads every digit to a `0`'s width and a number
 * like `121` reads loose; the display face is proportional, which is what
 * makes a big number look considered rather than borrowed from a table.
 */
export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'default' | 'warn';
}) {
  const numeric =
    typeof value === 'string' || typeof value === 'number' ? parseNumericLabel(String(value)) : null;

  return (
    <div className="border-r px-5 py-5 last:border-r-0">
      <Kicker>{label}</Kicker>
      <p className={`font-display mt-1 text-3xl lg:text-4xl ${tone === 'warn' ? 'text-primary' : ''}`}>
        {numeric ? <CountUpLabel {...numeric} /> : value}
      </p>
      {sub && <Meta>{sub}</Meta>}
    </div>
  );
}

export function StatStrip({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 border-b lg:grid-cols-4">{children}</div>;
}

/**
 * A proportion — loads delivered against loads ordered, balance against limit.
 *
 * This existed four times, hand-rolled, at two different heights: the orders
 * list, an order's detail, the public tracking link and the buyer's balance.
 * Four copies of the same nine characters of Tailwind is exactly the drift this
 * library exists to stop, and one of them was already a pixel out.
 *
 * **A meter never rounds up to full.** A 19-of-20 order whose bar is solid says
 * the delivery is done, and it is not — the one load left is the whole reason
 * somebody is looking. So anything short of complete stops at 97%, and only an
 * exact `value === max` fills it.
 */
export function Meter({
  value,
  max,
  caption,
  tone = 'primary',
}: {
  value: number;
  max: number;
  caption?: ReactNode;
  /** `warn` for a proportion that is bad when it is high — a credit limit. */
  tone?: 'primary' | 'warn';
}) {
  const done = max > 0 && value >= max;
  const pct = max > 0 ? Math.min(done ? 100 : 97, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: tone === 'warn' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
          }}
        />
      </div>
      {caption && <p className="mt-1.5 text-xs text-muted-foreground">{caption}</p>}
    </div>
  );
}

/**
 * Nothing here yet.
 *
 * Always says what WOULD be here and what puts it there. "No orders" is a dead
 * end; "Nothing on the way — ordering takes about a minute" is a next step.
 */
export function Empty({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed px-5 py-8 text-center">
      <p className="text-sm">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
