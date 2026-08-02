import { redirect } from 'next/navigation';

/**
 * `/work` is a section, not a screen.
 *
 * A section with segments has no page of its own — an overview above four
 * segments would be a fifth thing to read before reaching the one you came for.
 * It lands on Requests because an unanswered quote is a customer reaching for
 * the phone, which is the behaviour the buyer app exists to replace.
 */
export default function WorkIndex() {
  redirect('/work/requests');
}
