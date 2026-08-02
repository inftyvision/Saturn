/**
 * Layout. The spacing and structure rules, as components.
 *
 * Screens were assembling their own `px-6 py-5 border-b` every time, so no two
 * pages had the same gutter and section rhythm. These are the only containers
 * either app should use.
 *
 *   Page        the screen body
 *   PageHead    title + description + actions. One per screen.
 *   Section     a labelled group. Handles its own divider and gutter.
 *   Toolbar     a horizontal strip of controls
 *   Stack       vertical rhythm between cards/rows
 */

import type { ReactNode } from 'react';
import { PageTitle, SectionHeading } from './typography';

/** Desk gutter is 24px, phone is 20px — everything inherits it from here. */
export function Page({ children, phone }: { children: ReactNode; phone?: boolean }) {
  return <div className={phone ? 'px-5 py-5' : 'p-6'}>{children}</div>;
}

/**
 * The top of a screen — what it is about, and what it can do.
 *
 * `title` is OPTIONAL, and on most screens it should be omitted: the app
 * shell's header already says where you are, derived from the section and
 * segment you are in. A screen that titles itself under that chrome puts two
 * titles six pixels apart, and the one answering "where am I" is the smaller of
 * them.
 *
 * Pass a title only where the screen names a THING rather than a place — a
 * job's number, a docket's, an order's. Those are not in the nav and the chrome
 * cannot know them.
 */
export function PageHead({
  title,
  description,
  actions,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  if (!title && !description && !actions) return null;
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4 lg:px-6">
      <div className="min-w-0">
        {title && <PageTitle>{title}</PageTitle>}
        {description && (
          <p className={`text-sm text-muted-foreground ${title ? 'mt-0.5' : ''}`}>{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Section({
  title,
  hint,
  actions,
  divider = true,
  phone,
  children,
}: {
  title?: ReactNode;
  hint?: ReactNode;
  actions?: ReactNode;
  divider?: boolean;
  phone?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`${divider ? 'border-b' : ''} ${phone ? 'px-5 py-5' : 'px-6 py-5'}`}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {title && <SectionHeading>{title}</SectionHeading>}
            {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function Stack({ children, gap = 2 }: { children: ReactNode; gap?: 1 | 2 | 3 }) {
  return <div className={gap === 1 ? 'space-y-1.5' : gap === 3 ? 'space-y-4' : 'space-y-2'}>{children}</div>;
}

/** A divided list — the default for anything repeating that is not a table. */
export function List({ children }: { children: ReactNode }) {
  return <ul className="divide-y">{children}</ul>;
}
