import assert from "node:assert/strict";
import test from "node:test";
import { debugAnswer } from "../../../src/lib/chat/answers.ts";

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

test("training 5/5 — pricing, trust, emergencies & timelines", () => {
  for (const phrase of MONEY) expectRouted(phrase);
  for (const phrase of TRUST) expectRouted(phrase);
  for (const phrase of URGENT) expectRouted(phrase);
  for (const phrase of TIMELINE) expectRouted(phrase);
  assert.ok(MONEY.length + TRUST.length + URGENT.length + TIMELINE.length >= 100);
});
