import type { Metadata, Viewport } from 'next';
import './globals.css';
import { brandCss } from '@/lib/tokens';
import { RoleSwitch } from '@/features/RoleSwitch';

/**
 * Ops root layout — coordinator, hauler, driver.
 *
 * PRODUCT-BRANDED. Nobody using this app is a customer of a vendor, and a
 * hauler working for two coordinators should not need two apps — so ops wears
 * exactly ONE brand: Gaia's own, from its own workspace.
 *
 * Same reader and same token pipeline as `apps/buyer`, which is the point. The
 * difference is only WHICH brand: buyer resolves a vendor's from the hostname,
 * ops resolves Gaia's from `GAIA_OPS_WS`. Two apps, one theming system.
 */

export const metadata: Metadata = {
  title: 'Gaia — Operations',
  description: 'Verified load haulage.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // The driver route group is wrapped with Capacitor; a native shell must not
  // pinch-zoom like a web page.
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0B0D10',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Same shape as apps/buyer: resolve, and fail soft. Ops has one brand rather
  // than one per hostname, but the pipeline is identical — one token mapping
  // for both apps is one place to get `--accent` wrong instead of two.
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
        {/* Axes as RANGES. A pinned `FILL,GRAD@…,1,0` resolves to a static
            instance with no FILL axis, silently making every `'FILL' 1` a
            no-op and leaving every icon outlined. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,100..700,0..1,0&display=block"
        />
        {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
        <script dangerouslySetInnerHTML={{ __html: ICON_BOOT }} />
      </head>
      <body>
        {children}
        {/* Prototype scaffolding, outside every layout — see the file. */}
        <RoleSwitch />
      </body>
    </html>
  );
}

/**
 * Reveal icons only once the face is really there.
 *
 * Material Symbols are LIGATURES: with the font missing the browser renders the
 * ligature's NAME, so the screen paints the literal words `photo_camera` and
 * `lock` where the icons belong. On the worker surface — offline at a pit,
 * where the font may never arrive — that is a wrong word, not a missing glyph.
 *
 * ## Why the script SETS the attribute rather than the JSX
 *
 * `data-icons` is owned entirely by this script and never rendered by React.
 * That is not style: the script runs at parse time, before hydration, and
 * `document.fonts.load()` resolves in a microtask when the face is cached — so
 * a JSX-rendered `data-icons="wait"` is routinely gone from the DOM by the time
 * React hydrates, and React reports a mismatch it cannot patch up.
 *
 * Keeping it out of the vdom means there is nothing to diff. `suppressHydrationWarning`
 * on <html> covers the rest, since browser extensions decorate that element too.
 *
 * With JS off the attribute is never set, the CSS rule never matches, and icons
 * render normally — which is the right degradation. The earlier shape had it
 * hardcoded in the HTML, so a no-JS visitor got icons hidden forever.
 *
 * `visibility: hidden` rather than `display: none` so controls keep their exact
 * box and nothing reflows when the glyphs land. Reveals unconditionally after
 * 3s so a slow network degrades to plain buttons rather than empty ones. The
 * native shell should precache this face.
 */
const ICON_BOOT = `(function(){var d=document,h=d.documentElement;
h.setAttribute('data-icons','wait');
function go(){h.removeAttribute('data-icons')}
if(d.fonts&&d.fonts.load){d.fonts.load("24px 'Material Symbols Outlined'").then(go).catch(go)}else{go()}
setTimeout(go,3000)})();`;
