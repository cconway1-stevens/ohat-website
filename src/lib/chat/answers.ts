/**
 * Tread's brain — the fully local Q&A index behind the contact-page tire pal.
 *
 * No network, no API, no model: a tiny TF-IDF-ish matcher over content the
 * site already owns (the service catalog's FAQs, the shop config, the live
 * hours logic). Everything runs in the browser and in `node --test`, so the
 * static export carries the whole thing and the widget works offline.
 *
 * Answers always end in a next step (call / directions / save the card /
 * service page) — the widget's job is to move the customer one click closer
 * to the bay, not to be an encyclopedia.
 */
import { services } from "../services.ts";
import { shop } from "../shop/shop.mjs";
import { getShopHoursStatus } from "../shop/shop-hours.mjs";

export type ChatChip = {
  label: string;
  href: string;
  kind: "call" | "directions" | "download" | "email" | "link";
};

export type ChatAnswer = {
  text: string;
  chips: ChatChip[];
  /** Set when a service page is the natural next step. */
  serviceSlug?: string;
  /** True when nothing matched — the widget styles this as Tread shrugging. */
  fallback?: boolean;
};

type HoursStatus = {
  label: string;
  status: "open" | "opening-soon" | "closing-soon" | "closed";
  holiday: string | null;
  holidayNotice: string | null;
};
const hoursStatus = getShopHoursStatus as (now?: Date) => HoursStatus;

/* --- chips ------------------------------------------------------------- */

const callChip: ChatChip = {
  label: `Call ${shop.phone.display}`,
  href: shop.phone.href,
  kind: "call",
};
const directionsChip: ChatChip = {
  label: "Get directions",
  href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shop.address.full)}`,
  kind: "directions",
};
const saveChip: ChatChip = {
  label: "Add to contacts",
  href: "/contact-card.vcf",
  kind: "download",
};
const emailChip: ChatChip = {
  label: "Email the shop",
  href: `mailto:${shop.email.service}`,
  kind: "email",
};
const serviceChip = (slug: string, name: string): ChatChip => ({
  label: name,
  href: `/services/${slug}`,
  kind: "link",
});

/* --- tokenizing --------------------------------------------------------- */

const STOPWORDS = new Set(
  (
    "my me i you your yours we our they their them he she it its this that these those there here " +
    "the a an is are was were be been being do does did done can could should would will shall may might " +
    "what when where which who whom how why to too for of on in at by with from about and or but if so " +
    "just really very some any no not dont get got getting have has had having need needs needed want " +
    "wants wanted know think thanks thank please hi hey hello yeah yes ok okay car cars vehicle vehicles " +
    "auto shops guys people someone something anything im ive id youre"
  ).split(" "),
);

/** Variant → the form the site's own copy uses, so slang lands on real words. */
const SYNONYMS: Record<string, string> = {
  puncture: "flat",
  punctured: "flat",
  blowout: "flat",
  tyre: "tire",
  tpms: "tire",
  patch: "repair",
  plug: "repair",
  fix: "repair",
  fixes: "repair",
  squeak: "squeal",
  squeaking: "squeal",
  wobble: "vibration",
  wobbling: "vibration",
  shimmy: "vibration",
  shaking: "vibration",
  pulling: "pull",
  drifting: "pull",
  veer: "pull",
  veers: "pull",
  jump: "start",
  jumps: "start",
  jumped: "start",
  crank: "start",
  cranking: "start",
  overheat: "temperature",
  overheating: "temperature",
  overheats: "temperature",
  ac: "air",
  aircon: "air",
  oilchange: "oil",
  tesla: "ev",
  prius: "hybrid",
  muffler: "exhaust",
  inspection: "emissions",
  inspections: "emissions",
  inspect: "emissions",
};

/** Crude suffix stripping — good enough at this vocabulary size. */
function stem(token: string): string {
  let t = token;
  if (t.endsWith("ing") && t.length > 6) t = t.slice(0, -3);
  else if (t.endsWith("ed") && t.length > 5) t = t.slice(0, -2);
  else if (t.endsWith("es") && t.length > 5) t = t.slice(0, -2);
  else if (t.endsWith("s") && !t.endsWith("ss") && t.length > 3) t = t.slice(0, -1);
  // "stopping" → "stopp" → "stop".
  if (t.length > 3 && t[t.length - 1] === t[t.length - 2] && !"aeiou".includes(t[t.length - 1])) {
    t = t.slice(0, -1);
  }
  return t;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((raw) => stem(SYNONYMS[raw] ?? raw))
    .filter((t) => !STOPWORDS.has(t) && t.length > 1);
}

/* --- the index ---------------------------------------------------------- */

type Entry = {
  id: string;
  kind: "intent" | "faq" | "service";
  vocab: Map<string, number>;
  intent?: (now: Date) => ChatAnswer;
  serviceSlug?: string;
  serviceName?: string;
  faqQuestion?: string;
  faqAnswer?: string;
};

function addWords(vocab: Map<string, number>, text: string, weight: number) {
  for (const token of tokenize(text)) {
    vocab.set(token, (vocab.get(token) ?? 0) + weight);
  }
}

function hoursAnswer(now: Date): ChatAnswer {
  const status = hoursStatus(now);
  const lines: string[] = [];
  if (status.status === "open") {
    lines.push(`Yes — we're open right now. Hours: ${shop.hours.display}.`);
  } else if (status.status === "closing-soon") {
    lines.push(
      "We're open but closing soon today — if it's urgent, call now and we'll say what's doable.",
    );
  } else if (status.status === "opening-soon") {
    lines.push(`Almost — we open at ${shop.hours.opens.replace("08", "8")} AM today.`);
  } else {
    lines.push(`${status.label}.`);
  }
  if (status.holidayNotice) lines.push(status.holidayNotice);
  if (status.status !== "open")
    lines.push(`Regular hours: ${shop.hours.display}. ${shop.hours.closedNote}`);
  return { text: lines.join(" "), chips: [callChip, directionsChip] };
}

