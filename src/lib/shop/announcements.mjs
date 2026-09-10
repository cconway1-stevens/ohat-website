import { shop } from "./shop.mjs";
import { exceptionFor, holidayFor, localParts, WEEKDAY_NAMES } from "./shop-hours.mjs";

// ---------------------------------------------------------------------------
// SHOP NOTICES — the file the owner edits.
//
// TO POST A NOTICE: add one entry to the list below. The banner appears at
// the top of every page from `from` through `to`, inclusive, on the shop's
// own calendar (America/New_York):
//
//   {
//     id: "example-notice",     // any stable label; remembers dismissals
//     from: "2026-12-24",       // first day the banner shows (YYYY-MM-DD)
//     to: "2026-12-26",         // last day (single-day notice: make them equal)
//     message: "Closed for the holiday weekend — see you Monday.",
//   },
//
// The banner automatically appends a "Call (609) 241-1546" link — the phone
// number is read from shop.mjs and never needs typing here. Entries with a
// blank message or malformed dates are ignored, so a half-finished draft can
// never blank the banner. A manual entry always wins over the automatic
// federal-holiday notices on the same day. Every banner also carries a
// standing "Full hours" link to /hours, so a customer reading a closure
// notice is one click from the whole schedule.
// ---------------------------------------------------------------------------
const announcements = [];

// How many shop business days (Mon-Fri, per shop.hours.days, excluding other
// federal holidays) must remain before the next federal holiday for the
// "holiday ahead" banner to switch on. 3 = the banner starts three business
// days out: a Thursday holiday warns from Monday, a Monday holiday from
// Wednesday, and weekends never count.
const HOLIDAY_LEAD_DAYS = 3;

// TODO (deferred — owner-posted notices from outside this repo):
// Move the first source in the banner's chain to a Google Sheet so the owner
// can post notices without a code change. Agreed design:
//   - Owner edits a Google Sheet published via File → Share → Publish to web.
//     Four columns per row: message | start | end | on/off — the toggle lets
//     a notice be switched off without deleting the row.
//   - The site fetches the sheet's public URL client-side, following the
//     shop-almanac weather-fetch pattern (AbortController timeout, silent
//     failure, kept out of the page's critical window).
//   - Source chain, highest priority first: sheet rows → the `announcements`
//     list below → the automatic federal-holiday notices. Each layer covers
//     the one above it, so the banner never goes dark because a third party
//     did. Works identically on Vercel, GitHub Pages and Cloudflare.
//   - Dates compared in America/New_York; every row validated like the
//     entries above; the phone link stays single-sourced from shop.mjs.
//   - localStorage caches the last fetch so repeat visits paint the banner
//     instantly and refresh silently in the background.

// Calendar-day walk window wide enough for any lead window in use.
const SCAN_HORIZON_DAYS = 14;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function todayKey({ year, month, day }) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

/* The whole engine runs on UTC calendar dates built from the shop timezone's
   calendar parts (the same convention as shop-hours.mjs): UTC has no DST, so
   adding whole days to a UTC-midnight date rolls months and years correctly
   and the federal-holiday engine compares the same ISO keys. */
