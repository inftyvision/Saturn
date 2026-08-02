import { AppShell } from '@gaia/ui';
import { BUYER_AGENT_SCRIPT, BUYER_ACCOUNT, gyd } from '@gaia/core';
import { siteMeta, agentInfo } from '@/lib/workspace';
import { BUYER_ANSWERS } from '@/features/shell/answers';
import { BUYER_ROUTES } from '@/features/shell/nav';

/**
 * The signed-in contractor's surface.
 *
 * A route group, and that is the whole reason it exists: `/o/[token]` and
 * `/login` are reached WITHOUT an account, and they must render no shell at
 * all. The old nav decided that for itself with a `usePathname` check and an
 * early `return null` — which works, but leaves a client component running on
 * a page that should not have one, and puts the rule in the nav rather than in
 * the structure. `(app)` and `(public)` put it in the structure: the public
 * pages are not inside the layout that draws the chrome, so there is nothing to
 * hide.
 *
 * The brand is the VENDOR's, resolved from the hostname by the root layout. The
 * shell is Gaia's, identical to the one the coordinator wears. That split is
 * the product: one design system, two token sets, and a contractor who never
 * sees Gaia's name because they are buying from Saturn.
 */
export default async function BuyerAppLayout({ children }: { children: React.ReactNode }) {
  const [meta, info] = await Promise.all([siteMeta(), agentInfo()]);
  const brand = meta.title || info?.brand || 'Deliveries';

  return (
    <AppShell
      identity={{ name: brand, role: 'Account' }}
      routes={BUYER_ROUTES}
      surface="column"
      agent={{
        script: BUYER_AGENT_SCRIPT,
        answers: BUYER_ANSWERS,
        placeholder: `Ask ${brand} about an order…`,
        blurb: `I can tell you what has arrived, where the trucks are and what is owed. I can’t place an order or promise a date — ${brand} schedules the runs.`,
      }}
      // The balance, on the avatar. A contractor's account carries credit
      // terms, so what is outstanding is the one number worth surfacing from
      // every screen — but as text in the menu, not as a count badge: a badge
      // means "things needing attention", and a balance is not that.
      menu={[
        {
          items: [
            { href: '/sites', label: 'Delivery sites', icon: 'location_on' },
            { href: '/account', label: 'People on this account', icon: 'group' },
            { href: '/money', label: `Outstanding — ${gyd(BUYER_ACCOUNT.balance)}`, icon: 'account_balance' },
          ],
        },
        {
          items: [
            { href: '/login', label: 'Sign out', icon: 'logout', danger: true },
          ],
        },
      ]}
    >
      {children}
    </AppShell>
  );
}
