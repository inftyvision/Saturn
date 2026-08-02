'use client';

import {
  Action,
  ActionBar,
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  Fact,
  Icon,
  IconAction,
  Input,
  Kicker,
  Menu,
  Meta,
  Num,
  BigNum,
  Person,
  Phone,
  PageTitle,
  ProfileButton,
  Row,
  SectionHeading,
  SLOT_FILL,
  Stat,
  StatStrip,
  Status,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ItemTitle,
} from '@gaia/ui';
import { SceneShell } from '../_components/chrome';

export const dynamic = 'force-dynamic';

/**
 * The component catalogue.
 *
 * Every screen in both apps composes from this list. It exists because the
 * alternative — each screen styling its own buttons, cards and headings —
 * produced four treatments of the same thing and no way to notice.
 *
 * The rule: a screen composes `system/`. If it styles something by hand, that
 * is a gap in the library, and the fix goes HERE, not in the screen.
 */
export default function ComponentsScene() {
  return (
    <SceneShell title="Components" status="@gaia/ui — both apps compose from this">
      <Group
        title="Type"
        rule="A label ABOVE a group is a kicker. A title OF a thing is a title. Mono is for figures only — never body, never buttons."
      >
        <Spec name="PageTitle">
          <PageTitle>Yarrowkabra — White sand</PageTitle>
        </Spec>
        <Spec name="SectionHeading" note="an <h2>, kicker treatment">
          <SectionHeading>Waiting on you</SectionHeading>
        </Spec>
        <Spec name="Kicker" note="labels a field, not a group">
          <Kicker>Outstanding</Kicker>
        </Spec>
        <Spec name="ItemTitle" note="NOT a kicker — it is the content">
          <ItemTitle>Saturn Mining &amp; Haulage</ItemTitle>
        </Spec>
        <Spec name="Meta">
          <Meta>GRR 4471 · Ravi Persaud · loaded 11:14</Meta>
        </Spec>
        <Spec name="Num" note="mono + tabular; every figure in a column">
          <div className="space-y-0.5">
            <Num>4518</Num>
            <br />
            <Num>G$37,000</Num>
            <br />
            <Num>GRR 4471</Num>
          </div>
        </Spec>
        <Spec name="BigNum" note="one per screen, maximum">
          <BigNum>17</BigNum>
        </Spec>
      </Group>

      <Group
        title="Actions"
        rule="primary = the one thing this screen is for (max one). secondary = a real alternative. ghost = navigation and dismissal. danger = anything that voids, deletes or revokes — always, even when it reads as routine."
      >
        <Spec name="Action">
          <ActionBar className="justify-start">
            <Action kind="primary">Send quote</Action>
            <Action kind="secondary">Accept fewer</Action>
            <Action kind="ghost">Cancel</Action>
            <Action kind="danger" icon="block">
              Void docket
            </Action>
          </ActionBar>
        </Spec>
        <Spec name="Action tap" note="56px floor — gloves, sunlight, one thumb">
          <div className="max-w-[300px]">
            <Action kind="primary" full tap icon="photo_camera">
              Take photo
            </Action>
          </div>
        </Spec>
        <Spec name="IconAction" note="always labelled — never a bare glyph">
          <div className="flex gap-1">
            <IconAction icon="call" label="Call" />
            <IconAction icon="chat" label="WhatsApp" />
            <IconAction icon="edit" label="Edit" />
            <IconAction icon="delete" label="Void" tone="danger" />
          </div>
        </Spec>
        <Spec name="Menu" note="the overflow for actions that do not earn a button">
          <Menu
            items={[
              { label: 'Export CSV', icon: 'download' },
              { label: 'Reissue', icon: 'refresh' },
              { label: 'Void', icon: 'block', kind: 'danger' },
            ]}
          />
        </Spec>
      </Group>

      <Group
        title="Status"
        rule="ONE vocabulary for every entity. settled is QUIET — a closed docket is the normal case and there will be four hundred; making the common state shout leaves nothing to signal the exception."
      >
        <Spec name="Status">
          <div className="flex flex-wrap gap-1.5">
            {['in_transit', 'closed', 'quoted', 'draft', 'voided', 'expired', 'verified', 'paid'].map(
              (s) => (
                <Status key={s} state={s} />
              ),
            )}
          </div>
        </Spec>
        <Spec name="SLOT_FILL" note="the same tones as grid cells">
          <div className="flex gap-1">
            {Object.entries(SLOT_FILL).map(([k, cls]) => (
              <div
                key={k}
                className={`flex h-11 w-14 flex-col items-center justify-center rounded text-[10px] ${cls}`}
              >
                <span className="figure">09:40</span>
                <span className="opacity-70">{k}</span>
              </div>
            ))}
          </div>
        </Spec>
      </Group>

      <Group
        title="People"
        rule="Contact actions belong on OPS surfaces only — a coordinator calls a driver. A worker does not call themselves, and the buyer app never shows the vendor's fleet. Pass a phone only where somebody has a reason to dial."
      >
        <Spec name="Avatar" note="initials, deterministic colour, no photo slot">
          <div className="flex gap-2">
            {['Ravi Persaud', 'Devon Adams', 'Shivnarine Bhola', 'Andre Khan'].map((n) => (
              <Avatar key={n} name={n} size={34} />
            ))}
          </div>
        </Spec>
        <Spec name="Person">
          <Person name="Ravi Persaud" sub="GRR 4471 · 3 loads done" />
        </Spec>
        <Spec name="Person + phone" note="ops only">
          <Person name="Devon Adams" sub="Driver" phone="+592 641 9022" />
        </Spec>
        <Spec name="Phone">
          <Phone phone="+592 612 4471" name="Ravi Persaud" />
        </Spec>
        <Spec name="ProfileButton" note="app chrome — you, rendered like everyone else">
          <ProfileButton name="Andre Khan" role="Coordinator" />
        </Spec>
      </Group>

      <Group
        title="Cards"
        rule="One anatomy: kicker · title · meta · status top-right · actions bottom-right. A card is a LINK or it has ACTIONS — never both, because a clickable card with buttons is a coin toss about what a tap does."
      >
        <Spec name="Card">
          <Card
            kicker="Docket 4516"
            title="White sand → Eccles Block C"
            meta="GRR 4471 · Ravi Persaud · loaded 11:14"
            status={<Status state="in_transit" />}
            footer="±9 m"
            actions={<Action kind="ghost" size="sm">Open</Action>}
          />
        </Spec>
        <Spec name="Card href" note="whole card is the target">
          <Card
            kicker="Order"
            title="20 loads of White sand"
            meta="Eccles Housing Scheme — Block C"
            status={<Status state="in_progress" />}
            href="/jobs"
          />
        </Spec>
        <Spec name="Row" note="dense lists where a table is too heavy">
          <div className="divide-y">
            <Row
              leading={<Icon name="check_circle" size={18} className="text-primary" />}
              title={<Num>4511</Num>}
              meta="GRR 4471 · dumped 11:10"
              trailing={<Num className="text-xs text-muted-foreground">G$37,000</Num>}
            />
            <Row
              leading={<Icon name="check_circle" size={18} className="text-primary" />}
              title={<Num>4512</Num>}
              meta="GWW 1120 · dumped 11:21"
              trailing={<Num className="text-xs text-muted-foreground">G$37,000</Num>}
            />
          </div>
        </Spec>
        <Spec name="Stat / StatStrip" note="four across, maximum">
          <StatStrip>
            <Stat label="Closed today" value="17" sub="counted" />
            <Stat label="In flight" value="2" sub="not yet counted" />
            <Stat label="By hand" value="12%" sub="of closed" tone="warn" />
            <Stat label="Value" value="G$629,000" />
          </StatStrip>
        </Spec>
        <Spec name="Empty" note="always says what would be here AND what puts it there">
          <Empty
            title="Nothing on the way"
            hint="Ordering takes about a minute."
            action={<Action kind="primary" size="sm">Order material</Action>}
          />
        </Spec>
        <Spec name="Fact">
          <div className="rounded-lg border">
            <Fact label="Material" value="White sand" />
            <Fact label="Pit" value="Yarrowkabra Sand Pit" sub="Loading 08:00–17:00" />
          </div>
        </Spec>
      </Group>

      <Group title="Primitives" rule="Reached for directly only for form controls and tables.">
        <Spec name="Button variants" note="prefer Action — it encodes the decision">
          <div className="flex flex-wrap gap-2">
            {(['default', 'secondary', 'outline', 'ghost', 'destructive'] as const).map((v) => (
              <Button key={v} variant={v} size="sm">
                {v}
              </Button>
            ))}
          </div>
        </Spec>
        <Spec name="Badge">
          <div className="flex gap-1.5">
            {(['default', 'secondary', 'outline', 'ghost', 'destructive'] as const).map((v) => (
              <Badge key={v} variant={v}>
                {v}
              </Badge>
            ))}
          </div>
        </Spec>
        <Spec name="Input">
          <div className="max-w-[260px]">
            <Input placeholder="+592 …" />
          </div>
        </Spec>
        <Spec name="Table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Num>4516</Num>
                </TableCell>
                <TableCell>
                  <Num>GRR 4471</Num>
                </TableCell>
                <TableCell>
                  <Status state="in_transit" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Spec>
      </Group>

      <Group
        title="Map"
        rule="Positions are DERIVED from live dockets, never stored separately — a map whose markers disagree with the docket feed is worse than no map. No routing and no ETAs drawn on it: a map that draws a road implies it knows the traffic."
      >
        <Spec name="FleetMap" note="see /map for the live one">
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
            Rendered on /map, /jobs/[id], /job/[id]/transit and the buyer&apos;s order page
          </div>
        </Spec>
      </Group>
    </SceneShell>
  );
}

function Group({ title, rule, children }: { title: string; rule: string; children: React.ReactNode }) {
  return (
    <section>
      <SectionHeading>{title}</SectionHeading>
      <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">{rule}</p>
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

function Spec({ name, note, children }: { name: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border">
      <div className="flex items-baseline justify-between gap-3 border-b px-3 py-2">
        <code className="figure text-xs text-foreground">{name}</code>
        {note && <span className="text-[11px] text-muted-foreground">{note}</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
