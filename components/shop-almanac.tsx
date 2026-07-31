"use client";

import { useEffect, useState } from "react";

// The shop's own coordinates, so the reading is the weather at the garage
// rather than wherever the visitor happens to be.
const LATITUDE = 39.3776;
const LONGITUDE = -74.5946;
const FORECAST_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}` +
  "&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FNew_York";

// Where the reading points when clicked — the data source's own site, which
// also satisfies Open-Meteo's attribution ask.
const SOURCE_URL = "https://open-meteo.com/";

// The header remounts on every navigation, so the reading is cached with a
// TTL: one fetch per session per half hour, not one per page view. Conditions
// don't change faster than that, and neither should our API traffic.
const CACHE_KEY = "ohat-almanac";
const CACHE_TTL_MS = 30 * 60 * 1000;

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

function readCache(): string | null {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as { reading: string; at: number };
    if (Date.now() - cached.at > CACHE_TTL_MS) return null;
    return cached.reading;
  } catch {
    return null;
  }
}

function writeCache(reading: string) {
  try {
    window.sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ reading, at: Date.now() }),
    );
  } catch {
    // Storage being unavailable just means a fetch per page view again.
  }
}

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

    const cached = readCache();
    if (cached) {
      // Deferred a tick so the setState is asynchronous to the effect body.
      const id = window.setTimeout(
        () => setAlmanac({ date, reading: cached }),
        0,
      );
      return () => window.clearTimeout(id);
    }

    // Every state update below sits in a promise callback rather than in the
    // effect body, so the date still lands even when the forecast is blocked
    // or offline — the weather is an embellishment, never a dependency.
    fetch(FORECAST_URL, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        const temperature = data?.current?.temperature_2m;
        const code = data?.current?.weather_code;
        if (typeof temperature === "number" && typeof code === "number") {
          const reading = `${Math.round(temperature)}° ${describe(code)}`;
          writeCache(reading);
          setAlmanac({ date, reading });
        } else {
          setAlmanac({ date });
        }
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
              <a
                className="garage-almanac-reading"
                href={SOURCE_URL}
                target="_blank"
                rel="noreferrer"
                title="Current conditions at the shop — weather data by Open-Meteo"
              >
                {almanac.reading}
                <span className="sr-only">
                  {" "}— weather data by Open-Meteo (opens in a new tab)
                </span>
              </a>
            </>
          ) : null}
        </>
      ) : null}
    </span>
  );
}
