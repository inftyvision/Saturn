import { redirect } from 'next/navigation';

/** `/hauler` lands on the map — the same "where is it" slot every business
 *  surface opens on. */
export default function HaulerIndex() {
  redirect('/hauler/map');
}
