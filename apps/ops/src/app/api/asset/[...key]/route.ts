/**
 * GET /api/asset/<workspace-relative-key> — stream one workspace file.
 *
 * The brand's font binaries and images live in R2 behind brain's agent-scoped
 * proxy, which requires a bearer key. That key must never reach a browser, so
 * this route is the server-side hop: the page emits `/api/asset/…` URLs and
 * this handler re-signs them.
 *
 * Scoped by construction — brain's `/v1/agent/:id/r2/:path` only serves files
 * belonging to THIS agent's workspace, so a crafted key cannot read another
 * tenant's bucket even in a shared deployment.
 */

export const runtime = 'nodejs';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { agentCreds, localWorkspace, mode } from '@/lib/mode';

/** Long, immutable: a published release never changes a file in place, and the
 *  release id changes the effective content on re-publish. */
const CACHE_CONTROL = 'public, max-age=31536000, immutable';
/** Local mode is a dev loop — a font edit must show on refresh. */
const CACHE_CONTROL_LOCAL = 'no-store';

const MIME: Record<string, string> = {
  woff2: 'font/woff2',
  woff: 'font/woff',
  otf: 'font/otf',
  ttf: 'font/ttf',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

export async function GET(req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const key = (await ctx.params).key.join('/');

  // Local mode: stream off the checkout, same as the wrapper's WS_ROOT path.
  if (mode() === 'local') {
    const local = localWorkspace(req.headers.get('host'));
    if (!local) return new Response('not configured', { status: 503 });
    if (!key || key.includes('..') || key.includes('\\')) {
      return new Response('bad key', { status: 400 });
    }
    try {
      const buf = await readFile(join(local.dir, key));
      const ext = key.split('.').pop()?.toLowerCase() ?? '';
      return new Response(new Uint8Array(buf), {
        headers: {
          'content-type': MIME[ext] ?? 'application/octet-stream',
          'cache-control': CACHE_CONTROL_LOCAL,
        },
      });
    } catch {
      return new Response('not found', { status: 404 });
    }
  }

  const creds = await agentCreds();
  if (!creds) return new Response('not configured', { status: 503 });
  // Traversal is rejected here as well as in brain: a 400 at the edge beats a
  // round trip, and the two gates are independent on purpose.
  if (!key || key.includes('..') || key.includes('\\')) {
    return new Response('bad key', { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${creds.brainUrl}/v1/agent/${encodeURIComponent(creds.agentId)}/r2/${encodeURI(key)}`,
      { headers: { Authorization: `Bearer ${creds.brainKey}` } },
    );
  } catch {
    return new Response('upstream unreachable', { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response('not found', { status: upstream.status === 404 ? 404 : 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      'cache-control': CACHE_CONTROL,
    },
  });
}
