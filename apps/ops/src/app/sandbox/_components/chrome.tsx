import { SectionHeading } from '@gaia/ui';
import Link from 'next/link';

/**
 * Gaia's sandbox chrome.
 *
 * Deliberately not a port of Syvon's. That one carries a nav card, breadcrumb,
 * group ordering and a 17-scene catalogue because it documents a system that
 * shipped; this documents a system that mostly has not, and the day it needs
 * grouping it can grow it. A scene here is a page and a registry row.
 *
 * The sandbox lives inside `apps/ops` because it is an internal surface and ops
 * is the internal app. It is not part of the product: nothing links to it from
 * the coordinator nav.
 */

export const SCENES = [
  {
    slug: 'components',
    title: 'Components',
    blurb:
      'The library both apps compose from — type, actions, status, people, cards, layout. Every rule that keeps the two apps looking like one product, with a live specimen of each.',
  },
  {
    slug: 'app-shell',
    title: 'App shell',
    blurb:
      'One layout worn by all five surfaces — frame, header, card, side menu, and the single morphing bar that is all the navigation either app has. What went in the bar, what went behind the avatar, and why the agent sits on the far side of a hairline.',
  },
  {
    slug: 'docket-kernel',
    title: 'Docket kernel',
    blurb:
      'The enforcement and data design behind every screen — tenancy, number blocks, geofence authority, slot spacing. Theory: none of it is built.',
  },
  {
    slug: 'attestation-seam',
    title: 'Attestation seam',
    blurb:
      'The one decision that makes category two cheap. What varies between a load, a trip, a shift and a machine hour — and what must not.',
  },
  {
    slug: 'agent-layer',
    title: 'Agent layer',
    blurb:
      'Read, draft, commit — and why the commit line is absolute when the evidence is the product.',
  },
] as const;

export function SceneShell({
  title,
  status,
  children,
}: {
  title: string;
  status?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link href="/sandbox" className="text-xs text-muted-foreground hover:text-foreground">
        ← Sandbox
      </Link>
      <h1 className="font-display mt-3 text-2xl">{title}</h1>
      {status && (
        <span className="mt-2 inline-block rounded-full border border-[hsl(var(--primary))]/50 px-2.5 py-0.5 text-xs text-primary">
          {status}
        </span>
      )}
      <div className="mt-8 flex flex-col gap-10">{children}</div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <SectionHeading className="mb-2">{title}</SectionHeading>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

/** A rule and the reason it exists. The reason is the load-bearing half. */
export function Rule({ rule, why }: { rule: string; why: string }) {
  return (
    <div className="flex flex-col gap-1 border-t py-2.5 sm:flex-row sm:gap-4">
      <code className="shrink-0 text-xs text-foreground sm:w-56">{rule}</code>
      <p className="text-xs leading-relaxed">{why}</p>
    </div>
  );
}

export function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border p-3 text-xs leading-relaxed text-foreground">
      {children}
    </pre>
  );
}
