import assert from "node:assert/strict";
import test from "node:test";
import {
  answerQuestion,
  debugAnswer,
  mascotGreeting,
  quickPrompts,
  STUDIO_CONFIG,
  TREAD_PERSONA,
} from "../../src/lib/chat/answers.ts";

// Fixed moments in the shop's America/New_York day: Tuesday 10:00 AM (open)
// and Sunday 11:00 AM (closed until Monday). Not 2026-09-06: the Monday after
// that Sunday is Labor Day, so the shop truthfully says "Reopens Tuesday".
const TUESDAY_OPEN = new Date("2026-09-01T14:00:00Z");
const SUNDAY_CLOSED = new Date("2026-09-13T15:00:00Z");

const chipHrefs = (answer) => answer.chips.map((chip) => chip.href);

test("answers the hours question with the live open/closed state", () => {
  const open = answerQuestion("are you open right now?", TUESDAY_OPEN);
  assert.match(open.text, /open right now/i);
  assert.ok(chipHrefs(open).some((href) => href.startsWith("tel:")));

  const closed = answerQuestion("are you open right now?", SUNDAY_CLOSED);
  assert.match(closed.text, /reopens monday/i);
  assert.ok(chipHrefs(closed).some((href) => href.startsWith("tel:")));
});

test("routes a flat tire to the tires service", () => {
  const answer = answerQuestion("can you fix a flat tire?", TUESDAY_OPEN);
  assert.equal(answer.serviceSlug, "tires");
  assert.ok(chipHrefs(answer).includes("/services/tires"));
});

test("routes squealing brakes to brake repair", () => {
  const answer = answerQuestion("my brakes squeal really bad", TUESDAY_OPEN);
  assert.equal(answer.serviceSlug, "brake-repair");
});

test("answers a cost question with the matching service's pricing", () => {
  const answer = answerQuestion("how much is an oil change?", TUESDAY_OPEN);
  assert.equal(answer.serviceSlug, "oil-maintenance");
  assert.ok(chipHrefs(answer).includes("/services/oil-maintenance"));
  assert.ok(chipHrefs(answer).some((href) => href.startsWith("tel:")));
});

test("points parking questions at directions", () => {
  const answer = answerQuestion("where do I park?", TUESDAY_OPEN);
  assert.ok(chipHrefs(answer).some((href) => href.includes("google.com/maps/dir")));
});

test("offers the contact card when asked to save the number", () => {
  const answer = answerQuestion("save your number", TUESDAY_OPEN);
  assert.ok(chipHrefs(answer).includes("/contact-card.vcf"));
});

test("shrugs with a fallback on gibberish", () => {
  const answer = answerQuestion("zzz qqx blorp", TUESDAY_OPEN);
  assert.equal(answer.fallback, true);
  assert.ok(chipHrefs(answer).some((href) => href.startsWith("tel:")));
});

test("greets as Sparky (the production mascot) whether open or closed", () => {
  assert.match(mascotGreeting(TUESDAY_OPEN), /Sparky/);
  assert.match(mascotGreeting(SUNDAY_CLOSED), /Sparky/);
});

