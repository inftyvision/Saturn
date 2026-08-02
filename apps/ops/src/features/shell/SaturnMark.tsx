/**
 * Saturn's own mark — traced from `assets/logo.svg` in the `saturn`
 * workspace, shown INSIDE Gaia's own squircle via `BrandBadge` (see
 * `system/brand` in `@gaia/ui`) in place of Gaia's default checkmark. Fill
 * is `hsl(var(--background))`, not the source file's baked white, so it
 * reads the same dark-mark-on-brand-field way the checkmark it replaces
 * does — one treatment, not two.
 *
 * Fixture-level, same as everything else the prototype reads Saturn from:
 * there is one coordinator org today (`COORDINATOR_ORG`), so there is one
 * mark. The durable fix is the same one `apps/ops/src/lib/workspace.ts`
 * already names for tokens and fonts — a per-brand asset read off the
 * workspace, not a component per vendor — worth doing once there is a
 * second coordinator, not before the first.
 */
export function SaturnMark({ size = '100%' }: { size?: number | string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 186 186" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="hsl(var(--background))"
        d="M84.596 18.4329C115.043 15.036 143.258 30.3733 157.748 55.2451C162.757 46.3907 164.213 39.3931 161.151 35.5554C159.643 33.666 157.145 32.6747 153.835 32.5031C150.204 32.3149 146.573 31.4161 143.715 29.1689C141.373 27.3266 138.933 25.6131 136.407 24.0368C154.454 18.5415 168.662 19.1456 175.063 27.167C182.375 36.331 177.988 53.2808 165.127 72.6853C166.206 76.5449 166.991 80.5417 167.45 84.6539C172.043 125.82 142.395 162.914 101.229 167.508C85.4308 169.27 70.232 165.989 57.2398 158.95C35.264 167.339 17.5797 167.92 10.2194 158.696C2.83947 149.444 7.38021 132.26 20.526 112.626C19.5355 108.962 18.809 105.176 18.375 101.287C13.782 60.1212 43.4304 23.0263 84.596 18.4329ZM146.846 95.7109C138.276 105.022 128.213 114.42 116.955 123.403C105.822 132.286 94.5519 139.938 83.6836 146.189C88.5919 147.038 93.7013 147.219 98.9006 146.639C125.595 143.66 145.557 121.699 146.846 95.7109ZM86.9248 39.3049C57.2853 42.6119 35.9387 69.3203 39.2457 98.9597C40.895 113.738 48.3628 126.455 59.1105 135.082C58.2029 135.533 57.3065 135.968 56.4218 136.386C44.9394 141.816 31.3764 137.712 25.7245 126.337C20.4625 135.453 18.8811 142.662 22.0062 146.58C30.2469 156.907 68.0761 140.427 106.5 109.768C121.338 97.9288 134.092 85.7044 143.688 74.5659C135.395 51.6301 112.23 36.4818 86.9248 39.3049Z"
      />
    </svg>
  );
}
