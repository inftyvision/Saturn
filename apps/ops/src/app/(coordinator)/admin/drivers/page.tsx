import { Badge, Button, Icon, Num, PageHead, Person, Status, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@gaia/ui';
import Link from 'next/link';
import { DRIVERS, vehiclePlate, driverStatus, DAY } from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * §3 `/(coordinator)/admin/drivers`.
 *
 * Licence expiry is surfaced as a state rather than a date column you have to
 * read. §12 carries `licence_expiry` and the pack interface list carries a
 * `ComplianceCheck` — an expired licence is the sort of thing that should stop
 * an assignment, and the screen should make it visible long before it does.
 */
export default function DriversPage() {
  const today = new Date(DAY).getTime();
  const days = (d: string) => Math.round((new Date(d).getTime() - today) / 86_400_000);

  return (
    <>
      <PageHead
        description="One driver runs one job at a time."
        actions={<Button>
            <Icon name="add" size={16} />
            Add driver
          </Button>}
      />

      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned vehicle</TableHead>
              <TableHead>Licence</TableHead>
              <TableHead>Expiry</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DRIVERS.map((d) => {
              const left = days(d.licenceExpiry);
              const soon = left < 60;
              return (
                <TableRow key={d.id}>
                  <TableCell>
                    {/* The row is identity + contact here, not a link — the
                        plate cell below is where this driver's record opens.
                        Never both on the same element: a Person carrying call
                        and WhatsApp actions can't also be the click target,
                        the same rule Card enforces for href vs. actions. */}
                    <Person name={d.name} phone={d.phone} />
                  </TableCell>
                  <TableCell>
                    <Status state={driverStatus(d.id)} />
                  </TableCell>
                  <TableCell>
                    {d.vehicleId ? (
                      <Link href={`/admin/vehicles/${d.vehicleId}`} className="hover:text-primary">
                        <Num>{vehiclePlate(d.vehicleId)}</Num>
                      </Link>
                    ) : (
                      <Num>—</Num>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <Num>{d.licenceNo}</Num>
                  </TableCell>
                  <TableCell>
                    <Badge variant={soon ? 'outline' : 'ghost'}>
                      {soon ? `${left} days` : d.licenceExpiry}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