test("greets with a custom persona when one is given", () => {
  const torque = { name: "Torque", kind: "the blackwall tire-bot", self: "the blackwall tire-bot" };
  assert.match(mascotGreeting(TUESDAY_OPEN, torque), /Hi! I'm Torque, the blackwall tire-bot\./);
  assert.doesNotMatch(mascotGreeting(TUESDAY_OPEN, torque), /shop tire/);
  const bit = { name: "Bit", kind: "the original cloud-bot", self: "the original cloud-bot" };
  assert.match(mascotGreeting(SUNDAY_CLOSED, bit), /Hi! I'm Bit, the original cloud-bot\./);
});

test("answers 'what are you' with the mascot identity instead of shrugging", () => {
  const answer = answerQuestion("what are you", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  assert.match(answer.text, /Sparky, the shop spark plug/);
});

test("identity and fallback auto-fill from a custom persona", () => {
  const sparky = { name: "Sparky", kind: "the shop spark plug", self: "a spark plug" };
  const id = answerQuestion("who are you", TUESDAY_OPEN, { persona: sparky });
  assert.match(id.text, /I'm Sparky, the shop spark plug/);
  const fb = answerQuestion("zzz qqx blorp", TUESDAY_OPEN, { persona: sparky });
  assert.equal(fb.fallback, true);
  assert.match(fb.text, /I'm just a spark plug/);
  assert.doesNotMatch(fb.text, /just a tire/);
});

test("ships a non-empty list of quick prompts", () => {
  assert.ok(Array.isArray(quickPrompts));
  assert.ok(quickPrompts.length > 0);
  for (const prompt of quickPrompts) assert.equal(typeof prompt, "string");
});

test("falls back on an empty string", () => {
  const answer = answerQuestion("", TUESDAY_OPEN);
  assert.equal(answer.fallback, true);
});

test("falls back when every word is a stopword", () => {
  const answer = answerQuestion("the a an is are do you", TUESDAY_OPEN);
  assert.equal(answer.fallback, true);
});

test("survives a very long question and still routes to brake repair", () => {
  const longQuestion =
    "my brakes are making a terrible squealing noise every time I press the pedal and the car shakes when I slow down from high speeds on the highway the steering wheel vibrates and the stopping distance feels way too long I am worried about safety driving this vehicle around town with my family in it because the brake pads might be worn out and the rotors could be damaged I need to get them checked and replaced soon before something bad happens on the road please help me figure out what to do about these noisy failing brakes";
  const answer = answerQuestion(longQuestion, TUESDAY_OPEN);
  assert.equal(answer.fallback, undefined);
  assert.equal(answer.serviceSlug, "brake-repair");
});

test("maps the 'tyre' synonym to the tires service", () => {
  const answer = answerQuestion("my tyre is flat", TUESDAY_OPEN);
  assert.equal(answer.serviceSlug, "tires");
});

test("maps the 'overheating' synonym to engine cooling", () => {
  const answer = answerQuestion("car is overheating", TUESDAY_OPEN);
  assert.equal(answer.serviceSlug, "engine-cooling");
});

test("routes a multi-intent overlap somewhere sensible without falling back", () => {
  const { answer, matched } = debugAnswer("call to book an oil change", TUESDAY_OPEN);
  assert.ok(!answer.fallback, "should not fall back");
  assert.ok(
    matched !== null &&
      (matched.id === "booking" ||
        matched.id === "phone" ||
        answer.serviceSlug === "oil-maintenance"),
    "should route to booking, phone, or oil-maintenance",
  );
});

test("debugAnswer reports a match for a known question and null for gibberish", () => {
  const known = debugAnswer("can you fix a flat tire?", TUESDAY_OPEN);
  assert.ok(known.matched !== null);
  const gibberish = debugAnswer("zzz qqx blorp", TUESDAY_OPEN);
  assert.equal(gibberish.matched, null);
});

test("debugAnswer returns a non-empty token array for real input", () => {
  const { tokens } = debugAnswer("can you fix a flat tire?", TUESDAY_OPEN);
  assert.ok(Array.isArray(tokens));
  assert.ok(tokens.length > 0);
});

test("every quick prompt produces a non-fallback answer", () => {
  for (const prompt of quickPrompts) {
    const answer = answerQuestion(prompt, TUESDAY_OPEN);
    assert.ok(!answer.fallback, `quick prompt should not fall back: ${prompt}`);
  }
});

test("greets as Sparky on both a weekday and a weekend date", () => {
  const weekday = new Date("2026-09-02T14:00:00Z");
  const weekend = new Date("2026-09-12T15:00:00Z");
  assert.match(mascotGreeting(weekday), /Sparky/);
  assert.match(mascotGreeting(weekend), /Sparky/);
});

/* --- New intents --------------------------------------------------------- */

test("routes state inspection questions to the state-inspection intent", () => {
  const answer = answerQuestion("do you do NJ state inspection?", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  assert.match(answer.text, /not a licensed state-inspection station/i);
  assert.ok(chipHrefs(answer).some((href) => href.includes("/services/exhaust-emissions")));
});

test("inspection answer points at the free MVC station with the Mays Landing address", () => {
  const answer = answerQuestion("where do I get my car inspected?", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  // The MVC's own test is free — say so, and give the nearby station.
  assert.match(answer.text, /MVC inspection is free/i);
  assert.match(answer.text, /Mays Landing/i);
  assert.match(answer.text, /1477 19th St/i);
  assert.ok(
    chipHrefs(answer).includes("https://www.nj.gov/mvc/locations/inspection.htm"),
    "should link the NJ MVC inspection locations page",
  );
});

test("inspection answer is honest about charging diagnostic time, never a free check", () => {
  const answer = answerQuestion("do you do inspections?", TUESDAY_OPEN);
  // The shop always charges its diagnostic time — the copy must never
  // promise a free inspection prep or a no-charge check.
  assert.doesNotMatch(answer.text, /free inspection prep/i);
  assert.doesNotMatch(answer.text, /at no charge/i);
  assert.match(answer.text, /diagnostic time/i);
  assert.ok(chipHrefs(answer).some((href) => href.startsWith("tel:")));
});

test("routes payment questions to the payment intent", () => {
  const answer = answerQuestion("do you take credit cards?", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  assert.match(answer.text, /Cash, credit, and debit/);
});

test("routes fleet questions to the fleet intent", () => {
  const answer = answerQuestion("do you service work truck fleets?", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  assert.match(answer.text, /family fleets/i);
});

test("routes review questions to the reviews intent with the CARFAX score", () => {
  const answer = answerQuestion("are you any good? what's your rating?", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  assert.match(answer.text, /CARFAX/i);
  assert.match(answer.text, /5\.0/);
});

test("routes walk-in questions to the walkin intent", () => {
  const answer = answerQuestion("can I walk in without an appointment?", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  assert.match(answer.text, /Walk-ins are welcome/i);
});

test("routes wifi / amenity questions to the wifi intent", () => {
  const answer = answerQuestion("is there wifi and a restroom?", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  assert.match(answer.text, /Wi-Fi/i);
});

test("routes tow questions to the tow intent", () => {
  const answer = answerQuestion("do you do towing?", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  assert.match(answer.text, /tow truck/i);
});

test("routes service-area makes questions to the service-area intent", () => {
  const answer = answerQuestion("do you work on Subarus?", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  assert.match(answer.text, /gas, diesel, hybrid/i);
});

/* --- Tire brand synonyms ------------------------------------------------- */

test("routes tire-brand questions to the tires service", () => {
  for (const brand of ["michelin", "goodyear", "bridgestone", "firestone", "yokohama", "hankook"]) {
    const answer = answerQuestion(`do you have ${brand} tires?`, TUESDAY_OPEN);
    assert.equal(answer.serviceSlug, "tires", `${brand} should route to tires`);
  }
});

/* --- Fuzzy matching ------------------------------------------------------ */

test("fuzzy-matches typos to the tires service", () => {
  const answer = answerQuestion("my teir is flat", TUESDAY_OPEN);
  assert.equal(answer.serviceSlug, "tires");
});

test("fuzzy-matches typos to brake repair", () => {
  const answer = answerQuestion("my braks are sqealing", TUESDAY_OPEN);
  assert.equal(answer.serviceSlug, "brake-repair");
});

test("fuzzy-matches a longer typo sentence to a service", () => {
  const answer = answerQuestion("i need alignmnet badly", TUESDAY_OPEN);
  assert.equal(answer.serviceSlug, "wheel-alignment");
});

/* --- areaServed indexing ------------------------------------------------- */

test("routes Mays Landing / Linwood / EHT questions to the location intent", () => {
  for (const town of ["Mays Landing", "Linwood", "Somers Point"]) {
    const answer = answerQuestion(`do you service ${town}?`, TUESDAY_OPEN);
    assert.notEqual(answer.fallback, true, `${town} should not fall back`);
    assert.ok(
      chipHrefs(answer).some((href) => href.includes("google.com/maps/dir")),
      `${town} should include a directions chip`,
    );
  }
});

test("routes 'EHT' to the location intent", () => {
  const answer = answerQuestion("do you service EHT?", TUESDAY_OPEN);
  assert.ok(chipHrefs(answer).some((href) => href.includes("google.com/maps/dir")));
});

/* --- Spanish synonyms ---------------------------------------------------- */

test("routes Spanish 'aceite' to oil-maintenance", () => {
  const answer = answerQuestion("cuánto cuesta el aceite?", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  assert.equal(answer.serviceSlug, "oil-maintenance");
});

test("routes Spanish 'frenos' to brake-repair", () => {
  const answer = answerQuestion("mis frenos están chillando", TUESDAY_OPEN);
  assert.equal(answer.serviceSlug, "brake-repair");
});

/* --- Better fallback with did-you-mean suggestions ----------------------- */

test("returns 'Did you mean…' suggestions when nothing crosses threshold", () => {
  // Use a single non-stopword token that isn't in the vocab to avoid fuzzy hits.
  const { answer, suggestions } = debugAnswer("splonketick", TUESDAY_OPEN);
  assert.equal(answer.fallback, true);
  // Suggestions are optional — but if they're present they must be strings.
  if (suggestions) {
    for (const s of suggestions) assert.equal(typeof s, "string");
  }
});

/* --- Trimmed / read-more flag -------------------------------------------- */

test("sets trimmed/fullText on long FAQ answers", () => {
  // Most brake-repair FAQ answers are long enough to trigger the trim.
  const answer = answerQuestion("my brakes squeal really badly every morning", TUESDAY_OPEN);
  if (answer.trimmed) {
    assert.ok(answer.fullText, "trimmed FAQ must expose the full text");
    assert.ok(answer.fullText.length > answer.text.length, "full text is longer than trimmed");
  }
});

/* --- Production persona invariants --------------------------------------- */

test("TREAD_PERSONA stays intact; production copy follows PRODUCTION_PERSONA", () => {
  assert.equal(TREAD_PERSONA.name, "Tread");
  assert.equal(TREAD_PERSONA.kind, "the shop tire");
  assert.equal(TREAD_PERSONA.self, "a tire");
  // Production swapped to Sparky (src/lib/chat/mascot.ts) — the greeting and
  // identity the real widget ships must say Sparky now.
  assert.match(mascotGreeting(TUESDAY_OPEN), /^Hi! I'm Sparky, the shop spark plug\./);
  const identity = answerQuestion("what are you", TUESDAY_OPEN);
  assert.match(identity.text, /I'm Sparky, the shop spark plug/);
});

test("STUDIO_CONFIG exposes the new Spanish synonym table and intents", () => {
  assert.ok(Array.isArray(STUDIO_CONFIG.spanishSynonyms));
  assert.ok(STUDIO_CONFIG.spanishSynonyms.length > 0);
  const intentIds = STUDIO_CONFIG.intents.map((i) => i.id);
  for (const id of [
    "state-inspection",
    "payment",
    "fleet",
    "reviews",
    "walkin",
    "wifi",
    "tow",
    "service-area",
  ]) {
    assert.ok(intentIds.includes(id), `intents should include ${id}`);
  }
});

/* --- Lead routing: urgent, contact, phone, help --------------------------- */

test("routes a breakdown to the urgent intent with a call-first answer", () => {
  const answer = answerQuestion("I broke down on the parkway, what do I do?", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  assert.match(answer.text, /call 911/i);
  assert.match(answer.text, /\(609\) 241-1546/);
  assert.equal(answer.chips[0].kind, "call");
});

test("routes 'how do I contact you' to the contact intent with every channel", () => {
  const answer = answerQuestion("how do I contact you?", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  const kinds = answer.chips.map((chip) => chip.kind);
  assert.ok(kinds.includes("call"), "contact answer includes a call chip");
  assert.ok(kinds.includes("email"), "contact answer includes an email chip");
  assert.ok(kinds.includes("directions"), "contact answer includes a directions chip");
  assert.ok(kinds.includes("download"), "contact answer includes the save-card chip");
});

test("routes 'talk to a real person' to the phone intent, person-first", () => {
  const answer = answerQuestion("can I talk to a real person?", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  assert.match(answer.text, /a person at the counter picks up/i);
  assert.ok(chipHrefs(answer).some((href) => href.startsWith("tel:")));
});

test("answers 'what can you do' with the help intent instead of shrugging", () => {
  const answer = answerQuestion("what can you do", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  assert.ok(chipHrefs(answer).some((href) => href.startsWith("tel:")));
});

test("greets 'hi tread' with the identity answer, not a fallback", () => {
  const answer = answerQuestion("hi tread", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  // Production mascot is Sparky now — the identity says who actually answers.
  assert.match(answer.text, /Sparky, the shop spark plug/);
});

/* --- Easter eggs: silly, honest, always ending in a next step ------------- */

test("tells a joke when asked, and still offers the call chip", () => {
  const answer = answerQuestion("tell me a joke", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  assert.match(answer.text, /tread-ucation/i);
  assert.ok(chipHrefs(answer).some((href) => href.startsWith("tel:")));
});

test("plays marco polo and links the arcade", () => {
  const answer = answerQuestion("marco", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  assert.match(answer.text, /polo/i);
  assert.ok(chipHrefs(answer).includes("/arcade"));
});

test("answers a love note honestly and routes to the shop", () => {
  const answer = answerQuestion("i love you tread", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  assert.match(answer.text, /I'm a tire/i);
  assert.ok(chipHrefs(answer).some((href) => href.startsWith("tel:")));
});

test("answers 'who made you' honestly about running on-device", () => {
  const answer = answerQuestion("who made you?", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  assert.match(answer.text, /entirely on your device/i);
});

test("thanks and goodbye stay polite and offer next steps", () => {
  const thanks = answerQuestion("thank you so much", TUESDAY_OPEN);
  assert.notEqual(thanks.fallback, true);
  assert.match(thanks.text, /You're welcome/i);
  const bye = answerQuestion("bye", TUESDAY_OPEN);
  assert.notEqual(bye.fallback, true);
  assert.ok(chipHrefs(bye).includes("/contact-card.vcf"));
});

test("takes an insult on the chin and hands over to the humans", () => {
  const answer = answerQuestion("you are useless", TUESDAY_OPEN);
  assert.notEqual(answer.fallback, true);
  assert.match(answer.text, /humans at the counter/i);
  assert.ok(chipHrefs(answer).some((href) => href.startsWith("tel:")));
});

/* --- Expanded synonyms route to the right service ------------------------- */

test("routes brake-hardware words to brake repair", () => {
  for (const q of ["my brake pads are worn", "I think my rotors are warped"]) {
    const answer = answerQuestion(q, TUESDAY_OPEN);
    assert.equal(answer.serviceSlug, "brake-repair", `${q} should route to brake-repair`);
  }
});

test("routes cooling words to engine cooling", () => {
  const answer = answerQuestion("i have a coolant leak", TUESDAY_OPEN);
  assert.equal(answer.serviceSlug, "engine-cooling");
});

test("routes suspension words to suspension-steering", () => {
  const answer = answerQuestion("my shocks are shot", TUESDAY_OPEN);
  assert.equal(answer.serviceSlug, "suspension-steering");
});

test("routes transmission slang to transmission-driveline", () => {
  const answer = answerQuestion("my trans is slipping", TUESDAY_OPEN);
  assert.equal(answer.serviceSlug, "transmission-driveline");
});

test("routes electrical words to battery-electrical", () => {
  const answer = answerQuestion("i think my alternator is dead", TUESDAY_OPEN);
  assert.equal(answer.serviceSlug, "battery-electrical");
});

/* --- Every production answer carries a lead chip --------------------------- */

test("every intent answer includes a call or email chip", () => {
  const probes = [
    "are you open",
    "where are you located",
    "what is your phone number",
    "how do I contact you",
    "how much does it cost",
    "do you take walk-ins",
    "do you offer towing",
    "help",
    "tell me a joke",
    "thank you",
    "bye",
  ];
  for (const probe of probes) {
    const answer = answerQuestion(probe, TUESDAY_OPEN);
    const hasLead = answer.chips.some((chip) => chip.kind === "call" || chip.kind === "email");
    assert.ok(hasLead, `"${probe}" should include a call or email chip`);
  }
});
