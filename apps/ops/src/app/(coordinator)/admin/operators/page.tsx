import { Badge, Button, Icon, PageHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@gaia/ui';
import { ORGS, COORDINATOR_ORG } from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * §3 `/(coordinator)/admin/operators` — approval. Marked "(phase 3)" in the spec.
 *
 * Present but deliberately inert, because §9 is explicit: phase 1 is Saturn's
 * own fleet, no hauler UI and no third-party slot claiming — but `org_id` is on
 * every table and `hauler_org_id` is on `Assignment` from the FIRST migration.
 * Model it, don't build the interface.
 *
 * The screen exists at this stage to make that boundary visible rather than
 * discoverable later: everything here is what phase 3 turns on, and nothing
 * about the data model has to change when it does.
 */
export default function OperatorsPage() {
  const others = ORGS.filter((o) => o.id !== COORDINATOR_ORG && o.kinds.includes('hauler'));

  return (
    <>
      <PageHead
        description="Subcontracted haulers. Approval and slot claiming arrive in phase 3."
        actions={
          <Button disabled title="Phase 3">
            Invite operator
          </Button>
        }
      />

      <div className="p-6">
        <div className="mb-5 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          Saturn holds both coordinator and hauler roles, so today every assignment is its own
          fleet. The schema already separates them — an assignment links a job owned by one org to a
          vehicle owned by another — so turning this on adds screens, not migrations.
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Operator</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Access</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {others.map((o) => (
              <TableRow key={o.id}>
                <TableCell>{o.name}</TableCell>
                <TableCell className="text-muted-foreground capitalize">
                  {o.kinds.join(', ')}
                </TableCell>
                <TableCell>
                  <Badge variant="ghost">Not granted</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" disabled>
            <Icon name="check" size={16} />
            Approve
          </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <p className="mt-4 text-xs text-muted-foreground">
          A coordinator seeing a subcontractor&apos;s dockets is an explicit access edge checked in
          the service layer — never a relaxed row-level policy.
        </p>
      </div>
    </>
  );
}
