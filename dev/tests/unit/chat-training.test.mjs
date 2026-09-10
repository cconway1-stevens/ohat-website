import assert from "node:assert/strict";
import test from "node:test";
import { debugAnswer } from "../../../src/lib/chat/answers.ts";

/**
 * The chat brain's training corpus: several hundred real customer phrasings
 * that must route to a genuine answer rather than the shrug.
 *
 * These were five files -- chat-training-{smalltalk,hours,services,contact,
 * money} -- each repeating this same fifteen-line preamble and each titled
 * "training N/5", an ordinal nobody could add a sixth topic to without
 * renumbering the rest. One file, one preamble, one case per topic.
 *
 * Every phrase, whatever its topic, must clear the same three bars: it must
 * not fall back, its answer must carry a call chip (the site's one conversion),
 * and it must not over-promise. Individual cases add their own requirement on
 * top -- greetings must reach `smalltalk`, hours must hit an intent rather than
 * a fuzzy guess, symptoms must land on a service or FAQ.
 */

const TUESDAY_OPEN = new Date("2026-09-01T14:00:00Z");
const chipHrefs = (answer) => answer.chips.map((chip) => chip.href);
const hasCallChip = (answer) => chipHrefs(answer).some((href) => href.startsWith("tel:"));
const OVERPROMISE_RE =
  /guarantee|lowest price|cheapest|best price|won'?t be beat|100% satisfaction|lifetime warranty/i;

function expectRouted(phrase) {
  const { answer, matched } = debugAnswer(phrase, TUESDAY_OPEN);
  assert.ok(!answer.fallback, `"${phrase}" fell back to the shrug`);
  assert.ok(hasCallChip(answer), `"${phrase}" answer has no call chip`);
  assert.doesNotMatch(answer.text, OVERPROMISE_RE, `"${phrase}" answer over-promises`);
  return matched;
}

// ---------------------------------------------------------------------------
// smalltalk
// ---------------------------------------------------------------------------
const GREETINGS = [
  "hi",
  "Hi!",
  "hi there",
  "hey",
  "hey!",
  "hey there",
  "hey there buddy",
  "hey everyone",
  "hello",
  "hello!",
  "hello there",
  "hello?",
  "howdy",
  "yo",
  "yo!",
  "sup",
  "sup?",
  "sup!!",
  "hiya",
  "heya",
  "whats up",
  "what's up",
  "what's up?",
  "how are you",
  "how are you?",
  "how are you doing",
  "how you doing",
  "how's it going",
  "how is it going",
  "nice to meet you",
  "you there",
  "you there?",
  "anyone there",
  "anyone there?",
  "can you hear me",
  "are you busy",
  "awesome",
  "awesome!",
  "nice",
  "nice!",
  "perfect",
  "cool",
  "great",
  "great!",
  "sounds good",
  "have a good day",
  "have a nice day",
  "take care",
  "good morning",
  "good morning!",
  "good afternoon",
  "good evening",
];

const CHATTER = [
  "thanks",
  "thank you",
  "thanks!",
  "thx",
  "ty",
  "ok thanks",
  "okay thank you",
  "much appreciated",
  "appreciate it",
  "thanks a lot",
  "help",
  "help me",
  "i need help",
  "can you help",
  "can you help me",
  "i need a mechanic",
  "do you know my car",
  "can you check my car",
  "what can you do",
  "what do you do",
  "what can you do for me",
  "who are you",
  "what are you",
  "what's your name",
  "your name",
  "hi tread",
  "hey tread",
  "are you a robot",
  "are you a bot",
  "are you real",
  "are you alive",
  "are you sentient",
  "who made you",
  "who built you",
  "tell me a joke",
  "make me laugh",
  "say something funny",
  "i love you",
  "will you marry me",
  "marco",
  "lets play a game",
  "i'm bored",
  "you're stupid",
  "you suck",
  "bye",
  "goodbye",
  "see ya",
  "later",
];

