import { Badge, Button, Icon, Num, PageHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@gaia/ui';
import { STATEMENTS, orgName, gyd } from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * §3 `/(coordinator)/statements` — per counterparty, per period, ready to pay against.
 *
 * A statement is a docket COUNT multiplied by a rate, and it has to be checkable
 * against the operator's own record — §"Hauler" gives them an independent list
 * for exactly this reason. So the count is a first-class column rather than a
 * detail behind the total: two parties reconciling a disagreement compare
 * counts first and money second.
 */
export default function StatementsPage() {
  return (
    <>
      <PageHead
        description="What each counterparty is owed, or owes, for a period."
        actions={<Button>
            <Icon name="event" size={16} />
            New period
          </Button>}
      />

      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Counterparty</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Dockets</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {STATEMENTS.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{orgName(s.counterpartyOrgId)}</TableCell>
                <TableCell className="text-muted-foreground">
                  <Num>
                    {s.periodStart} → {s.periodEnd}
                  </Num>
                </TableCell>
                <TableCell className="text-right">
                  <Num>{s.docketCount}</Num>
                </TableCell>
                <TableCell className="text-right">
                  <Num>{gyd(s.total)}</Num>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      s.status === 'paid' ? 'secondary' : s.status === 'issued' ? 'outline' : 'ghost'
                    }
                    className="capitalize"
                  >
                    {s.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost">
                    Open
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <p className="mt-4 text-xs text-muted-foreground">
          Same-day payout on a closed docket is a later phase — Gaia instructs the transfer and
          never holds the money.
        </p>
      </div>
    </>
  );
}
