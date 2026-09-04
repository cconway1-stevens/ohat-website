/**
 * THE single source of truth for the shop's details.
 *
 * Change a phone number, an email, the hours or the address here and it
 * updates everywhere at once: the header, footer, contact page, link hub,
 * downloadable contact card, sitemap, and every block of structured data.
 *
 * Written as plain ESM rather than TypeScript on purpose — the static build
 * scripts run under plain Node and cannot import a `.ts` file, so this is the
 * one format both the app and the build tooling can share. `src/lib/shop/shop.ts`
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
const mapsQuery = encodeURIComponent(
  `Ocean Heights Auto & Tire, ${street}, ${city}, ${state} ${zip}`,
);

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
    /** Days whose close time differs from `closes` above. Friday closes an
     *  hour early; every other configured day falls through to `closes`. */
    closesByDay: { Friday: "16:00" },
    weekdayLabel: "Monday-Thursday",
    weekdayHours: "8:00 AM–5:00 PM",
    fridayLabel: "Friday",
    fridayHours: "8:00 AM–4:00 PM",
    weekendLabel: "Saturday-Sunday",
    weekendValue: "Closed",
    display: "Monday–Thursday, 8:00 AM–5:00 PM; Friday, 8:00 AM–4:00 PM",
    compact: "Mon–Thu 8:00 AM–5:00 PM · Fri 8:00 AM–4:00 PM",
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
        /**
         * The closed-state wording, assembled as
         *   "<closedForDay>. <reopens> <day> at <time>"
         * These used to be hardcoded in lib/shop-hours.mjs, which meant the
         * one message customers see most often could not be reworded without
         * editing logic. Tone matters here: this is the sign on the door, and
         * it should read like a shop that wants you back on Monday.
         */
        closedToday: "Closed",
        closedForDay: "Closed for the day",
        reopens: "Reopens",
        reopensToday: "today",
        at: "at",
      },
      holidayNotice: {
        beforeName: "Holiday hours may vary for",
        afterName: "Please give us a call before stopping by.",
        /** Wording for the days leading up to a federal holiday — the banner
         *  shows it once fewer than `HOLIDAY_LEAD_DAYS` shop business days
         *  remain before the next one. Same rewordable-data rule as above. */
        upcomingKicker: "Coming up:",
        upcomingNote: "Hours may vary around the holiday.",
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

  /**
   * Locals rarely type the township's full name. "EHT" is what it is called
   * on signage, in conversation and in search boxes; "Atlantic County" and
   * "South Jersey" are how people describe the area when they do not know
   * which town a shop sits in. None of these appeared anywhere on the site,
   * so every one of those searches had nothing to match against.
   *
   * These belong in real sentences, not a keyword list — Google ignores the
   * latter and readers resent it. See dev/docs/seo-audit.md.
   */
  nickname: "EHT",
  county: "Atlantic County",
  region: "South Jersey",

  /** Towns close enough that the drive is reasonable. Keep this honest: it
   *  is a claim about where customers actually come from. */
  areaServed: [
    "Egg Harbor Township",
    "Mays Landing",
    "Linwood",
    "Northfield",
    "Somers Point",
    "Absecon",
    "Pleasantville",
    "Galloway",
  ],

  /**
   * The CARFAX standing, with the date it was checked.
   *
   * The date is not decoration. New Jersey's advertising rules
   * (N.J.A.C. 13:45A-9.2) require an advertiser to be able to substantiate a
   * quality claim with written proof, kept available for 90 days after the ad
   * runs. A bare "customers currently rate us 5.0" is a live claim about a
   * third-party number this site cannot see and cannot keep true; "5.0 as of
   * <date>" is a statement of what was observed, which is verifiable and
   * stays true. Re-check the profile and move this date when you cite it.
   */
  rating: {
    value: "5.0",
    scale: "5",
    source: "CARFAX",
    observed: "July 30, 2026",
    // CARFAX issues this "Top-Rated Service Center" title yearly. It only
    // shows up as a badge graphic inside the shop's CARFAX dashboard (no
    // public URL to read it from), so there's nothing to automate here —
    // log in once a year, confirm the title renewed, and bump this.
    awardYear: "2025",
  },

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
    google: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
  },
};

/** Profiles worth listing as `sameAs` — canonical, verifiable pages only. */
export const sameAs = [shop.profiles.carfax, shop.profiles.yelp, shop.profiles.facebook];

/** The structured-data block for the business, shared by every page that
 *  needs it so the details can never disagree between pages. */
export function autoRepairSchema(extra = {}) {
  return {
    "@type": "AutoRepair",
    // A stable node id lets every other block on the site (Service, ContactPage,
    // FAQPage, breadcrumbs) point at the *same* business entity instead of
    // asking Google to reconcile several look-alike copies.
    "@id": `${shop.siteUrl}/#business`,
    name: shop.name,
    url: `${shop.siteUrl}/`,
    image: `${shop.siteUrl}/media/ocean-heights-cover.jpg`,
    logo: `${shop.siteUrl}/ohat-logo.jpg`,
    priceRange: "$$",
    currenciesAccepted: "USD",
    paymentAccepted: "Cash, Credit Card, Debit Card",
    hasMap: shop.profiles.google,
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
      // Built from `shop.hours.closesByDay` rather than a second hardcoded day
      // list, so a day added there picks up its own OpeningHoursSpecification
      // automatically instead of silently keeping the default close time.
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: shop.hours.days.filter((day) => !(day in shop.hours.closesByDay)),
        opens: shop.hours.opens,
        closes: shop.hours.closes,
      },
      ...Object.entries(shop.hours.closesByDay).map(([day, closes]) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [day],
        opens: shop.hours.opens,
        closes,
      })),
      {
        // Saying "closed" explicitly rather than by omission: an equal
        // opens/closes time is schema.org's documented way to mark a day
        // closed, and it stops Google inferring weekend hours from the
        // absence of a rule.
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday"],
        opens: "00:00",
        closes: "00:00",
      },
    ],
    // Typed City nodes rather than bare strings: Google reads the place names
    // far more reliably when the entity type is spelled out.
    areaServed: [
      ...shop.areaServed.map((name) => ({
        "@type": "City",
        name,
        containedInPlace: {
          "@type": "AdministrativeArea",
          name: shop.county,
          containedInPlace: { "@type": "State", name: "New Jersey" },
        },
      })),
      {
        "@type": "AdministrativeArea",
        name: shop.county,
        containedInPlace: { "@type": "State", name: "New Jersey" },
      },
    ],
    alternateName: `${shop.name} — ${shop.nickname} auto repair`,
    sameAs,
    ...extra,
  };
}

/** A pointer to the business node above, for blocks that reference the shop
 *  without needing to restate every detail. */
export const businessRef = { "@id": `${shop.siteUrl}/#business` };

/** FAQPage structured data. Only ever call this with question-and-answer text
 *  that is also rendered on the page — Google drops (and can penalise) FAQ
 *  markup whose answers a visitor cannot see. */
export function faqSchema(faqs, { url } = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    ...(url ? { "@id": `${url}#faq` } : {}),
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

/** BreadcrumbList structured data from `[label, path]` pairs, Home first. */
export function breadcrumbSchema(trail) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [["Home", "/"], ...trail].map(([name, path], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: `${shop.siteUrl}${path}`,
    })),
  };
}
