import { SceneShell, Section, Rule, Code } from '../_components/chrome';

export const dynamic = 'force-dynamic';

/**
 * The extension seam. This is the scene that argues for a decision already
 * taken — worth writing down because the decision looks like premature
 * generality and is not, and the distinction is easy to lose.
 */
export default function AttestationSeamScene() {
  return (
    <SceneShell title="Attestation seam" status="THEORY — the schema is unwritten">
      <Section title="The rule">
        <p className="text-foreground">
          Build the aggregate capture screens. Make them <em>selected</em>, not hardcoded.
        </p>
        <p>
          <code>attestation_types</code> is a field on the job, not an assumption in the code. That
          is the single decision that makes a second category cheap, and it costs almost nothing
          today because the schema does not exist yet.
        </p>
        <p>
          It sits uncomfortably beside &ldquo;add when a customer asks, not before&rdquo; — and the
          resolution is that renaming a shipped schema costs far more than naming it right while it
          is still a document. Generalise the DATA now; generalise nothing above it.
        </p>
      </Section>

      <Section title="What varies">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 text-left font-normal">Category</th>
                <th className="py-2 text-left font-normal">Unit</th>
                <th className="py-2 text-left font-normal">Origin capture</th>
                <th className="py-2 text-left font-normal">Destination capture</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              {[
                ['Aggregate', 'Load', 'Loaded-bed photo', 'Dump photo'],
                ['Ground transport', 'Trip', 'Passenger confirmed', 'Arrival confirmed'],
                ['Waste', 'Collection', 'Container photo', 'Transfer confirmed'],
                ['Janitorial', 'Shift', 'Start tap + geofence', 'End tap + geofence'],
                ['Plant hire', 'Machine hour', 'Hour meter photo', 'Hour meter photo'],
              ].map((r) => (
                <tr key={r[0]} className="border-b">
                  {r.map((c, i) => (
                    <td key={i} className="py-2 pr-4">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Same docket table, same lifecycle, same numbering, same geofence. Only the capture screen
          swaps — and janitorial collapses origin and destination to one site, skipping{' '}
          <code>in_transit</code> entirely.
        </p>
      </Section>

      <Section title="What must not vary">
        <div>
          <Rule
            rule="The lifecycle"
            why="issued → at_origin → acquired → in_transit → at_dest → released → closed. A category that needs a different state machine is a different product."
          />
          <Rule
            rule="Numbering"
            why="Blocks, per vendor org, never a shared space. A vendor's independent record is why they trust the count."
          />
          <Rule
            rule="The commit line"
            why="Closed dockets are immutable in every category. Corrections are void-and-reissue."
          />
          <Rule
            rule="Who verifies"
            why="Server-canonical geofence and a capture that carries its own fix. The evidence rules do not soften for an easier category."
          />
        </div>
      </Section>

      <Section title="The gap this scene exists to flag">
        <p className="text-foreground">
          The lint bans commodity nouns in <code>packages/core</code>. It should. But nothing
          carries the nouns the UI needs.
        </p>
        <p>
          Core says <code>resource</code>. A driver&apos;s screen must say{' '}
          <strong>vehicle</strong>; a janitorial one must say <strong>team</strong>.
          &ldquo;Resource&rdquo; on a worker&apos;s phone is absurd, and
          &ldquo;unit&rdquo; on a buyer&apos;s order is worse — a foreman ordering twenty units of
          sand will phone to check what he just bought.
        </p>
        <p>
          <code>ServiceItem.unit</code> carries the unit. Nothing carries the rest. Without a
          per-category label set the generality either leaks into the UI or the UI leaks back into
          core — and the lint only catches the second one.
        </p>
        <Code>{`// packages/core/src/vocabulary.ts — the missing piece
export const VOCAB = {
  aggregate: {
    resource: 'vehicle', resourcePlural: 'vehicles',
    person:   'driver',  unit: 'load',  unitPlural: 'loads',
    origin:   'pit',     destination: 'site',
  },
  janitorial: {
    resource: 'team',    resourcePlural: 'teams',
    person:   'cleaner', unit: 'shift',  unitPlural: 'shifts',
    origin:   'site',    destination: 'site',
  },
  // …one row per category. Core stays commodity-free; the UI never does.
} as const`}</Code>
      </Section>
    </SceneShell>
  );
}
