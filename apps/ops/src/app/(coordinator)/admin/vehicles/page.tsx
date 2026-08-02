import { Badge, Button, Icon, Num, PageHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@gaia/ui';
import Link from 'next/link';
import { VEHICLES, orgName, vehicleClassLabel, gyd, rateFor, DOCKETS } from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * §3 `/(coordinator)/admin/vehicles`.
 *
 * Class is not a description here — §12 says the vehicle class IS the price tier,
 * so changing a vehicle's class changes what every future docket of its is worth.
 * The rate is shown on the row for that reason rather than hidden on the rate
 * card: an admin editing a class should see the money move.
 *
 * `org` matters even though every row is Saturn's today. §12 rule 2: an
 * assignment links a job owned by org A to a vehicle owned by org B, and the
 * column exists so nobody builds a screen that assumes otherwise.
 */
export default function VehiclesPage() {
  const loadsFor = (id: string) =>
    DOCKETS.filter((d) => d.vehicleId === id && d.status === 'closed' && !d.voided).length;

  return (
    <>
      <PageHead
        description="Class sets the rate. Changing it changes what future dockets are worth."
        actions={<Button>
            <Icon name="add" size={16} />
            Add vehicle
          </Button>}
      />

      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plate</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-right">Rate / load</TableHead>
              <TableHead className="text-right">Loads today</TableHead>
              <TableHead>State</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {VEHICLES.map((t) => (
              <TableRow key={t.id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/admin/vehicles/${t.id}`} className="hover:text-primary">
                    <Num>{t.plate}</Num>
                  </Link>
                </TableCell>
                <TableCell>{vehicleClassLabel(t.class)}</TableCell>
                <TableCell className="text-muted-foreground">{orgName(t.orgId)}</TableCell>
                <TableCell className="text-right">
                  <Num>{gyd(rateFor(t.class))}</Num>
                </TableCell>
                <TableCell className="text-right">
                  <Num>{loadsFor(t.id) || '—'}</Num>
                </TableCell>
                <TableCell>
                  <Badge variant={t.active ? 'outline' : 'ghost'}>
                    {t.active ? 'Active' : 'Off road'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