function utcDate({ year, month, day }) {
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

function shiftDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function holidayName(date) {
  return holidayFor(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function isShopBusinessDay(date) {
  if (!shop.hours.days.includes(WEEKDAY_NAMES[date.getUTCDay()])) return false;
  // An owner-posted closure hides the day from the lead count exactly like a
  // holiday does — counting a day the doors won't open would start the
  // holiday warning too late.
  if (holidayName(date)) return false;
  return exceptionFor(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()) === null;
}

function manualNotice(entries, key) {
  for (const entry of entries) {
    const message = typeof entry?.message === "string" ? entry.message.trim() : "";
    if (!message) continue;
    if (!ISO_DATE.test(entry.from ?? "") || !ISO_DATE.test(entry.to ?? "")) continue;
    if (key >= entry.from && key <= entry.to) {
      // An owner writes their own wording, so there is no sentence this can
      // safely drop — the phone banner shows the same line.
      return { id: entry.id ?? `${entry.from}_${entry.to}`, message, short: message };
    }
  }
  return null;
}

function holidayTodayNotice(today, holidayNotice) {
  const holiday = holidayName(today);
  if (!holiday) return null;
  return {
    id: `holiday-${today.toISOString().slice(0, 10)}`,
    message: `${holidayNotice.beforeName} ${holiday}. ${holidayNotice.afterName}`,
    short: `${holidayNotice.beforeName} ${holiday}.`,
  };
}

/* Nearest federal holiday within the scan window; shows while fewer than
   HOLIDAY_LEAD_DAYS shop business days sit strictly between today and it, so
   the banner starts exactly three business days prior and runs through the
   holiday itself (handled by holidayTodayNotice, which wins). */
function holidayAheadNotice(today, holidayNotice) {
  for (let offset = 1; offset <= SCAN_HORIZON_DAYS; offset += 1) {
    const date = shiftDays(today, offset);
    const holiday = holidayName(date);
    if (!holiday) continue;
    let businessDays = 0;
    for (let between = 1; between < offset; between += 1) {
      if (isShopBusinessDay(shiftDays(today, between))) businessDays += 1;
    }
    if (businessDays >= HOLIDAY_LEAD_DAYS) return null;
    return {
      id: `holiday-ahead-${date.toISOString().slice(0, 10)}`,
      message: `${holidayNotice.upcomingKicker} ${holiday}. ${holidayNotice.upcomingNote} ${holidayNotice.afterName}`,
      short: `${holidayNotice.upcomingKicker} ${holiday}. ${holidayNotice.upcomingNote}`,
    };
  }
  return null;
}

/* The owner-posted closure for today, worded exactly as the placard words
   it (both read `hours.exceptions` through the same engine). Fires only on
   the closure day itself — lead-up copy is what the manual `announcements`
   list above is for. */
function exceptionTodayNotice(today, key) {
  const exception = exceptionFor(
    today.getUTCFullYear(),
    today.getUTCMonth() + 1,
    today.getUTCDate(),
  );
  if (!exception) return null;
  // Already a placard-length line; nothing to trim for the phone banner.
  return { id: `exception-${key}`, message: exception.label, short: exception.label };
}

/**
 * Every notice layer evaluated for right now — what the owner dash renders
 * to explain why the banner reads the way it does.
 *
 * The layers, highest priority first: a manual `announcements` entry, then
 * today's owner-posted closure from `hours.exceptions`, then the
 * federal-holiday notice for today, then the "holiday ahead" notice once the
 * next federal holiday is within HOLIDAY_LEAD_DAYS shop business days. One
 * winner, never a stack: each layer covers the one below it. The federal
 * engine supplies observed dates (a Saturday holiday warns toward its Friday
 * observance) and crosses year boundaries naturally.
 *
 * `entries` is injectable so tests can exercise the merge without touching
 * this module's list.
 */
export function getNoticeChain(now = new Date(), entries = announcements) {
  const parts = localParts(now);
  const key = todayKey(parts);
  const today = utcDate(parts);
  const { holidayNotice } = shop.hours.status;
  const manual = manualNotice(entries, key);
  const exception = exceptionTodayNotice(today, key);
  const holidayToday = holidayTodayNotice(today, holidayNotice);
  const holidayAhead = holidayAheadNotice(today, holidayNotice);
  return {
    manual,
    exception,
    holidayToday,
    holidayAhead,
    winner: manual ?? exception ?? holidayToday ?? holidayAhead,
  };
}

/** The notice the banner should show right now, or null — the winner of
 *  getNoticeChain, kept as its own export because every caller that only
 *  wants the message should not know the chain exists. */
export function getActiveNotice(now = new Date(), entries = announcements) {
  return getNoticeChain(now, entries).winner;
}
