import { Action, Page, Num, Section } from '@gaia/ui';
import { BUYER_USERS } from '@gaia/core';

export const dynamic = 'force-dynamic';

/**
 * Account — who can see this account's orders.
 *
 * The money moved to `/money`. What is left is the thing that is genuinely
 * about the ACCOUNT rather than about the trading on it, and it lives behind
 * the avatar with everything else that is not a destination — because a
 * contractor opens this when somebody joins the crew, not weekly.
 *
 * "Ask to add someone" is `secondary`, not `primary`, and the wording is the
 * reason: nobody can add themselves, so this is a request to the yard rather
 * than an action that completes. A `primary` button that opens a conversation
 * with a human is a button that over-promises.
 */
export default function BuyerAccountPage() {
  return (
    <Page phone>
      <Section
        title="People on this account"
        hint="Everyone here sees the same orders. The yard adds people — nobody can sign themselves up, because an account carries credit terms."
        actions={
          <Action kind="secondary" size="sm" icon="person_add">
            Ask to add someone
          </Action>
        }
        divider={false}
        phone
      >
        <ul className="divide-y">
          {BUYER_USERS.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.role}</p>
              </div>
              <Num className="text-xs text-muted-foreground">{u.phone}</Num>
            </li>
          ))}
        </ul>
      </Section>
    </Page>
  );
}
