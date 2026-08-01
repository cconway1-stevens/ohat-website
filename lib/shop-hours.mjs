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

function openingTimeLabel() {
  const [hour, minute] = shop.hours.opens.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hour, minute));
}

function nextOpening(now, currentParts, isOpenDay, minutes, openAt) {
  for (let offset = 0; offset <= 8; offset += 1) {
    if (offset === 0 && (!isOpenDay || minutes >= openAt)) continue;
    const candidate = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
    const parts = offset === 0 ? currentParts : localParts(candidate);
    const holiday = holidayFor(Number(parts.year), Number(parts.month), Number(parts.day));
    if (shop.hours.days.includes(parts.weekday) && !holiday) {
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
  const holiday = holidayFor(Number(parts.year), Number(parts.month), Number(parts.day));
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const openAt = timeToMinutes(shop.hours.opens);
  const closeAt = timeToMinutes(shop.hours.closes);
  const { openingSoonMinutes, closingSoonMinutes, holidayNotice } = shop.hours.status;
  const isWeekday = shop.hours.days.includes(parts.weekday);
  const isOpenDay = isWeekday && !holiday;
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
  const label = status === "closed" && next
    ? `${next.today ? labels.closedToday : labels.closedForDay}. ` +
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
  };
}
