'use client';

import { Button, Icon, IconWarning, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@gaia/ui';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MATERIALS, RATE_CARD, vehicleClassLabel } from '@gaia/core';
import { BUYER_SITES, CLASS_CAPTION, ORDERS } from '@gaia/core';
import type { VehicleClass } from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * Request loads.
 *
 * **No price anywhere on this screen.** It is a request, not a checkout — the
 * coordinator quotes, and putting a number here would either be wrong or
 * become a promise. That is also why the window is a period rather than a
 * time: the slot system decides arrival order operationally, and precision here
 * would be a commitment the yard cannot keep.
 *
 * Vehicle classes are captioned in vehicle terms. A foreman knows what a tandem
 * carries and has never heard of `8x4_chinese`; showing the enum would make
 * them phone to ask.
 *
 * `?from=<orderId>` pre-fills from a past order — the reorder path. It fills
 * and stops: material and window still change week to week, so submitting for
 * them would turn one tap into a mistake.
 *
 * ## Why the Suspense boundary
 *
 * `useSearchParams` forces client-side rendering for whatever subtree reads it,
 * and Next refuses to prerender such a subtree without an explicit boundary —
 * the build fails outright rather than shipping a page that flashes empty. So
 * the form is split out and the default export is the boundary.
 *
 * The fallback is the form's own chrome, not a spinner: `?from` only PRE-FILLS,
 * so what is behind the boundary is the same screen either way and a spinner
 * would be announcing a wait that is one tick long.
 */
export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="px-5 py-5 text-sm text-muted-foreground">Loading…</div>}>
      <NewOrderForm />
    </Suspense>
  );
}

function NewOrderForm() {
  const params = useSearchParams();
  const from = ORDERS.find((o) => o.id === params.get('from'));

  const [materialId, setMaterialId] = useState(from?.materialId ?? MATERIALS[0].id);
  const [siteId, setSiteId] = useState(from?.deliverySiteId ?? BUYER_SITES[0].id);
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>(from?.vehicleClass ?? '8x4_chinese');
  const [loads, setLoads] = useState(String(from?.loadsRequested ?? 10));
  const [period, setPeriod] = useState<'am' | 'pm' | 'all_day'>('all_day');
  const [notes, setNotes] = useState(from?.notes ?? '');

  const site = BUYER_SITES.find((s) => s.id === siteId);
  const blocked = site && !site.polygonConfirmed;

  return (
    <div className="px-5 py-5">
      {from && (
        <p className="mb-4 rounded-md border border-[hsl(var(--primary))]/40 bg-primary/5 px-3 py-2 text-xs">
          Filled in from your order on {from.windowDate}. Change anything before sending.
        </p>
      )}

      <div className="space-y-5">
        <Field label="Material">
          <Select value={materialId} onValueChange={setMaterialId}>
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
          <Field label="How many loads">
            <Input
              inputMode="numeric"
              value={loads}
              onChange={(e) => setLoads(e.target.value.replace(/\D/g, ''))}
            />
          </Field>
          <Field label="Vehicle size" hint={CLASS_CAPTION[vehicleClass]}>
            <Select value={vehicleClass} onValueChange={(v) => setVehicleClass(v as VehicleClass)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RATE_CARD.map((r) => (
                  <SelectItem key={r.class} value={r.class}>
                    {vehicleClassLabel(r.class)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Deliver to">
          <Select value={siteId} onValueChange={setSiteId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUYER_SITES.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {blocked && (
          <div className="flex items-start gap-2 rounded-md border border-dashed px-3 py-2.5">
            <IconWarning size={15} className="mt-0.5 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              This site&apos;s boundary hasn&apos;t been drawn yet. You can still send the request —
              the yard confirms the boundary before the first vehicle goes out, so deliveries there
              can be evidenced like everywhere else.{' '}
              <Link href="/sites" className="underline">
                Check the pin
              </Link>
              .
            </p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Date">
            <Input type="date" defaultValue="2026-08-06" />
          </Field>
          <Field label="When" hint="Times are set once vehicles are assigned.">
            <div className="flex gap-1.5">
              {(
                [
                  ['am', 'Morning'],
                  ['pm', 'Afternoon'],
                  ['all_day', 'Any time'],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setPeriod(v)}
                  className={`tap-target flex-1 rounded-md px-2 text-sm transition-colors ${
                    period === v
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <Field label="Anything the driver should know" hint="Gate codes, access, who to call on site.">
          <textarea
            className="min-h-[84px] w-full resize-none rounded-md border bg-background p-2.5 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. gate off the main road, ask for Terrence"
          />
        </Field>

        <div className="space-y-2 pt-1">
          <Button className="tap-target w-full text-base" size="lg">
            <Icon name="send" size={16} />
            Send request
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            You&apos;ll get a price back. Nothing is booked until you accept it.
          </p>
        </div>
      </div>
    </div>
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
