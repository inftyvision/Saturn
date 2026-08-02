/**
 * Status. ONE vocabulary across every entity in both apps.
 *
 * A docket, a job, a slot, an order and a credential all have states, and
 * before this each screen picked its own badge variant per state — so `closed`
 * was emphatic on one screen and muted on another, and a coordinator scanning
 * between the docket feed and the job page had to re-learn the palette.
 *
 * Five tones, and every state in the product maps to one:
 *
 *   live      happening right now, needs no action        primary
 *   settled   finished and counted                        secondary
 *   waiting   open, someone must act                      outline
 *   idle      exists, nothing to do                       ghost
 *   bad       voided, expired, failed                     destructive
 *
 * The rule that matters: `settled` is quiet, not loud. A closed docket is the
 * normal case and there will be four hundred of them — making the common state
 * shout leaves nothing left to signal the exception.
 */

import { Badge } from '../primitives/badge';

export type Tone = 'live' | 'settled' | 'waiting' | 'idle' | 'bad';

const VARIANT: Record<Tone, 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'> = {
  live: 'default',
  settled: 'secondary',
  waiting: 'outline',
  idle: 'ghost',
  bad: 'destructive',
};

/** The one status map. Add a state here, not in a screen. */
const STATES: Record<string, { label: string; tone: Tone }> = {
  // docket
  issued: { label: 'Issued', tone: 'idle' },
  at_pit: { label: 'At pit', tone: 'live' },
  at_origin: { label: 'At origin', tone: 'live' },
  loaded: { label: 'Loaded', tone: 'live' },
  acquired: { label: 'Acquired', tone: 'live' },
  in_transit: { label: 'In transit', tone: 'live' },
  at_site: { label: 'At site', tone: 'live' },
  at_dest: { label: 'At site', tone: 'live' },
  dumped: { label: 'Dumped', tone: 'live' },
  released: { label: 'Released', tone: 'live' },
  closed: { label: 'Closed', tone: 'settled' },
  voided: { label: 'Voided', tone: 'bad' },

  // job
  draft: { label: 'Draft', tone: 'idle' },
  open: { label: 'Open', tone: 'waiting' },
  active: { label: 'Active', tone: 'live' },

  // slot
  claimed: { label: 'Claimed', tone: 'waiting' },
  running: { label: 'Running', tone: 'live' },
  done: { label: 'Done', tone: 'settled' },
  released_slot: { label: 'Released', tone: 'bad' },

  // order
  requested: { label: 'Awaiting quote', tone: 'waiting' },
  quoted: { label: 'Quote received', tone: 'waiting' },
  accepted: { label: 'Accepted', tone: 'live' },
  in_progress: { label: 'Delivering', tone: 'live' },
  completed: { label: 'Complete', tone: 'settled' },
  declined: { label: 'Declined', tone: 'idle' },
  cancelled: { label: 'Cancelled', tone: 'idle' },

  // credential
  pending: { label: 'Pending', tone: 'waiting' },
  verified: { label: 'Verified', tone: 'settled' },
  expiring: { label: 'Expiring', tone: 'waiting' },
  expired: { label: 'Expired', tone: 'bad' },

  // statement
  issued_statement: { label: 'Issued', tone: 'waiting' },
  paid: { label: 'Paid', tone: 'settled' },

  // driver / worker — derived from the docket feed and device sync, never
  // stored, so this can't disagree with either
  online: { label: 'Online', tone: 'live' },
  busy: { label: 'Busy', tone: 'live' },
  inactive: { label: 'Inactive', tone: 'idle' },
};

export function Status({ state, label }: { state: string; label?: string }) {
  const s = STATES[state] ?? { label: label ?? state, tone: 'idle' as Tone };
  return <Badge variant={VARIANT[s.tone]}>{label ?? s.label}</Badge>;
}

/** Slot cells on the job grid — same tones, as fills rather than badges. */
export const SLOT_FILL: Record<string, string> = {
  open: 'bg-secondary text-muted-foreground',
  claimed: 'bg-primary/25 text-foreground',
  running: 'bg-primary text-primary-foreground',
  done: 'bg-primary/10 text-muted-foreground',
  released: 'bg-destructive/25 text-foreground',
};

/**
 * A count that must not hide — open exceptions, unanswered requests.
 *
 * This existed FOUR times before it was a component: twice as an identical
 * corner badge (`BarAction`, `AccountButton`) and twice as an inline pill
 * (`SideMenuItem`, `Segments`), with two different type sizes between them. Four
 * copies of the same eleven classes is precisely the drift this library exists
 * to stop, and one of them had already diverged.
 *
 * Renders NOTHING at zero. A badge showing "0" is a badge drawing attention to
 * the absence of anything to attend to — which is the opposite of its job, and
 * on a bar of three icons it is a permanent dot that stops meaning anything.
 *
 * `inverse` is for a pill sitting on a filled (selected) background, where the
 * brand colour would be invisible against it.
 */
export function Count({
  n,
  corner,
  inverse,
}: {
  n?: number;
  /** Absolutely positioned on the top-right of a control. The caller must be
   *  `relative` — both current callers wrap the control in a positioning span
   *  rather than making the control itself relative, because several of their
   *  layouts would lay out differently with a positioning context. */
  corner?: boolean;
  inverse?: boolean;
}) {
  if (typeof n !== 'number' || n <= 0) return null;
  const text = n > 99 ? '99+' : String(n);
  const tone = inverse ? 'bg-background/20 text-background' : 'bg-primary text-primary-foreground';

  return corner ? (
    <span
      aria-hidden
      className={`pointer-events-none absolute -right-0.5 -top-0.5 flex min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] leading-none ring-1 ring-background ${tone}`}
      style={{ height: 16 }}
    >
      {text}
    </span>
  ) : (
    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] leading-none ${tone}`}>
      {text}
    </span>
  );
}
