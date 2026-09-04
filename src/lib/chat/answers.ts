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

import { makes } from "../makes.ts";
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
  /** True when an FAQ answer was trimmed at the bubble boundary. */
  trimmed?: boolean;
  /** The full untrimmed FAQ answer when `trimmed` is true. */
  fullText?: string;
  /** "Did you mean…" candidates surfaced when nothing crosses threshold. */
  suggestions?: string[];
};

/**
 * Who the mascot is, for copy templates. Every sprite points at this shape
 * (`PixelCharacter.persona` + its name) and the brain auto-fills:
 * greeting "Hi! I'm {name}, {kind}.", identity "I'm {name}, {kind} — …",
 * fallback "I'm just {self} — that one's beyond me."
 */
export type ChatPersona = {
  name: string;
  kind: string;
  self: string;
};

/** The production widget's persona — Tread, the shop tire. */
export const TREAD_PERSONA: ChatPersona = {
  name: "Tread",
  kind: "the shop tire",
  self: "a tire",
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
  // Flat tires
  puncture: "flat",
  punctured: "flat",
  blowout: "flat",
  // Tires
  tyre: "tire",
  tpms: "tire",
  // Repair
  patch: "repair",
  plug: "repair",
  fix: "repair",
  fixes: "repair",
  // Brakes
  squeak: "squeal",
  squeaking: "squeal",
  squealing: "squeal",
  braking: "brake",
  brakes: "brake",
  pad: "brake",
  pads: "brake",
  rotor: "brake",
  rotors: "brake",
  caliper: "brake",
  calipers: "brake",
  // Vibration / pull
  wobble: "vibration",
  wobbling: "vibration",
  shimmy: "vibration",
  shaking: "vibration",
  pulling: "pull",
  drifting: "pull",
  veer: "pull",
  veers: "pull",
  // Starting
  jump: "start",
  jumps: "start",
  jumped: "start",
  crank: "start",
  cranking: "start",
  // Cooling
  overheat: "temperature",
  overheating: "temperature",
  overheats: "temperature",
  coolant: "cooling",
  antifreeze: "cooling",
  radiator: "cooling",
  thermostat: "cooling",
  // A/C and climate
  ac: "air",
  aircon: "air",
  heater: "air",
  // Oil
  oilchange: "oil",
  // Hybrid / EV
  tesla: "ev",
  prius: "hybrid",
  priuses: "hybrid",
  hybrids: "hybrid",
  electric: "ev",
  electrified: "ev",
  // Diagnostics
  diagnose: "diagnostic",
  diagnosing: "diagnostic",
  diagnosis: "diagnostic",
  // Alignment
  align: "alignment",
  aligned: "alignment",
  // Transmission
  trans: "transmission",
  tranny: "transmission",
  gearbox: "transmission",
  // Electrical
  alternator: "electrical",
  starter: "electrical",
  wiring: "electrical",
  ecu: "electrical",
  ecm: "electrical",
  electricals: "electrical",
  // Suspension
  shock: "suspension",
  shocks: "suspension",
  strut: "suspension",
  struts: "suspension",
  // Exhaust
  muffler: "exhaust",
  catalytic: "exhaust",
  // Emissions / inspection
  inspection: "emissions",
  inspections: "emissions",
  inspect: "emissions",
  inspected: "emissions",
  inspecting: "emissions",
  // Breakdown — the urgent intent's canonical token.
  broke: "breakdown",
  broken: "breakdown",
  stranded: "breakdown",
  stuck: "breakdown",
  // Tire brands → routed to the tires service via the matcher; the synonym
  // folds the brand into a generic "tire" so brand-specific queries land on
  // the tires vocabulary instead of failing.
  michelin: "tire",
  goodyear: "tire",
  bridgestone: "tire",
  continental: "tire",
  firestone: "tire",
  yokohama: "tire",
  toyo: "tire",
  hankook: "tire",
  nitto: "tire",
  pirelli: "tire",
  cooper: "tire",
  kumho: "tire",
  falken: "tire",
  general: "tire",
};

