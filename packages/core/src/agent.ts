/**
 * The agent's answer format, and the scripted exchanges the prototype answers
 * with.
 *
 * ## Why an answer is not a string
 *
 * Lifted from Syvon's `@syvon/mdx-chat`, where a model's reply is MDX compiled
 * against an ALLOWLISTED component map: the agent writes prose, and inside that
 * prose it can place real product components — a comp card, a product, a button
 * that navigates. The reply is part of the app, not a transcript of a
 * conversation about the app.
 *
 * That is worth far more here than it is there. "Where is GPP 3106" answered as
 * a sentence is a claim the reader has to go and check; answered as the actual
 * `Card` with the actual `Status` on it, from the same fixture the map reads, it
 * is the record. This product sells evidence — an agent that paraphrases the
 * evidence into prose is working against it.
 *
 * ## The allowlist is a safety property, not a convenience
 *
 * `mdx-chat` wraps its component map in a Proxy so a tag the model invented
 * resolves to a harmless fallback instead of throwing, because a single bad tag
 * would otherwise white-screen the chat. The same rule holds here in a stronger
 * form: a block naming a docket that does not exist renders NOTHING rather than
 * an empty card. An agent that can draw a docket-shaped box around a number it
 * made up is the one failure this surface cannot have.
 *
 * ## What is stubbed, and what is not
 *
 * The real implementation compiles MDX. This does not — there is no compiler in
 * this repo and adding one to fake a conversation is backend weight in a front
 * end phase. What IS real: the block contract, the allowlist, the graceful
 * degradation, and the rule that a `propose` block is the ONLY thing the agent
 * may emit that would change anything. Swapping the stub for a compiler later
 * changes how blocks are PRODUCED, not what they are.
 *
 * Nothing here calls a model. The exchanges are canned and matched on keywords.
 */

// ── the answer ──────────────────────────────────────────────────────────────

/**
 * One block of an agent answer.
 *
 * Every block that names a record names it by ID, never by value. The renderer
 * looks the record up in the same fixtures the screens read, so an answer
 * cannot disagree with the surface underneath it — the same reason vehicle
 * positions are derived from the live docket rather than stored beside it.
 */
export type AnswerBlock =
  /** Prose. The connective tissue, never the evidence. */
  | { kind: 'text'; text: string }
  /** A note or a warning. `warn` is for something the reader must act on. */
  | { kind: 'callout'; tone: 'note' | 'warn'; text: string }
  /** A record, rendered as the app's own card for it. */
  | { kind: 'docket'; id: string }
  | { kind: 'vehicle'; id: string }
  | { kind: 'job'; id: string }
  | { kind: 'exception'; id: string }
  | { kind: 'order'; id: string }
  /** Figures. Same `Stat` the screens use, so a count in an answer and the same
   *  count on the map are typographically one thing. */
  | { kind: 'figures'; items: { label: string; value: string; sub?: string }[] }
  /** A way into the app. The agent hands the reader the surface that owns the
   *  record rather than becoming a second place to work with it. */
  | { kind: 'goto'; href: string; label: string }
  /**
   * A DRAFT the agent has prepared and cannot enact.
   *
   * This is `Proposal` from the spec, as a UI object: the agent's output is a
   * row a human accepts. Rendering it as a card with Accept and Discard is what
   * makes the commit line visible rather than merely written down — see the
   * refusal exchange below for the other half of the same rule.
   */
  | { kind: 'propose'; title: string; detail: string; accept: string };

/** A canned exchange. `match` is lowercase substrings; first hit wins. */
export interface AgentExchange {
  /** Offered as a starter chip when the conversation is empty. Omit to keep the
   *  exchange reachable by typing but off the suggestion run. */
  ask?: string;
  match: string[];
  answer: AnswerBlock[];
}

/** What the agent says when nothing matches. Says what it CAN do — an agent
 *  that answers "I don't understand" teaches the reader to stop asking. */
export const AGENT_FALLBACK: AnswerBlock[] = [
  {
    kind: 'text',
    text: 'I can read this org’s jobs, dockets, positions, exceptions and statements, and I can draft — a quote reply, a resolution note, a message to a hauler. I can’t close, void, verify or price anything; those need you.',
  },
  { kind: 'text', text: 'Try one of the questions below, or ask about a plate or a docket number.' },
];

// ── the ops script ──────────────────────────────────────────────────────────

/**
 * The coordinator's agent.
 *
 * The four exchanges are the four in the spec's own order of value — a position
 * query, an exception triage, a draft, and the refusal. The refusal is not a
 * curiosity: it is the one exchange that demonstrates the rule instead of
 * asserting it, and it is scripted so that it cannot quietly stop being true.
 */
