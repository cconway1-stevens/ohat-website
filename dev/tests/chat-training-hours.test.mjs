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

const HOURS = [
  "are you open", "are you open today", "are you open right now", "are you open now",
  "are you open tomorrow", "are you open on saturday", "are you open on sunday",
  "are you open on weekends", "are you closed", "are you closed today",
  "are you closed tomorrow", "are you closed on sunday", "are you closed on saturday",
  "what are your hours", "what are your hours today", "what are your hours tomorrow",
  "your hours", "shop hours", "store hours", "business hours", "hours of operation",
  "service hours", "when do you open", "when do you close", "when are you open",
  "what time do you open", "what time do you close", "what time do you open today",
  "what time do you open tomorrow", "what time", "opening time", "closing time",
  "opening hours", "closing hours", "do you open early", "do you close late",
  "are you open late", "are you open late tonight", "are you open tonight", "open tonight",
  "open late", "open now", "open yet", "still open", "already closed", "closed yet",
  "before you close", "sunday hours", "saturday hours", "weekend hours", "monday hours",
  "tuesday hours", "wednesday hours", "thursday hours", "friday hours", "friday close time",
  "do you open on sundays", "open on saturdays", "hours on saturday", "hours on sunday",
  "open in the morning", "open in the afternoon", "open in the evening", "morning hours",
  "afternoon hours", "evening hours", "early hours", "late hours", "today hours",
  "tomorrow hours", "hours this week", "hours this weekend", "are you open this weekend",
  "are you open mondays", "are you open fridays", "what days are you open",
  "what days are you closed", "days and hours", "are you open holidays", "holiday hours",
  "labor day hours", "thanksgiving hours", "christmas hours", "new year hours",
  "are you open on labor day", "are you open on thanksgiving", "closed for holiday",
  "holiday closures", "any closures coming up", "upcoming closures", "when do you reopen",
  "reopening", "reopen monday", "are you open before 8", "are you open after 5", "open at 8",
  "close at 5", "friday 8 to 4", "open past 5", "do you close early on friday",
];

test("training 2/5 — hours & schedule", () => {
  for (const phrase of HOURS) {
    const matched = expectRouted(phrase);
    assert.equal(matched?.kind, "intent", `"${phrase}" should hit an intent, not a guess`);
  }
  assert.equal(HOURS.length, 100);
});