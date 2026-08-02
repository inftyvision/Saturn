'use client';

import { useState } from 'react';
import {
  Action,
  BarAction,
  BarDivider,
  BarInput,
  CARD_FILL,
  Kicker,
  Meter,
  Num,
  SectionHeading,
  Segments,
  SideMenuGroup,
  SideMenuItem,
  SideMenuProfile,
  Stat,
  Starters,
  type Presence,
} from '@gaia/ui';
import { SceneShell, Rule, Code } from '../_components/chrome';

export const dynamic = 'force-dynamic';

/**
 * The app shell, documented next to the components it is built from.
 *
 * This scene exists because the shell is the one part of the library where the
 * DECISIONS matter more than the specimens. A `Card` is obvious once you see
 * one; "why is the agent on the far side of a hairline" is not, and it is the
 * kind of thing that gets quietly undone by the next person who needs one more
 * icon in the bar.
 */
export default function AppShellScene() {
  return (
    <SceneShell title="App shell" status="@gaia/ui — all four surfaces wear this">
      <Section title="What this replaced">
        <p>
          Four unrelated chromes: a coordinator sidebar with thirteen links, a driver phone column, a
          hauler tab strip, and a buyer top nav. They shared no component, no gutter and no idea of
          where the account lives — so a change to any of them changed exactly one.
        </p>
        <p className="text-foreground">
          There is now ONE layout. Coordinator, hauler, worker and contractor differ in data — which
          sections, which width, whether there is an agent and what it may draw — never in layout.
        </p>
      </Section>

      <Section title="Anatomy">
        <Code>{`AppFrame          the viewport. Owns gutters, safe-area insets, and the width.
  AppHeader       a lane on the BODY background, ABOVE the card
    AccountButton   leading edge — opens the side menu, becomes its cross
    HeaderTitle     where you are, DERIVED from section + segment
    actions         what this screen can do
  PageCard        the surface. Rounded, tinted, and it CROPS —
                  everything that floats is a child of it:
    Segments        the section's own sub-navigation, when it has one
    children        the screen
    AgentLayer      the conversation, over the surface
    SideMenu        everything that is not a destination
    FloatingBar     the one morphing pill`}</Code>
        <p>
          The header sits OUTSIDE the card because the card is the content and the header is not. It
          is also what lets one button open the side menu and close it: the menu fills the card, the
          header stays above, so the control that opened it is still on screen.
        </p>
      </Section>

      <Section title="The bar — three modes, one instance">
        <p>
          A bar that unmounts and remounts is three controls that happen to sit in one place. A bar
          that animates its width between contents is one control that changed shape, and the eye
          tracks it. It also means Send lands where the Agent button was — so that button is not
          replaced, it <strong className="text-foreground">becomes</strong> Send.
        </p>
        <BarModes />
      </Section>

      <Section title="The hairline is the grammar">
        <p>
          Everything LEFT of it is a destination. The one thing RIGHT of it is the agent, which is
          not a place you go — it is a layer raised over wherever you already are. Without the
          hairline the agent reads as a fifth section that never highlights.
        </p>
        <div>
          <Rule
            rule="3 by default, never by force"
            why="Most surfaces stop at three — everything that doesn't fit goes into a SEGMENT or the side menu, and nothing gets deleted to get there. The coordinator's bar runs four, deliberately: Operations turned out to be opened daily, not monthly, and a bar that hides a daily screen to protect a headcount is optimising the wrong thing. The test stays the same either way — a revamp that reaches its icon count by dropping surfaces is a redesign of a smaller product."
          />
          <Rule
            rule="BarAction has no `kind`"
            why="`Action` is the decision table and belongs on a PAGE, where the reader is choosing what to do. Everything in the bar is either somewhere to go or the agent, and neither is a decision with consequences."
          />
          <Rule
            rule="nothing destructive, ever"
            why={
              'Void, delete and revoke are `Action kind="danger"` on the surface that owns the record. ' +
              'A destructive control one slot from Map is the exact accident the danger variant exists to ' +
              'prevent — and the bar cannot signal it, because its whole grammar is that everything in it ' +
              'is safe to press.'
            }
          />
          <Rule
            rule="the bar hides, never unmounts"
            why="While the side menu is up the pill is faded out and disabled. Unmounting it would destroy the composer's input state and bring it back empty on return."
          />
        </div>
      </Section>

      <Section title="Segments — the cost of a short bar, paid once">
        <p>
          Work holds requests, jobs, dockets and exceptions; Money holds statements and buyers. That
          nesting is what a short bar costs, and this is where it is paid — in one control, rather
          than as a different tab strip on each screen.
        </p>
        <SegmentDemo />
        <div>
          <Rule
            rule="sections remember"
            why="Nesting costs a tap only if the bar forgets. Work returns you to the segment you were last on, so Map → Work → Dockets is one tap after the first visit, not two forever. Re-tapping the section you are already on resets it to the first segment — the way back to the default, at no cost in chrome."
          />
          <Rule
            rule="the segment, never the record"
            why="From /work/jobs/j_1, Work returns to the jobs list rather than to that job. Coming back to a section is 'where was I working', not 'reopen the row I had open'."
          />
        </div>
        <p>
          A segment is a <strong className="text-foreground">link, not a filter</strong>: each is its
          own route, so a coordinator can send someone a URL that lands on the exceptions list rather
          than on Work with instructions. A section MAY have segments — the hauler has none, and
          inventing some so the two roles looked symmetrical would be nesting for its own sake.
        </p>
      </Section>

      <Section title="The side menu — everything that is not a destination">
        <p>
          Whoever holds the screen, first: an avatar, a name, and a presence they set themselves —
          WhatsApp-style, online, busy or inactive, and never derived from a docket the way a driver's
          status on the fleet screens is. Below that, the account and whatever else does not belong in
          the bar. One slide from every surface. Full width over the card so the account button stays
          visible above it — which is what lets that one button be both the opener and the cross.
        </p>
        <MenuDemo />
        <p>
          No title inside the panel: the header already reads &ldquo;Menu&rdquo; while it is open,
          and repeating it six pixels below is the same word twice.
        </p>
      </Section>

      <Section title="One grammar: WHERE · WHAT · OWED">
        <p>
          Every surface that runs a business fills the same three slots with its own nouns. The
          label changes where the word changes — a yard says &ldquo;work&rdquo;, a contractor says
          &ldquo;orders&rdquo; — but the shape does not, which is what someone actually learns.
        </p>
        <p className="text-foreground">
          That matters because roles overlap: Saturn holds coordinator AND hauler simultaneously, and
          used to meet a bar that rearranged itself when they switched.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs">
            <thead>
              <tr className="border-b text-left">
                <th className="kicker py-2 font-normal">Role</th>
                <th className="kicker py-2 font-normal">Where</th>
                <th className="kicker py-2 font-normal">What</th>
                <th className="kicker py-2 font-normal">Owed</th>
                <th className="kicker py-2 font-normal">Surface</th>
                <th className="kicker py-2 font-normal">Agent</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                ['Coordinator', 'Map', 'Work', 'Money', 'desk', 'yes'],
                ['Hauler', 'Map', 'Work', 'Money', 'column', 'yes'],
                ['Contractor (buyer)', 'Map', 'Orders', 'Money', 'column', 'yes'],
                ['Worker', '—', 'Today · Summary', '—', 'phone', 'yes'],
              ].map((r) => (
                <tr key={r[0]} className="border-b last:border-b-0">
                  <td className="py-2.5 text-foreground">{r[0]}</td>
                  <td className="py-2.5">{r[1]}</td>
                  <td className="py-2.5">{r[2]}</td>
                  <td className="py-2.5">{r[3]}</td>
                  <td className="py-2.5">{r[4]}</td>
                  <td className={`py-2.5 ${r[5] === 'NO' ? 'text-primary' : ''}`}>{r[5]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          The worker breaks the grammar for a reason: a linear task surface, not a place to browse,
          so it has no &ldquo;what&rdquo; and no &ldquo;owed&rdquo; the way the desk surfaces do. The
          coordinator's Operations tab breaks it a different way — a fourth icon that is not a fourth
          slot, because it does not answer where/what/owed at all. It is a distinct grammar,
          fleet-management rather than the day's business, and it earned its own icon rather than a
          strained fit into one of the other three.
        </p>
      </Section>

      <Section title="`tap` is not a size preference">
        <p>
          The worker gets the identical frame, header, card, bar and side menu — at a 56px floor with
          the label rendered under each glyph. Every control on that surface is pressed one-handed,
          in sunlight, sometimes in gloves.
        </p>
        <TapDemo />
        <p>
          The alternative considered and rejected was leaving the worker on its own chrome. That is
          exactly how the four layouts came about, and the worker surface would then be last to get
          every fix.
        </p>
      </Section>

      <Section title="The agent — a layer, not a section">
        <p>
          A MODE means the surface stops being itself. A LAYER means the map is still there and the
          agent is superimposed. That only pays off with a half-open state, so there are two detents:
        </p>
        <div>
          <Rule
            rule="detent 1 — composer"
            why="The pill becomes the composer and the surface underneath is untouched. You type a line while still looking at the map."
          />
          <Rule
            rule="detent 2 — transcript"
            why="The conversation rises over the surface on the card's OWN fill, composited opaque. A conversation is a surface, not a scrim: at 86% glass its colour is whatever happened to be behind it."
          />
          <Rule
            rule="one control"
            why="The Agent button opens straight to detent 2 and closes the layer. Backdrop click or Esc drops to detent 1. Opening to a composer with no visible conversation was the bug this pattern fixes."
          />
        </div>
      </Section>

      <Section title="An answer is not a string">
        <p>
          Lifted from Syvon&apos;s <code>@syvon/mdx-chat</code>, where a reply is MDX compiled against
          an allowlisted component map: the agent writes prose, and inside it places real product
          components. That is worth more here than it is there.
        </p>
        <p className="text-foreground">
          &ldquo;Where is GPP 3106&rdquo; answered as a sentence is a claim the reader has to go and
          check. Answered as the actual card with the actual status, from the same fixture the map
          reads, it is the record. This product sells evidence — an agent that paraphrases the
          evidence into prose is working against it.
        </p>
        <Code>{`type AnswerBlock =
  | { kind: 'text';    text }              prose — connective tissue, never the evidence
  | { kind: 'callout'; tone, text }
  | { kind: 'figures'; items }             the same Stat the screens use
  | { kind: 'docket' | 'vehicle' | 'job' | 'exception' | 'order'; id }
  | { kind: 'goto';    href, label }       hands the reader back to the app
  | { kind: 'propose'; title, detail }     a row a human accepts`}</Code>
        <div>
          <Rule
            rule="records by ID, never by value"
            why="The renderer looks each one up in the same fixtures the screens read, so an answer cannot disagree with the surface underneath it."
          />
          <Rule
            rule="a missing record renders NOTHING"
            why="Not an empty card, not a placeholder. An agent that can draw a docket-shaped box around a number it invented is the one failure an evidence product cannot have — and a prompt is not where you stop it."
          />
          <Rule
            rule="an omitted renderer is a REFUSAL"
            why="The buyer app supplies `order` and nothing else, so an answer naming a vehicle silently drops rather than leaking the vendor's fleet into a contractor's app. One script format, two apps, two allowlists — and the allowlist lives on the app that would be doing the leaking."
          />
          <Rule
            rule="an unknown kind renders NOTHING"
            why="Never a crash. An answer is untrusted output and one unhandled block must not take the surface down with it — the same reason mdx-chat proxies its component map."
          />
        </div>
        <p className="pt-1">
          What is stubbed: there is no MDX compiler here, and adding one to fake a conversation is
          backend weight in a front-end phase. Swapping the stub for a compiler later changes how
          blocks are <em>produced</em>, not what they are.
        </p>
      </Section>

      <Section title="Proposal — the commit line, as a component">
        <p>
          Spec rule 5: the agent may never commit. A <code>Proposal</code> is a row a human accepts.
          Rendering it as a card with Accept and Discard is what makes that rule{' '}
          <strong className="text-foreground">visible rather than merely written down</strong>.
        </p>
        <ProposalDemo />
        <div>
          <Rule
            rule="Accept is `secondary`, not `primary`"
            why="A proposal is never the reason anyone opened the screen, an answer can carry more than one, and primary is capped at one per view. The emphasis stays with the surface that owns the record."
          />
          <Rule
            rule="accepting OPENS, it does not commit"
            why="The card says so in words. Every accept lands the reader on their own surface with the draft filled in."
          />
          <Rule
            rule="one exchange is a REFUSAL"
            why="Ask the coordinator's agent to close a docket and it declines, and says why. Scripted deliberately, and deliberately off the starter chips — a starter that invites the reader to ask for something they cannot have teaches the wrong thing. It is the one exchange that demonstrates the rule instead of asserting it, and it cannot quietly stop being true."
          />
        </div>
      </Section>

      <Section title="Things that will bite">
        <div>
          <Rule
            rule="nav tables carry NO 'use client'"
            why="A Server Component cannot read a client module's exports — they arrive as client references, not values, so a lookup in a layout reads undefined and the page 500s at render with nothing in the type system to warn you."
          />
          <Rule
            rule="segments are passed as DATA, not a resolver"
            why="The layout is a Server Component and a function cannot cross that boundary. Hence `{ section, items }` groups the shell matches against the path itself."
          />
          <Rule
            rule="fillPaths, not a context"
            why="A page renders INSIDE the shell and cannot reach up to tell it not to scroll. A context would work and would also decide the card's scroll behaviour a frame after the card is painted."
          />
          <Rule
            rule="a `fill` map must wait for its box"
            why="MapLibre sizes its canvas at construction. As a flex child that box may not have resolved on the frame the effect runs, and the map comes up blank. It also needs a ResizeObserver: opening the side menu or growing the sync banner changes the container with no window resize event."
          />
        </div>
      </Section>

      <Section title="Where the shell lives">
        <Code>{`packages/ui/src/system/shell.tsx      frame · header · card · side menu · segments
packages/ui/src/system/bar.tsx        the pill, its controls, the width measurer
packages/ui/src/system/chat.tsx       the turn machine + the answer renderer
packages/ui/src/system/app-shell.tsx  the one component that wires them together

packages/core/src/agent.ts            the block contract + the canned exchanges
apps/*/src/features/shell/nav.ts      what each surface's bar offers   (NO 'use client')
apps/*/src/features/shell/answers.tsx what each app lets the agent draw`}</Code>
        <p>
          The shell is in the LIBRARY, not in an app, for the same reason everything else is: both
          apps wear it, and the one that forked would be the one nobody looked at.
        </p>
      </Section>
    </SceneShell>
  );
}

// ── local helpers ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <SectionHeading className="mb-2">{title}</SectionHeading>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

/** A pill that looks like the real bar without being positioned like it. */
function Pill({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      className={`flex max-w-full items-center gap-2 p-2 ${wide ? 'w-full' : ''}`}
      style={{
        background: 'color-mix(in srgb, hsl(var(--background)) 70%, transparent)',
        backdropFilter: 'blur(20px)',
        border: '1px solid color-mix(in srgb, hsl(var(--foreground)) 8%, transparent)',
        borderRadius: 32,
      }}
    >
      {children}
    </div>
  );
}

function Stage({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Kicker className="mb-2">{label}</Kicker>
      <div
        className="flex items-center justify-center rounded-[20px] px-4 py-6"
        style={{ background: CARD_FILL }}
      >
        {children}
      </div>
    </div>
  );
}

/** The three modes, side by side — the one thing a paragraph cannot show. */
function BarModes() {
  const [draft, setDraft] = useState('Where is GPP 3106?');
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Stage label="sections">
        <Pill>
          <div className="flex items-center gap-1">
            <BarAction icon="pin_drop" label="Map" active />
            <BarAction icon="assignment" label="Work" />
            <BarAction icon="payments" label="Money" />
            <BarDivider />
            <BarAction icon="neurology" label="Agent" variant="plain" />
          </div>
        </Pill>
      </Stage>

      <Stage label="chat">
        <Pill wide>
          <div className="flex w-full min-w-0 items-center gap-2">
            <BarAction icon="chevron_left" label="Back to sections" variant="plain" active />
            <BarInput
              value={draft}
              onChange={setDraft}
              onSubmit={() => {}}
              placeholder="Ask about a plate…"
            />
            <BarAction icon="arrow_upward" label="Send" />
          </div>
        </Pill>
      </Stage>

      <Stage label="isolate">
        <Pill>
          <div className="flex items-center gap-1">
            <BarAction icon="arrow_back" label="Back to today" variant="plain" />
            <BarDivider />
            <BarAction icon="neurology" label="Agent" variant="plain" />
          </div>
        </Pill>
      </Stage>
    </div>
  );
}

function SegmentDemo() {
  const [at, setAt] = useState('/work/dockets');
  return (
    <div className="overflow-hidden rounded-[20px]" style={{ background: CARD_FILL }}>
      <Segments
        items={[
          { key: '/work/requests', label: 'Requests', badge: 1 },
          { key: '/work/jobs', label: 'Jobs' },
          { key: '/work/dockets', label: 'Dockets' },
          { key: '/work/exceptions', label: 'Exceptions', badge: 4 },
        ]}
        active={at}
        onSelect={setAt}
      />
      <p className="px-4 pb-4 pt-2 text-xs text-muted-foreground lg:px-6">
        <code>{at}</code> — its own route, not a filter.
      </p>
    </div>
  );
}

function MenuDemo() {
  const [presence, setPresence] = useState<Presence>('online');
  return (
    <div className="rounded-[20px] px-2 py-3" style={{ background: CARD_FILL }}>
      <div className="mx-auto max-w-md">
        <SideMenuProfile
          name="Saturn Mining & Haulage"
          role="Coordinator"
          presence={presence}
          onPresenceChange={setPresence}
        />
        <SideMenuGroup label="Account">
          <SideMenuItem icon="apartment" label="Saturn Mining & Haulage" sub="Coordinator · Saturn holds this and Hauler" />
        </SideMenuGroup>
        <SideMenuGroup>
          <SideMenuItem icon="science" label="Sandbox" />
        </SideMenuGroup>
        <SideMenuGroup>
          <SideMenuItem icon="logout" label="Log out" danger />
        </SideMenuGroup>
      </div>
    </div>
  );
}

function TapDemo() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Stage label="lg — desk and column">
        <Pill>
          <div className="flex items-center gap-1">
            <BarAction icon="today" label="Today" active />
            <BarAction icon="done_all" label="Summary" />
            <BarDivider />
            <BarAction icon="neurology" label="Agent" variant="plain" />
          </div>
        </Pill>
      </Stage>
      <Stage label="tap — 56px floor, labels rendered">
        <Pill>
          <div className="flex items-center gap-1">
            <BarAction icon="today" label="Today" size="tap" active />
            <BarAction icon="done_all" label="Summary" size="tap" />
            <BarDivider />
            <BarAction icon="neurology" label="Agent" size="tap" variant="plain" />
          </div>
        </Pill>
      </Stage>
    </div>
  );
}

