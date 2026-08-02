import { redirect } from 'next/navigation';

/** A section with segments has no page of its own. Available first: unclaimed
 *  work is the reason a hauler opens the app. */
export default function HaulerWorkIndex() {
  redirect('/hauler/work/available');
}
