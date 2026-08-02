import { redirect } from 'next/navigation';

/** Same as `/work` — a section lands on its first segment. */
export default function MoneyIndex() {
  redirect('/money/statements');
}
