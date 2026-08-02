import 'server-only';

/**
 * design-tokens/v2 → CSS, at request time. The workspace is the only source of
 * truth: no sync script, no committed artifacts.
 *
 * Reads the coordinator's published design tokens and emits the `--brand-*`
 * map, `@font-face` for their font binaries, and the display/body stacks.
 *
 * Deliberately NOT carried over from the Syvon wrapper this descends from: the
 * `--color-*` / `--dna-*` canvas variables, which exist so workspace `.react`
 * and `.comp` visuals can theme themselves. Gaia renders none of those, and
 * carrying them would have meant depending on Syvon's design engine forever.
 *
 * SECURITY NOTE, and it is the reason every value goes through `cssValue`:
 * token names and values are arbitrary authored workspace JSON, and they land
 * inside a <style> element. A value containing `}` or `</style` would escape
 * declaration position. Treat all of it as untrusted input.
 */

import { cache } from 'react';
import { getBrandSlug, getWorkspaceJson, listWorkspaceDir, WS_PATHS } from './workspace';
import { PLACEHOLDER_TOKENS } from './placeholder-brand';
import { shadcnVars, type TokenVariable } from '@gaia/ui';

export interface FontFile {
  /** Workspace-relative key, served through /api/asset. */
  key: string;
  family: string;
  weight: number;
}

/**
 * design-tokens/v2 `variables` map for the active brand.
 *
 * Falls back to the neutral placeholder set rather than `{}`. An empty map
 * would leave every shared component on its own defaults, which reads as
 * "theming is broken" — and it is the NORMAL state for a surface whose product
 * has no workspace yet. A brand that publishes tokens overrides this entirely;
 * nothing merges, so a brand can never inherit a placeholder colour it did not
 * ask for.
 */
export const getTokens = cache(async (): Promise<Record<string, TokenVariable>> => {
  const slug = await getBrandSlug();
  if (!slug) return PLACEHOLDER_TOKENS;
  const raw = (await getWorkspaceJson(WS_PATHS.tokens)) as {
    variables?: Record<string, TokenVariable>;
  } | null;
  const vars = raw?.variables;
  return vars && Object.keys(vars).length ? vars : PLACEHOLDER_TOKENS;
});

const WEIGHTS: Record<string, number> = {
  thin: 100,
  extralight: 200,
  ultralight: 200,
  light: 300,
  regular: 400,
  normal: 400,
  book: 400,
  medium: 500,
  semibold: 600,
  demibold: 600,
  bold: 700,
  extrabold: 800,
  ultrabold: 800,
  black: 900,
  heavy: 900,
};

/**
 * The vendor's font binaries: the `fonts.json` manifest when there is one, else
 * every font file in the folder with the weight inferred from the filename
 * suffix.
 *
 * A vendor with no fonts is the NORMAL case — most will have a logo and a
 * colour and nothing else. That path returns an empty list and the app runs on
 * the system stack, which is honest rather than broken.
 */
export const listFonts = cache(async (): Promise<FontFile[]> => {
  const slug = await getBrandSlug();
  const dirs = [WS_PATHS.fontsDir];
  for (const dir of dirs) {
    const manifest = (await getWorkspaceJson(`${dir}/fonts.json`)) as Array<{
      file?: string;
      family?: string;
      weight?: number;
    }> | null;
    if (Array.isArray(manifest)) {
      const entries = manifest
        .filter((e) => typeof e?.file === 'string' && typeof e?.family === 'string')
        .map((e) => ({
          key: `${dir}/${e.file}`,
          family: e.family as string,
          weight: typeof e.weight === 'number' ? e.weight : 400,
        }));
      if (entries.length) return entries;
    }
    const files = (await listWorkspaceDir(dir)).filter((f) => /\.(woff2?|otf|ttf)$/i.test(f));
    if (!files.length) continue;
    return files.map((file) => {
      const base = file.replace(/\.[^.]+$/, '');
      const [family, ...rest] = base.split('-');
      return { key: `${dir}/${file}`, family, weight: WEIGHTS[rest.join('').toLowerCase()] ?? 400 };
    });
  }
  return [];
});

