import { Button, Icon, IconWarning, Num, PageHead, Person, Stat, Status, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@gaia/ui';
import {
  DOCKETS,
  COORDINATOR_ORG,
  vehiclePlate,
  driver as findDriver,
  clock,
  gyd,
  DAY,
} from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * §3 `/(hauler)/dockets` — "the independent count they check the coordinator's
 * statement against."
 *
 * The spec calls this the reason an operator adopts the app instead of the
 * paper book, and it is the only screen in the product whose job is to let
 * someone DISAGREE with the coordinator. That shapes it:
 *
 *   · The count and the money are stated at the top, in the operator's own
 *     terms, so they can be compared to a statement without arithmetic.
 *   · Every docket is listed including voided ones, with the reason. A record
 *     that quietly drops rows is not a record you can check anything against.
 *   · Overrides are marked here too. If the coordinator later queries a docket,
 *     the operator should already know which ones are contestable.
 *
 * Export exists because the operator's accountant does not have a login.
 */
export default function HaulerDocketsPage() {
  const mine = DOCKETS.filter((d) => d.haulerOrgId === COORDINATOR_ORG);
  const counted = mine.filter((d) => d.status === 'closed' && !d.voided);
  const owed = counted.reduce((sum, d) => sum + d.ratePerLoad, 0);
  const overrides = counted.filter((d) => d.manualOverride).length;

  return (
    <>
      <PageHead
        description="Your own record. Check it against what the coordinator sends you."
        actions={<Button variant="secondary">
            <Icon name="download" size={16} />
            Export CSV
          </Button>}
      />

      <div className="grid grid-cols-2 border-b lg:grid-cols-4">
        <Stat label="Counted" value={String(counted.length)} sub={DAY} />
        <Stat label="Value" value={gyd(owed)} sub="at card rates" />
        <Stat label="Voided" value={String(mine.filter((d) => d.voided).length)} sub="with reason" />
        <Stat
          label="Flagged"
          value={String(overrides)}
          sub="taken by hand"
          tone={overrides ? 'warn' : 'default'}
        />
      </div>

      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">No.</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Loaded</TableHead>
              <TableHead>Dumped</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...mine].reverse().map((d) => {
              const dr = findDriver(d.driverId);
              return (
                <TableRow key={d.id}>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5">
                      <Num className={d.voided ? 'line-through opacity-50' : ''}>{d.number}</Num>
                      {d.manualOverride && <IconWarning size={13} className="text-primary" />}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Num>{vehiclePlate(d.vehicleId)}</Num>
                  </TableCell>
                  <TableCell>
                    <Person name={dr?.name ?? '—'} phone={dr?.phone} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <Num>{clock(d.loadedAt)}</Num>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <Num>{clock(d.dumpedAt)}</Num>
                  </TableCell>
                  <TableCell className="text-right">
                    <Num className={d.voided ? 'opacity-50' : ''}>{gyd(d.ratePerLoad)}</Num>
                  </TableCell>
                  <TableCell>
                    <Status state={d.voided ? 'voided' : d.status} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <p className="mt-4 text-xs text-muted-foreground">
          Voided dockets stay listed with their reason — a corrected load is a void plus a reissue,
          never an edit. Numbers are never reused.
        </p>
      </div>
    </>
  );
}