const INTENTS: { id: string; triggers: string[]; build: (now: Date) => ChatAnswer }[] = [
  {
    id: "hours",
    triggers: [
      "open",
      "closed",
      "close",
      "closes",
      "hours",
      "hour",
      "today",
      "tomorrow",
      "weekend",
      "saturday",
      "sunday",
      "opening",
      "closing",
      "late",
      "early",
      "tonight",
    ],
    build: hoursAnswer,
  },
  {
    id: "location",
    triggers: [
      "where",
      "located",
      "location",
      "address",
      "directions",
      "direction",
      "park",
      "parking",
      "find",
      "map",
      "drive",
      "driving",
      "far",
      "town",
      "eht",
    ],
    build: () => ({
      text: `We're at ${shop.address.full}. Customer parking is right out front, and there's a comfortable waiting area if you stay.`,
      chips: [directionsChip, callChip],
    }),
  },
  {
    id: "phone",
    triggers: [
      "phone",
      "number",
      "call",
      "calling",
      "dial",
      "ring",
      "telephone",
      "reach",
      "talk",
      "speak",
      "human",
      "person",
    ],
    build: (now) => ({
      text: `The shop line is ${shop.phone.display}. ${hoursStatus(now).label}.`,
      chips: [callChip, saveChip],
    }),
  },
  {
    id: "save-contact",
    triggers: ["save", "saved", "contact", "contacts", "vcard", "add", "download", "keep", "handy"],
    build: () => ({
      text: "Nice — tap below to save the shop card: phone, email, address and hours in one tap. We're in your phone before you ever need a tow.",
      chips: [saveChip, callChip],
    }),
  },
  {
    id: "email",
    triggers: ["email", "mail", "write", "inbox", "message"],
    build: () => ({
      text: `Write us at ${shop.email.service}. Receipts arrive from ${shop.email.receipts} — that inbox is outbound-only, so don't reply there.`,
      chips: [emailChip, callChip],
    }),
  },
  {
    id: "dropoff",
    triggers: [
      "drop",
      "dropoff",
      "leave",
      "leaving",
      "overnight",
      "night",
      "keys",
      "key",
      "lockbox",
      "after",
    ],
    build: () => ({
      text: "Use the secure night drop — it's available around the clock, so you can leave the car and keys any time and we call you once we've looked it over.",
      chips: [{ label: "Night drop details", href: "/vehicle-drop-off", kind: "link" }, callChip],
    }),
  },
  {
    id: "booking",
    triggers: [
      "book",
      "booking",
      "appointment",
      "appointments",
      "schedule",
      "slot",
      "reserve",
      "reservation",
      "walkin",
      "availability",
      "available",
    ],
    build: () => ({
      text: "The fastest way to grab a bay is a quick call — we'll tell you the next opening and what to bring.",
      chips: [callChip, emailChip],
    }),
  },
  {
    id: "cost",
    triggers: [
      "much",
      "cost",
      "costs",
      "price",
      "prices",
      "pricing",
      "quote",
      "estimate",
      "estimates",
      "expensive",
      "cheap",
      "charge",
      "fee",
      "fees",
      "rate",
      "rates",
      "ballpark",
      "pay",
      "worth",
      "afford",
    ],
    build: () => ({
      text: "Every job starts with findings and your approval before work begins — no surprise bills. Exact pricing depends on the vehicle, so call with the year, make and model for a ballpark.",
      chips: [callChip],
    }),
  },
  {
    id: "waiting",
    triggers: ["wait", "waiting", "lobby", "wifi", "sit", "stay", "staying", "ride", "rideshare"],
    build: () => ({
      text: "There's a comfortable waiting area if you stay — and we call with findings before any work begins, so you're never guessing.",
      chips: [callChip, directionsChip],
    }),
  },
  {
    id: "services",
    triggers: [
      "services",
      "offer",
      "offers",
      "specialize",
      "list",
      "everything",
      "repairs",
      "work",
    ],
    build: () => ({
      text: `Diagnostics, brakes, tires, alignments, oil and maintenance, hybrid/EV, A/C, cooling, suspension, transmissions, batteries, diesel, recalls and exhaust — the catalog has the details.`,
      chips: [{ label: "All services", href: "/services", kind: "link" }, callChip],
    }),
  },
];

