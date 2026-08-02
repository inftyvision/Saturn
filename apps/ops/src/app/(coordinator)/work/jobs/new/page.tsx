'use client';

/**
 * §3 `/(coordinator)/jobs/new`.
 *
 * The whole screen is arranged around one number: the pit's **load rate**.
 * §10's queue mechanic is not a solver — the spacing IS the queue management —
 * so the coordinator has to see, while typing, what a rate of 6/hour actually
 * does to the day. That preview is the feature. A form that collected the
 * number and revealed the consequence on the next screen would be the same
 * fields and none of the idea.
 *
 * The observed rate is shown beside the entered one wherever a pit has enough
 * history (§10 self-correction). It is deliberately not auto-filled: the
 * coordinator is posting a commitment, and quietly substituting a different
 * number under their commitment is how you lose their trust in the tool.
 */

import { Button, Icon, IconWarning, Input, Label, Num, PageHead, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@gaia/ui';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MATERIALS, SITES, RATE_CARD, gyd, vehicleClassLabel } from '@gaia/core';

const pits = SITES.filter((s) => s.kind === 'pit');
const deliveries = SITES.filter((s) => s.kind === 'delivery');

export default function NewJobPage() {
  const [pitId, setPitId] = useState(pits[0].id);
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('17:00');
  const [loads, setLoads] = useState('54');

  const pit = pits.find((p) => p.id === pitId)!;
  const [loadRate, setLoadRate] = useState(String(pit.loadRatePerHour ?? 4));

  const preview = useMemo(() => {
    const rate = Number(loadRate);
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const minutes = eh * 60 + em - (sh * 60 + sm);
    if (!rate || rate <= 0 || minutes <= 0) return null;
    const spacing = 60 / rate;
    const count = Math.floor(minutes / spacing);
    return { spacing, count, hours: minutes / 60 };
  }, [loadRate, start, end]);

  const ordered = Number(loads) || 0;
  const shortfall = preview ? ordered - preview.count : 0;

  return (
    <>
      <PageHead
        description="Slots generate from the pit's load rate across the window."
        actions={
          <>
            <Button variant="ghost" asChild>
              <Link href="/work/jobs">Cancel</Link>
            </Button>
            <Button>
            <Icon name="send" size={16} />
            Post job
          </Button>
          </>
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Field label="Material">
            <Select defaultValue={MATERIALS[0].id}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATERIALS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Pit">
              <Select value={pitId} onValueChange={setPitId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pits.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Delivery site">
              <Select defaultValue={deliveries[0].id}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {deliveries.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Window opens">
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
            <Field label="Window closes">
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </Field>
            <Field label="Loads wanted">
              <Input
                inputMode="numeric"
                value={loads}
                onChange={(e) => setLoads(e.target.value.replace(/\D/g, ''))}
              />
            </Field>
          </div>

          <Field
            label="Pit load rate — vehicles per hour the loader can serve"
            hint={
              pit.observedRatePerHour
                ? `Observed ${pit.observedRatePerHour}/hour over the last few dozen dockets.`
                : 'No observed rate yet — it replaces this figure once enough dockets exist.'
            }
          >
            <Input
              inputMode="decimal"
              value={loadRate}
              onChange={(e) => setLoadRate(e.target.value.replace(/[^\d.]/g, ''))}
            />
          </Field>

          <div>
            <p className="mb-2 text-sm">Rates per vehicle class</p>
            <div className="divide-y rounded-md border">
              {RATE_CARD.map((r) => (
                <div key={r.class} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-muted-foreground">{vehicleClassLabel(r.class)}</span>
                  <Num>{gyd(r.ratePerLoad)}</Num>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* The consequence of the load rate, live. */}
        <aside className="h-fit rounded-lg border">
          <div className="border-b px-4 py-3">
            <p className="text-sm">Slots</p>
            <p className="text-xs text-muted-foreground">Generated when you post</p>
          </div>

          {preview ? (
            <>
              <div className="px-4 py-4">
                <p className="text-3xl" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {preview.count}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  every <Num>{preview.spacing.toFixed(0)}</Num> min across{' '}
                  <Num>{preview.hours.toFixed(1)}</Num> h
                </p>
              </div>

              {/* A day at a glance — each tick is one slot. */}
              <div className="flex flex-wrap gap-[3px] px-4 pb-4">
                {Array.from({ length: Math.min(preview.count, 90) }, (_, i) => (
                  <span key={i} className="h-4 w-1.5 rounded-sm bg-primary/40" />
                ))}
              </div>

              {shortfall !== 0 && (
                <div className="flex items-start gap-2 border-t px-4 py-3 text-xs text-muted-foreground">
                  <IconWarning size={14} className="mt-0.5 shrink-0 text-primary" />
                  {shortfall > 0 ? (
                    <span>
                      {ordered} loads wanted but only {preview.count} slots fit. Raise the load
                      rate, widen the window, or expect {shortfall} to roll over.
                    </span>
                  ) : (
                    <span>
                      {preview.count} slots for {ordered} loads — {-shortfall} spare. Haulers can
                      claim more than ordered unless you narrow the window.
                    </span>
                  )}
                </div>
              )}

              <p className="border-t px-4 py-3 text-xs text-muted-foreground">
                A slot with no vehicle on the ground 20 minutes past its time is released and offered
                to whoever is waiting.
              </p>
            </>
          ) : (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Enter a load rate and a window to see the day.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