export const OPS_AGENT_SCRIPT: AgentExchange[] = [
  {
    ask: 'Where is GPP 3106?',
    match: ['gpp', '3106', 'where is', 'position'],
    answer: [
      { kind: 'text', text: 'On the road, carrying white sand from Yarrowkabra to Eccles Block C.' },
      { kind: 'vehicle', id: 'veh_1' },
      {
        kind: 'callout',
        tone: 'warn',
        text: 'The last fix is 34 minutes old at ±180 m. That is stale enough that I would not trust the position on the map — the truck may well be where it shows, but nothing has confirmed it since.',
      },
      { kind: 'goto', href: '/map', label: 'Open the fleet map' },
    ],
  },
  {
    ask: 'What is open on exceptions?',
    match: ['exception', 'open on', 'flagged', 'wrong'],
    answer: [
      { kind: 'text', text: 'Four open. They fall into two groups.' },
      {
        kind: 'figures',
        items: [
          { label: 'Position disputed', value: '2', sub: 'geofence vs GPS' },
          { label: 'Evidence missing', value: '1', sub: 'no dump photo' },
          { label: 'Unused number', value: '1', sub: 'block gap' },
        ],
      },
      {
        kind: 'text',
        text: 'The two position disputes are the same truck on the same run, which usually means the site boundary is drawn tight rather than that the driver was somewhere else.',
      },
      {
        kind: 'propose',
        title: 'Widen the Eccles Block C boundary by 40 m',
        detail:
          'Would clear both disputes and stop the pair recurring on tomorrow’s runs. It also loosens the check that produced them — which is why it is yours to decide, not mine.',
        accept: 'Accept and open Sites',
      },
      { kind: 'goto', href: '/work/exceptions', label: 'Open exceptions' },
    ],
  },
  {
    ask: 'Draft a reply to the Loam request',
    match: ['draft', 'reply', 'quote', 'loam', 'request'],
    answer: [
      {
        kind: 'text',
        text: 'Eight loads of loam to Mahaica — a new depot, so there is no rate history on that site. I have used the 8×4 Chinese rate and the standard 30-day terms.',
      },
      {
        kind: 'propose',
        title: 'Quote 8 × loam to Mahaica at G$52,000/load',
        detail:
          'G$416,000 total, 30-day terms, first load Thursday. I have not sent it and I cannot: a price is a commitment, and it is yours to make.',
        accept: 'Open the quote to review',
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'Mahaica is 61 km further than any site on this rate card. Worth checking the rate before it becomes the precedent for that depot.',
      },
    ],
  },
  {
    // THE refusal. Reachable by typing, deliberately off the suggestion chips —
    // a starter that invites the reader to ask for something they cannot have
    // teaches the wrong thing about the surface.
    match: ['close docket', 'close the docket', 'void', 'mark delivered', 'sign off', 'approve'],
    answer: [
      {
        kind: 'text',
        text: 'No — I can’t close, void or verify a docket, and this is the one limit that is not a setting.',
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'A docket is the evidence that the work happened. The moment an agent can write that proof, the proof stops being evidence and becomes a record of what a model believed. So the commit line is absolute: I read, and I draft.',
      },
      {
        kind: 'text',
        text: 'What I can do is have it ready for you — the docket open, the photos side by side, and the discrepancy called out.',
      },
      { kind: 'goto', href: '/work/dockets', label: 'Open dockets' },
    ],
  },
];

// ── the buyer script ────────────────────────────────────────────────────────

/**
 * The contractor's agent — the spec's second tier, and a narrower one.
 *
 * Read-only, scoped to that buyer's org, and it never promises allocation. In a
 * supply-constrained market an agent that says "yes, Thursday" is worse than no
 * agent: it converts a scheduling problem into a broken commitment, and the
 * vendor wears it.
 */
export const BUYER_AGENT_SCRIPT: AgentExchange[] = [
  {
    ask: 'How much sand has arrived?',
    match: ['how much', 'arrived', 'delivered', 'sand', 'progress'],
    answer: [
      { kind: 'text', text: 'Fifteen of twenty loads on the Eccles Block C order.' },
      { kind: 'order', id: 'ord_1' },
      {
        kind: 'text',
        text: 'Every one of those fifteen was photographed at the pit and at your site, and its position checked against the boundary. Five still to come.',
      },
    ],
  },
  {
    ask: 'When will the rest arrive?',
    match: ['when', 'rest', 'finish', 'eta', 'tomorrow'],
    answer: [
      {
        kind: 'text',
        text: 'I can tell you where the trucks are, not when they will be with you — Saturn schedules the runs and I would only be guessing at their day.',
      },
      {
        kind: 'figures',
        items: [
          { label: 'On the road', value: '1' },
          { label: 'At a site', value: '1', sub: 'loading or dumping' },
          { label: 'Still to come', value: '5' },
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'Three loads landed yesterday between 09:00 and 14:00. That is the pattern so far, not a commitment.',
      },
    ],
  },
  {
    ask: 'What do I owe?',
    match: ['owe', 'balance', 'invoice', 'statement', 'pay'],
    answer: [
      {
        kind: 'figures',
        items: [
          { label: 'Balance', value: 'G$15,466,000', sub: 'statement 2026-08-31' },
          { label: 'Terms', value: '30 days' },
        ],
      },
      {
        kind: 'text',
        text: 'That is closed dockets only — the five loads still to come are not on it, and nothing is billed before it is delivered and evidenced.',
      },
      { kind: 'goto', href: '/account', label: 'Open the statement' },
    ],
  },
  {
    match: ['order more', 'place an order', 'book', 'add loads', 'confirm'],
    answer: [
      {
        kind: 'text',
        text: 'I can fill the order in for you, but I can’t place it — Saturn has to quote it, and a price I invented would be a commitment nobody made.',
      },
      {
        kind: 'propose',
        title: '36 × crusher run to Providence',
        detail: 'Same material and site as your last order. Nothing is sent until you review and submit it.',
        accept: 'Open the order form',
      },
    ],
  },
];

/** First match wins; falls through to the fallback. */
export function answerFor(script: AgentExchange[], question: string): AnswerBlock[] {
  const q = question.toLowerCase();
  const hit = script.find((e) => e.match.some((m) => q.includes(m)));
  return hit?.answer ?? AGENT_FALLBACK;
}

/** The starter chips — the exchanges that chose to offer themselves. */
export function starters(script: AgentExchange[]): string[] {
  return script.map((e) => e.ask).filter((a): a is string => !!a);
}
