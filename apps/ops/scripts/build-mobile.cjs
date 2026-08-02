#!/usr/bin/env node
/**
 * Mobile (Capacitor) build — static export of the app WITHOUT the API routes.
 * Route handlers cannot ship in `output: 'export'`; the native shell talks to
 * the deployed web API instead.
 *
 * Sidelines src/app/api → .api-sidelined for the build and ALWAYS restores it,
 * even when the build fails. Ported from apps/sy.
 *
 * Note this export is unused while capacitor.config.ts sets `server.url` — the
 * shell renders the live deployment. Keep the script working anyway: it is the
 * only path to an offline or launcher shell, and it rots silently otherwise.
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const appDir = path.join(__dirname, '..');
const apiDir = path.join(appDir, 'src', 'app', 'api');
const sidelined = path.join(appDir, '.api-sidelined');

if (fs.existsSync(sidelined)) {
  console.error(
    '[build-mobile] .api-sidelined already exists — a previous build crashed mid-flight. Restore it first.',
  );
  process.exit(1);
}

const hadApi = fs.existsSync(apiDir);
if (hadApi) fs.renameSync(apiDir, sidelined);

let code = 1;
try {
  const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['next', 'build'], {
    cwd: appDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, BUILD_TARGET: 'mobile' },
  });
  code = result.status ?? 1;
} finally {
  if (hadApi) fs.renameSync(sidelined, apiDir);
}

process.exit(code);
