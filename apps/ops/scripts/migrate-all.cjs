/**
 * Apply this app's migrations to EVERY member bank.
 *
 * One schema, N databases — one per shipped app. Each bank is discovered from
 * an env var named `VESSEL_DB_URL__<slug>`:
 *
 *     VESSEL_DB_URL__dev=postgresql://…
 *     VESSEL_DB_URL__fortys=postgresql://…
 *     VESSEL_DB_URL__saturn=postgresql://…
 *
 * Locally those live in apps/vessel/.env; in CI each is a per-brand secret, so
 * a workflow can hold one brand's credentials without holding them all.
 *
 * `migrate deploy` ONLY — never `migrate dev`. Deploy applies pending
 * migrations and nothing else; dev can offer to reset, and these banks hold a
 * brand's customers. Creating a migration is a separate, deliberate act
 * (`pnpm --filter vessel db:migrate`) run once against the dev bank.
 *
 * Continues past a failing bank and exits non-zero at the end, so one
 * unreachable database does not hide the state of the other nine.
 */
const path = require('path');
const { spawnSync } = require('child_process');

const appRoot = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(appRoot, '.env') });

const PREFIX = 'VESSEL_DB_URL__';

const banks = Object.entries(process.env)
  .filter(([k, v]) => k.startsWith(PREFIX) && typeof v === 'string' && v.trim())
  .map(([k, v]) => ({ slug: k.slice(PREFIX.length), url: v.trim() }))
  .sort((a, b) => a.slug.localeCompare(b.slug));

if (!banks.length) {
  console.error(
    `[migrate-all] no banks found. Set at least one ${PREFIX}<slug> in apps/vessel/.env`,
  );
  process.exit(1);
}

console.log(`[migrate-all] ${banks.length} bank(s): ${banks.map((b) => b.slug).join(', ')}\n`);

const failed = [];
for (const bank of banks) {
  console.log(`── ${bank.slug} ──────────────────────────────────────────`);
  const res = spawnSync(
    process.execPath,
    [path.join(__dirname, 'prisma-with-env.cjs'), 'migrate', 'deploy'],
    {
      cwd: appRoot,
      stdio: 'inherit',
      // Overrides the .env value inside prisma-with-env.cjs.
      env: { ...process.env, VESSEL_DB_URL: bank.url },
    },
  );
  if (res.status !== 0) failed.push(bank.slug);
  console.log('');
}

if (failed.length) {
  console.error(`[migrate-all] FAILED: ${failed.join(', ')}`);
  process.exit(1);
}
console.log(`[migrate-all] all ${banks.length} bank(s) up to date.`);
