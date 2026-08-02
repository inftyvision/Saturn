import { Badge, Button, Icon, Num, PageHead, Person, SectionHeading, Stat, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@gaia/ui';
import { gyd, orgName, materialName } from '@gaia/core';
import { BUYER_ACCOUNT, BUYER_USERS, BUYER_SITES, ORDERS, deliveredFor } from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * Buyer accounts — who can order, on what terms.
 *
 * The invite list is the access-control surface for the whole buyer app.
 * Buyers do not self-register, because an account implies credit terms; this is
 * where that decision is actually made, so the credit limit belongs beside the
 * invite rather than in a settings page nobody opens.
 *
 * Sites are listed here too, and specifically the UNCONFIRMED ones — the
 * coordinator drawing that polygon is a blocking step for the buyer's first
 * delivery, and it is easy to leave undone because nothing on the ops side
 * fails until a job tries to dispatch.
 */
export default function BuyersPage() {
  const unconfirmed = BUYER_SITES.filter((s) => !s.polygonConfirmed);
  const orders = ORDERS.filter((o) => o.status !== 'draft');
  const lifetime = orders.reduce((sum, o) => sum + deliveredFor(o) * 37_000, 0);

  return (
    <>
      <PageHead
        description="Who can order on account, and on what terms."
        actions={<Button>
            <Icon name="person_add" size={16} />
            Invite buyer
          </Button>}
      />

      <div className="grid grid-cols-2 border-b lg:grid-cols-4">
        <Stat label="Accounts" value="1" sub="active" />
        <Stat label="Outstanding" value={gyd(BUYER_ACCOUNT.balance)} />
        <Stat label="Limit" value={gyd(BUYER_ACCOUNT.creditLimit)} sub={`${BUYER_ACCOUNT.termsDays} day terms`} />
        <Stat
          label="Sites to draw"
          value={String(unconfirmed.length)}
          sub="blocking first delivery"
          tone={unconfirmed.length ? 'warn' : 'default'}
        />
      </div>

      <section className="px-6 py-5">
        <SectionHeading>{orgName(BUYER_ACCOUNT.buyerOrgId)}</SectionHeading>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {BUYER_ACCOUNT.statementPeriod} statements · lifetime <Num>{gyd(lifetime)}</Num>
        </p>

        <div className="mt-4">
          <p className="kicker mb-2">Users</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {BUYER_USERS.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Person name={u.name} sub={u.role} phone={u.phone} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.role}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost">
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-2 text-xs text-muted-foreground">
            All users on an account see the same orders. Adding one is an invite to a phone number —
            they cannot sign themselves up.
          </p>
        </div>

        <div className="mt-6">
          <p className="kicker mb-2">
            Delivery sites
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Boundary</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {BUYER_SITES.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.address}</TableCell>
                  <TableCell>
                    <Badge variant={s.polygonConfirmed ? 'ghost' : 'outline'}>
                      {s.polygonConfirmed ? 'Drawn' : 'Pin only'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant={s.polygonConfirmed ? 'ghost' : 'secondary'}>
                      {s.polygonConfirmed ? 'Edit' : 'Draw boundary'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {unconfirmed.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              A job cannot dispatch to a site with no boundary — its dockets could never close on
              arrival, so every delivery there would fall to the manual override path.
            </p>
          )}
        </div>

        <div className="mt-6">
          <p className="kicker mb-2">Orders</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Loads</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{materialName(o.materialId)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    <Num>{o.windowDate}</Num>
                  </TableCell>
                  <TableCell className="text-right">
                    <Num>
                      {deliveredFor(o)}/{o.loadsRequested}
                    </Num>
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">
                    {o.status.replace('_', ' ')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </>
  );
}
