'use client';

/**
 * The agent conversation — the transcript, the turn machine, and the renderer
 * that turns an answer into real product components.
 *
 * The shape is Syvon's `@syvon/mdx-chat` (beta-v2, `packages/mdx-chat`): a hook
 * that owns one turn-taking state machine for every chat surface, and a
 * renderer that resolves an answer against an ALLOWLISTED component map. What
 * differs is the source — theirs streams NDJSON off a model endpoint, this
 * replays a canned script from `@gaia/core` — and that difference is confined
 * to `send`. Everything downstream of it is the real contract.
 *
 * ## Two rules the renderer enforces, not the prompt
 *
 * 1. **A block whose record does not exist renders nothing.** Not an empty
 *    card, not a placeholder — nothing. An agent that can draw a docket-shaped
 *    box around a number it invented is the one failure this surface cannot
 *    have, and a prompt is not where you stop it.
 *
 * 2. **A block kind the host did not supply renders nothing.** The buyer app
 *    passes no `vehicle` renderer, so an answer that names one is silently
 *    dropped rather than leaking the vendor's fleet into a contractor's app.
 *    Same reason `Person` renders contact actions only where a screen passes a
 *    phone: the surface decides what it is willing to show.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { answerFor, type AgentExchange, type AnswerBlock } from '@gaia/core';
import { Icon } from '../Icon';
import { Action } from './action';
import { Stat } from './card';
import { Kicker } from './typography';

// ── the turn machine ────────────────────────────────────────────────────────

export type Turn =
  | { role: 'user'; text: string }
  | { role: 'agent'; blocks: AnswerBlock[]; shown: number; partial: string; done: boolean };

/** How fast the reply is written. Characters per frame, and the pause between
 *  blocks — slow enough to read as composition, fast enough not to be a wait. */
const CHARS_PER_TICK = 3;
const TICK_MS = 16;
const BLOCK_GAP_MS = 140;
/** The pause before the first token. A reply that lands instantly reads as a
 *  lookup table, which is exactly what this is — and saying so with a delay is
 *  more honest than pretending it thought about it for two seconds. */
const THINK_MS = 420;

