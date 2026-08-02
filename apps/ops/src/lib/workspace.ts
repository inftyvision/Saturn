import 'server-only';

/**
 * The data seam onto the coordinator's workspace. Everything the app knows about the
 * brand it is wearing comes through here, and all of it comes from brain —
 * never from disk, never from R2 directly, never from a Postgres the wrapper
 * or studio owns.
 *
 * White-labelling is READ-ONLY: this app fetches the coordinator's published
 * brand over a bearer-authed HTTP API and writes nothing back. Gaia's own data
 * lives in packages/db, which has no relationship to the workspace at all.
 *
 * Endpoints used (all behind `bearerAuth` in services/brain/src/routes/agent.ts):
 *   GET /v1/agent/:id            → { id, slug, name, brand, activeWorkflowId }
 *   GET /v1/agent/:id/site       → the frozen site/v1 config
 *   GET /v1/agent/:id/files      → the release's frozen file index
 *   GET /v1/agent/:id/r2/<key>   → one workspace file, agent-scoped
 *
 * There is no list access: brain-mode "dir listings" filter the frozen file
 * index and then stream individual files. `listWorkspaceDir` does exactly that.
 */

import { cache } from 'react';
import { headers } from 'next/headers';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { agentCreds, BRAIN_REVALIDATE, localWorkspace, mode } from './mode';

/** The on-disk checkout for THIS request's surface, or null outside local mode. */
const activeLocal = cache(async () => {
  if (mode() !== 'local') return null;
  // Host is what white-labels this app: app.saturn.gy vs app.nordstar.gy on
  // one deployment.
  let host: string | null = null;
  try {
    host = (await headers()).get('host');
  } catch {
    /* outside a request scope */
  }
  return localWorkspace(host);
});

/**
 * The Syvon workspace layout this app reads.
 *
 * A CONTRACT with someone else's repo, held here as three strings rather than
 * imported from `@syvon/organism` — Gaia does not depend on the Syvon monorepo
 * and must not start. If the layout ever moves, this breaks loudly in one
 * place, which is the honest failure mode for a cross-repo assumption.
 *
 * The durable fix is a brand-tokens endpoint on brain: one resolved payload
 * over HTTP, no layout knowledge on this side at all. Worth doing before a
 * second coordinator, not before the first.
 */
const WS_PATHS = {
  tokens: 'config/design-tokens.json',
  site: 'wrapper/site.json',
  fontsDir: 'assets/fonts',
} as const;

export { WS_PATHS };

/** Workspace-relative key → readable? Rejects traversal; mirrors brain's own
 *  gate so a malformed key fails here rather than as a 400 downstream. */
function safeKey(key: string): string | null {
  const k = key.replace(/^\/+/, '');
  if (k.includes('..') || k.includes('\\')) return null;
  return k;
}

