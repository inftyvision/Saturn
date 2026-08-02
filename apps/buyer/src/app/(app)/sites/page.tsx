import { Badge, Button, Icon, IconPin, IconWarning, Num, SectionHeading } from '@gaia/ui';
import { BUYER_SITES } from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * Saved delivery sites.
 *
 * The buyer drops a PIN; the coordinator draws the POLYGON. That division is
 * the whole design — buyers will not draw usable boundaries, and a bad boundary
 * is not a cosmetic problem: the delivery geofence is what gates the driver's
 * dump camera and closes the docket. An unconfirmed site would quietly push
 * every delivery there onto the manual override path, which is the one number
 * the product cannot afford to inflate.
 *
 * So `polygonConfirmed` is surfaced as a state on the card rather than hidden
 * in admin, and the copy explains what it means for the buyer rather than
 * naming the mechanism.
 */
export default function BuyerSitesPage() {
  return (
    <div className="px-5 py-5">
      <div className="flex items-center justify-between">
        <SectionHeading>Delivery sites</SectionHeading>
        <Button size="sm">
            <Icon name="add" size={16} />
            Add site
          </Button>
      </div>

      <ul className="mt-4 space-y-3">
        {BUYER_SITES.map((s) => (
          <li key={s.id} className="rounded-lg border">
            <div className="flex items-start gap-3 px-4 py-3.5">
              <IconPin size={18} className="mt-0.5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.address}</p>
                {s.accessNotes && (
                  <p className="mt-1.5 text-xs text-muted-foreground">{s.accessNotes}</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                {s.polygonConfirmed ? (
                  <Badge variant="ghost">Ready</Badge>
                ) : (
                  <Badge variant="outline">Being checked</Badge>
                )}
                {s.lastDelivery && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last <Num>{s.lastDelivery}</Num>
                  </p>
                )}
              </div>
            </div>

            {!s.polygonConfirmed && (
              <div className="flex items-start gap-2 border-t px-4 py-2.5">
                <IconWarning size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  You&apos;ve dropped the pin. The yard confirms the exact boundary before the first
                  delivery — that&apos;s what lets each load be photographed and timed at your gate.
                </p>
              </div>
            )}

            <div className="flex aspect-[3/1] items-center justify-center border-t bg-secondary text-xs text-muted-foreground">
              Map — drop and drag the pin
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-muted-foreground">
        A site can be edited until it has an order running to it.
      </p>
    </div>
  );
}
