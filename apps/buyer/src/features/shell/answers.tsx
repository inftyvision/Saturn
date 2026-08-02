'use client';

/**
 * What the contractor's agent is allowed to draw.
 *
 * The interesting half of this file is what is NOT in it.
 *
 * The ops app supplies `vehicle`, `docket`, `job` and `exception`. This one
 * supplies `order` and nothing else — so an answer that names a vehicle renders
 * NOTHING rather than leaking the vendor's fleet into a contractor's app. That
 * is not a filter applied to the result; the block never resolves to a
 * component, the same way `withOrgContext` means a query never sees the rows.
 *
 * One shared script format, two apps, two different sets of what may be drawn.
 * The allowlist is the boundary, and it lives on the app that would be doing
 * the leaking.
 */

import { Card, Status, Num, Action, type AnswerComponents } from '@gaia/ui';
import {
  ORDERS,
  ORDER_LABEL,
  buyerSite,
  gyd,
  materialName,
} from '@gaia/core';

export const BUYER_ANSWERS: AnswerComponents = {
  order: (id) => {
    const o = ORDERS.find((x) => x.id === id);
    if (!o) return null;
    const site = buyerSite(o.deliverySiteId);
    // Progress is the whole point of a buyer's order card, so it is the body
    // rather than a figure buried in the meta line.
    const done = o.jobId ? 15 : 0;
    return (
      <Card
        kicker="Order"
        title={materialName(o.materialId)}
        meta={site?.name}
        status={<Status state={o.status} label={ORDER_LABEL[o.status]} />}
        footer={
          o.quote ? (
            <>
              <Num>{gyd(o.quote.ratePerLoad)}</Num> per load
            </>
          ) : (
            'Not yet quoted'
          )
        }
      >
        <p className="text-sm">
          <Num>{done}</Num> of <Num>{o.loadsRequested}</Num> loads delivered
        </p>
      </Card>
    );
  },

  goto: (href, label) => (
    <div>
      <Action kind="ghost" size="sm" icon="arrow_forward" href={href}>
        {label}
      </Action>
    </div>
  ),
};
