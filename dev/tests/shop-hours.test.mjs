import assert from "node:assert/strict";
import test from "node:test";
import { shop } from "../../src/lib/shop/shop.mjs";
import {
  exceptionFor,
  getHoursForecast,
  getShopHoursStatus,
  getShopStatusLabel,
} from "../../src/lib/shop/shop-hours.mjs";

test("uses configured opening and closing status windows", () => {
  assert.equal(getShopHoursStatus(new Date("2026-07-27T11:29:00Z")).status, "closed");
  assert.equal(getShopHoursStatus(new Date("2026-07-27T11:30:00Z")).status, "opening-soon");
  assert.equal(getShopHoursStatus(new Date("2026-07-27T12:00:00Z")).status, "open");
  assert.equal(getShopHoursStatus(new Date("2026-07-27T20:30:00Z")).status, "closing-soon");
  assert.equal(getShopHoursStatus(new Date("2026-07-27T21:00:00Z")).status, "closed");
});

test("closes an hour early on Fridays", () => {
  // 2026-07-31 is a Friday; EDT is UTC-4, so 16:00 local is 20:00Z.
  assert.equal(getShopHoursStatus(new Date("2026-07-31T19:29:00Z")).status, "open");
  assert.equal(getShopHoursStatus(new Date("2026-07-31T19:30:00Z")).status, "closing-soon");
  assert.equal(getShopHoursStatus(new Date("2026-07-31T20:00:00Z")).status, "closed");
  // Same clock time on a Thursday is still well within the regular close.
  assert.equal(getShopHoursStatus(new Date("2026-07-30T20:00:00Z")).status, "open");
});

