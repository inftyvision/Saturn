import type { Metadata, Viewport } from 'next';
import './globals.css';
import { brandCss } from '@/lib/tokens';
import { BuyerModeSwitch } from '@/features/ModeSwitch';
import { siteMeta } from '@/lib/workspace';

/**
 * Buyer root layout — the contractor's app.
 *
 * WHITE-LABELLED PER COORDINATOR, resolved from the HOSTNAME: `app.saturn.gy`
 * and `app.nordstar.gy` are one deployment wearing two brands. A new
 * coordinator is a CNAME, not a redeploy, and an unclaimed hostname gets no
 * brand at all rather than the last one configured.
 *
 * The contractor is buying from Saturn, not from the platform, so the
 * coordinator's identity is the only one on the page. Not decoration: a link
 * arriving over WhatsApp under an unfamiliar brand reads as a phishing attempt,
 * and this is a market that settles on account.
 *
 * ONE RULE: nothing that can fail on a service call goes above this line.
 * `brandCss()` is awaited here, so an uncaught throw takes the whole app down
 * rather than one screen. Order data is fetched inside the screens that need it.
 */

export async function generateMetadata(): Promise<Metadata> {
  const meta = await siteMeta();
  return { title: meta.title || 'Deliveries', description: meta.description || undefined };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fail-soft: an unreachable brand source leaves the app unbranded but alive.
  let css = '';
  try {
    css = await brandCss();
  } catch (err) {
    console.error('[layout] brandCss failed — rendering unbranded', err);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,100..700,0..1,0&display=block"
        />
        {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
        <script dangerouslySetInnerHTML={{ __html: ICON_BOOT }} />
      </head>
      {/*
        Nothing but the brand and the fonts lives here now.
        The chrome — header, card, bar, side menu — belongs to `(app)/layout`,
        because `(public)` must render none of it: `/o/[token]` arrives over
        WhatsApp and lands in more hands than the recipient's, and `/login` has
        no session to draw a nav for.

        The footer went with it. "Every load is photographed…" is a claim about
        the evidence behind an ORDER, so it belongs under the order rather than
        under the sign-in page, where it was making a promise to somebody who
        had not bought anything yet.
      */}
      <body>
        {children}
        {/* Prototype scaffolding, outside every layout — see the file. */}
        <BuyerModeSwitch />
      </body>
    </html>
  );
}

/** Ligature icons paint their own NAME when the face is missing — hide until
 *  loaded, reveal unconditionally after 3s.
 *
 *  The script SETS and clears `data-icons`; React never renders it. Rendering it
 *  in the JSX is a hydration mismatch, because this runs at parse time and the
 *  font resolves from cache before React hydrates. See apps/ops for the full note. */
const ICON_BOOT = `(function(){var d=document,h=d.documentElement;
h.setAttribute('data-icons','wait');
function go(){h.removeAttribute('data-icons')}
if(d.fonts&&d.fonts.load){d.fonts.load("24px 'Material Symbols Outlined'").then(go).catch(go)}else{go()}
setTimeout(go,3000)})();`;
