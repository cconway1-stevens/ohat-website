import { shop } from "./shop.mjs";

/** One name per index of Date.getUTCDay() — exported so every module that
 *  walks the shop's calendar reads the same weekday names from one place. */
export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function observedDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCDay() === 6) date.setUTCDate(day - 1);
  if (date.getUTCDay() === 0) date.setUTCDate(day + 1);
  return date;
}

function nthWeekday(year, month, weekday, nth) {
  const date = new Date(Date.UTC(year, month - 1, 1));
  date.setUTCDate(1 + ((weekday - date.getUTCDay() + 7) % 7) + (nth - 1) * 7);
  return date;
}

function lastWeekday(year, month, weekday) {
  const date = new Date(Date.UTC(year, month, 0));
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() - weekday + 7) % 7));
  return date;
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

export function holidayFor(year, month, day) {
  const { fixed, floating } = shop.hours.federalHolidays;
  const candidates = fixed.map((holiday) => ({
    date: observedDate(year, holiday.month, holiday.day),
    name: holiday.name,
  }));
  candidates.push(
    ...floating.map((holiday) => ({
      date: holiday.last
        ? lastWeekday(year, holiday.month, holiday.weekday)
        : nthWeekday(year, holiday.month, holiday.weekday, holiday.nth),
      name: holiday.name,
    })),
  );
  const key = dateKey(new Date(Date.UTC(year, month - 1, day)));
  return candidates.find((holiday) => dateKey(holiday.date) === key)?.name ?? null;
}

/**
 * The owner-posted closure covering a shop-calendar date, or null.
 *
 * Reads `shop.hours.exceptions` — see the shape notes there. Dates are
 * inclusive on both ends; a missing `to` means a single day. Entries with a
 * blank reason or malformed dates are ignored rather than fatal, the same
 * rule the notice banner applies to its manual list. Returns the raw reason
 * plus the fully worded customer-facing phrase, so the placard, the banner
 * and the hours page can never disagree about why the doors are shut.
 */
export function exceptionFor(year, month, day) {
  const { labels } = shop.hours.status;
  const key = dateKey(new Date(Date.UTC(year, month - 1, day)));
  for (const entry of shop.hours.exceptions ?? []) {
    const reason = typeof entry?.reason === "string" ? entry.reason.trim() : "";
    if (!reason || !ISO_DATE.test(entry.from ?? "")) continue;
    const to = ISO_DATE.test(entry.to ?? "") ? entry.to : entry.from;
    if (key >= entry.from && key <= to) {
      return {
        reason,
        label: labels.reasons.exception.replace("{name}", reason),
      };
    }
  }
  return null;
}

/** The customer-facing "why" phrase for a closure kind; every word comes
 *  from shop.hours.status.labels.reasons — see the note there. */
function reasonPhrase(kind, name) {
  const { labels } = shop.hours.status;
  return labels.reasons[kind].replace("{name}", name ?? "");
}

// Shared with lib/announcements.mjs so the notice banner reads the same
// timezone-aware calendar parts and federal-holiday engine as the hours
// sign — one date-math source, never a duplicate.
export function localParts(now) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: shop.timezone,
    weekday: "long",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function closesAt(weekday) {
  return shop.hours.closesByDay[weekday] ?? shop.hours.closes;
}

function timeLabel(value) {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hour, minute));
}

function openingTimeLabel() {
  return timeLabel(shop.hours.opens);
}

/** The day's window as the hours page and forecast show it, e.g.
 *  "8:00 AM–4:00 PM" — built from the config, never a second hardcoded
 *  copy of the hours. */
function dayHoursLabel(weekday) {
  return `${timeLabel(shop.hours.opens)}–${timeLabel(closesAt(weekday))}`;
}

/** Public form of the above for pages that render the regular week from the
 *  config directly — a new `closesByDay` entry flows through automatically. */
export function getDayHoursLabel(weekday) {
  return dayHoursLabel(weekday);
}

function nextOpening(now, currentParts, isOpenDay, minutes, openAt) {
  for (let offset = 0; offset <= 8; offset += 1) {
    if (offset === 0 && (!isOpenDay || minutes >= openAt)) continue;
    const candidate = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
    const parts = offset === 0 ? currentParts : localParts(candidate);
    const year = Number(parts.year);
    const month = Number(parts.month);
    const day = Number(parts.day);
    const holiday = holidayFor(year, month, day);
    // An owner-posted closure hides the next opening as surely as a holiday
    // does — "Reopens Tuesday" would be a lie if Tuesday is shut too.
    if (
      shop.hours.days.includes(parts.weekday) &&
      !holiday &&
      !exceptionFor(year, month, day)
    ) {
      return { day: parts.weekday, today: offset === 0 };
    }
  }
  return null;
}

export function getShopStatusLabel(status) {
  const { labels } = shop.hours.status;
  return {
    open: labels.open,
    "opening-soon": labels.openingSoon,
    "closing-soon": labels.closingSoon,
    closed: labels.closed,
  }[status];
}

