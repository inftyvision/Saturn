import { JOBS, jobSites } from '@gaia/core';
import { fetchRoute } from '@/lib/route';
import { TransitScreen } from './TransitScreen';

export const dynamic = 'force-dynamic';

/** Fetches the real route server-side — see `TransitScreen` for why the
 *  screen itself has to be the client half of this page. */
export default async function TransitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = JOBS.find((j) => j.id === id) ?? JOBS[0];
  const sites = jobSites(job.id);
  const route = sites[0] && sites[1] ? await fetchRoute(sites[0], sites[1]) : null;

  return <TransitScreen jobId={id} route={route} />;
}
