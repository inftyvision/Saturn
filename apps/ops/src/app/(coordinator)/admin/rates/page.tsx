import { Button, Icon, Num, PageHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@gaia/ui';
import { RATE_CARD, VEHICLES, vehicleClassLabel, gyd } from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * §3 `/(coordinator)/admin/rates` — the rate card.
 *
 * §12: vehicle class is an enum and it IS the price tier. So this is a five-row
 * table and always will be — a per-vehicle rate would put pricing on the fleet
 * record instead, where it could drift between two identical vehicles and turn a
 * statement dispute into an argument about which row was right.
 *
 * A docket freezes its rate at issue (`Docket.rate_per_load` in §12). Editing
 * here changes what future dockets are worth and nothing already counted.
 */
export default function RatesPage() {
  const fleetCount = (c: string) => VEHICLES.filter((t) => t.class === c && t.active).length;

  return (
    <>
      <PageHead
        description="Per load, by vehicle class. Dockets keep the rate they were issued at."
        actions={<Button>
            <Icon name="save" size={16} />
            Save card
          </Button>}
      />

      <div className="max-w-2xl p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead className="text-right">Active vehicles</TableHead>
              <TableHead className="text-right">Rate per load</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {RATE_CARD.map((r) => (
              <TableRow key={r.class}>
                <TableCell>{vehicleClassLabel(r.class)}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  <Num>{fleetCount(r.class) || '—'}</Num>
                </TableCell>
                <TableCell className="text-right">
                  <Num>{gyd(r.ratePerLoad)}</Num>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <p className="mt-4 text-xs text-muted-foreground">
          Money is held in whole Guyanese dollars. There are no fractional rates and no rounding
          step between a docket and a statement.
        </p>
      </div>
    </>
  );
}