export function getShopHoursStatus(now = new Date()) {
  const parts = localParts(now);
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const holiday = holidayFor(year, month, day);
  const exception = exceptionFor(year, month, day);
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const openAt = timeToMinutes(shop.hours.opens);
  const closeAt = timeToMinutes(closesAt(parts.weekday));
  const { openingSoonMinutes, closingSoonMinutes, holidayNotice } = shop.hours.status;
  const isWeekday = shop.hours.days.includes(parts.weekday);
  const isOpenDay = isWeekday && !holiday && !exception;
  let status = "closed";
  if (isOpenDay) {
    if (minutes >= openAt - openingSoonMinutes && minutes < openAt) {
      status = "opening-soon";
    } else if (minutes >= openAt && minutes < closeAt) {
      status = minutes >= closeAt - closingSoonMinutes ? "closing-soon" : "open";
    }
  }
  const next = status === "closed" ? nextOpening(now, parts, isOpenDay, minutes, openAt) : null;
  // Every word of this comes from shop.hours.status.labels — see the note
  // there.
  //
  // This deliberately does NOT inject a non-breaking space into the time to
  // stop "8:00 AM" wrapping. That was tried, and the shop-hours test caught
  // it: the label is data, and quietly seeding it with presentation
  // characters breaks anything that compares, logs or reads the string. The
  // wrap is handled in CSS on the badge instead, which is where it belongs.
  const { labels } = shop.hours.status;
  const openingTime = openingTimeLabel();
  // Why the doors are shut, in owner-first order: an owner-posted exception
  // outranks a federal holiday, which outranks the plain weekend, which
  // outranks the ordinary out-of-hours state of a business day. On an open
  // day (or outside hours on a business day) there is nothing to explain
  // beyond the reopen time, so reason falls back to null and the label keeps
  // its ordinary closedToday / closedForDay lead.
  const reason =
    status !== "closed"
      ? null
      : exception
        ? { kind: "exception", label: exception.label }
        : holiday
          ? { kind: "holiday", label: reasonPhrase("holiday", holiday) }
          : !isWeekday
            ? { kind: "weekend", label: reasonPhrase("weekend") }
            : { kind: "after-hours", label: next?.today ? labels.closedToday : labels.closedForDay };
  const lead =
    reason?.label ??
    (next?.today ? labels.closedToday : labels.closedForDay);
  const label =
    status === "closed" && next
      ? `${lead}. ` +
        `${labels.reopens} ${next.today ? labels.reopensToday : next.day} ` +
        `${labels.at} ${openingTime}`
      : getShopStatusLabel(status);
  return {
    label,
    status,
    holiday,
    holidayNotice: holiday
      ? `${holidayNotice.beforeName} ${holiday}. ${holidayNotice.afterName}`
      : null,
    reason,
    exceptionReason: exception?.reason ?? null,
  };
}

/**
 * The shop's predicted calendar, one row per shop-local day.
 *
 * Pure data that the public hours page, the owner dash and the tests all
 * read, so a predicted closure can never disagree between surfaces. Each row
 * is evaluated at mid-day shop time (16:00Z is 11 AM–noon in Egg Harbor
 * Township, inside the 8 AM–5 PM window in both DST states) — the same
 * instant convention the holiday tests pin — so `statusLabel` is exactly
 * what the placard reads in the middle of that day.
 */
export function getHoursForecast(now = new Date(), days = 14) {
  const parts = localParts(now);
  // Walk UTC-midnight dates anchored on today's shop-local calendar (the
  // same convention as announcements.mjs): UTC has no DST, so whole-day
  // steps roll months and years cleanly and the holiday engine compares
  // the same ISO keys.
  const anchor = new Date(
    Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)),
  );
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: shop.timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const rows = [];
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(anchor.getTime() + offset * 24 * 60 * 60 * 1000);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const weekday = WEEKDAY_NAMES[date.getUTCDay()];
    const holiday = holidayFor(year, month, day);
    const exception = exceptionFor(year, month, day);
    const isBusinessDay = shop.hours.days.includes(weekday);
    const open = isBusinessDay && !holiday && !exception;
    const why = exception
      ? { kind: "exception", label: exception.label, detail: exception.reason }
      : holiday
        ? { kind: "holiday", label: reasonPhrase("holiday", holiday), detail: holiday }
        : !isBusinessDay
          ? { kind: "weekend", label: reasonPhrase("weekend"), detail: null }
          : null;
    // Mid-day shop-time instant: what the sign reads in the middle of that
    // day, whatever instant `now` happens to be.
    const midday = new Date(date.getTime() + 16 * 3_600_000);
    const status = getShopHoursStatus(midday);
    rows.push({
      key: dateKey(date),
      weekday,
      dateLabel: new Intl.DateTimeFormat("en-US", {
        timeZone: shop.timezone,
        month: "short",
        day: "numeric",
      }).format(midday),
      open,
      hours: open ? dayHoursLabel(weekday) : "Closed",
      holiday,
      exception: exception?.reason ?? null,
      why,
      statusLabel: status.label,
      status: status.status,
    });
  }
  return rows;
}