export function useAgentThread(script: AgentExchange[]) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [thinking, setThinking] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const last = turns[turns.length - 1];
  const busy = thinking || (last?.role === 'agent' && !last.done);

  // Every scheduled tick is tracked so unmounting mid-reply cannot leave a
  // timer writing into a dead component — the layer is routinely closed while
  // an answer is still being written.
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    [],
  );

  const after = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };

  /** Rewrites the trailing agent turn. A no-op if the thread moved on. */
  const patch = (fn: (t: Extract<Turn, { role: 'agent' }>) => Turn) =>
    setTurns((ts) => {
      const tail = ts[ts.length - 1];
      if (tail?.role !== 'agent') return ts;
      return [...ts.slice(0, -1), fn(tail)];
    });

  const step = useCallback((blocks: AnswerBlock[], i: number, chars: number) => {
    if (i >= blocks.length) {
      patch((t) => ({ ...t, shown: blocks.length, partial: '', done: true }));
      return;
    }
    const b = blocks[i]!;
    // Prose is TYPED; a record LANDS. A docket card revealed a character at a
    // time would be a card mid-render, which reads as a broken card.
    if (b.kind === 'text' || b.kind === 'callout') {
      if (chars < b.text.length) {
        const next = Math.min(b.text.length, chars + CHARS_PER_TICK);
        patch((t) => ({ ...t, shown: i, partial: b.text.slice(0, next) }));
        after(TICK_MS, () => step(blocks, i, next));
      } else {
        patch((t) => ({ ...t, shown: i + 1, partial: '' }));
        after(BLOCK_GAP_MS, () => step(blocks, i + 1, 0));
      }
    } else {
      patch((t) => ({ ...t, shown: i + 1, partial: '' }));
      after(BLOCK_GAP_MS + 80, () => step(blocks, i + 1, 0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = useCallback(
    (text: string) => {
      const q = text.trim();
      if (!q || busy) return;
      const blocks = answerFor(script, q);
      setTurns((ts) => [...ts, { role: 'user', text: q }]);
      setThinking(true);
      after(THINK_MS, () => {
        setThinking(false);
        setTurns((ts) => [...ts, { role: 'agent', blocks, shown: 0, partial: '', done: false }]);
        step(blocks, 0, 0);
      });
    },
    [busy, script, step],
  );

  const reset = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setThinking(false);
    setTurns([]);
  }, []);

  return { turns, thinking, busy, send, reset };
}

// ── the renderer ────────────────────────────────────────────────────────────

/**
 * What the host app is willing to let the agent draw.
 *
 * Every entry is optional and an omission is a refusal, not a gap — see the
 * second rule at the top of this file. The blocks the library renders itself
 * (`text`, `callout`, `figures`, `propose`, `goto`) carry no record and cannot
 * leak one.
 */
export interface AnswerComponents {
  docket?: (id: string) => ReactNode;
  vehicle?: (id: string) => ReactNode;
  job?: (id: string) => ReactNode;
  exception?: (id: string) => ReactNode;
  order?: (id: string) => ReactNode;
  /** How this app navigates. Passed in so the library needs no router. */
  goto?: (href: string, label: string) => ReactNode;
  /** Accepting a proposal. Omit and the proposal renders read-only — which is
   *  the correct degradation, since a proposal nobody can accept is still a
   *  perfectly good thing to have read. */
  onAccept?: (title: string) => void;
}

function Callout({ tone, children }: { tone: 'note' | 'warn'; children: ReactNode }) {
  return (
    <div
      className="flex gap-2.5 rounded-lg border px-3.5 py-3 text-xs leading-relaxed"
      style={
        tone === 'warn'
          ? { borderColor: 'hsl(var(--primary))', background: 'color-mix(in srgb, hsl(var(--primary)) 8%, transparent)' }
          : undefined
      }
    >
      <Icon
        name={tone === 'warn' ? 'warning' : 'info'}
        size={16}
        className={tone === 'warn' ? 'shrink-0 text-primary' : 'shrink-0 text-muted-foreground'}
      />
      <span className={tone === 'warn' ? '' : 'text-muted-foreground'}>{children}</span>
    </div>
  );
}

/**
 * A draft the agent prepared and cannot enact — `Proposal` from the spec, as a
 * card.
 *
 * Accept is `secondary`, not `primary`. A proposal is never the reason anyone
 * opened the screen, an answer can carry more than one, and `primary` is capped
 * at one per view — so the emphasis stays with the surface underneath that owns
 * the record. The card also says, in words, that nothing has happened yet:
 * accepting opens the human's own surface, it does not commit.
 */
function Proposal({
  title,
  detail,
  accept,
  onAccept,
}: {
  title: string;
  detail: string;
  accept: string;
  onAccept?: (title: string) => void;
}) {
  const [taken, setTaken] = useState<'accepted' | 'discarded' | null>(null);

  if (taken) {
    return (
      <div className="rounded-lg border border-dashed px-3.5 py-3 text-xs text-muted-foreground">
        {taken === 'accepted'
          ? 'Handed to you — nothing has been committed. It is yours to send.'
          : 'Discarded. Nothing was written.'}
      </div>
    );
  }

  return (
    <div className="rounded-lg border px-3.5 py-3">
      <div className="flex items-center gap-1.5">
        <Icon name="edit_note" size={14} className="text-muted-foreground" />
        <Kicker>Draft · not sent</Kicker>
      </div>
      <p className="mt-1.5 text-sm">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
      <div className="mt-3 flex items-center gap-2 border-t pt-3">
        <Action
          kind="secondary"
          size="sm"
          icon="open_in_new"
          onClick={() => {
            setTaken('accepted');
            onAccept?.(title);
          }}
        >
          {accept}
        </Action>
        <Action kind="ghost" size="sm" onClick={() => setTaken('discarded')}>
          Discard
        </Action>
      </div>
    </div>
  );
}

/** One block. Returns null for anything the host did not allow — the allowlist
 *  is enforced here, at the only place every block passes through. */
function Block({
  block,
  text,
  components,
}: {
  block: AnswerBlock;
  /** The partially-typed text, when this block is the one being written. */
  text?: string;
  components: AnswerComponents;
}) {
  switch (block.kind) {
    case 'text':
      return <p className="text-sm leading-relaxed">{text ?? block.text}</p>;
    case 'callout':
      return <Callout tone={block.tone}>{text ?? block.text}</Callout>;
    case 'figures':
      return (
        <div className="grid grid-cols-2 overflow-hidden rounded-lg border sm:grid-cols-3">
          {block.items.map((f) => (
            <Stat key={f.label} label={f.label} value={f.value} sub={f.sub} />
          ))}
        </div>
      );
    case 'propose':
      return (
        <Proposal
          title={block.title}
          detail={block.detail}
          accept={block.accept}
          onAccept={components.onAccept}
        />
      );
    case 'goto':
      return <>{components.goto?.(block.href, block.label) ?? null}</>;
    case 'docket':
      return <>{components.docket?.(block.id) ?? null}</>;
    case 'vehicle':
      return <>{components.vehicle?.(block.id) ?? null}</>;
    case 'job':
      return <>{components.job?.(block.id) ?? null}</>;
    case 'exception':
      return <>{components.exception?.(block.id) ?? null}</>;
    case 'order':
      return <>{components.order?.(block.id) ?? null}</>;
    default:
      // A kind added to the contract and not yet handled here. Nothing, never a
      // crash: an answer is untrusted output, and one unknown tag must not take
      // the surface down with it.
      return null;
  }
}

// ── the transcript ──────────────────────────────────────────────────────────

/** The three dots. Says the agent is composing, not that something is loading —
 *  a spinner here would mean "something, for a while". */
export function Thinking() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="Composing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground"
          style={{ animation: `gaia-pulse 1.1s ${i * 0.15}s infinite ease-in-out` }}
        />
      ))}
    </div>
  );
}

