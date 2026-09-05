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

test("training 1/5 — small talk & greetings", () => {
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
