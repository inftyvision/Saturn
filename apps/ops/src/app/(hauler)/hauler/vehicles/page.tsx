import { Badge, Button, Icon, Num, PageHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@gaia/ui';
import Link from 'next/link';
import {
  VEHICLES,
  DRIVERS,
  DOCKETS,
  COORDINATOR_ORG,
  vehicleClassLabel,
  gyd,
  rateFor,
} from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * §3 `/(hauler)/vehicles` — my vehicles and drivers.
 *
 * The hauler's view of its own fleet, and the one place the class→rate link is
 * visible from the earning side rather than the pricing side. A hauler deciding
 * whether to put a tandem or a 6×4 on a job is comparing rate against what the
 * vehicle costs to run, and that comparison should not require a second screen.
 */
export default function HaulerVehiclesPage() {
  const mine = VEHICLES.filter((t) => t.orgId === COORDINATOR_ORG);
  const driverFor = (vehicleId: string) => DRIVERS.find((d) => d.vehicleId === vehicleId);
  const loadsFor = (vehicleId: string) =>
    DOCKETS.filter((d) => d.vehicleId === vehicleId && d.status === 'closed' && !d.voided).length;

  return (
    <>
      <PageHead
        description="Class sets what each load earns."
        actions={<Button variant="secondary">
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
              <TableHead>Driver</TableHead>
              <TableHead className="text-right">Loads today</TableHead>
              <TableHead className="text-right">Earned today</TableHead>
              <TableHead>State</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mine.map((t) => {
              const loads = loadsFor(t.id);
              const d = driverFor(t.id);
              return (
                <TableRow key={t.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/admin/vehicles/${t.id}`} className="hover:text-primary">
                      <Num>{t.plate}</Num>
                    </Link>
                  </TableCell>
                  <TableCell>{vehicleClassLabel(t.class)}</TableCell>
                  <TableCell className="text-muted-foreground">{d?.name ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <Num>{loads || '—'}</Num>
                  </TableCell>
                  <TableCell className="text-right">
                    <Num>{loads ? gyd(loads * rateFor(t.class)) : '—'}</Num>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.active ? 'outline' : 'ghost'}>
                      {t.active ? 'Active' : 'Off road'}
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
