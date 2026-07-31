import { shop } from "./shop.mjs";

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

function dateKey(date) { return date.toISOString().slice(0, 10); }

function holidayFor(year, month, day) {
  const { fixed, floating } = shop.hours.federalHolidays;
  const candidates = fixed.map((holiday) => ({
    date: observedDate(year, holiday.month, holiday.day),
    name: holiday.name,
  }));
  candidates.push(...floating.map((holiday) => ({
    date: holiday.last
      ? lastWeekday(year, holiday.month, holiday.weekday)
      : nthWeekday(year, holiday.month, holiday.weekday, holiday.nth),
    name: holiday.name,
  })));
  const key = dateKey(new Date(Date.UTC(year, month - 1, day)));
  return candidates.find((holiday) => dateKey(holiday.date) === key)?.name ?? null;
}

function localParts(now) {
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

export function getShopHoursStatus(now = new Date()) {
  const parts = localParts(now);
  const holiday = holidayFor(Number(parts.year), Number(parts.month), Number(parts.day));
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const openAt = timeToMinutes(shop.hours.opens);
  const closeAt = timeToMinutes(shop.hours.closes);
  const { labels, openingSoonMinutes, closingSoonMinutes, holidayNotice } = shop.hours.status;
  const isWeekday = shop.hours.days.includes(parts.weekday);
  let status = "closed";
  if (isWeekday && !holiday) {
    if (minutes >= openAt - openingSoonMinutes && minutes < openAt) {
      status = "opening-soon";
    } else if (minutes >= openAt && minutes < closeAt) {
      status = minutes >= closeAt - closingSoonMinutes ? "closing-soon" : "open";
    }
  }
  const statusLabels = {
    open: labels.open,
    "opening-soon": labels.openingSoon,
    "closing-soon": labels.closingSoon,
    closed: labels.closed,
  };
  return {
    label: statusLabels[status],
    status,
    holiday,
    holidayNotice: holiday
      ? `${holidayNotice.beforeName} ${holiday}. ${holidayNotice.afterName}`
      : null,
  };
}
