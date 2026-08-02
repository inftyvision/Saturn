import { IconCamera, IconWarning, Num, PageHead, Person, Status } from '@gaia/ui';
import {
  DOCKETS,
  vehiclePlate,
  driver as findDriver,
  clock,
  gyd,
  siteName,
  job as findJob,
} from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * §3 `/(coordinator)/dockets` — the feed, with photos.
 *
 * A feed rather than a table because this is the surface a coordinator leaves
 * open: dockets close through the day and the newest one belongs at the top,
 * where a table's sort order would bury it.
 *
 * Both photos ride each row. §8 binds GPS, timestamp and vehicle id at capture
 * and the server checks the fix against the polygon at ingest — but the reason
 * a coordinator looks is simpler than any of that: they want to see the load.
 * A row that shows a docket closed without letting anyone look at what moved is
 * asking for the same trust the paper book asked for.
 */
export default function DocketsPage() {
  const rows = [...DOCKETS].reverse();

  return (
    <>
      <PageHead
        description="Closing in real time. Voided dockets stay in the record."
      />

      <ul className="divide-y">
        {rows.map((d) => {
          const job = findJob(d.jobId);
          const dr = findDriver(d.driverId);
          return (
            <li key={d.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
              <div className="w-16 shrink-0">
                <Num className={`text-lg ${d.voided ? 'line-through opacity-50' : ''}`}>
                  {d.number}
                </Num>
              </div>

              {/* Load and dump photos. Placeholders here; the real ones are
                  R2 objects behind a signed URL (§13). */}
              <div className="flex shrink-0 gap-1.5">
                {[d.loadPhoto, d.dumpPhoto].map((p, i) => (
                  <div
                    key={i}
                    className="flex h-12 w-16 items-center justify-center rounded border bg-secondary text-muted-foreground"
                    title={p ? (i === 0 ? 'Load photo' : 'Dump photo') : 'Not captured'}
                  >
                    {p ? <IconCamera size={16} /> : <span className="text-[10px]">—</span>}
                  </div>
                ))}
              </div>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm">
                  <Num>{vehiclePlate(d.vehicleId)}</Num>
                  <Person name={dr?.name ?? '—'} phone={dr?.phone} size={18} />
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {job ? siteName(job.deliverySiteId) : '—'}
                  {d.loadedAt && (
                    <>
                      {' · loaded '}
                      <Num>{clock(d.loadedAt)}</Num>
                    </>
                  )}
                  {d.dumpedAt && (
                    <>
                      {' · dumped '}
                      <Num>{clock(d.dumpedAt)}</Num>
                    </>
                  )}
                </p>
                {d.voided && d.voidReason && (
                  <p className="mt-0.5 text-xs text-muted-foreground">Voided — {d.voidReason}</p>
                )}
              </div>

              {d.manualOverride && (
                <span
                  className="flex shrink-0 items-center gap-1 text-xs text-primary"
                  title="A transition was taken by hand"
                >
                  <IconWarning size={14} />
                  By hand
                </span>
              )}

              <div className="shrink-0 text-right">
                <Num className="text-sm">{gyd(d.ratePerLoad)}</Num>
              </div>

              <div className="w-24 shrink-0 text-right">
                <Status state={d.voided ? 'voided' : d.status} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