/**
 * Spanish-language synonyms for the same slang. Merged with SYNONYMS only
 * when the input contains Spanish-language signals (accented chars or a
 * Spanish stopword), so a stray "ó" doesn't accidentally rewrite English.
 */
const SYNONYMS_ES: Record<string, string> = {
  frenos: "brake",
  freno: "brake",
  llanta: "tire",
  llantas: "tire",
  neumatico: "tire",
  neumaticos: "tire",
  pinchazo: "flat",
  pinchados: "flat",
  aire: "air",
  bateria: "battery",
  baterias: "battery",
  aceite: "oil",
  escape: "exhaust",
  alineacion: "alignment",
  alineamiento: "alignment",
  suspension: "suspension",
  direccion: "steering",
  motor: "engine",
  diagnostico: "diagnostics",
};

/** Spanish stopwords — if any appear, the input is treated as Spanish. */
const SPANISH_HINTS = new Set([
  "hola",
  "como",
  "donde",
  "tienes",
  "cuanto",
  "cuanta",
  "cuantos",
  "cuantas",
  "ustedes",
  "gracias",
  "buenos",
  "buenas",
  "por",
  "para",
  "puedes",
  "tiene",
  "tienen",
]);

function isLikelySpanish(text: string): boolean {
  if (/[áéíóúñ¿¡]/i.test(text)) return true;
  const lowered = text.toLowerCase();
  for (const word of SPANISH_HINTS) {
    if (new RegExp(`\\b${word}\\b`, "i").test(lowered)) return true;
  }
  return false;
}

function pickSynonyms(text: string, base: Record<string, string>): Record<string, string> {
  if (!isLikelySpanish(text)) return base;
  return { ...base, ...SYNONYMS_ES };
}

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

function tokenize(
  text: string,
  synonyms: Record<string, string> = SYNONYMS,
  vocab?: Set<string>,
): string[] {
  const merged = pickSynonyms(text, synonyms);
  const rawTokens = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean);
  return rawTokens
    .map((raw) => {
      const direct = merged[raw] ?? raw;
      const stemmed = stem(direct);
      // Fuzzy fallback: if the stemmed token isn't in the global vocab (or
      // its synonym), try one-edit neighbors so "teir" still hits "tire",
      // "braks" still hits "brakes". Cheap because the vocab Set is tiny.
      if (!vocab || vocab.has(stemmed) || STOPWORDS.has(stemmed) || stemmed.length <= 2) {
        return stemmed;
      }
      const neighbor = nearestVocabNeighbor(stemmed, vocab);
      return neighbor ?? stemmed;
    })
    .filter((t) => !STOPWORDS.has(t) && t.length > 1);
}

/** One-edit-distance neighbors of a token, checked against the global vocab.
 *  Catches "teir→tire", "braks→brakes", "alignmnet→alignment", etc.
 *  The input token must be at least five characters: four-letter words have
 *  too many false-positive neighbors — "shot" was being rewritten to "slot"
 *  (a booking trigger), hijacking "my shocks are shot" into an appointment
 *  answer. Candidates may be four letters so "tired" still lands on "tire". */
function nearestVocabNeighbor(token: string, vocab: Set<string>): string | undefined {
  if (token.length < 5) return undefined;
  let best: { token: string; dist: number } | null = null;
  for (const candidate of vocab) {
    if (candidate.length < 4) continue;
    if (Math.abs(candidate.length - token.length) > 1) continue;
    if (!oneEdit(token, candidate)) continue;
    // Lower distance beats higher, then longer common prefix beats shorter.
    const dist = simpleEditDistance(token, candidate);
    if (best === null || dist < best.dist) best = { token: candidate, dist };
  }
  return best?.token;
}

