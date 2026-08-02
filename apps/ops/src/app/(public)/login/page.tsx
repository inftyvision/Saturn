'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandBadge, Button, Icon, Input, Label } from '@gaia/ui';

export const dynamic = 'force-dynamic';

/**
 * Email + password. Desk staff, not the buyer app's phone-OTP contractors —
 * that flow is justified there as "a WhatsApp market"; Gaia and vendor staff
 * sitting at a desk are a different audience with a different habit, so this
 * is the ordinary form instead of a borrowed one.
 *
 * No real auth exists yet (`CLAUDE.md`: "no auth, no database"), so this
 * does not check anything — submitting drops you at `/map`, the coordinator
 * surface's own default. Honest about what it is: the shape of the screen a
 * real session will need, not a working gate. Every "Log out" row in the app
 * points here now instead of doing nothing.
 */
export default function OpsLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="mx-auto w-full max-w-sm px-5 py-10">
      <BrandBadge size={40} />
      <h1 className="font-display mt-4 text-xl">Sign in to Gaia</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Coordinator, hauler and driver — one login, landing screens by role.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          router.push('/map');
        }}
      >
        <div className="space-y-1.5">
          <Label className="text-sm">Email</Label>
          <Input
            type="email"
            autoComplete="username"
            placeholder="you@saturn.gy"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="tap-target text-base"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Password</Label>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="tap-target text-base"
          />
        </div>

        <Button
          type="submit"
          className="tap-target w-full text-base"
          size="lg"
          disabled={email.trim().length < 3 || password.length < 1}
        >
          <Icon name="login" size={16} />
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-xs text-muted-foreground">
        Prototype — nothing here is checked against a real account. Submitting takes you straight
        to the coordinator's map.
      </p>
    </div>
  );
}
