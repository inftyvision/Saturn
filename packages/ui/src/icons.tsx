/**
 * The app's icon vocabulary — Material Symbols, via the local `Icon` wrapper.
 *
 * Named wrappers rather than raw `<Icon name="…" />` at every call site, so the
 * set stays a deliberate list: the worker surface should use eight icons, not
 * whatever each screen reached for. Renaming or reskinning one is a change
 * here, not a search across the app.
 *
 * Two traps, both handled in `app/layout.tsx` and `globals.css`, both silent
 * when you get them wrong:
 *
 *   1. The stylesheet must request the axes as RANGES (`FILL@0..1`). Pinned
 *      values resolve to a static instance with no FILL axis, and every
 *      `'FILL' 1` becomes a no-op — the icons render, just always outlined,
 *      which reads as a design choice rather than a bug.
 *   2. Ligatures paint their own NAME when the face is missing, so a driver
 *      offline at a pit would see the word `photo_camera`. Icons stay
 *      `visibility: hidden` until the face loads, revealed unconditionally
 *      after 3s.
 */

import { Icon } from './Icon';

interface P {
  size?: number;
  className?: string;
}

const make = (name: string) =>
  function MaterialIcon({ size = 24, className }: P) {
    return <Icon name={name} size={size} className={className} />;
  };

export const IconCamera = make('photo_camera');
export const IconLock = make('lock');
export const IconCheck = make('check_circle');
export const IconPin = make('location_on');
export const IconVehicle = make('local_shipping');
export const IconOffline = make('cloud_off');
export const IconWarning = make('warning');
export const IconClock = make('schedule');
export const IconArrow = make('arrow_forward');

/** Coordinator-side additions. Same list discipline. */
export const IconJobs = make('assignment');
export const IconDockets = make('receipt_long');
export const IconExceptions = make('report');
export const IconStatements = make('request_quote');
export const IconAdmin = make('settings');
export const IconSites = make('map');
export const IconDrivers = make('badge');
export const IconDevices = make('smartphone');
export const IconRates = make('payments');
export const IconSlots = make('grid_view');

/** Buyer-side additions. */
export const IconRequests = make('inbox');
export const IconBuyers = make('handshake');
export const IconFleet = make('pin_drop');
