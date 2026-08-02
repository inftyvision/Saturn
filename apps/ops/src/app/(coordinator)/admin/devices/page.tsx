import { Badge, Button, Icon, IconWarning, Num, PageHead, Person, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@gaia/ui';
import { DEVICES, driver, clock } from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * §3 `/(coordinator)/admin/devices`.
 *
 * Two columns here are operational, not informational.
 *
 * **Numbers left** is §5's block state. A phone below the refill threshold that
 * cannot reach the server has a hard ceiling on how many more loads it can
 * record — the driver keeps working and simply runs out of dockets at the pit.
 * The coordinator needs to see that coming.
 *
 * **Last sync** is how long the office has been blind to that vehicle. §15 makes
 * offline normal, so a stale row is not an alarm by itself; a stale row on a
 * phone with four numbers left is.
 */
export default function DevicesPage() {
  return (
    <>
      <PageHead
        description="Company handsets. Nothing depends on device control — subcontractors will bring their own."
        actions={<Button>
            <Icon name="confirmation_number" size={16} />
            Issue block
          </Button>}
      />

      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Number block</TableHead>
              <TableHead className="text-right">Left</TableHead>
              <TableHead>Last sync</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DEVICES.map((d) => {
              const low = d.blockRemaining < 15;
              const dr = driver(d.driverId);
              return (
                <TableRow key={d.id}>
                  <TableCell>
                    <Person name={dr?.name ?? '—'} phone={dr?.phone} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    Android {d.osVersion}
                  </TableCell>
                  <TableCell>
                    <Num className="text-muted-foreground">{d.blockRange}</Num>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1.5">
                      {low && <IconWarning size={14} className="text-primary" />}
                      <Num className={low ? 'text-primary' : ''}>{d.blockRemaining}</Num>
                    </span>
                  </TableCell>
                  <TableCell>
                    {d.lastSyncAt ? (
                      <Num className="text-muted-foreground">{clock(d.lastSyncAt)}</Num>
                    ) : (
                      <Badge variant="outline">Never</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <p className="mt-4 text-xs text-muted-foreground">
          Blocks refill below 15 remaining and expire after 7 days unused. An expired block is
          retired, never reissued.
        </p>
      </div>
    </>
  );
}
