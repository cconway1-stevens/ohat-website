import { shop } from "./shop";

type Status = "open" | "opening-soon" | "closing-soon" | "closed";

const federalFixedHolidays = [
  [1, 1, "New Year's Day"], [6, 19, "Juneteenth"], [7, 4, "Independence Day"],
  [11, 11, "Veterans Day"], [12, 25, "Christmas Day"],
] as const;

function observedDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCDay() === 6) date.setUTCDate(day - 1);
  if (date.getUTCDay() === 0) date.setUTCDate(day + 1);
  return date;
}

function nthWeekday(year: number, month: number, weekday: number, nth: number) {
  const date = new Date(Date.UTC(year, month - 1, 1));
  date.setUTCDate(1 + ((weekday - date.getUTCDay() + 7) % 7) + (nth - 1) * 7);
  return date;
}

function lastWeekday(year: number, month: number, weekday: number) {
  const date = new Date(Date.UTC(year, month, 0));
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() - weekday + 7) % 7));
  return date;
}

function dateKey(date: Date) { return date.toISOString().slice(0, 10); }

function holidayFor(year: number, month: number, day: number) {
  const candidates = federalFixedHolidays.map(([holidayMonth, holidayDay, name]) => ({ date: observedDate(year, holidayMonth, holidayDay), name }));
  candidates.push(
    { date: nthWeekday(year, 1, 1, 3), name: "Martin Luther King Jr. Day" },
    { date: nthWeekday(year, 2, 1, 3), name: "Washington's Birthday" },
    { date: lastWeekday(year, 5, 1), name: "Memorial Day" },
    { date: nthWeekday(year, 9, 1, 1), name: "Labor Day" },
    { date: nthWeekday(year, 10, 1, 2), name: "Columbus Day" },
    { date: nthWeekday(year, 11, 4, 4), name: "Thanksgiving Day" },
  );
  const key = dateKey(new Date(Date.UTC(year, month - 1, day)));
  return candidates.find((holiday) => dateKey(holiday.date) === key)?.name ?? null;
}

function easternParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "long", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(now);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

export function getShopHoursStatus(now = new Date()) {
  const parts = easternParts(now);
  const holiday = holidayFor(Number(parts.year), Number(parts.month), Number(parts.day));
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const isWeekday = shop.hours.days.includes(parts.weekday);
  let status: Status = "closed";
  if (isWeekday && !holiday && minutes >= 480 && minutes < 1020) {
    status = minutes < 510 ? "opening-soon" : minutes >= 990 ? "closing-soon" : "open";
  }
  const labels: Record<Status, string> = { open: "Open", "opening-soon": "Opening soon", "closing-soon": "Closing soon", closed: "Closed" };
  return { label: labels[status], status, holiday };
}
