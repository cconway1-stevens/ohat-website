"use client";

import { useEffect, useState } from "react";

// The shop's own coordinates, so the reading is the weather at the garage
// rather than wherever the visitor happens to be.
const LATITUDE = 39.3776;
const LONGITUDE = -74.5946;
const FORECAST_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}` +
  "&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FNew_York";

// WMO weather codes, condensed to masthead-length words.
function describe(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 2) return "Fair";
  if (code === 3) return "Overcast";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow";
  return "Thunder";
}

type Almanac = { date: string; reading?: string };

export function ShopAlmanac() {
  const [almanac, setAlmanac] = useState<Almanac | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    // Always the shop's local day, not the visitor's — this is the garage's
    // masthead, and a visitor abroad should not see tomorrow's date on it.
    const date = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "America/New_York",
    });

    // Every state update below sits in a promise callback rather than in the
    // effect body, so the date still lands even when the forecast is blocked
    // or offline — the weather is an embellishment, never a dependency.
    fetch(FORECAST_URL, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        const temperature = data?.current?.temperature_2m;
        const code = data?.current?.weather_code;
        setAlmanac(
          typeof temperature === "number" && typeof code === "number"
            ? { date, reading: `${Math.round(temperature)}° ${describe(code)}` }
            : { date },
        );
      })
      .catch(() => {
        if (!cancelled) setAlmanac({ date });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return (
    <span className="garage-almanac">
      <span className="garage-almanac-place">Egg Harbor Township, New Jersey</span>
      {almanac ? (
        <>
          <span className="garage-almanac-rule" aria-hidden="true">·</span>
          <span className="garage-almanac-date">{almanac.date}</span>
          {almanac.reading ? (
            <>
              <span className="garage-almanac-rule" aria-hidden="true">·</span>
              <span className="garage-almanac-reading">{almanac.reading}</span>
            </>
          ) : null}
        </>
      ) : null}
    </span>
  );
}
