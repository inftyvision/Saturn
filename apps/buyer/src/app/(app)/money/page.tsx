import {
  Badge,
  BigNum,
  Kicker,
  Meter,
  Num,
  Page,
  Section,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@gaia/ui';
import { STATEMENTS, gyd, orgName, BUYER_ACCOUNT, BUYER_ORG } from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * Money — what is outstanding, the statements behind it, and what has been paid.
 *
 * Split out of `/account`, which used to hold this AND the list of people on
 * the account. Those are two different frequencies: a balance is checked
 * weekly, and who can see the orders is checked when somebody joins. Putting
 * them on one page meant the weekly thing was a scroll past the annual one.
 *
 * **Gaia does not process payments** and this screen must never imply it does.
 * Payment history is what the coordinator has RECORDED, phrased that way, and
 * there is no pay button — the money moves between the contractor and the yard
 * exactly as it did before. Taking a cut of that flow would make the platform a
 * payment facilitator, with Bank of Guyana licensing and AML obligations
 * attached; that is a deliberate business decision and the UI has to honour it.
 *
 * A statement is a docket COUNT times a rate, so the count is a column rather
 * than a detail. Two parties reconciling compare counts first and money second,
 * and the buyer holds the same docket list the coordinator does.
 */
export default function BuyerMoneyPage() {
  const statements = STATEMENTS.filter((s) => s.counterpartyOrgId === BUYER_ORG);

  return (
    <Page phone>
      <div className="pb-6">
        <Kicker>Outstanding</Kicker>
        <div className="mt-1">
          <BigNum>{gyd(BUYER_ACCOUNT.balance)}</BigNum>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Next statement {BUYER_ACCOUNT.nextStatement} · {BUYER_ACCOUNT.termsDays} day terms
        </p>

        <div className="mt-4">
          <Meter
            value={BUYER_ACCOUNT.balance}
            max={BUYER_ACCOUNT.creditLimit}
            caption={
              <>
                <Num>{gyd(BUYER_ACCOUNT.creditLimit - BUYER_ACCOUNT.balance)}</Num> of your{' '}
                <Num>{gyd(BUYER_ACCOUNT.creditLimit)}</Num> limit available
              </>
            }
          />
        </div>
      </div>

      <Section
        title="Statements"
        hint="Every load on a statement has a docket with two photographs behind it. Open any order to check them."
        phone
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Loads</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {statements.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <Num className="text-sm">{s.periodStart.slice(0, 7)}</Num>
                </TableCell>
                <TableCell className="text-right">
                  <Num>{s.docketCount}</Num>
                </TableCell>
                <TableCell className="text-right">
                  <Num>{gyd(s.total)}</Num>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={s.status === 'paid' ? 'ghost' : 'outline'} className="capitalize">
                    {s.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section
        title="Payments"
        hint={`As recorded by ${orgName(BUYER_ACCOUNT.coordinatorOrgId)}. Payment is settled directly with them — this app never handles money.`}
        divider={false}
        phone
      >
        <ul className="divide-y">
          <li className="flex justify-between py-2.5 text-sm">
            <span className="text-muted-foreground">2026-07-15 · bank transfer</span>
            <Num>{gyd(12_000_000)}</Num>
          </li>
          <li className="flex justify-between py-2.5 text-sm">
            <span className="text-muted-foreground">2026-06-14 · cheque</span>
            <Num>{gyd(9_450_000)}</Num>
          </li>
        </ul>
      </Section>
    </Page>
  );
}
