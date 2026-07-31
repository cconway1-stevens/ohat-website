import assert from "node:assert/strict";
import test from "node:test";
import { getShopHoursStatus } from "../lib/shop-hours.mjs";
import { shop } from "../lib/shop.mjs";

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

  assert.equal(observed2026.length, shop.hours.federalHolidays.fixed.length + shop.hours.federalHolidays.floating.length);
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
