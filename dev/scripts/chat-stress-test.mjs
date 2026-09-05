import { debugAnswer } from "../../src/lib/chat/answers.ts";

const NOW = new Date("2026-09-05T18:00:00Z"); // Saturday — shop closed, exercises the closed-hours path

const QUESTIONS = [
  // Hours
  "are you open right now",
  "what time do you close today",
  "are you open on sunday",
  "when do you open tomorrow",
  "are you open on labor day",
  // Location
  "where are you located",
  "how do i get there",
  "do you have parking",
  "do you service linwood",
  // Phone/contact
  "whats your number",
  "can i talk to a real person",
  "how do i reach you",
  "whats your email",
  // Pricing
  "how much for an oil change",
  "how much does a brake job cost",
  "whats the cheapest tire you sell",
  "do you guarantee your work",
  "will you beat any price",
  "how much to fix a flat",
  "whats the price for an alignment",
  "do you finance repairs",
  "do you take apple pay",
  // Booking
  "can i book an appointment",
  "do you have any openings today",
  "can i just walk in",
  "how long will an oil change take",
  // Symptoms
  "my brakes are grinding",
  "check engine light is on",
  "car is making a weird noise",
  "car pulls to the left",
  "ac isnt blowing cold",
  "transmission is slipping",
  "battery died again",
  "smoke coming from under the hood",
  "car wont start",
  "my tire is losing air",
  // Legal / trust
  "are you licensed",
  "are you insured",
  "do you offer a lifetime warranty",
  "is this the cheapest shop in town",
  "will this always fix the problem",
  "are you a certified mechanic",
  "can you legally do my state inspection",
  // Emergency
  "i just got in an accident",
  "theres smoke and its on fire",
  "im stranded on the parkway",
  // Small talk / off-topic
  "hi",
  "hello there",
  "thank you",
  "bye",
  "tell me a joke",
  "are you sentient",
  "who built you",
  "will you marry me",
  "this bot sucks",
  // Edge cases
  "",
  "asdkfjasldkfj",
  "??????",
  "how much does it cost to fix everything wrong with my car",
  "can you diagnose my car right now over chat",
  "what medications should i take",
  "give me legal advice about my lease",
  "whats the weather today",
  // Spanish
  "cuanto cuesta cambiar el aceite",
  "donde estan ubicados",
  "hacen frenos",
];

let issues = 0;
for (const q of QUESTIONS) {
  const { answer, matched } = debugAnswer(q, NOW);
  const flags = [];
  if (answer.fallback) flags.push("FALLBACK");
  if (!answer.chips || answer.chips.length === 0) flags.push("NO-CHIPS");
  if (!/tel:|mailto:/.test(answer.chips?.[0]?.href ?? "")) flags.push("NOT-CTA-FIRST");
  if (/\$\d/.test(answer.text)) flags.push("QUOTES-DOLLAR-FIGURE");
  if (/guarantee|lowest price|cheapest|best price|lifetime warranty|always fixes|never fails/i.test(answer.text))
    flags.push("BANNED-CLAIM");

  console.log(`Q: ${q || "(empty)"}`);
  console.log(`  matched: ${matched ? `${matched.kind}:${matched.id} (${matched.score.toFixed(1)})` : "none"}`);
  console.log(`  A: ${answer.text}`);
  console.log(`  chips: ${answer.chips.map((c) => `${c.kind}:${c.label}`).join(", ")}`);
  if (flags.length) {
    console.log(`  !! FLAGS: ${flags.join(", ")}`);
    issues++;
  }
  console.log();
}

console.log(`\n${QUESTIONS.length} questions asked, ${issues} flagged for review.`);
