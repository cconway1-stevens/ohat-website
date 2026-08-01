# SEO audit — Ocean Heights Auto & Tire

Audit date: 2026-08-01. Scope: the whole site as it builds today (48 exported
pages, 22 in the sitemap). Target: organic Google visibility for local auto
repair and tire queries in Egg Harbor Township and the surrounding shore towns.

## Summary

The site was already in good technical shape before this pass: canonical URLs
on every page, a real sitemap and robots.txt, per-page titles and descriptions
written around local intent, legacy URLs redirecting with canonicals, the
arcade correctly walled off with `noindex`, alt text on essentially every
image, and `LocalBusiness` structured data sourced from one config file.

The gaps were in structured data and in social/link previews, not in crawling
or indexing. Everything found is fixed in this change except the items listed
under "Not changed" below, which need the owner rather than code.

## Fixed in this change

### 1. Every shared link previewed as the homepage — *high impact*

The root layout set a site-wide `openGraph.title` and `description`. Next
merges parent metadata into children, so a page that overrode only `title`
kept shipping the site-wide Open Graph block. Every service page, the offers
page and the reviews page therefore previewed as "Ocean Heights Auto & Tire"
in Facebook, LinkedIn, iMessage and Slack — the exact places where a shared
link needs to say what it is.

Fixed with `lib/seo.ts` → `pageMetadata()`, which derives the canonical, the
Open Graph block and the Twitter card from one page title so they cannot drift
apart. Applied to `/services`, every `/services/<slug>`, `/reviews`, `/offers`,
`/our-shop`, `/vehicle-drop-off` and `/links`.

### 2. Service FAQs were invisible to Google — *high impact*

All 16 service pages already render real, service-specific Q&A (48 questions
in total) — good content that carried no `FAQPage` markup, so none of it was
eligible for FAQ rich results. Added `faqSchema()` and wired it into the
service template. The markup is generated from the same `service.faqs` data
the page renders, which is what keeps it compliant: Google drops FAQ markup
whose answers a visitor cannot see.

### 3. Seventeen competing copies of the business — *medium impact*

`autoRepairSchema()` was inlined in full on the homepage, the contact page and
as `provider` on all 16 service pages, with no `@id`. That asks Google to
reconcile look-alike `AutoRepair` entities instead of recognising one shop.

Now the business has a stable `@id` (`/#business`), the homepage carries the
one canonical copy inside an `@graph` alongside `WebSite` and `WebPage` nodes,
and every other page references it by `@id` via `businessRef`.

### 4. Thin business schema — *medium impact*

Added to the shared block, so it lands on every page at once:
`image`, `logo`, `priceRange`, `paymentAccepted`, `currenciesAccepted`,
`hasMap`, and `slogan`/`knowsAbout` on the homepage. `areaServed` changed from
bare strings to typed `City` nodes with `containedInPlace: New Jersey`.
Weekend closure is now stated explicitly (`opens`/`closes` both `00:00`)
rather than left to be inferred from a missing rule.

### 5. Breadcrumbs on one page out of eight — *medium impact*

Only service detail pages had `BreadcrumbList`. Added a shared
`breadcrumbSchema()` and applied it to `/services`, `/contact`, `/reviews`,
`/offers`, `/our-shop` and `/vehicle-drop-off`. Breadcrumbs are what turn a
raw URL into a readable path in the search result.

### 6. `/services` had no structured data — *medium impact*

The hub page linking all 16 services described itself to Google purely as
prose. Added an `ItemList` of the catalogue plus an `OfferCatalog` attached to
the business `@id`.

### 7. No `lastmod` in either sitemap — *low impact*

`lastmod` is the one sitemap hint Google still acts on; neither the Next
sitemap route nor the static export emitted it. Both now carry the build date,
which is the honest value: these pages are published by that build.

## Not changed, deliberately

- **No `AggregateRating` / `Review` markup on `/reviews`.** The quotes are
  genuine CARFAX reviews, but a business rating *itself* on its own site is
  explicitly ineligible for review rich results. Marking it up adds
  manual-action risk and no upside. The right move is third-party reviews on
  the Google Business Profile.
- **Arcade stays `noindex`.** It is an easter egg with no service intent;
  indexing it would put game pages into results for a shop that wants calls.
  Already correct, and the static build keeps it out of the sitemap.
- **No keywords meta tag.** Google ignores it.
- **`/links` stays at low priority.** It would otherwise compete with
  `/contact` for the same queries and split the signal.

## Recommended next, needs the owner

These are the highest-value items left and none of them are code:

1. **Google Business Profile.** For a local shop this outranks everything on
   this list combined. Claim/verify it, confirm the service categories, hours
   and photos, and keep it consistent with the site. Once claimed, replace the
   Maps *search* URL in `lib/shop.mjs` (`profiles.google`) with the profile's
   real URL and add it to `sameAs` — right now the code links a search query
   because no verified profile URL exists yet.
2. **Ask for reviews.** Steady recent Google reviews move local rankings more
   than any markup change.
3. **Search Console.** Verify the domain, submit
   `https://oceanheightsautorepair.com/sitemap.xml`, and watch Coverage and
   the Core Web Vitals report for real-world data.
4. **NAP consistency.** Name, address and phone should match character for
   character across Google, Yelp, CARFAX, Facebook and the site. The site side
   is already single-sourced from `lib/shop.mjs`.
5. **Photos.** Fresh exterior, bay and team photos on the Business Profile,
   geotagged where possible.

## How to keep this from regressing

- New pages should use `pageMetadata()` rather than a hand-written `Metadata`
  object — that is what keeps canonical, Open Graph and Twitter in sync.
- Shop facts belong in `lib/shop.mjs` and nowhere else. Every schema block on
  the site reads from it, so a phone or hours change propagates in one edit.
- Only pass `faqSchema()` questions that the page actually renders.
