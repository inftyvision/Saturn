import { redirect } from 'next/navigation';

/**
 * `/` has no screen of its own yet.
 *
 * Spec §3 puts `/login` in front and lands each role on its own board — a
 * coordinator on the fleet, a worker on today's job, a hauler on open work.
 * Until auth exists there is one destination and the prototype role switch in
 * each shell covers the rest; a placeholder dashboard would be a screen nobody
 * asked for that someone would later have to delete.
 */
export default function OpsRoot() {
  redirect('/map');
}
