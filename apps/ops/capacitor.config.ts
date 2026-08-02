import type { CapacitorConfig } from '@capacitor/cli';

/**
 * The Gaia Ops shell — ONE binary.
 *
 * Ops is product-branded, and that is what keeps this simple: nobody using it is
 * a customer of a vendor, and a subcontractor working for two coordinators
 * should not need two apps. So there is a single App Store record and a single
 * bundle id, not one per vendor — which also sidesteps the template-app rule a
 * per-vendor build would run straight into.
 *
 * The white-labelled half of the product is `apps/buyer`, and it is web only.
 * Onboarding a vendor there costs a CNAME, not a store submission.
 *
 * ## Why the shell renders the live app
 *
 * With `server.url` set, the shell loads the deployment rather than a bundled
 * export: same-origin cookies, no CORS, streaming intact, and UI work ships
 * without a store rebuild. Only shell-level changes — Capacitor plugins, OS
 * support, certificates — need resubmission. Keep the shell dumb and that stays
 * true.
 *
 * ⚠ This url is BAKED IN. Moving the origin leaves every install pointing at the
 * old one until it is rebuilt and re-reviewed, so pick the hostname once.
 *
 * ## What the native build is actually for
 *
 * Background location. A browser freezes the page on screen lock, and the phone
 * is in a pocket for the whole leg between origin and destination — so geofence
 * transitions stop, which is the one thing the count depends on. Native also
 * unlocks the platform geofencing APIs (Android Geofencing, `CLCircularRegion`),
 * which wake a terminated app on a boundary crossing for a fraction of the
 * battery polling costs.
 *
 * The ping queue belongs in the plugin, not the webview: Android will kill a
 * webview under memory pressure on a low-end phone, and a JS-side queue dies
 * with it.
 *
 * `webDir` is unused while `server.url` is set. It exists so an offline shell
 * stays possible later without re-plumbing the build.
 */
const config: CapacitorConfig = {
  appId: 'gy.gaia.ops',
  appName: 'Gaia Ops',
  webDir: 'dist-mobile',
  backgroundColor: '#0B0D10',
  server: { url: 'http://localhost:3050', cleartext: true },
  ios: { contentInset: 'never' },
};

export default config;
