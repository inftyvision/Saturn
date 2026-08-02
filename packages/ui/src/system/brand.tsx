/**
 * Gaia's own mark, as the account control's shape — not a second badge
 * stacked on top of a first one. The corner is reserved for the ONE thing
 * that earns an overlay there: the unread-exceptions count `AccountButton`
 * already draws (`Count n={badge} corner`). A vendor mark competing for that
 * same corner would read as two notifications, not one identity.
 *
 * So the vendor's mark goes WHERE the initials used to go — centred, filling
 * most of Gaia's own squircle — and Gaia's own checkmark is what shows when
 * there is no vendor mark to contain. Ops wears Gaia's brand (`CLAUDE.md`,
 * "Ops is one brand"), so the control reads as Gaia showing you whose desk
 * you're at, not a client badge photobombing a Gaia badge.
 */

import type { ReactNode } from 'react';

/** The rounded-square field, redrawn from `assets/logo.svg` in the `gaia`
 *  workspace in tokens instead of its baked hex (`#9AE600` / `#0B0D10`) —
 *  the one rule this file cannot break twice in the same product
 *  (`CLAUDE.md`: "Anything hardcoding a colour is a bug"). */
function GaiaCheck({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M12 20.5L18 26.5L28 14"
        stroke="hsl(var(--background))"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The account control's shape: a rounded-square field, filled with whatever
 * mark is handed in — the vendor's own, when there is one — and Gaia's own
 * checkmark otherwise. The field itself carries the SAME distinction: Gaia's
 * green by default, or the vendor's own accent (`Org.brandColor`) when it is
 * the vendor's mark inside — the field reads as theirs, not Gaia's box with
 * their logo dropped in it.
 */
export function BrandBadge({
  mark,
  name,
  size = 32,
  bg = 'hsl(var(--primary))',
}: {
  /** The vendor's mark — an inline SVG, sized to fit. Omit to show Gaia's
   *  own checkmark instead. */
  mark?: ReactNode;
  /** For the accessible label — the control itself stays a plain button. */
  name?: string;
  size?: number;
  /** The field colour. Defaults to Gaia's own — pass the vendor's
   *  `brandColor` alongside their `mark` so the field is theirs too. */
  bg?: string;
}) {
  return (
    <span
      className="flex shrink-0 items-center justify-center"
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), background: bg }}
      aria-hidden={!name}
    >
      <span className="flex items-center justify-center" style={{ width: '58%', height: '58%' }}>
        {mark ?? <GaiaCheck size={Math.round(size * 0.58)} />}
      </span>
    </span>
  );
}
