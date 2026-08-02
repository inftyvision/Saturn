/**
 * The one surface reached WITHOUT a session: `/login`.
 *
 * Same mount as the buyer app's `(public)` group — no header, no bar, no
 * side menu, no agent, because there is nothing here to hide it FROM. The
 * "Log out" row in every ops menu points here now instead of doing nothing;
 * see the note on that row for why it still isn't wired to a real session.
 *
 * All this layout does is give the content the same column the app has, so
 * a narrow form does not stretch across a desk monitor.
 */
export default function OpsPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-3 lg:px-5">{children}</div>
  );
}
