import 'server-only';

/**
 * A neutral token set, in the exact shape `getTokens()` returns.
 *
 * What an UNCLAIMED hostname renders. A coordinator who has a workspace gets
 * their real tokens; a stray CNAME pointed at this deployment gets this, and
 * never the last brand that happened to be configured.
 *
 * Deliberately characterless: a restrained slate with one functional accent.
 * It should read as "unbranded product", never as a design proposal — the
 * point of the prototype is the FLOW, and a confident-looking palette invites
 * review of the wrong thing.
 *
 * A claimed host never reaches this: its tokens come from the workspace, which
 * is what makes the white-labelling real rather than a colour swap.
 */

import type { TokenVariable } from '@gaia/ui';

const t = (value: string): TokenVariable => ({ value });

export const PLACEHOLDER_TOKENS: Record<string, TokenVariable> = {
  'color.background': t('#0B0D10'),
  'color.canvas': t('#0B0D10'),
  'color.surface': t('#14171C'),
  'color.border': t('#232830'),
  'color.text': t('#F2F4F7'),
  'color.textMuted': t('#8B94A3'),
  // One accent, for emphasis and focus rings only. Lime rather than blue:
  // most of this UI is status, and blue reads as "link" inside a table.
  'color.primary': t('#9AE600'),
  'color.accent': t('#9AE600'),
  'color.secondary': t('#3D6EE8'),
  'color.tertiary': t('#8B94A3'),

  'size.radiusSm': t('4px'),
  'size.radiusMd': t('8px'),
  'size.radiusLg': t('12px'),

  // No font tokens on purpose. Without a `@font-face` to serve, naming a
  // family here would only produce a silent fallback — the placeholder runs on
  // the system stack, which is honest about being unbranded.
};
