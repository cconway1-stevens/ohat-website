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

  hours: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "08:00",
    closes: "17:00",
    display: "Monday–Friday, 8:00 AM–5:00 PM",
    compact: "Monday–Friday · 8:00 AM–5:00 PM",
    closedNote: "Closed weekends and major holidays.",
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
      "https://www.google.com/maps/search/?api=1&query=Ocean+Heights+Auto+%26+Tire%2C+1178+Ocean+Heights+Avenue%2C+Egg+Harbor+Township%2C+NJ+08234",
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
