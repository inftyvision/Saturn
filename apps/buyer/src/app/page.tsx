import { redirect } from 'next/navigation';

/** The contractor's home is their order list. */
export default function BuyerRoot() {
  redirect('/orders');
}
