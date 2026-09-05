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

test("training 4/5 — contact, location & booking", () => {
  for (const phrase of CONTACT) expectRouted(phrase);
  assert.ok(CONTACT.length >= 90);
});