/** Strict Levenshtein without transpositions, used only for fuzzy ranking. */
function simpleEditDistance(a: string, b: string): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  const prev = new Array(lb + 1).fill(0).map((_, i) => i);
  const curr = new Array(lb + 1).fill(0);
  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= lb; j++) prev[j] = curr[j];
  }
  return prev[lb];
}

function oneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  // Walk both strings with i/j and allow at most one operation (sub/ins/del
  // or a transposition for the common "recieve/receive" case).
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    edits++;
    if (edits > 1) return false;
    // Transposition: a[i] === b[j+1] and a[i+1] === b[j].
    if (i + 1 < la && j + 1 < lb && a[i] === b[j + 1] && a[i + 1] === b[j]) {
      i += 2;
      j += 2;
      continue;
    }
    if (la > lb) i++;
    else if (lb > la) j++;
    else {
      i++;
      j++;
    }
  }
  // Trailing characters count as one edit if present.
  if (i < la || j < lb) edits++;
  return edits <= 1;
}

/* --- the index ---------------------------------------------------------- */

type Entry = {
  id: string;
  kind: "intent" | "faq" | "service";
  vocab: Map<string, number>;
  intent?: (now: Date, persona?: ChatPersona) => ChatAnswer;
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

const INTENTS: {
  id: string;
  triggers: string[];
  build: (now: Date, persona?: ChatPersona) => ChatAnswer;
}[] = [
  {
    id: "identity",
    triggers: ["name", "bot", "robot", "mascot", "ai", "assistant", "tread"],
    build: (_now, persona = TREAD_PERSONA) => ({
      text: `I'm ${persona.name}, ${persona.kind} — here for quick questions about hours, services and directions. For anything car-specific, the humans at the counter know best.`,
      chips: [callChip, { label: "All services", href: "/services", kind: "link" }],
    }),
  },
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
      "talk",
      "speak",
      "human",
      "person",
      "representative",
      "agent",
      "operator",
      "manager",
      "owner",
      "receptionist",
      "counter",
      "front desk",
    ],
    build: (now) => ({
      text: `The shop line is ${shop.phone.display} — a person at the counter picks up, not a phone tree. ${hoursStatus(now).label}.`,
      chips: [callChip, saveChip, emailChip],
    }),
  },
  {
    id: "contact",
    triggers: [
      "contact",
      "contacts",
      "touch",
      "reach",
      "get ahold",
      "get hold",
      "get in touch",
      "contact info",
      "contact information",
      "reach out",
    ],
    build: () => ({
      text: `Everything in one place — call ${shop.phone.display}, email ${shop.email.service}, or stop by ${shop.address.full}. Save the card and it's all in your phone for the day you need it.`,
      chips: [callChip, emailChip, directionsChip, saveChip],
    }),
  },
  {
    id: "urgent",
    triggers: [
      "emergency",
      "urgent",
      "asap",
      "breakdown",
      "accident",
      "unsafe",
      "dangerous",
      "danger",
      "fire",
      "immediately",
    ],
    build: () => ({
      text: `If it's a true emergency — accident, fire, or smoke — call 911 first. Otherwise call the shop line right now and we'll tell you what's doable today: ${shop.phone.display}.`,
      chips: [callChip, directionsChip],
    }),
  },
  {
    id: "save-contact",
    triggers: ["save", "saved", "vcard", "add", "download", "keep", "handy"],
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
    triggers: ["services", "offer", "offers", "specialize", "list", "everything", "repairs"],
    build: () => ({
      text: `Diagnostics, brakes, tires, alignments, oil and maintenance, hybrid/EV, A/C, cooling, suspension, transmissions, batteries, diesel, recalls and exhaust — the catalog has the details.`,
      chips: [{ label: "All services", href: "/services", kind: "link" }, callChip],
    }),
  },
  {
    id: "state-inspection",
    triggers: [
      "state",
      "inspection",
      "safety",
      "sticker",
      "smog",
      "emissions test",
      "inspection station",
      "state inspection",
      "safety inspection",
    ],
    build: () => ({
      text: "The MVC inspection is free, and the closest station is right in Mays Landing — 1477 19th St. We're not a licensed state-inspection station, so we can't issue the sticker, but bring the car in and we can test it before you go: check-engine lights, exhaust leaks, and readiness monitors are what usually fail, and we'll get you ready to pass the first time. No inspection fee here — just our normal diagnostic time, and the sticker itself costs you nothing at the MVC.",
      chips: [
        { label: "Exhaust & emissions details", href: "/services/exhaust-emissions", kind: "link" },
        {
          label: "NJ MVC inspection locations",
          href: "https://www.nj.gov/mvc/locations/inspection.htm",
          kind: "link",
        },
        callChip,
      ],
    }),
  },
  {
    id: "payment",
    triggers: [
      "card",
      "cards",
      "cash",
      "credit",
      "debit",
      "pay",
      "paying",
      "payment",
      "finance",
      "financing",
      "synchrony",
      "invoice",
      "bill",
      "tab",
    ],
    build: () => ({
      text: "Cash, credit, and debit — no financing or payment plans, but we will give you the full quote before any work begins so there are no surprises.",
      chips: [callChip],
    }),
  },
  {
    id: "fleet",
    triggers: [
      "fleet",
      "fleets",
      "commercial",
      "business",
      "company vehicle",
      "company vehicles",
      "contractor",
    ],
    build: () => ({
      text: "We service family fleets and small-business vehicles — pickups, vans, light trucks, and diesel work rigs — with the same diagnostic-first approach we use on personal cars. Call and tell us how many vehicles are in the fleet and we will scope a plan that fits.",
      chips: [callChip, emailChip],
    }),
  },
  {
    id: "reviews",
    triggers: [
      "rating",
      "ratings",
      "review",
      "reviews",
      "reputation",
      "carfax",
      "yelp",
      "google reviews",
      "trustworthy",
      "any good",
      "good shop",
    ],
    build: () => ({
      text: `We're a CARFAX Top-Rated Service Center (${shop.rating.value} / ${shop.rating.scale} as of ${shop.rating.observed}) — third-party verified, not self-reported. Recent reviews live on the reviews page and on our CARFAX, Yelp, and Google profiles.`,
      chips: [
        { label: "Read reviews", href: "/reviews", kind: "link" },
        { label: "CARFAX profile", href: shop.profiles.carfax, kind: "link" },
      ],
    }),
  },
  {
    id: "walkin",
    triggers: ["walk-in", "walkin", "walk in", "drop in", "drop-in", "without appointment"],
    build: () => ({
      text: "Walk-ins are welcome — most days we can take a same-day look and start with a quick check before any work begins. For longer jobs, a quick call ahead saves you the wait.",
      chips: [callChip, directionsChip],
    }),
  },
  {
    id: "service-area",
    triggers: [
      "make",
      "makes",
      "model",
      "models",
      "brand",
      "brands",
      "manufacture",
      "manufacturer",
    ],
    build: () => ({
      text: `Yes — gas, diesel, hybrid, and electric, plus the classics. ${makes
        .slice(0, 12)
        .join(", ")} and many more — call with the year, make and model for a confirmation.`,
      chips: [callChip],
    }),
  },
  {
    id: "wifi",
    triggers: ["wifi", "wi-fi", "internet", "restroom", "bathroom", "kids", "coffee", "amenities"],
    build: () => ({
      text: "The waiting area has Wi-Fi, a restroom, and space for kids — most folks are comfortable waiting for routine jobs. For longer repairs we'll call with findings before any work begins, so you're never guessing.",
      chips: [callChip, directionsChip],
    }),
  },
  {
    id: "tow",
    triggers: ["tow", "towing", "towed", "roadside", "roadside assistance", "flatbed"],
    build: () => ({
      text: "We don't run a tow truck ourselves, but we work with local roadside partners and can usually point you to one. If you've already broken down, save our number for the next stop and we'll get you on the schedule.",
      chips: [saveChip, callChip],
    }),
  },
  {
    id: "help",
    triggers: ["help", "assist", "assistance", "support", "guide", "options"],
    build: () => ({
      text: `I can answer questions about hours, services, directions and pricing — or cut to the chase and talk to a human: ${shop.phone.display}.`,
      chips: [callChip, { label: "All services", href: "/services", kind: "link" }],
    }),
  },
  /* --- Easter eggs: silly, honest, and always ending in a next step ------- */
  {
    id: "joke",
    triggers: ["joke", "jokes", "funny", "laugh", "humor", "humour", "comedian", "silly"],
    build: () => ({
      text: "Why did the tire go to school? To get a little more tread-ucation. ...I'm a tire, not a comedian — the humans at the counter have better material.",
      chips: [callChip],
    }),
  },
  {
    id: "love",
    triggers: ["love", "marry", "date", "girlfriend", "boyfriend", "valentine", "kiss", "cute"],
    build: () => ({
      text: "I'm flattered, but I'm a tire — my one true love is proper inflation. If your car needs some love, the shop is one call away.",
      chips: [callChip],
    }),
  },
  {
    id: "creator",
    triggers: [
      "made you",
      "built you",
      "created you",
      "programmed you",
      "wrote you",
      "your maker",
      "your creator",
      "who made",
      "who built",
    ],
    build: () => ({
      text: "Some very patient humans at the shop built me out of JavaScript and shop trivia. I run entirely on your device — no cloud, no servers, just tire.",
      chips: [callChip],
    }),
  },
  {
    id: "philosophy",
    triggers: ["alive", "sentient", "conscious", "real", "philosophy", "meaning of life"],
    build: () => ({
      text: "Am I alive? I'm a tire with good PR — I think, therefore I tread. For the deeper questions, the humans at the counter are wiser than me.",
      chips: [callChip],
    }),
  },
  {
    id: "games",
    triggers: ["marco", "ping", "pong", "play", "game", "games", "bored", "boring"],
    build: () => ({
      text: "Marco? Polo! Ping? Pong! I roll with it. If you're killing time, the shop arcade has real games — and if the car needs work, you know the number.",
      chips: [{ label: "Play the arcade", href: "/arcade", kind: "link" }, callChip],
    }),
  },
  {
    id: "thanks",
    triggers: ["thanks", "thank", "thx", "ty", "appreciated", "appreciate"],
    build: () => ({
      text: "You're welcome — that's what I'm here for. If the car still needs work, you know the number; if I helped, tell a friend.",
      chips: [callChip, saveChip],
    }),
  },
  {
    id: "goodbye",
    triggers: ["bye", "goodbye", "later", "see ya", "seeya", "farewell", "gtg", "cya"],
    build: () => ({
      text: "See you on the road! Save the number before you go — future-you, stranded on the parkway, will be grateful.",
      chips: [saveChip, callChip],
    }),
  },
  {
    id: "insult",
    triggers: ["stupid", "dumb", "useless", "suck", "sucks", "terrible", "awful", "idiot", "hate"],
    build: () => ({
      text: `Fair enough — I'm a tire doing my best. For a real conversation, the humans at the counter are standing by: ${shop.phone.display}.`,
      chips: [callChip],
    }),
  },
];