/** A specimen of every block the renderer owns, in one answer. */
function ProposalDemo() {
  const [taken, setTaken] = useState<string | null>(null);
  return (
    <div className="space-y-3 rounded-[20px] p-4" style={{ background: CARD_FILL }}>
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl bg-muted/50 px-3.5 py-2 text-sm text-foreground">
          What is open on exceptions?
        </p>
      </div>

      <p className="text-sm leading-relaxed text-foreground">Four open. They fall into two groups.</p>

      <div className="grid grid-cols-2 overflow-hidden rounded-lg border sm:grid-cols-3">
        <Stat label="Position disputed" value="2" sub="geofence vs GPS" />
        <Stat label="Evidence missing" value="1" sub="no dump photo" />
        <Stat label="Unused number" value="1" sub="block gap" />
      </div>

      {taken ? (
        <div className="rounded-lg border border-dashed px-3.5 py-3 text-xs text-muted-foreground">
          {taken === 'accepted'
            ? 'Handed to you — nothing has been committed. It is yours to send.'
            : 'Discarded. Nothing was written.'}
        </div>
      ) : (
        <div className="rounded-lg border px-3.5 py-3">
          <Kicker>Draft · not sent</Kicker>
          <p className="mt-1.5 text-sm text-foreground">
            Widen the Eccles Block C boundary by <Num>40</Num> m
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Would clear both disputes and stop the pair recurring on tomorrow&apos;s runs. It also
            loosens the check that produced them — which is why it is yours to decide, not mine.
          </p>
          <div className="mt-3 flex items-center gap-2 border-t pt-3">
            <Action
              kind="secondary"
              size="sm"
              icon="open_in_new"
              onClick={() => setTaken('accepted')}
            >
              Accept and open Sites
            </Action>
            <Action kind="ghost" size="sm" onClick={() => setTaken('discarded')}>
              Discard
            </Action>
          </div>
        </div>
      )}

      {taken && (
        <button
          type="button"
          onClick={() => setTaken(null)}
          className="text-xs text-muted-foreground underline hover:text-foreground"
        >
          Reset the specimen
        </button>
      )}
    </div>
  );
}
