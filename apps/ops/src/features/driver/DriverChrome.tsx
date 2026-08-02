'use client';

/**
 * Driver chrome — the sync banner, and the prototype's condition strip.
 *
 * The banner is a real product surface, not decoration. §15 makes offline
 * load-bearing, which means a driver is routinely producing dockets the server
 * has never seen. The only honest thing to show is a count: what is captured,
 * what has landed. A spinner or a silent retry would ask a driver to trust an
 * unverified claim, which is the exact opposite of what this product sells.
 */

import { useSim } from './sim';
import { IconCheck, IconOffline, IconWarning } from '@gaia/ui';

export function SyncBanner() {
  const { online, queued, accuracy } = useSim();
  const lowFix = accuracy > 50;

  if (online && !queued && !lowFix) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
        <IconCheck size={14} />
        <span>Synced</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 px-4 py-2 text-xs">
      {!online && (
        <div className="flex items-center gap-2 text-[hsl(var(--primary))]">
          <IconOffline size={14} />
          <span>
            No signal — {queued} {queued === 1 ? 'entry' : 'entries'} saved on this phone
          </span>
        </div>
      )}
      {online && queued > 0 && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <IconCheck size={14} />
          <span>Sending {queued}…</span>
        </div>
      )}
      {lowFix && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <IconWarning size={14} />
          <span>Weak GPS — {Math.round(accuracy)} m</span>
        </div>
      )}
    </div>
  );
}

/**
 * Prototype-only condition strip.
 *
 * Stands in for GPS, the geofence evaluator and the radio. It is here so a
 * reviewer can reach the states that actually matter — camera refusing to
 * unlock, forty minutes of unsynced work, a fix too weak to transition on —
 * without driving to a pit. Deleted when the real client lands.
 */
export function ConditionStrip() {
  const { fence, setFence, online, setOnline, accuracy, setAccuracy } = useSim();

  const seg = (active: boolean) =>
    `flex-1 rounded-md px-2 py-2 text-xs transition-colors ${
      active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
    }`;

  return (
    <div className="border-t border-dashed px-4 py-3">
      <p className="kicker mb-2">
        Prototype conditions — not part of the app
      </p>
      <div className="mb-2 flex gap-1.5">
        <button className={seg(fence === 'travelling')} onClick={() => setFence('travelling')}>
          On road
        </button>
        <button className={seg(fence === 'in_pit')} onClick={() => setFence('in_pit')}>
          In pit
        </button>
        <button className={seg(fence === 'in_delivery')} onClick={() => setFence('in_delivery')}>
          At site
        </button>
      </div>
      <div className="flex gap-1.5">
        <button className={seg(online)} onClick={() => setOnline(!online)}>
          {online ? 'Signal' : 'No signal'}
        </button>
        <button className={seg(accuracy <= 50)} onClick={() => setAccuracy(accuracy > 50 ? 8 : 78)}>
          GPS {Math.round(accuracy)} m
        </button>
      </div>
    </div>
  );
}