function buildIndex(): Entry[] {
  const entries: Entry[] = [];
  for (const intent of INTENTS) {
    const vocab = new Map<string, number>();
    for (const trigger of intent.triggers) {
      // Tokenize the trigger so multi-word / hyphenated phrases like
      // "walk-in", "drop-in", or "without appointment" expand into the same
      // stems the user input gets. Without this, "walk in" produces
      // ["walk", "in"] but the vocab would carry a single "walk-in" key.
      for (const token of tokenize(trigger)) {
        vocab.set(token, (vocab.get(token) ?? 0) + 6);
      }
    }
    // The location intent also indexes the shop's actual service area — the
    // SEO audit added these towns for search, but the chat brain should share
    // the data so "do you service Mays Landing?" lands on a real answer.
    if (intent.id === "location") {
      addWords(vocab, [shop.address.city, shop.nickname, shop.county, shop.region].join(" "), 5);
      addWords(vocab, shop.areaServed.join(" "), 5);
    }
    // The service-area intent indexes every make the shop services — it
    // catches "do you work on Subarus?" / "can you fix a Toyota?" and replies
    // with the full makes list straight from src/lib/makes.ts.
    if (intent.id === "service-area") {
      addWords(vocab, makes.join(" "), 3);
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

/** Every stemmed token that lives in the index — drives the fuzzy fallback. */
const VOCAB: Set<string> = (() => {
  const set = new Set<string>();
  for (const entry of INDEX) {
    for (const token of entry.vocab.keys()) set.add(token);
  }
  // Also include the noun stems we want fuzzy matching to find even if no
  // entry currently carries them (so a fresh synonym stays findable).
  for (const syn of Object.values(SYNONYMS)) set.add(stem(syn));
  return set;
})();

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

/** Why a question matched — surfaced by the /agent studio's brain lab. */
type DebugMatch = {
  kind: "intent" | "faq" | "service";
  id: string;
  score: number;
  label: string;
};

type Resolved = {
  answer: ChatAnswer;
  matched: DebugMatch | null;
  tokens: string[];
  suggestions?: string[];
};

/** Studio-only tuning knobs — never used by the production widget. */
export type MatcherConfig = {
  threshold?: number;
  extraSynonyms?: Record<string, string>;
  /** Mascot metadata the copy templates auto-fill from. Defaults to Tread. */
  persona?: ChatPersona;
};

/**
 * "What are you?" / "who are you" are pure stopword phrases — nothing
 * survives tokenizing, so the matcher never sees them. Catch them up front
 * and route to the identity intent.
 */
const IDENTITY_RE = /\b(who|what)('s| are| is)?\s+(you|this)\b|\byour name\b/i;

/**
 * More pure-stopword phrases the matcher can never see: "what can you do"
 * tokenizes to nothing, and "thank you" loses both words to the stopword
 * list (leaving a stray "much" that would otherwise land on the cost
 * intent). Catch them up front like IDENTITY_RE and route by intent id.
 */
const STOPWORD_ROUTE_RES: { re: RegExp; id: string }[] = [
  { re: /\bwhat (can|do) (you|u) do\b/i, id: "help" },
  { re: /^\s*(thank(s| you)?|thx|ty|much appreciated|appreciate it)\b/i, id: "thanks" },
];

function resolve(input: string, now: Date, config: MatcherConfig = {}): Resolved {
  const persona = config.persona ?? TREAD_PERSONA;
  const synonyms = { ...SYNONYMS, ...config.extraSynonyms };
  const threshold = config.threshold ?? THRESHOLD;
  if (IDENTITY_RE.test(input)) {
    const identity = INTENTS.find((i) => i.id === "identity")!;
    return {
      answer: identity.build(now, persona),
      matched: { kind: "intent", id: "identity", score: 99, label: "identity" },
      tokens: [],
    };
  }
  for (const { re, id } of STOPWORD_ROUTE_RES) {
    if (re.test(input)) {
      const intent = INTENTS.find((i) => i.id === id)!;
      return {
        answer: intent.build(now, persona),
        matched: { kind: "intent", id, score: 99, label: id },
        tokens: [],
      };
    }
  }
  const tokens = tokenize(input, synonyms, VOCAB);
  if (tokens.length === 0)
    return {
      answer: fallbackAnswer(persona),
      matched: null,
      tokens,
      suggestions: [],
    };

  let bestIntent: { entry: Entry; score: number } | null = null;
  let bestFaq: { entry: Entry; score: number } | null = null;
  let bestService: { entry: Entry; score: number } | null = null;
  const belowThreshold: { entry: Entry; score: number }[] = [];
  for (const entry of INDEX) {
    const s = score(entry, tokens);
    if (s < threshold) {
      if (s > 0) belowThreshold.push({ entry, score: s });
      continue;
    }
    if (entry.kind === "intent" && (!bestIntent || s > bestIntent.score))
      bestIntent = { entry, score: s };
    if (entry.kind === "faq" && (!bestFaq || s > bestFaq.score)) bestFaq = { entry, score: s };
    if (entry.kind === "service" && (!bestService || s > bestService.score))
      bestService = { entry, score: s };
  }

  // "How much is an oil change?" — the cost intent plus a confident service
  // match gets the service's own cost explainer, not the generic money answer.
  if (bestIntent?.entry.id === "cost" && bestService && bestService.score >= threshold) {
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
  if (!top) {
    // Nothing crossed threshold — try Fuse.js as a soft second pass so a
    // close miss (typo, near-synonym) still lands on a real answer instead
    // of a shrug. Failures stay silent and we fall through to did-you-mean.
    const fuzzy = fuzzyFaqLookup(input);
    if (fuzzy) {
      return {
        answer: {
          text: trimForBubble(fuzzy.answer),
          chips: [serviceChip(fuzzy.slug, `${fuzzy.service} details`), callChip],
          serviceSlug: fuzzy.slug,
          trimmed: fuzzy.answer.length > FAQ_BUBBLE ? true : undefined,
          ...(fuzzy.answer.length > FAQ_BUBBLE ? { fullText: fuzzy.answer } : {}),
        },
        matched: {
          kind: "faq",
          id: `faq:fuzzy:${fuzzy.slug}`,
          score: 1 - fuzzy.distance,
          label: `${fuzzy.service} — fuzzy match`,
        },
        tokens,
      };
    }
    return {
      answer: fallbackAnswer(persona, suggestionLabels(belowThreshold)),
      matched: null,
      tokens,
      suggestions: suggestionLabels(belowThreshold),
    };
  }

  if (top.entry.kind === "intent") {
    return {
      answer: top.entry.intent!(now, persona),
      matched: { kind: "intent", id: top.entry.id, score: top.score, label: top.entry.id },
      tokens,
    };
  }

  if (top.entry.kind === "faq") {
    const full = top.entry.faqAnswer!;
    const trimmed = trimForBubble(full);
    const wasTrimmed = full.length > FAQ_BUBBLE;
    return {
      answer: {
        text: trimmed,
        chips: [serviceChip(top.entry.serviceSlug!, `${top.entry.serviceName} details`), callChip],
        serviceSlug: top.entry.serviceSlug,
        ...(wasTrimmed ? { trimmed: true, fullText: full } : {}),
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

/** Take the top below-threshold entries and turn them into "Did you mean…"
 *  suggestion labels for the widget's fallback chips. Keeps at most three,
 *  preferring services and FAQs over intents (which the customer usually
 *  doesn't mean literally). */
function suggestionLabels(below: { entry: Entry; score: number }[]): string[] {
  if (below.length === 0) return [];
  const ranked = below
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const labels: string[] = [];
  for (const { entry } of ranked) {
    if (entry.kind === "service") labels.push(`Ask about ${entry.serviceName}`);
    else if (entry.kind === "faq") labels.push(`Ask: ${entry.faqQuestion}`);
    else if (entry.kind === "intent") labels.push(`Ask about ${entry.id}`);
  }
  return labels;
}

/** Local, no-network fuzzy FAQ matcher — Damerau-Levenshtein over the FAQ
 *  questions. Runs at module load and on every resolve() call; cost is
 *  bounded by the index size (currently ~42 FAQs), so the whole pass stays
 *  under a millisecond. Promoted from the /agent studio's "Engine" tab to
 *  a real fallback path here. */
type FuzzyHit = { slug: string; service: string; answer: string; distance: number };
function fuzzyFaqLookup(input: string): FuzzyHit | null {
  const normalized = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!normalized) return null;
  let best: FuzzyHit | null = null;
  for (const entry of INDEX) {
    if (entry.kind !== "faq" || !entry.faqQuestion) continue;
    const q = entry.faqQuestion
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    const d = damerauLevenshtein(normalized, q);
    if (best === null || d < best.distance) {
      best = {
        slug: entry.serviceSlug!,
        service: entry.serviceName!,
        answer: entry.faqAnswer!,
        distance: d,
      };
    }
  }
  // Accept the hit only if it is meaningfully close — anything past 35% of
  // the input length is probably noise.
  if (!best) return null;
  const maxLen = Math.max(normalized.length, 4);
  return best.distance <= Math.ceil(maxLen * 0.35) ? best : null;
}

function damerauLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;
  const prev = new Array(lb + 1).fill(0).map((_, i) => i);
  const curr = new Array(lb + 1).fill(0);
  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        curr[j] = Math.min(curr[j], prev[j - 2] + cost);
      }
    }
    for (let j = 0; j <= lb; j++) prev[j] = curr[j];
  }
  return prev[lb];
}

/** The main entry point: one question in, one answer (with next steps) out. */
export function answerQuestion(
  input: string,
  now: Date = new Date(),
  config: MatcherConfig = {},
): ChatAnswer {
  return resolve(input, now, config).answer;
}

/** Studio-only: the answer plus why it matched, for the /agent brain lab. */
export function debugAnswer(
  input: string,
  now: Date = new Date(),
  config: MatcherConfig = {},
): Resolved {
  return resolve(input, now, config);
}

function fallbackAnswer(
  persona: ChatPersona = TREAD_PERSONA,
  suggestions: string[] = [],
): ChatAnswer {
  return {
    text: `I'm just ${persona.self} — that one's beyond me. A human at the counter can help${
      suggestions.length > 0 ? ", or try one of these:" : ""
    }`,
    chips: [callChip, emailChip, ...suggestionChips(suggestions)],
    fallback: true,
    ...(suggestions.length > 0 ? { suggestions } : {}),
  };
}

function suggestionChips(suggestions: string[]): ChatChip[] {
  return suggestions.map((label) => ({
    label,
    href: `#suggestion:${encodeURIComponent(label)}`,
    kind: "link",
  }));
}

/** The opening line, aware of whether the shop is open right now. */
export function treadGreeting(
  now: Date = new Date(),
  persona: ChatPersona = TREAD_PERSONA,
): string {
  const status = hoursStatus(now);
  const intro = `${persona.name}, ${persona.kind}`;
  if (status.status === "open" || status.status === "closing-soon") {
    return `Hi! I'm ${intro}. We're open right now — ask me about hours, services or directions, or save our number for later.`;
  }
  return `Hi! I'm ${intro}. We're closed right now, but I can still answer questions — or save our number for the morning.`;
}

/** One-tap starters shown above the input. */
export const quickPrompts = [
  "Are you open?",
  "Can you fix a flat?",
  "Book an appointment",
  "Talk to a person",
  "Do you do NJ inspection?",
  "Do you take cards?",
  "Tell me a joke",
];

/** Read-only config snapshot for the /agent studio's knowledge-base viewer. */
export const STUDIO_CONFIG = {
  threshold: THRESHOLD,
  stopwords: [...STOPWORDS].sort(),
  synonyms: Object.entries(SYNONYMS).map(([alias, canonical]) => ({ alias, canonical })),
  spanishSynonyms: Object.entries(SYNONYMS_ES).map(([alias, canonical]) => ({
    alias,
    canonical,
  })),
  intents: INTENTS.map((i) => ({ id: i.id, triggers: i.triggers })),
};
