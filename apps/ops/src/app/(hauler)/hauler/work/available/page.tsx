import { Badge, Button, IconClock, IconPin, Num, PageHead } from '@gaia/ui';
import {
  JOBS,
  materialName,
  siteName,
  clock,
  gyd,
  slotsForJob,
  VEHICLES,
  COORDINATOR_ORG,
  vehicleClassLabel,
} from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * §3 `/(hauler)/available` — open jobs, claim slots.
 *
 * §10: the market broadcasts and operators self-select. There is no matching
 * problem to solve, so this is a list and a claim button, not a feed of
 * recommendations.
 *
 * What makes it different from the WhatsApp broadcast it replaces is the TIME.
 * A broadcast says "sand at Yarrowkabra today" and every vehicle arrives at eight;
 * a slot says "you, 11:40". So the rate is prominent — that is what decides
 * whether to bid — and the claim control asks how many vehicles, because that is
 * how many times the hauler is committing to be somewhere.
 */
export default function AvailablePage() {
  const open = JOBS.filter((j) => j.status === 'open' || j.status === 'active');
  const myVehicles = VEHICLES.filter((t) => t.orgId === COORDINATOR_ORG && t.active);

  return (
    <>
      <PageHead
        description="Claim slots and you get times, not a scramble at the gate."
      />

      <ul className="divide-y">
        {open.map((j) => {
          const slots = slotsForJob(j);
          const free = slots.filter((s) => s.status === 'open' || s.status === 'released').length;
          return (
            <li key={j.id} className="px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base">{materialName(j.materialId)}</h2>
                    <Badge variant={j.status === 'open' ? 'outline' : 'ghost'} className="capitalize">
                      {j.status}
                    </Badge>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <IconPin size={14} />
                      {siteName(j.pickupSiteId)} → {siteName(j.deliverySiteId).split(' — ')[0]}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <IconClock size={14} />
                      <Num>
                        {clock(j.windowStart)}–{clock(j.windowEnd)}
                      </Num>
                    </span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground">8×4 Chinese</p>
                  <Num className="text-lg">
                    {gyd(j.rates.find((r) => r.class === '8x4_chinese')!.ratePerLoad)}
                  </Num>
                  <p className="text-xs text-muted-foreground">per load</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm">
                    <Num>{free}</Num> slot{free === 1 ? '' : 's'} free
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You have <Num>{myVehicles.length}</Num> vehicles available. Claiming gives each one
                    a time.
                  </p>
                </div>
                <Button disabled={j.status !== 'open' || free === 0}>
                  {free === 0 ? 'Full' : 'Claim slots'}
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {j.rates.slice(0, 4).map((r) => (
                  <span key={r.class}>
                    {vehicleClassLabel(r.class)} <Num>{gyd(r.ratePerLoad)}</Num>
                  </span>
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="px-6 py-5 text-xs text-muted-foreground">
        A slot with no vehicle on the ground 20 minutes past its time is released and offered to
        whoever is waiting. Missing one costs the slot, not the job.
      </p>
    </>
  );
}
