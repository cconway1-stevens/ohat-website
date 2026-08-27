import assert from "node:assert/strict";
import test from "node:test";
import { getShopHoursStatus, getShopStatusLabel } from "../../src/lib/shop/shop-hours.mjs";
import { shop } from "../../src/lib/shop/shop.mjs";

test("uses configured opening and closing status windows", () => {
  assert.equal(getShopHoursStatus(new Date("2026-07-27T11:29:00Z")).status, "closed");
  assert.equal(getShopHoursStatus(new Date("2026-07-27T11:30:00Z")).status, "opening-soon");
  assert.equal(getShopHoursStatus(new Date("2026-07-27T12:00:00Z")).status, "open");
  assert.equal(getShopHoursStatus(new Date("2026-07-27T20:30:00Z")).status, "closing-soon");
  assert.equal(getShopHoursStatus(new Date("2026-07-27T21:00:00Z")).status, "closed");
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
});

test("tells customers when the shop will reopen after hours", () => {
  const mondayEvening = getShopHoursStatus(new Date("2026-07-27T21:00:00Z"));
  assert.equal(mondayEvening.label, "Closed for the day. Reopens Tuesday at 8:00 AM");

  const fridayEvening = getShopHoursStatus(new Date("2026-07-31T21:00:00Z"));
  assert.equal(fridayEvening.label, "Closed for the day. Reopens Monday at 8:00 AM");

  const mondayMorning = getShopHoursStatus(new Date("2026-07-27T11:00:00Z"));
  assert.equal(mondayMorning.label, "Closed. Reopens today at 8:00 AM");
});

test("configures every hold-preview sign and label", () => {
  const preview = shop.hours.status.signPreview;
  assert.equal(preview.holdMs, 5_000);
  assert.ok(preview.stepMs > 0);
  assert.ok(preview.cycles > 0);
  assert.deepEqual(preview.states, ["opening-soon", "open", "closing-soon", "closed"]);
  for (const state of preview.states) assert.ok(getShopStatusLabel(state));
});
