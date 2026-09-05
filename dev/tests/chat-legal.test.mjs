import assert from "node:assert/strict";
import test from "node:test";
import { allIntentAnswers, debugAnswer } from "../../src/lib/chat/answers.ts";
import { services } from "../../src/lib/services.ts";

// The legal audit: the widget is a tire/plug, not a mechanic. No canned
// answer may make a strong claim, and every symptom answer must hedge the
// cause, mirror what the customer typed, and lead with the call chip.

const TUESDAY_OPEN = new Date("2026-09-01T14:00:00Z");

const BANNED_CLAIMS =
  /guarantee|we promise|lowest price|cheapest|best price|won'?t be beat|100% satisfaction|lifetime warranty|always fixes|never fails|cures|fixes it every time/i;

test("legal: no canned intent answer makes a banned claim", () => {
  for (const { id, text } of allIntentAnswers(TUESDAY_OPEN)) {
    assert.doesNotMatch(text, BANNED_CLAIMS, `intent "${id}" makes a banned claim`);
  }
});

// The cost intent and the FAQ matcher can both surface a service's own copy
// verbatim (see resolve() in answers.ts) — that copy is just as much "a
// canned answer" as the intents above, so it gets the same sweep.
test("legal: no service cost blurb or FAQ answer makes a banned claim", () => {
  for (const service of services) {
    assert.doesNotMatch(
      service.cost,
      BANNED_CLAIMS,
      `${service.slug} cost blurb makes a banned claim`,
    );
    for (const faq of service.faqs) {
      assert.doesNotMatch(
        faq.answer,
        BANNED_CLAIMS,
        `${service.slug} FAQ "${faq.question}" makes a banned claim`,
      );
    }
  }
});

const SYMPTOMS = [
  "my brakes squeal",
  "my brakes are grinding",
  "car makes sounds",
  "my car is making a noise",
  "my car is overheating",
  "coolant leak under the car",
  "transmission slipping",
  "check engine light is on",
  "battery keeps dying",
  "ac blows hot",
  "car pulls to the right",
  "loud muffler",
  "tire pressure light is on",
  "car won't start",
  "smoke coming from the engine",
  "car shaking at highway speed",
];

test("legal: symptom answers mirror, hedge, and lead with the call", () => {
  for (const phrase of SYMPTOMS) {
    const { answer } = debugAnswer(phrase, TUESDAY_OPEN);
    assert.ok(!answer.fallback, `"${phrase}" fell back`);
    assert.ok(
      /could be a few different things|don'?t guess over chat/i.test(answer.text),
      `"${phrase}" answer does not hedge the diagnosis`,
    );
    assert.ok(
      /recommend a call|live agent/i.test(answer.text),
      `"${phrase}" answer never hands off to a live agent`,
    );
    assert.ok(
      answer.chips.length > 0 && answer.chips[0].href.startsWith("tel:"),
      `"${phrase}" answer does not lead with the call chip`,
    );
    assert.doesNotMatch(answer.text, BANNED_CLAIMS, `"${phrase}" answer makes a banned claim`);
    // The customer's own words come back to them — they sound heard.
    assert.ok(answer.text.includes('"'), `"${phrase}" answer does not mirror the issue`);
  }
});

test("routes named federal holidays to the hours intent, not the timeline intent", () => {
  for (const phrase of [
    "are you open on labor day",
    "are you open on memorial day",
    "are you open for thanksgiving",
    "open on christmas",
  ]) {
    const { matched } = debugAnswer(phrase, TUESDAY_OPEN);
    assert.equal(matched?.id, "hours", `"${phrase}" should route to the hours intent`);
  }
});

test("routes credential questions (licensed, insured, ASE) to the credentials intent", () => {
  for (const phrase of ["are you licensed", "are you insured", "are you ase certified"]) {
    const { matched, answer } = debugAnswer(phrase, TUESDAY_OPEN);
    assert.equal(matched?.id, "credentials", `"${phrase}" should route to the credentials intent`);
    assert.ok(!answer.fallback, `"${phrase}" fell back instead of answering`);
    assert.ok(answer.chips[0]?.href.startsWith("tel:"), `"${phrase}" not call-first`);
  }
});

test("routes hint-free Spanish auto vocabulary without a full Spanish sentence", () => {
  for (const [phrase, expectedId] of [
    ["hacen frenos", "service:brake-repair"],
    ["cambio de aceite", "service:oil-maintenance"],
    ["donde estan ubicados", "location"],
  ]) {
    const { matched } = debugAnswer(phrase, TUESDAY_OPEN);
    assert.ok(matched, `"${phrase}" fell back`);
    assert.equal(matched.id, expectedId, `"${phrase}" matched ${matched.id}, expected ${expectedId}`);
  }
});

test("legal: small talk never swallows a symptom", () => {
  for (const phrase of [
    "hey my brakes are grinding",
    "hi my check engine light is on",
    "hello, car makes sounds",
  ]) {
    const { answer } = debugAnswer(phrase, TUESDAY_OPEN);
    assert.ok(!answer.fallback, `"${phrase}" fell back`);
    assert.ok(
      /could be|don'?t guess|recommend a call|live agent/i.test(answer.text),
      `"${phrase}" answered without the hedge`,
    );
    assert.ok(answer.chips[0]?.href.startsWith("tel:"), `"${phrase}" not call-first`);
  }
});
