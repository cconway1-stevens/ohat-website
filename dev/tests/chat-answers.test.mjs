import assert from "node:assert/strict";
import test from "node:test";
import { answerQuestion, quickPrompts, treadGreeting } from "../../src/lib/chat/answers.ts";

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

test("greets as Tread whether the shop is open or closed", () => {
  assert.match(treadGreeting(TUESDAY_OPEN), /Tread/);
  assert.match(treadGreeting(SUNDAY_CLOSED), /Tread/);
});

test("ships a non-empty list of quick prompts", () => {
  assert.ok(Array.isArray(quickPrompts));
  assert.ok(quickPrompts.length > 0);
  for (const prompt of quickPrompts) assert.equal(typeof prompt, "string");
});
