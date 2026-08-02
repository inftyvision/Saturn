import Link from 'next/link';
import { SCENES } from './_components/chrome';

export const dynamic = 'force-dynamic';

/**
 * Gaia's sandbox index.
 *
 * These scenes document decisions, not code. Everything in the product today is
 * front end on fixtures — no database, no auth, no telemetry — so this is where
 * the backend argument lives until there is a migration to point at.
 *
 * Moved out of the Syvon portal, where it did not belong: Gaia is its own
 * repository and its own business, and design records that describe it should
 * not be readable only to someone with a Syvon checkout.
 */
export default function SandboxIndex() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="font-display text-2xl">Sandbox</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Design records for decisions that are expensive to change later. Nothing here is built —
        the product is front end on fixtures, deliberately, until the flows are approved.
      </p>

      <ul className="mt-8 divide-y">
        {SCENES.map((s) => (
          <li key={s.slug}>
            <Link href={`/sandbox/${s.slug}`} className="block py-4 transition-colors hover:text-primary">
              <p className="text-sm">{s.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-xs text-muted-foreground">
        Every entry here needs a page at <code>sandbox/&lt;slug&gt;/page.tsx</code>, and every such
        directory needs an entry. An entry without a page is a link to a 404; a page without an
        entry is one nobody finds.
      </p>
    </div>
  );
}