test("warns on every configured observed federal holiday", () => {
  const observed2026 = [
    ["2026-01-01T17:00:00Z", "New Year's Day"],
    ["2026-01-19T17:00:00Z", "Martin Luther King Jr. Day"],
    ["2026-02-16T17:00:00Z", "Washington's Birthday"],
    ["2026-05-25T17:00:00Z", "Memorial Day"],
    ["2026-06-19T17:00:00Z", "Juneteenth"],
    ["2026-07-03T17:00:00Z", "Independence Day"],
    ["2026-09-07T17:00:00Z", "Labor Day"],
    ["2026-10-12T17:00:00Z", "Columbus Day"],
    ["2026-11-11T17:00:00Z", "Veterans Day"],
    ["2026-11-26T17:00:00Z", "Thanksgiving Day"],
    ["2026-12-25T17:00:00Z", "Christmas Day"],
  ];

  assert.equal(
    observed2026.length,
    shop.hours.federalHolidays.fixed.length + shop.hours.federalHolidays.floating.length,
  );
  for (const [iso, holiday] of observed2026) {
    const status = getShopHoursStatus(new Date(iso));
    assert.equal(status.status, "closed");
    assert.equal(status.holiday, holiday);
    assert.match(status.holidayNotice, new RegExp(holiday.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("keeps ordinary weekends closed without a holiday notice", () => {
  const status = getShopHoursStatus(new Date("2026-07-26T17:00:00Z"));
  assert.equal(status.status, "closed");
  assert.equal(status.holiday, null);
  assert.equal(status.holidayNotice, null);
  // The sign explains itself: a weekend closure is the standing weekly rule,
  // not a mystery the customer has to call about.
  assert.equal(status.reason.kind, "weekend");
assert.equal(
    status.label,
    "Closed — we're shut every Saturday and Sunday. Reopens Monday at 8:00 AM",
  );
});

test("names the holiday on the closed sign", () => {
  // 2026-09-07 is Labor Day (Monday); 17:00Z is mid-day there.
  const laborDay = getShopHoursStatus(new Date("2026-09-07T17:00:00Z"));
  assert.equal(laborDay.status, "closed");
  assert.equal(laborDay.reason.kind, "holiday");
  assert.equal(laborDay.holiday, "Labor Day");
  assert.equal(laborDay.label, "Closed for Labor Day. Reopens Tuesday at 8:00 AM");
});

test("tells customers when the shop will reopen after hours", () => {
  const mondayEvening = getShopHoursStatus(new Date("2026-07-27T21:00:00Z"));
  assert.equal(mondayEvening.label, "Closed for the day. Reopens Tuesday at 8:00 AM");
  assert.equal(mondayEvening.reason.kind, "after-hours");

  const fridayEvening = getShopHoursStatus(new Date("2026-07-31T21:00:00Z"));
  assert.equal(fridayEvening.label, "Closed for the day. Reopens Monday at 8:00 AM");

  const mondayMorning = getShopHoursStatus(new Date("2026-07-27T11:00:00Z"));
  assert.equal(mondayMorning.label, "Closed. Reopens today at 8:00 AM");
});

test("owner-posted closures close the day and name themselves", () => {
  shop.hours.exceptions = [{ from: "2026-07-28", reason: "Storm cleanup" }];
  try {
    const tuesday = getShopHoursStatus(new Date("2026-07-28T17:00:00Z"));
    assert.equal(tuesday.status, "closed");
    assert.equal(tuesday.reason.kind, "exception");
    assert.equal(tuesday.exceptionReason, "Storm cleanup");
    assert.equal(tuesday.holiday, null);
    assert.equal(tuesday.label, "Closed — Storm cleanup. Reopens Wednesday at 8:00 AM");
  } finally {
    shop.hours.exceptions = [];
  }
});

test("the reopen day skips over an owner-posted closure", () => {
  shop.hours.exceptions = [{ from: "2026-07-28", to: "2026-07-29", reason: "Storm cleanup" }];
  try {
    // Monday evening: Tuesday and Wednesday are both shut, so Thursday.
    const mondayEvening = getShopHoursStatus(new Date("2026-07-27T21:00:00Z"));
    assert.equal(mondayEvening.label, "Closed for the day. Reopens Thursday at 8:00 AM");
  } finally {
    shop.hours.exceptions = [];
  }
});

test("an owner-posted closure outranks a holiday on the same day", () => {
  shop.hours.exceptions = [{ from: "2026-11-26", reason: "Family emergency" }];
  try {
    const thanksgiving = getShopHoursStatus(new Date("2026-11-26T17:00:00Z"));
    assert.equal(thanksgiving.reason.kind, "exception");
    assert.equal(thanksgiving.exceptionReason, "Family emergency");
    // The holiday still names itself for the day-of notice, but the sign
    // leads with the owner's own reason.
    assert.equal(thanksgiving.holiday, "Thanksgiving Day");
    assert.equal(thanksgiving.label, "Closed — Family emergency. Reopens Friday at 8:00 AM");
  } finally {
    shop.hours.exceptions = [];
  }
});

test("draft or malformed exception entries are ignored, not fatal", () => {
  shop.hours.exceptions = [
    null,
    { from: "07/28/2026", reason: "Wrong date format" },
    { from: "2026-07-28", reason: "   " },
  ];
  try {
    // Tuesday 2026-07-28 is a scheduled business day and every entry above
    // is invalid, so the shop is open at mid-day.
    assert.equal(getShopHoursStatus(new Date("2026-07-28T17:00:00Z")).status, "open");
    assert.equal(exceptionFor(2026, 7, 28), null);
  } finally {
    shop.hours.exceptions = [];
  }
});

test("the forecast reads the week ahead from the same engine", () => {
  // Friday 2026-09-04 (8 AM EDT) looking 14 days out.
  const rows = getHoursForecast(new Date("2026-09-04T12:00:00Z"), 14);
  assert.equal(rows.length, 14);
  assert.equal(rows[0].key, "2026-09-04");
  assert.equal(rows[0].weekday, "Friday");
  assert.equal(rows[0].open, true);
  assert.equal(rows[0].hours, "8:00 AM–4:00 PM");

  const [saturday, sunday, laborDay, tuesday] = rows.slice(1, 5);
  assert.equal(saturday.open, false);
  assert.equal(saturday.why.kind, "weekend");
  assert.equal(sunday.open, false);
  assert.equal(laborDay.open, false);
  assert.equal(laborDay.holiday, "Labor Day");
  assert.equal(laborDay.why.kind, "holiday");
  assert.equal(laborDay.why.detail, "Labor Day");
  assert.match(laborDay.statusLabel, /Closed for Labor Day\. Reopens Tuesday/);
  assert.equal(tuesday.open, true);
  assert.equal(tuesday.hours, "8:00 AM–5:00 PM");
});

test("the forecast carries owner-posted closures with their reason", () => {
  shop.hours.exceptions = [{ from: "2026-09-10", to: "2026-09-11", reason: "Staff training" }];
  try {
    const rows = getHoursForecast(new Date("2026-09-08T12:00:00Z"), 7);
    const thursday = rows[2];
    assert.equal(thursday.key, "2026-09-10");
    assert.equal(thursday.open, false);
    assert.equal(thursday.hours, "Closed");
    assert.equal(thursday.why.kind, "exception");
    assert.equal(thursday.why.detail, "Staff training");
    assert.equal(thursday.exception, "Staff training");
  } finally {
    shop.hours.exceptions = [];
  }
});

test("configures every hold-preview sign and label", () => {
  const preview = shop.hours.status.signPreview;
  assert.equal(preview.holdMs, 5_000);
  assert.ok(preview.stepMs > 0);
  assert.ok(preview.cycles > 0);
  assert.deepEqual(preview.states, ["opening-soon", "open", "closing-soon", "closed"]);
  for (const state of preview.states) assert.ok(getShopStatusLabel(state));
});
