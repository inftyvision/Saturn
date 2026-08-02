'use client';

import { useState } from 'react';
import { Button, Icon, Input, Label } from '@gaia/ui';

export const dynamic = 'force-dynamic';

/**
 * Phone OTP. Nothing else on the screen.
 *
 * Contractors will not manage passwords, and this is a WhatsApp market — the
 * phone number is the identity, and §12's `User` is keyed on it.
 *
 * **No self-registration.** An account implies credit terms, so the coordinator
 * decides who has one. That makes the unrecognised-number case a real screen
 * rather than an error: someone who was told about the app and typed their
 * number needs to know who to ask, not that they failed. Getting this wrong
 * sends them back to the phone, which is the thing the app is competing with.
 */
export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');

  return (
    <div className="mx-auto w-full max-w-sm px-5 py-10">
      {step === 'phone' ? (
        <>
          <h1 className="font-display text-xl">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ll text you a code. No password to remember.
          </p>

          <div className="mt-6 space-y-1.5">
            <Label className="text-sm">Phone number</Label>
            <Input
              inputMode="tel"
              placeholder="+592 …"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="tap-target text-base"
            />
          </div>

          <Button
            className="tap-target mt-4 w-full text-base"
            size="lg"
            disabled={phone.trim().length < 7}
            onClick={() => setStep('code')}
          >
            Send code
          </Button>

          <p className="mt-6 text-xs text-muted-foreground">
            Accounts are set up by the yard. If your number isn&apos;t recognised, ask them to add
            you — they need to know who&apos;s ordering on the account.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display text-xl">Enter the code</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sent to {phone}</p>

          <div className="mt-6 flex gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Input
                key={i}
                inputMode="numeric"
                maxLength={1}
                className="tap-target h-14 w-full p-0 text-center text-lg"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              />
            ))}
          </div>

          <Button className="tap-target mt-4 w-full text-base" size="lg">
            <Icon name="login" size={16} />
            Sign in
          </Button>

          <div className="mt-4 flex justify-between text-xs">
            <button onClick={() => setStep('phone')} className="text-muted-foreground underline">
              Change number
            </button>
            <button className="text-muted-foreground underline">Resend</button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            You&apos;ll stay signed in on this phone for 30 days.
          </p>
        </>
      )}
    </div>
  );
}
