'use client';

import { useMemo, useState } from 'react';
import { SceneShell, Section, Rule, Code } from '../_components/chrome';

/**
 * The enforcement and data design behind every screen. Theory — none of it is
 * built, and the banner should keep saying so until there is a migration.
 */
export default function DocketKernelScene() {
  return (
    <SceneShell title="Docket kernel" status="THEORY — nothing here is built">
      <Section title="What a docket is">
        <p>
          One unit of completed work — a load, a trip, a collection, a shift, a machine hour.
          Authorised before it happens, geofence-verified while it happens, evidenced at both ends,
          immutable once closed.
        </p>
        <p>
          Dockets are proof of delivery, the invoice basis, the dispute record, and later the audit
          trail enterprise buyers are obliged to produce. That last role is why the evidence rules
          below are not negotiable: a record that can be edited after the fact is worth nothing to
          an auditor.
        </p>
      </Section>

      <Section title="Tenancy — service layer first, RLS as backstop">
        <p>
          Every path goes through a repository function taking explicit org context. RLS catches the
          mistake; it is not the only thing standing. A policy that is the sole guard fails silently
          the day someone adds a raw query.
        </p>
        <Code>{`// packages/db/context.ts
export async function withOrgContext<T>(
  orgId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw\`SELECT set_config('app.current_org_id', \${orgId}, true)\`
    return fn(tx)
  })
}`}</Code>
        <div className="pt-2">
          <Rule
            rule="set_config(…, true)"
            why="Transaction-scoped. Session scope leaks across pooled connections — the next request on that connection inherits the previous tenant."
          />
          <Rule
            rule="Pooler in transaction mode"
            why="In statement mode the SET LOCAL and the query can land on different connections, so the policy evaluates with no org set at all."
          />
          <Rule
            rule="App role lacks BYPASSRLS"
            why="Prisma's migration user usually has it. If that is the same credential the app runs on, every policy is decorative."
          />
          <Rule
            rule="Migrations under a separate role"
            why="Which is what lets the app role stay unprivileged without breaking deploys."
          />
        </div>
        <p className="pt-1">
          Cross-org reads are explicit <code>OrgAccess</code> edges checked in the service layer,
          never a relaxed policy. Phase 1 is one org, but <code>org_id</code> is on every table and{' '}
          <code>hauler_org_id</code> is on Assignment from the first migration. Model it, don&apos;t
          build the interface.
        </p>
      </Section>

      <BlocksSection />
      <GeofenceSection />
      <SlotsSection />

      <Section title="Open — decide before the first migration">
        <Open
          q="The override rate has no target"
          note="Every automatic transition has a manual override, and must. But that rate is exactly the share of the tally that was asserted rather than verified. At 5% 'indisputable' holds; at 30% it is a slightly better paper book. Instrument it from the first commit and pick a number that means investigate."
        />
        <Open
          q="Credentials expiring mid-shift"
          note="An expired credential removes a subject from dispatch automatically, with no human in the loop. Correct for assignment. Undecided for an OPEN docket when the licence lapses at 23:59 — does it hold, close, or complete? A commercial and safety call, and the case that will actually occur."
        />
        <Open
          q="attestation_types[] lost its waypoint scoping"
          note="Spec v2 had { origin: [presence, quantity], destination: [presence, event] }. v7 flattened it to one array on the Job, but capture differs per end — a loaded bed at origin, a dump at destination. A flat array cannot say which applies where."
        />
        <Open
          q="PostGIS is not on the provisioned database"
          note="geometry(Polygon,4326) and geog(Point) need the PostGIS image. Free to switch while it holds nothing; a data migration afterwards."
        />
      </Section>
    </SceneShell>
  );
}

