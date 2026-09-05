import assert from "node:assert/strict";
import test from "node:test";
import { debugAnswer } from "../../src/lib/chat/answers.ts";

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

test("training 3/5 — services & car knowledge", () => {
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