async function brainJson<T>(path: string): Promise<T | null> {
  const creds = await agentCreds();
  if (!creds) return null;
  try {
    const res = await fetch(`${creds.brainUrl}${path}`, {
      headers: { Authorization: `Bearer ${creds.brainKey}` },
      next: { revalidate: BRAIN_REVALIDATE },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ── agent identity ───────────────────────────────────────────────────────────

export interface AgentInfo {
  id: string;
  slug: string | null;
  name: string | null;
  /** The BRAND slug — what every brand-scoped file path is keyed by. */
  brand: string | null;
  activeWorkflowId: string | null;
}

export const agentInfo = cache(async (): Promise<AgentInfo | null> => {
  // Local mode has no agent — it has a checkout. The brand slug IS the folder,
  // which is everything the theming path needs.
  const local = await activeLocal();
  if (local) {
    return { id: `local:${local.slug}`, slug: local.slug, name: null, brand: local.slug, activeWorkflowId: null };
  }
  const creds = await agentCreds();
  if (!creds) return null;
  return brainJson<AgentInfo>(`/v1/agent/${encodeURIComponent(creds.agentId)}`);
});

/** The active brand slug, or null when unconfigured / unpublished. Every
 *  brand-scoped read below is keyed by this. */
export const getBrandSlug = cache(async (): Promise<string | null> => {
  return (await agentInfo())?.brand ?? null;
});

// ── workspace files ──────────────────────────────────────────────────────────

/** UTF-8 text of one workspace file. Null on any miss — a missing file is a
 *  normal state (an unpublished brand, an optional config), never an error. */
export const getWorkspaceText = cache(async (key: string): Promise<string | null> => {
  const k = safeKey(key);
  if (!k) return null;

  const local = await activeLocal();
  if (local) {
    try {
      return await readFile(join(local.dir, k), 'utf8');
    } catch {
      return null;
    }
  }

  const creds = await agentCreds();
  if (!creds) return null;
  try {
    const res = await fetch(
      `${creds.brainUrl}/v1/agent/${encodeURIComponent(creds.agentId)}/r2/${k}`,
      {
        headers: { Authorization: `Bearer ${creds.brainKey}` },
        next: { revalidate: BRAIN_REVALIDATE },
      },
    );
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
});

/** Parsed JSON of one workspace file. Null on a miss OR on malformed JSON —
 *  authored workspace content can never throw into a render. */
export const getWorkspaceJson = cache(async (key: string): Promise<unknown | null> => {
  const text = await getWorkspaceText(key);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
});

/** The release's frozen file index (workspace-relative keys, minted by
 *  publish). Empty when the release predates file indexing or none exists. */
const fileIndex = cache(async (): Promise<string[]> => {
  const creds = await agentCreds();
  if (!creds) return [];
  const res = await brainJson<{ files?: string[] }>(
    `/v1/agent/${encodeURIComponent(creds.agentId)}/files`,
  );
  return Array.isArray(res?.files) ? res.files : [];
});

/** Filenames (not paths) directly under `dir` — the frozen index in brain mode,
 *  a real directory read on disk. */
export const listWorkspaceDir = cache(async (dir: string): Promise<string[]> => {
  const local = await activeLocal();
  if (local) {
    try {
      const entries = await readdir(join(local.dir, dir), { withFileTypes: true });
      return entries.filter((e) => e.isFile()).map((e) => e.name);
    } catch {
      return [];
    }
  }

  const prefix = `${dir.replace(/\/+$/, '')}/`;
  const out = new Set<string>();
  for (const f of await fileIndex()) {
    if (!f.startsWith(prefix)) continue;
    const rest = f.slice(prefix.length);
    if (!rest || rest.includes('/')) continue; // direct children only
    out.add(rest);
  }
  return [...out];
});

// ── site meta ────────────────────────────────────────────────────────────────

/**
 * The handful of site/v1 fields this app actually wants — the brand's display
 * name for the app chrome, mostly.
 *
 * Deliberately NOT the full contract: `parseSiteConfig` lives in
 * `apps/wrapper/src/lib/site-contract.ts` and apps must not import across each
 * other. This app only needs the brand's display name; anything more should
 * come from a real published contract, not a second parser.
 */
export interface SiteMetaLite {
  title: string;
  description: string;
}

export const siteMeta = cache(async (): Promise<SiteMetaLite> => {
  const fallback = { title: '', description: '' };

  let site: { meta?: { title?: unknown; description?: unknown } } | null = null;
  const local = await activeLocal();
  if (local) {
    site = (await getWorkspaceJson(WS_PATHS.site)) as typeof site;
  } else {
    const creds = await agentCreds();
    if (!creds) return fallback;
    site = await brainJson(`/v1/agent/${encodeURIComponent(creds.agentId)}/site`);
  }

  const m = site?.meta ?? {};
  return {
    title: typeof m.title === 'string' ? m.title : '',
    description: typeof m.description === 'string' ? m.description : '',
  };
});
