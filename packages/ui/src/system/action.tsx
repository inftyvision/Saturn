'use client';

/**
 * Actions. ONE decision table, so a button's look tells you what it does.
 *
 * The mess this replaces: primary buttons used for "Cancel", ghost buttons used
 * for the main action on a screen, icon buttons at three different sizes, and
 * `variant` chosen per screen by whoever wrote it. When every button can look
 * like any other, none of them mean anything.
 *
 *   primary     the ONE action the screen exists for. Max one per view.
 *   secondary   a real alternative to the primary — "Accept fewer", "Export"
 *   ghost       navigation and dismissal — "Cancel", "Open", "Back"
 *   danger      void, delete, revoke. Never brand-derived, always red.
 *
 * Anything that mutates a docket is `danger` even when it reads as routine,
 * because a void-and-reissue that looks like every other button is how an
 * immutable record gets voided by accident.
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '../primitives/button';
import { Icon } from '../Icon';

export type ActionKind = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANT: Record<ActionKind, 'default' | 'secondary' | 'ghost' | 'destructive'> = {
  primary: 'default',
  secondary: 'secondary',
  ghost: 'ghost',
  danger: 'destructive',
};

export function Action({
  kind = 'secondary',
  icon,
  size = 'default',
  full,
  tap,
  href,
  children,
  ...rest
}: {
  kind?: ActionKind;
  icon?: string;
  size?: 'sm' | 'default' | 'lg';
  /** Fills its container — the driver surface's primary actions always do. */
  full?: boolean;
  /** 56px floor. Every control a worker taps in gloves, in sunlight. */
  tap?: boolean;
  /**
   * Renders an `<a>` (a `Link` for an internal path) instead of a button.
   *
   * `ghost` exists for "navigation and dismissal", so most ghost actions ARE
   * links — and until this existed every one of them was a hand-rolled anchor
   * wearing a copy of the button's classes, which is the per-screen styling
   * this library exists to stop. An external href opens in a new tab and
   * carries `rel`, because the two things you always forget are the two things
   * that matter.
   */
  href?: string;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const inner = (
    <>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 18} />}
      {children}
    </>
  );
  const className = `${full ? 'w-full' : ''} ${tap ? 'tap-target text-base' : ''}`;

  if (href) {
    const external = /^https?:|^tel:|^mailto:/.test(href);
    return (
      <Button variant={VARIANT[kind]} size={size} className={className} asChild>
        {external ? (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {inner}
          </a>
        ) : (
          <Link href={href}>{inner}</Link>
        )}
      </Button>
    );
  }

  return (
    <Button variant={VARIANT[kind]} size={size} className={className} {...rest}>
      {inner}
    </Button>
  );
}

/**
 * An icon-only control. ALWAYS carries a label for assistive tech and a title
 * for the tooltip — an unlabelled glyph is a guess, and this product is used by
 * people who open it twice a week.
 */
export function IconAction({
  icon,
  label,
  href,
  onClick,
  tone = 'muted',
}: {
  icon: string;
  label: string;
  href?: string;
  onClick?: () => void;
  tone?: 'muted' | 'primary' | 'danger';
}) {
  const cls = `inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-accent ${
    tone === 'primary'
      ? 'text-primary'
      : tone === 'danger'
        ? 'text-[hsl(var(--destructive))]'
        : 'text-muted-foreground hover:text-foreground'
  }`;

  const inner = <Icon name={icon} size={16} />;

  return href ? (
    <a href={href} aria-label={label} title={label} className={cls} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>
      {inner}
    </a>
  ) : (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/**
 * A row of actions. Primary goes LAST on desktop (bottom-right convention) and
 * FIRST on a phone, where the thumb is at the bottom — so the driver surface
 * stacks and the coordinator surface aligns right.
 */
export function ActionBar({
  children,
  stack,
  className = '',
}: {
  children: ReactNode;
  /** Phone layout: full-width, stacked, primary on top. */
  stack?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex gap-2 ${stack ? 'flex-col' : 'items-center justify-end'} ${className}`}>
      {children}
    </div>
  );
}

/**
 * A menu — the overflow for actions that do not earn a button.
 *
 * Deliberately not a dropdown library: this needs three items and a click-away,
 * and pulling in Radix's menu for that was how the primitive set grew a
 * dependency nothing rendered.
 */
export function Menu({
  items,
  label = 'More',
}: {
  items: Array<{ label: string; onClick?: () => void; href?: string; kind?: ActionKind; icon?: string }>;
  label?: string;
}) {
  return (
    <details className="relative">
      <summary className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&::-webkit-details-marker]:hidden">
        <span className="sr-only">{label}</span>
        <Icon name="more_vert" size={18} />
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border bg-card p-1 shadow-lg">
        {items.map((it) =>
          it.href ? (
            <a
              key={it.label}
              href={it.href}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                it.kind === 'danger' ? 'text-[hsl(var(--destructive))]' : 'text-muted-foreground'
              }`}
            >
              {it.icon && <Icon name={it.icon} size={15} />}
              {it.label}
            </a>
          ) : (
            <button
              key={it.label}
              type="button"
              onClick={it.onClick}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent ${
                it.kind === 'danger' ? 'text-[hsl(var(--destructive))]' : 'text-muted-foreground'
              }`}
            >
              {it.icon && <Icon name={it.icon} size={15} />}
              {it.label}
            </button>
          ),
        )}
      </div>
    </details>
  );
}
