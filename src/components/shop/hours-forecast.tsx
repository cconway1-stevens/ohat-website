"use client";

import { useEffect, useState } from "react";
import { shop } from "@/lib/shop/shop";
import { getHoursForecast } from "@/lib/shop/shop-hours.mjs";

type ForecastRow = ReturnType<typeof getHoursForecast>[number];

/**
 * The upcoming-closures list: federal holidays and owner-posted closures in
 * the next two weeks, each with its reason. The standing weekend rule lives
 * in the schedule above, so it is left out here. The server renders null and
 * the client decides — a closure list is a build-day decision, and a static
 * export must never bake one into the HTML.
 */
export function HoursForecast() {
  const [rows, setRows] = useState<ForecastRow[] | null>(null);

  useEffect(() => {
    setRows(
      getHoursForecast(new Date(), 14).filter((row) => !row.open && (row.holiday || row.exception)),
    );
  }, []);

  if (rows === null) return null;

  if (rows.length === 0) {
    return <p className="hours-closures-empty">No closures posted for the next two weeks.</p>;
  }

  return (
    <ul className="hours-closures">
      {rows.map((row) => (
        <li
          className={`hours-closure${row.why?.kind === "exception" ? " is-exception" : ""}`}
          key={row.key}
        >
          <span className="hours-closure-date">
            {row.weekday}, {row.dateLabel}
          </span>
          <span className="hours-closure-reason">{row.why?.label ?? row.hours}</span>
          {row.why?.kind === "holiday" ? (
            <span className="hours-closure-warn">
              Hours may vary — please call <a href={shop.phone.href}>{shop.phone.display}</a> to
              confirm.
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