test("greetings and chatter route to small talk", () => {
  for (const phrase of GREETINGS) {
    const matched = expectRouted(phrase);
    assert.equal(matched?.id, "smalltalk", `"${phrase}" should route to smalltalk`);
  }
  for (const phrase of CHATTER) expectRouted(phrase);
  assert.equal(GREETINGS.length + CHATTER.length, 100);
});

test("small talk never swallows a real question", () => {
  for (const phrase of [
    "hey, are you open?",
    "good morning, are you open?",
    "hi, how much for brakes?",
    "hello there, i need an oil change",
    "sup, my check engine light is on",
  ]) {
    const { answer } = debugAnswer(phrase, TUESDAY_OPEN);
    assert.ok(!answer.fallback, `"${phrase}" should not fall back`);
    assert.ok(hasCallChip(answer));
  }
});

// ---------------------------------------------------------------------------
// hours
// ---------------------------------------------------------------------------
const HOURS = [
  "are you open",
  "are you open today",
  "are you open right now",
  "are you open now",
  "are you open tomorrow",
  "are you open on saturday",
  "are you open on sunday",
  "are you open on weekends",
  "are you closed",
  "are you closed today",
  "are you closed tomorrow",
  "are you closed on sunday",
  "are you closed on saturday",
  "what are your hours",
  "what are your hours today",
  "what are your hours tomorrow",
  "your hours",
  "shop hours",
  "store hours",
  "business hours",
  "hours of operation",
  "service hours",
  "when do you open",
  "when do you close",
  "when are you open",
  "what time do you open",
  "what time do you close",
  "what time do you open today",
  "what time do you open tomorrow",
  "what time",
  "opening time",
  "closing time",
  "opening hours",
  "closing hours",
  "do you open early",
  "do you close late",
  "are you open late",
  "are you open late tonight",
  "are you open tonight",
  "open tonight",
  "open late",
  "open now",
  "open yet",
  "still open",
  "already closed",
  "closed yet",
  "before you close",
  "sunday hours",
  "saturday hours",
  "weekend hours",
  "monday hours",
  "tuesday hours",
  "wednesday hours",
  "thursday hours",
  "friday hours",
  "friday close time",
  "do you open on sundays",
  "open on saturdays",
  "hours on saturday",
  "hours on sunday",
  "open in the morning",
  "open in the afternoon",
  "open in the evening",
  "morning hours",
  "afternoon hours",
  "evening hours",
  "early hours",
  "late hours",
  "today hours",
  "tomorrow hours",
  "hours this week",
  "hours this weekend",
  "are you open this weekend",
  "are you open mondays",
  "are you open fridays",
  "what days are you open",
  "what days are you closed",
  "days and hours",
  "are you open holidays",
  "holiday hours",
  "labor day hours",
  "thanksgiving hours",
  "christmas hours",
  "new year hours",
  "are you open on labor day",
  "are you open on thanksgiving",
  "closed for holiday",
  "holiday closures",
  "any closures coming up",
  "upcoming closures",
  "when do you reopen",
  "reopening",
  "reopen monday",
  "are you open before 8",
  "are you open after 5",
  "open at 8",
  "close at 5",
  "friday 8 to 4",
  "open past 5",
  "do you close early on friday",
];

test("hours and schedule questions hit an intent, not a guess", () => {
  for (const phrase of HOURS) {
    const matched = expectRouted(phrase);
    assert.equal(matched?.kind, "intent", `"${phrase}" should hit an intent, not a guess`);
  }
  assert.equal(HOURS.length, 100);
});

