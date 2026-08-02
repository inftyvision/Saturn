import { redirect } from 'next/navigation';

/** Same as `/work` and `/money` — a section lands on its first segment. */
export default function AdminIndex() {
  redirect('/admin/vehicles');
}
