/**
 * THE single source of truth for the shop's details.
 *
 * Change a phone number, an email, the hours or the address here and it
 * updates everywhere at once: the header, footer, contact page, link hub,
 * downloadable contact card, sitemap, and every block of structured data.
 *
 * Written as plain ESM rather than TypeScript on purpose — the static build
 * scripts run under plain Node and cannot import a `.ts` file, so this is the
 * one format both the app and the build tooling can share. `lib/shop.ts`
 * re-exports it with types for use inside components.
 *
 * Only two things are deliberately NOT centralised, both for SEO reasons:
 *  - Per-page titles, descriptions and canonical paths, which must differ
 *    page by page — they live with their pages.
 *  - `metadataBase` / canonical host in app/layout.tsx, which has to be the
 *    production domain even while the prototype is served elsewhere.
 */

const street = "1178 Ocean Heights Avenue";
const city = "Egg Harbor Township";
const state = "NJ";
const zip = "08234";
const mapsQuery = encodeURIComponent(`Ocean Heights Auto & Tire, ${street}, ${city}, ${state} ${zip}`);

export const shop = {
  name: "Ocean Heights Auto & Tire",
  // Plain-text form for places that cannot render an entity, e.g. the vCard.
  namePlain: "Ocean Heights Auto and Tire",
  tagline: "Car care, done right. No detours.",

  phone: {
    display: "(609) 241-1546",
    href: "tel:+16092411546",
    e164: "+1-609-241-1546",
  },

  email: {
    /** Monitored inbox — the address customers should write to. */
    service: "oceanheightsautoandtire@yahoo.com",
    /**
     * Outbound only: the point-of-sale system sends digital receipts from
     * here and nobody reads replies. Published so customers recognise a
     * receipt as genuine and can whitelist it — never as a way to reach us.
     */
    receipts: "oceanheightsautoandtire@gmail.com",
  },

  address: {
    street,
    city,
    state,
    zip,
    country: "US",
    full: `${street}, ${city}, ${state} ${zip}`,
    cityLine: `${city}, ${state} ${zip}`,
    region: `${city}, New Jersey`,
  },

  geo: { latitude: 39.3776, longitude: -74.5946 },
  timezone: "America/New_York",

  hours: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "08:00",
    closes: "17:00",
    weekdayLabel: "Monday-Friday",
    weekendLabel: "Saturday-Sunday",
    weekendValue: "Closed",
    display: "Monday–Friday, 8:00 AM–5:00 PM",
    compact: "Monday–Friday · 8:00 AM–5:00 PM",
    closedNote: "Closed weekends and major holidays.",
    status: {
      openingSoonMinutes: 30,
      closingSoonMinutes: 30,
      refreshMs: 60_000,
      labels: {
        open: "Open",
        openingSoon: "Opening soon",
        closingSoon: "Closing soon",
        closed: "Closed",
      },
      holidayNotice: {
        beforeName: "Holiday hours may vary for",
        afterName: "Please give us a call before stopping by.",
      },
      signPreview: {
        holdMs: 5_000,
        stepMs: 900,
        cycles: 2,
        states: ["opening-soon", "open", "closing-soon", "closed"],
        hint: "Hold for 5 seconds to preview all shop signs",
      },
    },
    federalHolidays: {
      fixed: [
        { month: 1, day: 1, name: "New Year's Day" },
        { month: 6, day: 19, name: "Juneteenth" },
        { month: 7, day: 4, name: "Independence Day" },
        { month: 11, day: 11, name: "Veterans Day" },
        { month: 12, day: 25, name: "Christmas Day" },
      ],
      floating: [
        { month: 1, weekday: 1, nth: 3, name: "Martin Luther King Jr. Day" },
        { month: 2, weekday: 1, nth: 3, name: "Washington's Birthday" },
        { month: 5, weekday: 1, last: true, name: "Memorial Day" },
        { month: 9, weekday: 1, nth: 1, name: "Labor Day" },
        { month: 10, weekday: 1, nth: 2, name: "Columbus Day" },
        { month: 11, weekday: 4, nth: 4, name: "Thanksgiving Day" },
      ],
    },
  },

  areaServed: ["Egg Harbor Township", "Mays Landing", "Linwood"],

  /** Canonical production host. The site may be served elsewhere while it is
   *  still a prototype; anything user-facing should prefer a relative path. */
  siteUrl: "https://oceanheightsautorepair.com",

  profiles: {
    carfax:
      "https://www.carfax.com/Reviews-Ocean-Heights-Auto-And-Tire-Egg-Harbor-Township-NJ_BLQLOZM001",
    yelp: "https://www.yelp.com/biz/ocean-heights-auto-and-tire-egg-harbor-township-2",
    facebook: "https://www.facebook.com/OceanHeightsAuto/",
    // Until the owner supplies the Business Profile's own URL or Place ID,
    // this uses Google's documented Maps search URL, which resolves to the
    // listing without inventing an identifier.
    google:
      `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
  },
};

/** Profiles worth listing as `sameAs` — canonical, verifiable pages only. */
export const sameAs = [
  shop.profiles.carfax,
  shop.profiles.yelp,
  shop.profiles.facebook,
];

/** The structured-data block for the business, shared by every page that
 *  needs it so the details can never disagree between pages. */
export function autoRepairSchema(extra = {}) {
  return {
    "@type": "AutoRepair",
    name: shop.name,
    url: `${shop.siteUrl}/`,
    telephone: shop.phone.e164,
    email: shop.email.service,
    address: {
      "@type": "PostalAddress",
      streetAddress: shop.address.street,
      addressLocality: shop.address.city,
      addressRegion: shop.address.state,
      postalCode: shop.address.zip,
      addressCountry: shop.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: shop.geo.latitude,
      longitude: shop.geo.longitude,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: shop.hours.days,
        opens: shop.hours.opens,
        closes: shop.hours.closes,
      },
    ],
    areaServed: shop.areaServed,
    sameAs,
    ...extra,
  };
}
