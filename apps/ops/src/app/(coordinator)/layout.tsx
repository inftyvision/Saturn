import { AppShell, BrandBadge } from '@gaia/ui';
import { EXCEPTIONS, ORGS, COORDINATOR_ORG, JOBS, CURRENT_COORDINATOR_USER, OPS_AGENT_SCRIPT } from '@gaia/core';
import { OPS_ANSWERS } from '@/features/shell/answers';
import { coordinatorRoutes, OPS_AGENT_COPY } from '@/features/shell/nav';
import { SaturnMark } from '@/features/shell/SaturnMark';

/**
 * The coordinator route group.
 *
 * No surface guard here, and that absence is the point: ops and buyer are two
 * builds now, so a buyer deployment does not contain `/admin/vehicles` to leak.
 * The access-control shim that existed purely to keep two products out of each
 * other's routes went away with the extraction.
 *
 * Counts are resolved HERE, in a Server Component, and passed down as numbers.
 * `nav.ts` names them as keys instead of holding them, because it has to stay a
 * plain module a server layout can read — see the note at the top of that file.
 */
export default async function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  const org = ORGS.find((o) => o.id === COORDINATOR_ORG)!;
  const openExceptions = EXCEPTIONS.filter((e) => e.status === 'open').length;
  const openRequests = JOBS.filter((j) => j.status === 'draft').length;

  return (
    <AppShell
      identity={{ name: org.name, role: 'Coordinator' }}
      routes={coordinatorRoutes({ requests: openRequests, exceptions: openExceptions })}
      // The exception count rides on the ACCOUNT because Exceptions is a segment
      // of Work rather than a section: it is the number that decides whether the
      // tally can be trusted, and it must be legible from the map.
      accountBadge={openExceptions}
      brandMark={<BrandBadge mark={<SaturnMark />} name={org.name} bg={org.brandColor} />}
      personName={CURRENT_COORDINATOR_USER}
      company={org.name}
      agent={{ script: OPS_AGENT_SCRIPT, answers: OPS_ANSWERS, ...OPS_AGENT_COPY }}
      menu={[
        {
          label: 'Account',
          items: [{ label: org.name, icon: 'apartment', sub: 'Coordinator · Saturn holds this and Hauler' }],
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
