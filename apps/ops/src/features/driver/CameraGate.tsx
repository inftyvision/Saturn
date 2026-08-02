'use client';

/**
 * The geofence-gated camera (§8, §11).
 *
 * Three things this screen has to get right, in order of how badly they hurt
 * when wrong:
 *
 * 1. WHEN LOCKED, SAY WHY AND WHAT TO DO. A disabled button with no reason is
 *    how a driver concludes the app is broken and reverts to the paper book.
 *    The lock is doing its job; the driver still needs a way forward.
 *
 * 2. THE OVERRIDE IS ALWAYS REACHABLE, AND NEVER THE OBVIOUS PATH. §11 makes it
 *    mandatory — geofences miss, pits move, phones lose GPS. But every override
 *    weakens the count this product sells, so it costs a deliberate second tap
 *    and a stated reason. The coordinator sees both in the exception queue, and
 *    the override RATE is the health metric for the whole system.
 *
 * 3. THE FRAMING OVERLAY IS NOT DECORATION. §8 wants beds comparable over time,
 *    which only works if every photo of vehicle 47 is taken from roughly the same
 *    place. The guide is what makes "deviation from vehicle 47's own baseline"
 *    mean anything.
 */

import { Button, IconCamera, IconLock, IconWarning } from '@gaia/ui';
import { useState } from 'react';
import { useSim, type Fence } from './sim';

export function CameraGate({
  need,
  plate,
  onCapture,
  captionOpen,
}: {
  need: Exclude<Fence, 'travelling'>;
  plate: string;
  onCapture: (opts?: { override?: string }) => void;
  captionOpen: string;
}) {
  const { cameraGate } = useSim();
  const gate = cameraGate(need);
  const [overriding, setOverriding] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <div className="flex flex-1 flex-col">
      {/* The viewfinder. Fixed 4:3 with a framing guide — the bed should fill
          the guide, which is what makes two photos of the same vehicle
          comparable months apart. */}
      <div className="relative mx-4 aspect-[4/3] overflow-hidden rounded-lg border bg-secondary">
        <div
          className={`absolute inset-0 flex items-center justify-center ${
            gate.open ? '' : 'opacity-30'
          }`}
        >
          <div className="text-center text-muted-foreground">
            <IconCamera size={40} className="mx-auto" />
            <p className="mt-2 text-xs">{plate}</p>
          </div>
        </div>

        {/* Framing guide */}
        <div className="pointer-events-none absolute inset-6 rounded border-2 border-dashed border-[hsl(var(--primary))]/40" />
        <div className="pointer-events-none absolute inset-x-6 top-1/2 h-px bg-[hsl(var(--primary))]/25" />

        {!gate.open && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 px-6 text-center backdrop-blur-[2px]">
            <IconLock size={28} className="text-muted-foreground" />
            <p className="text-sm">{gate.reason}</p>
          </div>
        )}
      </div>

      <p className="px-4 pt-3 text-xs text-muted-foreground">
        {gate.open
          ? captionOpen
          : 'The photo is what proves the load. It carries its own GPS fix, checked against the boundary when it reaches the office.'}
      </p>

      <div className="mt-auto space-y-2 p-4">
        <Button
          className="tap-target w-full text-base"
          size="lg"
          disabled={!gate.open}
          onClick={() => onCapture()}
        >
          <IconCamera size={18} />
          Take photo
        </Button>

        {!gate.open && !overriding && (
          <Button
            variant="ghost"
            className="tap-target w-full text-muted-foreground"
            onClick={() => setOverriding(true)}
          >
            Boundary missed — record by hand
          </Button>
        )}

        {overriding && (
          <div className="space-y-2 rounded-lg border border-dashed p-3">
            <div className="flex items-start gap-2">
              <IconWarning size={16} className="mt-0.5 shrink-0 text-[hsl(var(--primary))]" />
              <p className="text-xs text-muted-foreground">
                This docket will be flagged for the office. Say what happened.
              </p>
            </div>
            <textarea
              className="min-h-[72px] w-full resize-none rounded-md border bg-background p-2 text-sm"
              placeholder="e.g. no GPS at the pit, boundary never triggered"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="tap-target flex-1"
                onClick={() => {
                  setOverriding(false);
                  setReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="tap-target flex-1"
                disabled={reason.trim().length < 4}
                onClick={() => onCapture({ override: reason.trim() })}
              >
                Record
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
