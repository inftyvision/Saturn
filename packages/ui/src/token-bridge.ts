/**
 * design-tokens/v2 → the shadcn variable set `@gaia/ui` is built against.
 *
 * Shared by BOTH apps: ops resolves a static product brand, buyer resolves a
 * vendor's per request. Same mapping, same traps, one file — two copies of a
 * colour-role mapping is two chances to disagree about what `--accent` means.
 *
 * ## Why this file has to exist
 *
 * The shared components are shadcn-shaped: `bg-primary`, `border-border`, and
 * raw `hsl(var(--muted-foreground))` in their stylesheets. They expect
 * `--background` / `--primary` / `--border` … as **bare HSL triplets**
 * ("24 100% 50%"), because shadcn composes opacity as `hsl(var(--x) / 0.9)`.
 *
 * A workspace's design tokens are hex. Nothing connects the two, so without
 * this bridge every shared component renders in its own default palette and
 * none of the brand shows through — the failure is silent and looks like
 * "the components just don't theme".
 *
 * `globals.css` maps these onto Tailwind with `@theme inline`, so the triplets
 * below drive BOTH the utility classes and the raw `hsl(var(…))` usages. One
 * source, no second definition to drift.
 *
 * ## The trap in the middle of this mapping
 *
 * shadcn's names are UI ROLES, not brand roles, and two of them collide:
 *
 *   shadcn `--secondary`  = a low-emphasis BUTTON SURFACE
 *   brand  `color.secondary` = the brand's second colour  (saturn: #FFB07A)
 *
 *   shadcn `--accent`     = the HOVER background for menu items and rows
 *   brand  `color.accent`  = the brand's highlight colour (saturn: #FF6A00)
 *
 * Mapping brand→shadcn by name would put a bright orange behind every
 * secondary button and every hovered table row. Both shadcn roles are
 * SURFACES, so both take the brand's surface colour. The brand's accent
 * belongs on `--primary` and `--ring`, where emphasis is the point.
 */

export interface TokenVariable {
  type?: string;
  value: string;
  label?: string;
}

// ── colour ───────────────────────────────────────────────────────────────────

interface Hsl {
  h: number;
  s: number;
  l: number;
}

/** #RGB / #RRGGBB → {r,g,b} 0-255. Null for anything else (a token may hold a
 *  gradient, a var() reference, or nonsense — authored JSON is untrusted). */
function parseHex(v: string | undefined): { r: number; g: number; b: number } | null {
  const m = (v ?? '').trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s: s * 100, l: l * 100 };
}

const round = (n: number, p = 1) => Number(n.toFixed(p));

/** A hex token → the bare `H S% L%` triple shadcn expects. Null on a miss, so
 *  callers fall back rather than emitting `NaN` into the stylesheet. */
export function hexToHslTriplet(v: string | undefined): string | null {
  const rgb = parseHex(v);
  if (!rgb) return null;
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return `${round(h)} ${round(s)}% ${round(l)}%`;
}

/** WCAG relative luminance — used only to pick a legible foreground, never to
 *  claim a contrast ratio. */
function luminance(v: string | undefined): number | null {
  const rgb = parseHex(v);
  if (!rgb) return null;
  const ch = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(rgb.r) + 0.7152 * ch(rgb.g) + 0.0722 * ch(rgb.b);
}

/**
 * Black or white, whichever is legible ON `bg`.
 *
 * A brand's own `color.text` is chosen against its BACKGROUND, not against its
 * primary — saturn's is #FFFFFF, which is unreadable on any light primary. So
 * button labels are computed here rather than taken from a token.
 */
function contrastOn(bg: string | undefined): string {
  const l = luminance(bg);
  if (l === null) return '0 0% 100%';
  return l > CROSSOVER ? '0 0% 4%' : '0 0% 100%';
}

/**
 * The luminance at which black and white are equally legible.
 *
 * Contrast against white is `1.05 / (L + 0.05)`; against black it is
 * `(L + 0.05) / 0.05`. They cross where `(L + 0.05)² = 0.0525`, i.e.
 * **L ≈ 0.179** — far darker than intuition suggests.
 *
 * Eyeballing this gets it wrong in exactly the direction that hurts. An amber
 * primary (#E8A33D, L≈0.44) sits well above the crossover, so it needs BLACK
 * text at 9.8:1 — but a naive "is it light?" threshold near 0.5 calls it dark
 * and picks white, which lands at 2.1:1. That is legible on a desk and gone in
 * Guyana sunlight, on the one screen a driver has to read at a glance.
 */
const CROSSOVER = 0.179;

// ── the mapping ──────────────────────────────────────────────────────────────

/** First token key that carries a usable hex. */
function pick(tokens: Record<string, TokenVariable>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = tokens[k]?.value;
    if (parseHex(v)) return v;
  }
  return undefined;
}

/** `hsl()` triplet, or the fallback triplet when the brand has no such token. */
function hsl(v: string | undefined, fallback: string): string {
  return hexToHslTriplet(v) ?? fallback;
}

/**
 * The shadcn variable block for a brand.
 *
 * Every value falls back, so a brand with two colours themes as far as it can
 * and a brand with none still renders a coherent dark UI — an app must never
 * be unusable because a token is missing.
 */
export function shadcnVars(tokens: Record<string, TokenVariable>): string {
  const background = pick(tokens, 'color.background', 'color.canvas');
  const surface = pick(tokens, 'color.surface', 'color.background', 'color.canvas');
  const text = pick(tokens, 'color.text', 'color.foreground');
  const muted = pick(tokens, 'color.textMuted', 'color.tertiary');
  const border = pick(tokens, 'color.border');
  const primary = pick(tokens, 'color.primary', 'color.accent');

  const radius = tokens['size.radiusMd']?.value?.trim();

  const lines: Array<[string, string]> = [
    ['--background', hsl(background, '0 0% 5%')],
    ['--foreground', hsl(text, '0 0% 98%')],

    // Cards and popovers sit ON the background, so they take the surface
    // colour — one step lifted, not the brand's second colour.
    ['--card', hsl(surface, '0 0% 9%')],
    ['--card-foreground', hsl(text, '0 0% 98%')],
    ['--popover', hsl(surface, '0 0% 9%')],
    ['--popover-foreground', hsl(text, '0 0% 98%')],

    // Emphasis. This is where the brand actually shows.
    ['--primary', hsl(primary, '24 100% 50%')],
    ['--primary-foreground', contrastOn(primary)],

    // …and these three are SURFACES despite their names. See the header.
    ['--secondary', hsl(surface, '0 0% 14%')],
    ['--secondary-foreground', hsl(text, '0 0% 98%')],
    ['--muted', hsl(surface, '0 0% 14%')],
    ['--muted-foreground', hsl(muted, '0 0% 63%')],
    ['--accent', hsl(surface, '0 0% 14%')],
    ['--accent-foreground', hsl(text, '0 0% 98%')],

    // Deliberately NOT brand-derived. Destructive means "this deletes
    // something" and must read as danger even for a brand whose primary is
    // red — a void-docket button that looks like every other button is how
    // an immutable record gets voided by accident.
    ['--destructive', '0 72% 51%'],
    ['--destructive-foreground', '0 0% 98%'],

    ['--border', hsl(border, '0 0% 16%')],
    ['--input', hsl(border, '0 0% 16%')],
    ['--ring', hsl(primary, '24 100% 50%')],
  ];

  const out = lines.map(([k, v]) => `  ${k}: ${v};`);
  if (radius && /^[\d.]+(px|rem|em)$/.test(radius)) out.push(`  --radius: ${radius};`);
  return out.join('\n');
}
