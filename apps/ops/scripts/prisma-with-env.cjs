/**
 * Run the Prisma CLI with VESSEL_DB_URL already loaded from apps/vessel/.env.
 *
 * A bare `prisma …` dies with `P1012 Environment variable not found` — the URL
 * lives in the app's .env, not in your shell. Same reason and same shape as
 * packages/database/scripts/prisma-with-env.cjs.
 *
 * Also invokes the CLI through `node <path>` rather than the `prisma` shim,
 * which exits EINVAL on the Windows dev box.
 *
 * Usage:  node scripts/prisma-with-env.cjs migrate deploy
 *         VESSEL_DB_URL=… node scripts/prisma-with-env.cjs migrate deploy
 */
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const appRoot = path.join(__dirname, '..');

// An explicit URL in the environment WINS — that is what lets migrate-all.cjs
// point this at each brand's bank in turn without rewriting .env.
if (!process.env.VESSEL_DB_URL) {
  require('dotenv').config({ path: path.join(appRoot, '.env') });
}

if (!process.env.VESSEL_DB_URL) {
  console.error(
    '[prisma-with-env] VESSEL_DB_URL is not set. Copy .env.example to .env and fill it in.',
  );
  process.exit(1);
}

process.chdir(appRoot);

const prismaCli = path.join(appRoot, 'node_modules', 'prisma', 'build', 'index.js');
if (!fs.existsSync(prismaCli)) {
  console.error('[prisma-with-env] prisma is not installed — run `pnpm install`.');
  process.exit(1);
}

try {
  execFileSync(process.execPath, [prismaCli, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env },
  });
} catch (err) {
  // Pass Prisma's exit code through — `migrate status` uses non-zero to mean
  // "something is pending", which is information, not a crash.
  process.exit(typeof err.status === 'number' ? err.status : 1);
}
