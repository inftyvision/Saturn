/**
 * Type. Four roles, and every piece of text in both apps is one of them.
 *
 * The rule that matters: a label ABOVE a group is a kicker; a title OF a thing
 * is a title. Get that wrong and the page loses its hierarchy — which is
 * exactly what happened when sections were written ad hoc and half of them came
 * out at body size.
 *
 *   PageTitle       one per screen, the thing you navigated to
 *   SectionHeading  the label above a group        → kicker treatment
 *   Kicker          the label above a field/value  → same treatment, not a heading
 *   ItemTitle       the name of a row or card      → body weight, NOT a kicker
 *   Num             any figure compared down a column → mono, tabular
 *   Meta            secondary detail under a title
 */

import type { ReactNode } from 'react';

export function PageTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h1 className={`font-display text-xl ${className}`}>{children}</h1>;
}

/** The label above a GROUP. An `<h2>` so the outline is real; kicker treatment
 *  so it reads as the same typographic job as a field label. */
export function SectionHeading({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={`kicker ${className}`}>{children}</h2>;
}

/** The label above a FIELD or a value. Not a heading — no outline entry. */
export function Kicker({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`kicker ${className}`}>{children}</p>;
}

/**
 * The name of a row, card or item — "White sand", "GRR 4471", "Saturn Mining".
 *
 * Deliberately NOT a kicker. A kicker labels a group; an item title IS the
 * content. Uppercasing it would make a table of vendor names shout.
 */
export function ItemTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-sm ${className}`}>{children}</p>;
}

/** Secondary detail — the line under a title. */
export function Meta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`truncate text-xs text-muted-foreground ${className}`}>{children}</p>;
}

/**
 * A figure — anything compared down a column: docket numbers, plates, money,
 * times, phone numbers.
 *
 * Mono and tabular. This is the ONLY place mono is applied by default: body
 * text and controls stay on the body face, because at reading size a mono face
 * costs legibility for nothing.
 */
export function Num({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`figure selectable ${className}`}>{children}</span>;
}

/**
 * The hero figure on a screen — a delivered count, a balance, a docket number.
 * One per screen at most; two competing hero figures means neither is the
 * answer to the question the screen exists to answer.
 */
export function BigNum({
  children,
  tone = 'primary',
  className = '',
}: {
  children: ReactNode;
  tone?: 'primary' | 'plain';
  className?: string;
}) {
  return (
    <span
      className={`figure font-display leading-none ${tone === 'primary' ? 'text-primary' : ''} ${className}`}
      style={{ fontSize: 'clamp(2.25rem, 12vw, 3.25rem)' }}
    >
      {children}
    </span>
  );
}

/** A label/value pair — the unit every detail list is built from. */
export function Fact({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="border-b px-4 py-3 last:border-b-0">
      <Kicker>{label}</Kicker>
      <p className="mt-0.5 text-base">{value}</p>
      {sub && <Meta>{sub}</Meta>}
    </div>
  );
}
