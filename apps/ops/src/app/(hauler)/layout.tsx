import { AppShell, BrandBadge } from '@gaia/ui';
import { ORGS, COORDINATOR_ORG, CURRENT_COORDINATOR_USER, OPS_AGENT_SCRIPT } from '@gaia/core';
import { OPS_ANSWERS } from '@/features/shell/answers';
import { HAULER_ROUTES, OPS_AGENT_COPY } from '@/features/shell/nav';
import { SaturnMark } from '@/features/shell/SaturnMark';

/**
 * The hauler route group.
 *
 * ⚠ PROTOTYPE DEVIATION. §3 puts these at `/(hauler)/dockets`, `/(hauler)/vehicles`
 * and so on — the same URLs the coordinator group claims, with the ROLE deciding
 * which renders ("one login, landing screens by role"). Next resolves routes
 * from the filesystem, so two groups cannot both own `/dockets`; in production
 * that page reads the caller's `RoleGrant` and renders one or the other.
 *
 * Here they are mounted under `/hauler/*` instead, so both roles are walkable
 * side by side without an auth session to switch between. The screens are
 * unaffected; only the path is.
 *
 * Saturn holds coordinator AND hauler simultaneously (§"Who uses it"), so in
 * phase 1 this surface shows Saturn its own fleet — which is exactly the case
 * §9 scopes to. A subcontractor sees the identical screens against its own org.
 *
 * Same bar shape as the coordinator's — Map, Work, Money, Operations — for
 * the reason `nav.ts` gives: Saturn holds both roles, and a bar that
 * rearranges itself when they switch is the thing this shape exists to
 * avoid. Money and Operations don't NEED segments the way Work does — the
 * shell does not require a section to have a strip — so they stay flat
 * rather than nesting for symmetry's own sake.
 */
export default async function HaulerLayout({ children }: { children: React.ReactNode }) {
  const org = ORGS.find((o) => o.id === COORDINATOR_ORG)!;

  return (
    <AppShell
      identity={{ name: org.name, role: 'Hauler' }}
      routes={HAULER_ROUTES}
      surface="column"
      brandMark={<BrandBadge mark={<SaturnMark />} name={org.name} bg={org.brandColor} />}
      personName={CURRENT_COORDINATOR_USER}
      company={org.name}
      agent={{ script: OPS_AGENT_SCRIPT, answers: OPS_ANSWERS, ...OPS_AGENT_COPY }}
      menu={[
        {
          label: 'Account',
          items: [{ label: org.name, icon: 'apartment', sub: 'Hauler · Saturn holds this and Coordinator' }],
        },
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
    >
      {children}
    </AppShell>
  );
}