/**
 * The transcript.
 *
 * The user's turn is a pill on the right; the agent's is full width with no
 * container at all. Deliberately asymmetric: what the agent returns is app
 * content — real cards, real figures — and boxing it in a speech bubble would
 * make a docket card look like a picture of one.
 */
export function ChatLog({
  turns,
  thinking,
  components,
  empty,
}: {
  turns: Turn[];
  thinking: boolean;
  components: AnswerComponents;
  /** Shown when there is nothing yet — starter chips and what this can do. */
  empty?: ReactNode;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, thinking]);

  if (turns.length === 0 && !thinking) {
    return <div className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto px-4 pb-4 lg:px-6">{empty}</div>;
  }

  return (
    // The inner `min-h-full … justify-end` is what keeps a SHORT conversation
    // sitting on the composer instead of pinned to the top of a mostly empty
    // card with the reply a screen away from the thing that produced it. Once
    // the thread outgrows the card the inner grows past `min-h-full` and it
    // scrolls normally, so this costs nothing at length.
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 lg:px-6">
      <div className="flex min-h-full flex-col justify-end gap-5">
        {turns.map((t, i) =>
          t.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl bg-muted/50 px-3.5 py-2 text-sm">{t.text}</p>
            </div>
          ) : (
            <div key={i} className="flex flex-col gap-3">
              {t.blocks.slice(0, t.shown).map((b, j) => (
                <Block key={j} block={b} components={components} />
              ))}
              {t.partial && t.shown < t.blocks.length && (
                <Block block={t.blocks[t.shown]!} text={t.partial} components={components} />
              )}
            </div>
          ),
        )}
        {thinking && <Thinking />}
        <div ref={endRef} />
      </div>
    </div>
  );
}

/** The starter chips. Questions, not commands — what the agent can answer is
 *  the thing worth advertising, and every one of these is scripted. */
export function Starters({ items, onPick }: { items: string[]; onPick: (q: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => onPick(q)}
          className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
