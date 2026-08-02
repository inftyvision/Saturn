'use client';

/**
 * People. One component for a person, wherever they appear.
 *
 * Before this there were four treatments: a bare name in a table cell, a name
 * with a role underneath, a name with a phone number as plain text, and an
 * avatar bolted onto one screen. Same entity, four looks.
 *
 * ## Where contact actions belong
 *
 * On the OPS side, and only there. A coordinator calls a driver; a coordinator
 * WhatsApps a hauler about a stale fix; a coordinator rings a buyer about a
 * short order. A worker does not call themselves, and the buyer app never shows
 * the coordinator's fleet — so `Person` renders contact actions only when a
 * caller passes a phone, and no screen passes one unless somebody on it has a
 * reason to dial.
 *
 * WhatsApp is not a nicety here. It is the channel the whole market runs on, so
 * a number rendered as plain text is a number somebody retypes into another
 * app — which is the phone call this product exists to remove.
 */

import type { ReactNode } from 'react';
import { IconAction } from './action';

/** Digits with country code — what `tel:` and `wa.me` both want. */
function e164(phone: string): string {
  return phone.replace(/[^\d+]/g, '').replace(/^\+/, '');
}

/**
 * Initials on a colour derived from the name.
 *
 * No photograph slot, deliberately. Drivers and site foremen have not uploaded
 * one and will not, so a photo avatar renders an empty circle for everybody and
 * reads as broken. Initials are always populated and distinct enough to scan.
 */
const TONES = ['#E8A33D', '#3D6EE8', '#22C55E', '#A855F7', '#EC4899', '#14B8A6'];

export function Avatar({ name, size = 28, className = '' }: { name: string; size?: number; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  // Deterministic — the same person is the same colour on every screen, and
  // screenshots reproduce.
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 9973;
  const tone = TONES[h % TONES.length];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `${tone}22`,
        color: tone,
        fontSize: Math.round(size * 0.36),
        fontFamily: 'var(--gaia-font-mono)',
      }}
      aria-hidden="true"
    >
      {initials || '—'}
    </span>
  );
}

/** Call + WhatsApp for one number. Ops surfaces only. */
export function ContactActions({ phone, name }: { phone: string; name: string }) {
  return (
    <span className="inline-flex shrink-0">
      <IconAction icon="call" label={`Call ${name}`} href={`tel:${phone.replace(/\s/g, '')}`} />
      <IconAction icon="chat" label={`WhatsApp ${name}`} href={`https://wa.me/${e164(phone)}`} />
    </span>
  );
}

/** A phone number as a figure, with the two ways to reach it. */
export function Phone({ phone, name }: { phone: string; name: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="figure selectable">{phone}</span>
      <ContactActions phone={phone} name={name} />
    </span>
  );
}

/**
 * A person: avatar, name, optional detail, optional contact.
 *
 * `phone` is opt-in per screen. Pass it where somebody has a reason to dial;
 * leave it off everywhere else.
 */
export function Person({
  name,
  sub,
  phone,
  size = 28,
  actions,
}: {
  name: string;
  sub?: ReactNode;
  phone?: string;
  size?: number;
  actions?: ReactNode;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <Avatar name={name} size={size} />
      <span className="min-w-0">
        <span className="block truncate text-sm">{name}</span>
        {sub && <span className="block truncate text-xs text-muted-foreground">{sub}</span>}
      </span>
      {phone && <ContactActions phone={phone} name={name} />}
      {actions}
    </span>
  );
}

/**
 * The signed-in user, for app chrome. Same avatar, so the person you are is
 * rendered the same way as every person you look at.
 */
export function ProfileButton({ name, role, href = '#' }: { name: string; role?: string; href?: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-accent"
      title={name}
    >
      <Avatar name={name} size={26} />
      <span className="hidden min-w-0 sm:block">
        <span className="block truncate text-xs">{name}</span>
        {role && <span className="kicker block truncate">{role}</span>}
      </span>
    </a>
  );
}
