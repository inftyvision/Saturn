'use client';

/**
 * What the coordinator's agent is allowed to draw.
 *
 * This is `mdx-chat`'s component map, as a Gaia object: the agent names a
 * record, and the app decides whether it will render one and what it looks like
 * when it does. The agent has no say in either.
 *
 * Two things follow from that, and both are enforced HERE rather than in the
 * script:
 *
 *  - **A record that does not exist renders nothing.** `vehicle('veh_99')`
 *    returns null, not an empty card. The failure this prevents is the only one
 *    that matters on an evidence product: a docket-shaped box drawn around a
 *    number nobody issued.
 *
 *  - **The card is the SAME card the screen uses.** Not a chat-flavoured
 *    version of one. An answer about a docket and the docket list are the same
 *    component reading the same fixture, so the two can never disagree — the
 *    same rule that keeps vehicle positions derived from the live docket rather
 *    than stored beside it.
 */

import { Card, Status, Num, Action, type AnswerComponents } from '@gaia/ui';
import {
  DOCKETS,
  EXCEPTIONS,
  EXCEPTION_LABEL,
  JOBS,
  driverName,
  job as findJob,
  materialName,
  siteName,
  vehicle as findVehicle,
} from '@gaia/core';

const gyd = (n: number) => `G$${n.toLocaleString('en-GY')}`;

export const OPS_ANSWERS: AnswerComponents = {
  vehicle: (id) => {
    const v = findVehicle(id);
    if (!v) return null;
    // Who is on it and what it is running both come off the LIVE DOCKET, the
    // same derivation the map uses — so an answer cannot show a truck doing
    // something the map disagrees with.
    const live = DOCKETS.find((k) => k.vehicleId === v.id && k.status !== 'closed' && !k.voided);
    const j = live ? findJob(live.jobId) : null;
    return (
      <Card
        kicker="Vehicle"
        title={<Num>{v.plate}</Num>}
        meta={
          j
            ? `${driverName(live!.driverId)} · ${materialName(j.materialId)} · ${siteName(j.pickupSiteId)} → ${siteName(j.deliverySiteId)}`
            : 'No live docket'
        }
        status={<Status state={live ? live.status : 'idle'} />}
      />
    );
  },

  docket: (id) => {
    const k = DOCKETS.find((d) => d.id === id);
    if (!k) return null;
    const j = findJob(k.jobId);
    return (
      <Card
        kicker="Docket"
        title={<Num>#{k.number}</Num>}
        meta={
          j
            ? `${materialName(j.materialId)} · ${driverName(k.driverId)} · ${gyd(k.ratePerLoad)}`
            : driverName(k.driverId)
        }
        status={<Status state={k.voided ? 'voided' : k.status} />}
      />
    );
  },

  job: (id) => {
    const j = JOBS.find((x) => x.id === id);
    if (!j) return null;
    return (
      <Card
        kicker="Job"
        title={materialName(j.materialId)}
        meta={`${siteName(j.pickupSiteId)} → ${siteName(j.deliverySiteId)}`}
        status={<Status state={j.status} />}
        footer={
          <>
            <Num>{j.loadsDone}</Num> of <Num>{j.loadsOrdered}</Num> loads
          </>
        }
      />
    );
  },

  exception: (id) => {
    const e = EXCEPTIONS.find((x) => x.id === id);
    if (!e) return null;
    return (
      <Card
        kicker={EXCEPTION_LABEL[e.kind]}
        title={e.detail}
        meta={`${e.entity} · ${e.occurredAt.slice(11, 16)}`}
        status={<Status state={e.status === 'open' ? 'waiting' : 'settled'} />}
      />
    );
  },

  /**
   * The way out of the conversation and into the surface that owns the record.
   *
   * `ghost`, because it is navigation — and because the agent should be handing
   * the reader back to the app rather than becoming a second place to work.
   */
  goto: (href, label) => (
    <div>
      <Action kind="ghost" size="sm" icon="arrow_forward" href={href}>
        {label}
      </Action>
    </div>
  ),
};