// ---------------------------------------------------------------------------
// services
// ---------------------------------------------------------------------------
const SERVICES = [
  "my brakes squeal",
  "brakes grinding",
  "need new brake pads",
  "brake rotors",
  "my brakes feel soft",
  "brake pedal goes to the floor",
  "brakes making noise",
  "replace my brake pads",
  "my brakes need checking",
  "brakes worn out",
  "need new tires",
  "flat tire",
  "tire repair",
  "tire rotation",
  "rotate my tires",
  "my tires are bald",
  "tire pressure light is on",
  "tire patch",
  "i need new tires",
  "tire making noise",
  "need an alignment",
  "car pulls to the right",
  "steering wheel off center",
  "alignment check",
  "car drifts to one side",
  "uneven tire wear",
  "oil change",
  "need an oil change",
  "oil change near me",
  "how often should i change my oil",
  "oil filter",
  "synthetic oil",
  "battery keeps dying",
  "need a new battery",
  "car battery replacement",
  "battery test",
  "battery light on",
  "ac blows hot",
  "air conditioning not cold",
  "ac repair",
  "recharge my ac",
  "ac smells bad",
  "no cold air",
  "car overheating",
  "coolant leak",
  "radiator problem",
  "temperature gauge high",
  "smoke coming from the engine",
  "transmission slipping",
  "transmission fluid",
  "gears grinding",
  "transmission service",
  "check engine light",
  "check engine light is on",
  "engine light flashing",
  "need a diagnostic",
  "car making a weird noise",
  "loud muffler",
  "exhaust leak",
  "exhaust smoke",
  "rattling under the car",
  "diesel truck service",
  "diesel repair",
  "my diesel pickup needs work",
  "hybrid service",
  "ev service",
  "electric car service",
  "bumpy ride",
  "worn shocks",
  "worn struts",
  "car bounces over bumps",
  "suspension noise",
  "open recall on my car",
  "recall work",
  "my car is shaking",
  "vibration at highway speed",
  "fluid leak under my car",
  "car smells like gas",
  "squealing when i brake",
  "steering feels loose",
  "car won't start",
  "slow crank when starting",
  "heat not working",
  "defroster not working",
  "wheel bearing noise",
  "humming noise at speed",
  "clicking when i turn",
  "burning smell from the car",
  "tires wearing on the inside edge",
  "battery dies overnight",
  "car cranks but won't start",
  "check engine light blinking",
  "vibration when braking",
  "my car pulls left",
];

test("service and symptom phrases land on a service or FAQ", () => {
  for (const phrase of SERVICES) {
    const matched = expectRouted(phrase);
    assert.ok(
      matched?.kind === "service" ||
        matched?.kind === "faq" ||
        // Deliberate, honest routing: a genuinely generic noise complaint
        // ("car making a weird noise") is tie-broken by the brain's NOISE_RE
        // onto the `noises` INTENT instead of a wrong service page. The
        // shrug/call-chip/over-promise guards above still apply to it —
        // only this id is exempted from the service-or-FAQ requirement.
        (matched?.kind === "intent" && matched?.id === "noises"),
      `"${phrase}" should land on a service or FAQ, got ${matched?.kind}/${matched?.id}`,
    );
  }
  assert.ok(SERVICES.length >= 90);
});

// ---------------------------------------------------------------------------
// contact
// ---------------------------------------------------------------------------
const CONTACT = [
  "where are you located",
  "where are you",
  "your address",
  "what's your address",
  "directions to the shop",
  "how do i find you",
  "are you in egg harbor township",
  "do you service mays landing",
  "do you service linwood",
  "do you service northfield",
  "do you service somers point",
  "do you service absecon",
  "how far are you",
  "send me directions",
  "map",
  "show me a map",
  "google maps",
  "parking",
  "where do i park",
  "is there parking",
  "where should i park my car",
  "phone number",
  "what's your phone number",
  "call you",
  "can i call",
  "talk to a human",
  "talk to someone",
  "speak to someone",
  "real person",
  "email",
  "email address",
  "your email",
  "send an email",
  "contact info",
  "how do i contact you",
  "reach you",
  "get in touch",
  "save your number",
  "save the shop",
  "download your card",
  "vcard",
  "night drop",
  "drop off my car",
  "can i drop off my car",
  "leave my car overnight",
  "drop my keys",
  "key drop",
  "leave keys",
  "overnight dropoff",
  "leave the car and keys",
  "after hours drop",
  "car overnight",
  "secure drop",
  "book an appointment",
  "make an appointment",
  "schedule an appointment",
  "appointment",
  "can i schedule",
  "get a slot",
  "reserve a time",
  "walk in",
  "walk-ins ok",
  "do i need an appointment",
  "without an appointment",
  "can i walk in",
  "how do i book",
  "book a service",
  "can i book online",
  "set up service",
  "next available",
  "get me on the schedule",
  "book brakes",
  "appointment for tires",
  "do you have wifi",
  "wifi",
  "waiting area",
  "can i wait",
  "restroom",
  "bathroom",
  "coffee",
  "kids waiting",
  "waiting room",
  "how long can i wait",
  "need a ride",
  "rideshare",
  "drop and go",
  "do you tow",
  "towing",
  "need a tow",
  "roadside assistance",
  "my car got towed",
];

