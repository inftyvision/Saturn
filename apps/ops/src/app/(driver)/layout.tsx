'use client';

import { AppShell, BrandBadge } from '@gaia/ui';
import { SimProvider } from '@/features/driver/sim';
import { SyncBanner, ConditionStrip } from '@/features/driver/DriverChrome';
import { WORKER_ROUTES, OPS_AGENT_COPY } from '@/features/shell/nav';
import { SaturnMark } from '@/features/shell/SaturnMark';
import { driverName, driver, ORGS, CURRENT_DRIVER, OPS_AGENT_SCRIPT } from '@gaia/core';
import { OPS_ANSWERS } from '@/features/shell/answers';

/**
 * The worker shell.
 *
 * A route group rather than a separate app, per §3 — the driver surface is
 * wrapped with Capacitor later for reliable background location, and it must be
 * the SAME code that ran on the web or the two diverge exactly where it matters
 * least visibly and costs most: the geofence transitions.
 *
 * ## Same shell, different size
 *
 * The worker gets the identical frame, header, card, bar and side menu as the
 * coordinator, at `tap` size — a 56px floor on every control, with the label
 * rendered under each glyph. That is the whole accommodation. The alternative
 * considered and rejected was leaving this surface on its own chrome: it is
 * exactly how the four layouts this replaces came about, and the driver surface
 * is the one that would then be last to get every fix.
 *
 * The 56px floor is not a preference. Every control here is pressed one-handed,
 * in sunlight, sometimes in gloves.
 *
 * ## Two things that moved rather than went away
 *
 *  - The SYNC BANNER is pinned at the top of the card, above the scroll. It is
 *    the one honest thing to show when offline is load-bearing: a count of what
 *    is captured and what has landed. A spinner would ask a driver to trust an
 *    unverified claim, which is the opposite of what this product sells.
 *  - The PROTOTYPE CONDITION STRIP is in the side menu. It stands in for GPS,
 *    the geofence evaluator and the radio, and it does not belong in the
 *    product chrome — a prototype affordance sewn into a layout is a prototype
 *    affordance somebody eventually ships.
 *
 * Constrained to a phone width even on a desk. Every driver screen is designed
 * for one thumb; letting it stretch to 1400px on a review machine would make it
 * look fine and hide that.
 */
export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const org = ORGS.find((o) => o.id === driver(CURRENT_DRIVER)?.orgId);

  return (
    <SimProvider>
      <AppShell
        identity={{ name: driverName(CURRENT_DRIVER), role: 'Worker' }}
        routes={WORKER_ROUTES}
        surface="phone"
        brandMark={org && <BrandBadge mark={<SaturnMark />} name={org.name} bg={org.brandColor} />}
        company={org?.name}
        agent={{
          script: OPS_AGENT_SCRIPT,
          answers: OPS_ANSWERS,
          ...OPS_AGENT_COPY,
        }}
        banner={<SyncBanner />}
        menu={[
          // No "Account" group here, unlike coordinator/hauler — those show
          // which ORG the screen is acting as, and a worker doesn't hold one;
          // the profile block above already carries the whole identity.
          // "Today's summary" isn't repeated either — it's already the bar's
          // own Summary icon, not a second link to the same page.
          { items: [{ href: '/sandbox', label: 'Sandbox', icon: 'science' }] },
          {
            items: [
              {
                href: '/login',
                label: 'Log out',
                icon: 'logout',
                sub: 'Prototype — no real session to end, but this is the real screen',
                danger: true,
              },
            ],
          },
        ]}
        menuExtra={<ConditionStrip />}
      >
        {children}
      </AppShell>
    </SimProvider>
  );
}