function BlocksSection() {
  const [burned, setBurned] = useState(12);
  const SIZE = 50;
  const left = SIZE - burned;

  return (
    <Section title="Docket numbers — pre-allocated blocks">
      <p>
        The number has to be speakable on site, offline, at the moment of work — the worker reads it
        to whoever is receiving, who writes it in their own book. That one requirement rules out
        server-side allocation at the moment of capture, because there is no signal at pits.
      </p>

      <div className="flex flex-wrap gap-[3px] pt-1">
        {Array.from({ length: SIZE }, (_, i) => (
          <span
            key={i}
            title={String(4501 + i)}
            className={`h-4 w-3.5 rounded-sm ${i < burned ? 'bg-primary/70' : 'bg-secondary'}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="range"
          min={0}
          max={SIZE}
          value={burned}
          onChange={(e) => setBurned(Number(e.target.value))}
          className="max-w-[240px] flex-1"
        />
        <span className="text-xs text-foreground">4501–4550 · {left} left</span>
        {left < 15 && <span className="text-xs text-primary">refill triggered</span>}
      </div>

      <ul className="list-disc space-y-1 pl-5 text-xs">
        <li>Sequential per VENDOR org, never reused, never a shared number space.</li>
        <li>Block 50, refill below 15; unused blocks expire after 7 days and are retired.</li>
        <li>
          <strong className="text-foreground">Gaps are expected</strong> — an allocated, unused,
          unvoided number is a soft signal in exceptions, not an error. Paper books have gaps too.
        </li>
      </ul>
    </Section>
  );
}

function GeofenceSection() {
  return (
    <Section title="Geofence authority — both, server canonical">
      <p>
        The client must evaluate offline, because the capture gate depends on it. The server
        re-evaluates and wins. Neither half is optional, and the disagreement between them is a
        product surface rather than an error path.
      </p>
      <div className="pt-1">
        <Rule
          rule="Client"
          why="Caches polygons, gates capture locally, takes transitions optimistically so the screen is right with no signal."
        />
        <Rule
          rule="Capture payload"
          why="Every capture carries its OWN GPS fix. Without this the client gate is the only barrier against a capture taken anywhere."
        />
        <Rule
          rule="Server"
          why="Re-derives geofence events from the ping stream on sync and reconciles against what the client reported."
        />
        <Rule
          rule="Disagreement"
          why="Goes to exceptions with BOTH versions attached. Never silently overwritten."
        />
        <Rule rule="Accuracy > 50 m" why="Recorded, but does not trigger a transition." />
      </div>
      <p className="pt-1">
        The evaluator belongs in <code>packages/core</code>, called from both the app and the
        worker. One implementation is what makes &ldquo;the server re-derives&rdquo; provable rather
        than aspirational, and keeps <em>where it runs</em> a deployment decision.
      </p>
    </Section>
  );
}

function SlotsSection() {
  const [rate, setRate] = useState(6);
  const [hours, setHours] = useState(9);
  const { spacing, count } = useMemo(() => {
    const s = 60 / rate;
    return { spacing: s, count: Math.floor((hours * 60) / s) };
  }, [rate, hours]);

  return (
    <Section title="Slots — the queue mechanic">
      <p>
        The pattern being replaced is a broadcast: everyone arrives at opening and the queue absorbs
        it. A slot is a claim with a time attached. No solver — the spacing <em>is</em> the queue
        management, and it self-corrects.
      </p>
      <div className="flex flex-wrap items-center gap-5 pt-1">
        <label className="text-xs">
          Service rate{' '}
          <input
            type="range"
            min={2}
            max={12}
            step={0.5}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="align-middle"
          />{' '}
          <span className="text-foreground">{rate}/h</span>
        </label>
        <label className="text-xs">
          Window{' '}
          <input
            type="range"
            min={4}
            max={12}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="align-middle"
          />{' '}
          <span className="text-foreground">{hours} h</span>
        </label>
        <span className="text-sm text-foreground">
          <strong>{count}</strong> slots, {spacing.toFixed(0)} min apart
        </span>
      </div>
      <div className="flex flex-wrap gap-[3px]">
        {Array.from({ length: Math.min(count, 96) }, (_, i) => (
          <span key={i} className="h-4 w-1.5 rounded-sm bg-primary/45" />
        ))}
      </div>
      <ul className="list-disc space-y-1 pl-5 text-xs">
        <li>
          Geofence gives arrival, capture gives completion; the gap is dwell. After a few dozen
          dockets the observed rate replaces the entered one — for FUTURE spacing only, never
          rewriting a window already posted.
        </li>
        <li>
          A slot with nothing on the ground 20 minutes past its time is released and re-offered.
        </li>
      </ul>
    </Section>
  );
}

function Open({ q, note }: { q: string; note: string }) {
  return (
    <div className="border-t py-3">
      <p className="text-sm text-foreground">{q}</p>
      <p className="mt-1 text-xs leading-relaxed">{note}</p>
    </div>
  );
}
