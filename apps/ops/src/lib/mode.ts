import 'server-only';

/**
 * THE seam. Every other module in this app asks `agentCreds()` which workspace
 * this request belongs to; none of them read the environment themselves.
 *
 * That indirection is the whole point, and it is why this file exists before
 * any feature does. This app ships in two deployment shapes and the difference
 * must never leak past this module:
 *
 *   dedicated — one deployment per workspace, pinned by env
 *               (SYVON_BRAIN_URL + GAIA_AGENT_ID + GAIA_BRAIN_KEY). This is
 *               what a per-brand app is: its own origin, its own binary, its own
 *               database. Mirrors the wrapper's `brain` mode.
 *   shared    — one deployment, many workspaces, resolved per request by Host
 *               header. NOT IMPLEMENTED YET — see `resolveByHost` below. When it
 *               lands it changes THIS FUNCTION and nothing else.
 *
 * Retrofitting this seam after callers have spread `process.env` reads through
 * the app is the expensive version of this file, so it exists before features do.
 */

import { cache } from 'react';
import { headers } from 'next/headers';

export type Mode = 'dedicated' | 'local' | 'shared' | 'none';

/** Brain responses cache for 5 min: a published release is immutable, so the
 *  only thing this window bounds is how long a re-publish takes to show. Same
 *  value the wrapper uses. */
export const BRAIN_REVALIDATE = 300;

/**
 * Everything needed to talk to brain about ONE workspace.
 *
 * `agentId` is a published `Project.id` — the agent identity in this fleet is a
 * project, not a workspace and not a brand. Handing brain a brand id 404s.
 */
export interface AgentCreds {
  brainUrl: string;
  agentId: string;
  brainKey: string;
}

function env(name: string): string {
  return (process.env[name] ?? '').trim();
}

/** Also accepts the generic SYVON_BRAIN_URL, so a deployment that already
 *  carries brain credentials works without a second copy under a new name. */
function brainUrl(): string {
  return (env('SYVON_BRAIN_URL') || env('BRAIN_URL')).replace(/\/+$/, '');
}

export function mode(): Mode {
  if (brainUrl() && env('GAIA_AGENT_ID') && env('GAIA_BRAIN_KEY')) return 'dedicated';
  if (env('GAIA_WS_ROOT')) return 'local';
  // `shared` will report here once resolveByHost() is real.
  return 'none';
}

/**
 * Local mode — the same escape hatch `apps/wrapper` runs on
 * (`WRAPPER_WS_ROOT`): read a workspace checkout straight off disk instead of
 * the frozen release. Edits show on refresh, no publish, no brain credentials.
 *
 * Which workspace depends on the SURFACE, because the two applications wear
 * different brands by design (spec §1): Track is white-labelled to the
 * coordinator, Ops is product-branded. So they resolve independently and either
 * may be absent — an absent one falls through to the placeholder token set,
 * which is the normal state for a product whose workspace does not exist yet.
 *
 * Returns the checkout DIRECTORY. The brand slug is the folder name: v11
 * flattened the brand into the workspace, so `<root>/saturn/config/` is the
 * brand folder and there is no `brands/` level to descend.
 */
export interface LocalWorkspace {
  dir: string;
  slug: string;
}

export function localWorkspace(_host?: string | null): LocalWorkspace | null {
  const root = env('GAIA_WS_ROOT');
  if (!root) return null;

  // White-labelled per coordinator, resolved by HOSTNAME: app.saturn.gy and
  // app.nordstar.gy are one deployment wearing two brands.
  //
  // A REAL hostname must be claimed. Falling back to the env pin here would
  // mean any stray CNAME pointed at this deployment gets served whichever brand
  // the env happens to name. The pin is for a dev session with no hostname to
  // resolve, and nothing else.
  // Ops wears ONE brand: Gaia's own. No hostname resolution — that is the
  // buyer app's job, because the buyer app is the white-labelled one.
  const slug = env('GAIA_OPS_WS');

  // A path separator in a slug would escape the root. Same guard the wrapper
  // applies to its cookie-supplied folder name.
  if (!slug || /[\\/]|\.\./.test(slug)) return null;
  return { dir: `${root.replace(/[\\/]+$/, '')}/${slug}`, slug };
}

/**
 * Hostname → workspace slug, from `GAIA_HOST_MAP`
 * (`app.saturn.gy=saturn,app.nordstar.gy=nordstar`).
 *
 * The dev/local stand-in for what production reads off the workspace itself —
 * in the wrapper a brand CLAIMS its domains in its own `site.json`, so
 * onboarding is a push plus DNS with no per-site env and no redeploy. Same
 * destination here; an env map is only what works before there is a release to
 * read from.
 *
 * Unknown host returns null rather than a default. A hostname nobody claims
 * must not be served somebody else's brand — that is exactly how the wrapper
 * once served a whole tenant directory on an unclaimed domain.
 */
/**
 * A hostname with no tenant of its own — a dev box. Only these may fall back to
 * the env pin; every real hostname has to be claimed in the map.
 */
function isDevHost(host: string | null | undefined): boolean {
  if (!host) return true;
  const bare = host.toLowerCase().replace(/:\d+$/, '');
  return bare === 'localhost' || bare === '127.0.0.1' || bare === '[::1]';
}

function hostSlug(host: string | null | undefined): string | null {
  if (!host) return null;
  const bare = host.toLowerCase().replace(/:\d+$/, '');
  for (const pair of env('GAIA_HOST_MAP').split(',')) {
    const [h, slug] = pair.split('=').map((s) => s.trim());
    if (h && slug && h.toLowerCase() === bare) return slug;
  }
  return null;
}

/**
 * Reserved for the shared-deployment shape: one origin per brand, all pointed
 * at one deployment, tenant resolved from the Host header exactly as
 * `apps/wrapper/src/proxy.ts` already does it.
 *
 * Deliberately unimplemented rather than absent — the signature is the contract
 * the rest of the app is already written against, so filling it in is a change
 * to one function instead of an audit of every caller.
 *
 * When it lands: read `host`, look up the workspace's agent id + key (from the
 * platform index or a projected R2 record — NOT from env, which is what makes
 * a deployment single-tenant), and return them.
 */
async function resolveByHost(_host: string): Promise<AgentCreds | null> {
  return null;
}

/**
 * The workspace THIS request belongs to, or null when the deployment is not
 * configured (the app renders a setup hint rather than pretending).
 *
 * `cache()` dedupes it across a single render pass, so the layout and every
 * server component resolve once.
 */
export const agentCreds = cache(async (): Promise<AgentCreds | null> => {
  if (mode() === 'dedicated') {
    return {
      brainUrl: brainUrl(),
      agentId: env('GAIA_AGENT_ID'),
      brainKey: env('GAIA_BRAIN_KEY'),
    };
  }
  try {
    const host = (await headers()).get('host') ?? '';
    if (host) return await resolveByHost(host);
  } catch {
    /* headers() outside a request scope (build-time prerender) */
  }
  return null;
});

/** True when this deployment can reach a workspace at all. Surfaces render an
 *  explicit "not configured" state off this instead of an empty page. */
export async function configured(): Promise<boolean> {
  return (await agentCreds()) !== null;
}