function buildIndex(): Entry[] {
  const entries: Entry[] = [];
  for (const intent of INTENTS) {
    const vocab = new Map<string, number>();
    for (const trigger of intent.triggers) {
      const token = stem(SYNONYMS[trigger] ?? trigger);
      vocab.set(token, (vocab.get(token) ?? 0) + 6);
    }
    entries.push({ id: intent.id, kind: "intent", vocab, intent: intent.build });
  }
  for (const service of services) {
    const serviceVocab = new Map<string, number>();
    addWords(serviceVocab, service.name, 4);
    addWords(serviceVocab, service.short, 2);
    addWords(serviceVocab, service.signs.join(" "), 2);
    addWords(serviceVocab, service.includes.join(" "), 1);
    entries.push({
      id: `service:${service.slug}`,
      kind: "service",
      vocab: serviceVocab,
      serviceSlug: service.slug,
      serviceName: service.name,
    });
    for (const faq of service.faqs) {
      const vocab = new Map<string, number>();
      addWords(vocab, faq.question, 3);
      addWords(vocab, faq.answer, 1);
      addWords(vocab, service.name, 2);
      entries.push({
        id: `faq:${service.slug}:${faq.question.slice(0, 24)}`,
        kind: "faq",
        vocab,
        serviceSlug: service.slug,
        serviceName: service.name,
        faqQuestion: faq.question,
        faqAnswer: faq.answer,
      });
    }
  }
  return entries;
}

const INDEX = buildIndex();

/** Inverse document frequency across the whole index, so "flat" outranks "car". */
const IDF = (() => {
  const df = new Map<string, number>();
  for (const entry of INDEX) {
    for (const token of entry.vocab.keys()) df.set(token, (df.get(token) ?? 0) + 1);
  }
  const idf = new Map<string, number>();
  for (const [token, count] of df) idf.set(token, Math.log(1 + INDEX.length / count));
  return idf;
})();

function score(entry: Entry, tokens: string[]): number {
  let total = 0;
  for (const token of tokens) {
    const weight = entry.vocab.get(token);
    if (weight) total += weight * (IDF.get(token) ?? 1);
  }
  return total;
}

/** Below this, Tread admits defeat and hands over to the humans. */
const THRESHOLD = 6;
/** Long FAQ answers get trimmed to a chat-sized bubble with a read-more chip. */
const FAQ_BUBBLE = 340;

function trimForBubble(text: string): string {
  if (text.length <= FAQ_BUBBLE) return text;
  const cut = text.slice(0, FAQ_BUBBLE);
  const lastSentence = Math.max(
    cut.lastIndexOf(". "),
    cut.lastIndexOf("! "),
    cut.lastIndexOf("? "),
  );
  return lastSentence > FAQ_BUBBLE / 2 ? cut.slice(0, lastSentence + 1) : cut.trimEnd() + "…";
}

