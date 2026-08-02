/**
 * The two surfaces reached WITHOUT an account.
 *
 * `/o/[token]` is the link that arrives over WhatsApp; `/login` is the way in.
 * Neither gets the app shell — no header, no bar, no side menu, no agent — and
 * that is the point of the route group. The old nav decided this for itself
 * with a `usePathname` check and an early `return null`, which works and puts
 * the rule in the nav rather than in the structure. Here there is simply
 * nothing to hide: these pages are not inside the layout that draws chrome.
 *
 * The tracking link lands in more hands than the recipient's — forwarded to a
 * site foreman, a driver, whoever is asking. It shows one order's progress and
 * offers no way into the account behind it.
 *
 * All this layout does is give the content the same column the app has, so a
 * phone-first page does not stretch across a desk monitor.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-3 lg:px-5">{children}</div>
  );
}