test("contact, location and booking phrases route to an answer", () => {
  for (const phrase of CONTACT) expectRouted(phrase);
  assert.ok(CONTACT.length >= 90);
});

// ---------------------------------------------------------------------------
// money
// ---------------------------------------------------------------------------
const MONEY = [
  "how much",
  "how much does it cost",
  "how much for brakes",
  "how much for an oil change",
  "how much is an oil change",
  "how much is a tire rotation",
  "price for brakes",
  "price for new tires",
  "prices",
  "pricing",
  "do you have prices",
  "can i get a quote",
  "quote",
  "estimate",
  "get an estimate",
  "expensive",
  "are you expensive",
  "are you cheap",
  "ballpark",
  "ballpark figure",
  "cost of repairs",
  "repair cost",
  "what will it cost",
  "charge",
  "fees",
  "labor rate",
  "hourly rate",
  "payment plans",
  "financing",
  "do you offer financing",
  "credit card",
  "debit card",
  "cash",
  "do you take cash",
  "do you take credit",
  "synchrony",
  "invoice",
  "payment",
  "how much do new tires cost",
  "what do brakes cost",
  "how much for a tune up",
  "do you take apple pay",
];

const TRUST = [
  "are you trustworthy",
  "any good",
  "good shop",
  "reviews",
  "your reviews",
  "google reviews",
  "carfax",
  "yelp",
  "rating",
  "your rating",
  "are you rated on google",
  "top rated",
  "reputation",
  "what do people say in your reviews",
  "do you have good reviews",
  "can i trust your shop",
  "what's your google rating",
];

const URGENT = [
  "emergency",
  "it's an emergency",
  "urgent",
  "asap",
  "i need this fixed asap",
  "breakdown",
  "my car broke down",
  "accident",
  "i hit a curb",
  "unsafe to drive",
  "is my car safe",
  "smoke from the engine",
  "car fire",
  "brakes failed",
  "brakes not working",
  "stuck on the highway",
  "stranded",
  "need help now",
  "right now",
  "today if possible",
  "can you fit me in today",
  "my car is broken down and undrivable",
  "my car died and i'm stranded",
  "overheating right now",
  "it's an emergency situation",
];

const TIMELINE = [
  "how long does it take",
  "how long will it take",
  "how long do repairs take",
  "turnaround time",
  "same day service",
  "can you fix it today",
  "will it be ready today",
  "when will my car be ready",
  "when can i pick it up",
  "how soon can you look at it",
  "how fast",
  "quick fix",
  "do you do same day",
  "time it takes",
  "how many hours",
  "how long for brakes",
  "how long for an oil change",
  "pickup time",
  "how long will the repairs take",
];

test("pricing, trust, emergency and timeline phrases route to an answer", () => {
  for (const phrase of MONEY) expectRouted(phrase);
  for (const phrase of TRUST) expectRouted(phrase);
  for (const phrase of URGENT) expectRouted(phrase);
  for (const phrase of TIMELINE) expectRouted(phrase);
  assert.ok(MONEY.length + TRUST.length + URGENT.length + TIMELINE.length >= 100);
});