/** Why a question matched — surfaced by the /adgent studio's brain lab. */
export type DebugMatch = {
  kind: "intent" | "faq" | "service";
  id: string;
  score: number;
  label: string;
};

type Resolved = {
  answer: ChatAnswer;
  matched: DebugMatch | null;
  tokens: string[];
};

function resolve(input: string, now: Date): Resolved {
  const tokens = tokenize(input);
  if (tokens.length === 0) return { answer: fallbackAnswer(), matched: null, tokens };

  let bestIntent: { entry: Entry; score: number } | null = null;
  let bestFaq: { entry: Entry; score: number } | null = null;
  let bestService: { entry: Entry; score: number } | null = null;
  for (const entry of INDEX) {
    const s = score(entry, tokens);
    if (s < THRESHOLD) continue;
    if (entry.kind === "intent" && (!bestIntent || s > bestIntent.score))
      bestIntent = { entry, score: s };
    if (entry.kind === "faq" && (!bestFaq || s > bestFaq.score)) bestFaq = { entry, score: s };
    if (entry.kind === "service" && (!bestService || s > bestService.score))
      bestService = { entry, score: s };
  }

  // "How much is an oil change?" — the cost intent plus a confident service
  // match gets the service's own cost explainer, not the generic money answer.
  if (bestIntent?.entry.id === "cost" && bestService && bestService.score >= THRESHOLD) {
    const service = services.find((s) => s.slug === bestService!.entry.serviceSlug)!;
    return {
      answer: {
        text: trimForBubble(service.cost),
        chips: [serviceChip(service.slug, service.name), callChip],
        serviceSlug: service.slug,
      },
      matched: {
        kind: "service",
        id: `service:${service.slug}`,
        score: bestService.score,
        label: service.name,
      },
      tokens,
    };
  }

  const top = [bestIntent, bestFaq, bestService]
    .filter(Boolean)
    .sort((a, b) => b!.score - a!.score)[0];
  if (!top) return { answer: fallbackAnswer(), matched: null, tokens };

  if (top.entry.kind === "intent") {
    return {
      answer: top.entry.intent!(now),
      matched: { kind: "intent", id: top.entry.id, score: top.score, label: top.entry.id },
      tokens,
    };
  }

  if (top.entry.kind === "faq") {
    return {
      answer: {
        text: trimForBubble(top.entry.faqAnswer!),
        chips: [serviceChip(top.entry.serviceSlug!, `${top.entry.serviceName} details`), callChip],
        serviceSlug: top.entry.serviceSlug,
      },
      matched: {
        kind: "faq",
        id: top.entry.id,
        score: top.score,
        label: `${top.entry.serviceName} — ${top.entry.faqQuestion!.slice(0, 40)}`,
      },
      tokens,
    };
  }

  const service = services.find((s) => s.slug === top.entry.serviceSlug)!;
  return {
    answer: {
      text: `${service.short} ${trimForBubble(service.intro)}`,
      chips: [serviceChip(service.slug, service.name), callChip],
      serviceSlug: service.slug,
    },
    matched: {
      kind: "service",
      id: `service:${service.slug}`,
      score: top.score,
      label: service.name,
    },
    tokens,
  };
}

/** The main entry point: one question in, one answer (with next steps) out. */
export function answerQuestion(input: string, now: Date = new Date()): ChatAnswer {
  return resolve(input, now).answer;
}

/** Studio-only: the answer plus why it matched, for the /adgent brain lab. */
export function debugAnswer(input: string, now: Date = new Date()): Resolved {
  return resolve(input, now);
}

function fallbackAnswer(): ChatAnswer {
  return {
    text: "I'm just a tire — that one's beyond me. A human at the counter can help:",
    chips: [callChip, emailChip],
    fallback: true,
  };
}

/** The opening line, aware of whether the shop is open right now. */
export function treadGreeting(now: Date = new Date()): string {
  const status = hoursStatus(now);
  if (status.status === "open" || status.status === "closing-soon") {
    return "Hi! I'm Tread, the shop tire. We're open right now — ask me about hours, services or directions, or save our number for later.";
  }
  return "Hi! I'm Tread, the shop tire. We're closed right now, but I can still answer questions — or save our number for the morning.";
}

/** One-tap starters shown above the input. */
export const quickPrompts = [
  "Are you open?",
  "Can you fix a flat?",
  "Book an appointment",
  "Save your number",
];