// ── CSS escaping ─────────────────────────────────────────────────────────────

/** Strip anything that could close a declaration, a comment, a quote, or the
 *  <style> element itself. Applied to EVERY authored value. */
function cssValue(v: unknown): string {
  return String(v ?? '')
    .replace(/[<>{}();]/g, '')
    .replace(/\*\//g, '')
    .replace(/["'\\]/g, '')
    .trim();
}

/** A CSS custom-property name we generated ourselves — still guarded, because
 *  the engine copies token KEYS into the name. */
function cssIdent(k: string): string {
  return String(k).replace(/[^a-zA-Z0-9_-]/g, '');
}

/** `color.textMuted` → `--brand-color-text-muted`. Dots to dashes, camelCase
 *  split, lowercased. The same mapping the per-brand sync scripts used. */
function cssVarName(key: string): string {
  const kebab = key
    .replace(/\./g, '-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
  return `--brand-${cssIdent(kebab)}`;
}

/** Resolve a `font.*` token — a single family or a full stack — to CSS. Each
 *  family is quoted; generic keywords stay bare; always ends in a system
 *  fallback so text is never unstyled. */
function fontStack(value: string | undefined, fonts: FontFile[]): string {
  const GENERIC = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui']);
  const parts = (value ?? '')
    .split(',')
    .map((p) => cssValue(p))
    .filter(Boolean);
  if (!parts.length) return 'system-ui, sans-serif';
  const css = parts.map((p) => {
    if (GENERIC.has(p.toLowerCase())) return p.toLowerCase();
    const served = fonts.some((f) => f.family.toLowerCase() === p.toLowerCase());
    return served || /\s/.test(p) ? `'${p}'` : p;
  });
  const last = css[css.length - 1];
  if (!GENERIC.has(last.replace(/'/g, '').toLowerCase())) css.push('system-ui', 'sans-serif');
  return css.join(', ');
}

// ── the stylesheet ───────────────────────────────────────────────────────────

/**
 * The generated stylesheet body for the active brand.
 *
 * MUST NOT THROW. This is awaited in the root layout, so an uncaught error here
 * fails the entire app rather than one screen. Every value is coerced and
 * escaped on the way through, and the layout catches anything that still gets
 * out — a vendor whose token file is malformed gets an unbranded app, not a
 * dead one.
 */
export async function brandCss(): Promise<string> {
  const [tokens, fonts] = await Promise.all([getTokens(), listFonts()]);

  // `font-display: swap` rather than `optional`: `optional` drops any face that
  // was not preloaded for the WHOLE page load, which reads as "the brand font
  // randomly doesn't apply". Family and key are both workspace-authored, so
  // both are escaped — the family inside quotes, the key inside a url().
  const faces = fonts
    .map(
      (f) =>
        `@font-face {\n` +
        `  font-family: '${cssValue(f.family)}';\n` +
        `  src: url('/api/asset/${encodeURI(f.key).replace(/['()<>]/g, '')}');\n` +
        `  font-weight: ${Number(f.weight) || 400};\n` +
        `  font-display: swap;\n}`,
    )
    .join('\n');

  const vars = Object.entries(tokens)
    .map(([k, v]) => `  ${cssVarName(k)}: ${cssValue(v.value)};`)
    .join('\n');

  const display = fontStack(tokens['font.heading']?.value, fonts);
  const body = fontStack(tokens['font.body']?.value, fonts);
  const kicker = fontStack(tokens['font.kicker']?.value ?? tokens['font.body']?.value, fonts);

  // The shadcn variable set every shared component is built against. Emitted
  // LAST inside :root so it wins over anything above it that shares a name,
  // and so `globals.css`'s `@theme inline` — which maps Tailwind's colour
  // utilities onto these same triplets — resolves to brand values.
  const ui = shadcnVars(tokens);

  return (
    `${faces}\n:root {\n${vars}\n` +
    `  --gaia-font-display: ${display};\n` +
    `  --gaia-font-body: ${body};\n` +
    `  --gaia-font-kicker: ${kicker};\n` +
    `${ui}\n}\n`
  );
}
