'use client';

/**
 * Prototype state for the driver cycle.
 *
 * There is no backend, so the things that would arrive from GPS, the geofence
 * evaluator and the sync queue are held here and driven by an explicit control
 * strip. That is deliberate rather than a shortcut: the whole question this
 * surface has to answer is "what does a driver see when the camera WON'T
 * unlock, or when nothing has synced for forty minutes", and a mock that is
 * always inside the fence and always online never shows you that screen.
 *
 * Nothing here survives a reload. When the real client lands this is replaced
 * by the offline queue plus the cached-polygon evaluator described in §6, and
 * the components below should not need to change.
 */

import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { DocketStatus } from '@gaia/core';
import { DOCKET_FLOW } from '@gaia/core';

/** Where the vehicle is, as the CLIENT believes it to be. §6: the client
 *  evaluates offline because the camera gate depends on it; the server
 *  re-derives and wins. This is only ever the client's opinion. */
export type Fence = 'travelling' | 'in_pit' | 'in_delivery';

export interface SimState {
  /** The number burned from the device's block (§5). Known offline, at the
   *  pit, at the moment of loading — which is the entire reason blocks exist. */
  docketNumber: number;
  status: DocketStatus;
  fence: Fence;
  online: boolean;
  /** GPS accuracy in metres. §6: worse than 50 m is recorded but must not
   *  trigger a transition. */
  accuracy: number;
  /** Transitions captured but not yet flushed to the server. */
  queued: number;
  /** Dockets closed today, for the running tally. */
  closedToday: number;
  /** Set when the driver took a transition by hand. §11 — logged with actor
   *  and reason; the coordinator sees it in the exception queue. */
  overrides: string[];
}

interface SimApi extends SimState {
  advance: (to: DocketStatus, opts?: { override?: string }) => void;
  setFence: (f: Fence) => void;
  setOnline: (v: boolean) => void;
  setAccuracy: (m: number) => void;
  closeDocket: () => void;
  /** True when the accuracy fix is good enough to move the cycle on. */
  fixUsable: boolean;
  /** Can the camera open right now, and if not, why not. */
  cameraGate: (need: Exclude<Fence, 'travelling'>) => { open: boolean; reason: string | null };
}

const Ctx = createContext<SimApi | null>(null);

const ACCURACY_CEILING = 50;

export function SimProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SimState>({
    docketNumber: 4518,
    status: 'issued',
    fence: 'travelling',
    online: true,
    accuracy: 8,
    queued: 0,
    closedToday: 3,
    overrides: [],
  });

  const advance = useCallback((to: DocketStatus, opts?: { override?: string }) => {
    setState((s) => ({
      ...s,
      status: to,
      // Offline transitions queue rather than post. This is what the banner
      // counts, and what the driver is trusting when there is no signal.
      queued: s.online ? s.queued : s.queued + 1,
      overrides: opts?.override ? [...s.overrides, opts.override] : s.overrides,
    }));
  }, []);

  const closeDocket = useCallback(() => {
    setState((s) => ({
      ...s,
      closedToday: s.closedToday + 1,
      docketNumber: s.docketNumber + 1,
      status: 'issued',
      fence: 'travelling',
      queued: s.online ? s.queued : s.queued + 1,
    }));
  }, []);

  const api = useMemo<SimApi>(() => {
    const fixUsable = state.accuracy <= ACCURACY_CEILING;
    return {
      ...state,
      advance,
      closeDocket,
      setFence: (fence) => setState((s) => ({ ...s, fence })),
      setOnline: (online) =>
        setState((s) => ({
          ...s,
          online,
          // Reconnecting flushes the queue. The real client dedupes on
          // (vehicle_id, recorded_at) per §15; here it just drains.
          queued: online ? 0 : s.queued,
        })),
      setAccuracy: (accuracy) => setState((s) => ({ ...s, accuracy })),
      fixUsable,
      cameraGate: (need) => {
        if (state.fence !== need) {
          return {
            open: false,
            reason:
              need === 'in_pit'
                ? 'Camera unlocks inside the pit boundary.'
                : 'Camera unlocks inside the delivery boundary.',
          };
        }
        if (!fixUsable) {
          return {
            open: false,
            reason: `GPS accuracy ${Math.round(state.accuracy)} m — needs ${ACCURACY_CEILING} m or better.`,
          };
        }
        return { open: true, reason: null };
      },
    };
  }, [state, advance, closeDocket]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useSim(): SimApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSim must be used inside SimProvider');
  return v;
}

/** How far through the cycle, 0–1. Drives the step rail. */
export function cycleProgress(status: DocketStatus): number {
  return DOCKET_FLOW.indexOf(status) / (DOCKET_FLOW.length - 1);
}
