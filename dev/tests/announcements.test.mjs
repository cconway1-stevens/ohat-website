import assert from "node:assert/strict";
import test from "node:test";
import { getActiveNotice, getNoticeChain } from "../../src/lib/shop/announcements.mjs";
import { shop } from "../../src/lib/shop/shop.mjs";

/* All instants are UTC; the notice engine converts them to the shop's
   America/New_York calendar before comparing dates. 2026's observed federal
   holidays are pinned by shop-hours.test.mjs — these tests build on those. */

test("warns on the holiday itself with the standing day-of wording", () => {
  const notice = getActiveNotice(new Date("2026-11-26T17:00:00Z"));
  assert.equal(notice.id, "holiday-2026-11-26");
  assert.match(notice.message, /Holiday hours may vary for Thanksgiving Day/);
  assert.match(notice.message, /Please give us a call before stopping by/);
});

test("the holiday-ahead banner starts three shop business days prior", () => {
  // Thanksgiving 2026 is Thursday, Nov 26. Three business days back from it
  // (Wed, Tue, Mon) is Monday the 23rd — so Sunday and earlier stay silent.
  assert.equal(getActiveNotice(new Date("2026-11-20T17:00:00Z")), null);
  assert.equal(getActiveNotice(new Date("2026-11-21T17:00:00Z")), null);
  assert.equal(getActiveNotice(new Date("2026-11-22T17:00:00Z")), null);

  const monday = getActiveNotice(new Date("2026-11-23T17:00:00Z"));
  assert.match(monday.message, /Coming up: Thanksgiving Day/);
  assert.match(monday.message, /Hours may vary around the holiday/);
  assert.equal(monday.id, "holiday-ahead-2026-11-26");

  // Runs every day from the start date through the eve of the holiday.
  assert.match(getActiveNotice(new Date("2026-11-24T17:00:00Z")).message, /Coming up/);
  assert.match(getActiveNotice(new Date("2026-11-25T17:00:00Z")).message, /Coming up/);
});

test("weekend days before the holiday do not widen the warning window", () => {
  // Veterans Day 2026 is Wednesday, Nov 11, so the window opens Friday the
  // 6th (three business days: Tue, Mon, Fri) — Thursday the 5th is silent.
  assert.equal(getActiveNotice(new Date("2026-11-05T17:00:00Z")), null);
  assert.match(getActiveNotice(new Date("2026-11-06T17:00:00Z")).message, /Veterans Day/);
});

test("a Saturday holiday warns toward its Friday observance", () => {
  // Independence Day 2026 falls on Saturday July 4 and is observed Friday
  // July 3 — the ahead window must count to the observed date.
  assert.equal(getActiveNotice(new Date("2026-06-29T17:00:00Z")), null);
  assert.match(getActiveNotice(new Date("2026-06-30T17:00:00Z")).message, /Independence Day/);
  assert.match(getActiveNotice(new Date("2026-07-01T17:00:00Z")).message, /Independence Day/);
});

test("the day after an observed Saturday holiday is an ordinary day", () => {
  assert.equal(getActiveNotice(new Date("2026-07-04T17:00:00Z")), null);
});

test("the ahead window crosses the year boundary to New Year's Day", () => {
  assert.equal(getActiveNotice(new Date("2026-12-28T17:00:00Z")), null);
  const dec30 = getActiveNotice(new Date("2026-12-30T17:00:00Z"));
  assert.match(dec30.message, /Coming up: New Year's Day/);
  assert.equal(dec30.id, "holiday-ahead-2027-01-01");
});

test("a manual announcement outranks the automatic holiday notices", () => {
  const entries = [
    { id: "special", from: "2026-11-23", to: "2026-11-24", message: "Special hours today." },
  ];
  const notice = getActiveNotice(new Date("2026-11-23T17:00:00Z"), entries);
  assert.equal(notice.id, "special");
  assert.equal(notice.message, "Special hours today.");
});

test("manual announcement dates are inclusive on both ends", () => {
  const entries = [
    { id: "bounds", from: "2026-11-23", to: "2026-11-23", message: "One day only." },
  ];
  assert.equal(getActiveNotice(new Date("2026-11-23T17:00:00Z"), entries).message, "One day only.");
  // Nov 22: manual entry inactive AND the Thanksgiving ahead window not yet
  // open — fully silent.
  assert.equal(getActiveNotice(new Date("2026-11-22T17:00:00Z"), entries), null);
  // Nov 24: manual entry has ended, so the automatic holiday-ahead notice
  // takes back over (the fallback chain, not a manual-range leak).
  assert.match(
    getActiveNotice(new Date("2026-11-24T17:00:00Z"), entries).message,
    /Coming up: Thanksgiving Day/,
  );
});

test("draft or malformed entries are ignored, not fatal", () => {
  const entries = [
    null,
    { id: "blank", from: "2026-11-23", to: "2026-11-23", message: "   " },
    { id: "bad-dates", from: "11/23/2026", to: "2026-11-23", message: "Wrong format." },
    { id: "no-message", from: "2026-11-23", to: "2026-11-23" },
  ];
  const notice = getActiveNotice(new Date("2026-11-23T17:00:00Z"), entries);
  assert.match(notice.message, /Coming up: Thanksgiving Day/);
});

test("an entry with no id still keys its dismissals predictably", () => {
  const entries = [{ from: "2026-11-23", to: "2026-11-23", message: "No id supplied." }];
  const notice = getActiveNotice(new Date("2026-11-23T17:00:00Z"), entries);
  assert.equal(notice.id, "2026-11-23_2026-11-23");
});

test("ordinary days far from any holiday stay silent", () => {
  assert.equal(getActiveNotice(new Date("2026-03-15T17:00:00Z")), null);
  assert.equal(getActiveNotice(new Date("2026-04-20T17:00:00Z")), null);
});

test("dates resolve on the shop's calendar, not the server's UTC clock", () => {
  // 2026-11-26T04:30Z is still Wednesday Nov 25 in Egg Harbor Township.
  assert.match(getActiveNotice(new Date("2026-11-26T04:30:00Z")).message, /Coming up/);
  // 2026-11-26T05:00Z is the first minute of Thursday Nov 26 there — day-of.
  assert.match(
    getActiveNotice(new Date("2026-11-26T05:00:00Z")).message,
    /Holiday hours may vary for Thanksgiving Day/,
  );
});

test("the chain exposes every layer with a single winner", () => {
  const chain = getNoticeChain(new Date("2026-11-26T17:00:00Z"));
  assert.equal(chain.manual, null);
  assert.equal(chain.exception, null);
  assert.equal(chain.holidayToday?.id, "holiday-2026-11-26");
  assert.equal(chain.winner, chain.holidayToday);
  // The scan window from Thanksgiving only reaches Dec 10, so Christmas is
  // not yet close enough for a holiday-ahead warning on top.
  assert.equal(chain.holidayAhead, null);

  // An ordinary day: every layer silent, no winner.
  const quiet = getNoticeChain(new Date("2026-03-15T17:00:00Z"));
  assert.equal(quiet.manual, null);
  assert.equal(quiet.exception, null);
  assert.equal(quiet.holidayToday, null);
  assert.equal(quiet.holidayAhead, null);
  assert.equal(quiet.winner, null);
});

test("an owner-posted closure outranks the holiday notice on the same day", () => {
  shop.hours.exceptions = [{ from: "2026-11-26", reason: "Storm cleanup" }];
  try {
    const chain = getNoticeChain(new Date("2026-11-26T17:00:00Z"));
    // The exception layer wins with the same words the placard uses; the
    // holiday notice stays computed underneath but covered.
    assert.equal(chain.exception?.message, "Closed — Storm cleanup");
    assert.equal(chain.winner, chain.exception);
    assert.equal(chain.holidayToday?.id, "holiday-2026-11-26");
    assert.equal(
      getActiveNotice(new Date("2026-11-26T17:00:00Z")).message,
      "Closed — Storm cleanup",
    );
  } finally {
    shop.hours.exceptions = [];
  }
});

test("a manual posting still outranks an owner closure", () => {
  shop.hours.exceptions = [{ from: "2026-11-23", reason: "Storm cleanup" }];
  try {
    const entries = [
      { id: "special", from: "2026-11-23", to: "2026-11-23", message: "Special hours today." },
    ];
    const chain = getNoticeChain(new Date("2026-11-23T17:00:00Z"), entries);
    assert.equal(chain.winner, chain.manual);
    assert.equal(chain.manual.message, "Special hours today.");
  } finally {
    shop.hours.exceptions = [];
  }
});

test("owner closures hide their days from the holiday lead count", () => {
  // Thanksgiving 2026 is Thursday Nov 26; normally the ahead window opens
  // Monday Nov 23 (three business days back). With Tue+Wed posted as owner
  // closures those days stop counting as business days, so the warning
  // switches on earlier — warning early is the safe direction.
  shop.hours.exceptions = [
    { from: "2026-11-24", to: "2026-11-25", reason: "Storm cleanup" },
  ];
  try {
    const chain = getNoticeChain(new Date("2026-11-21T17:00:00Z"));
    assert.equal(chain.holidayAhead?.id, "holiday-ahead-2026-11-26");
  } finally {
    shop.hours.exceptions = [];
  }
});
