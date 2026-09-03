# Ocean Heights Auto & Tire Website Rebuild Playbook

## Project goal

Build a clean, fast, family-friendly auto-repair website that makes Ocean
Heights Auto & Tire feel like the modern neighborhood garage: skilled enough
to rival a dealership, friendly enough to call family, and memorable enough
to be fun.

The primary conversion on every page is:

> Call Ocean Heights Auto & Tire at (609) 241-1546 to book service.

> **Owner follow-up:** CARFAX currently lists a different service number,
> (609) 566-8325. The rebuild preserves the existing official website number,
> (609) 241-1546, until the owner confirms whether CARFAX uses a tracking line.

## Current progress — reset July 30, 2026

| Workstream                  | Status                         | Next proof required                                            |
| --------------------------- | ------------------------------ | -------------------------------------------------------------- |
| Legacy page inventory       | Complete                       | 9 public destinations captured and mapped                      |
| External trust sources      | Complete with owner follow-ups | Links verified; unsupported badge/year claims omitted          |
| Image and media import      | Complete                       | 22 legacy assets imported, opened, and reviewed                |
| Consolidated page plan      | Complete                       | 6 primary destinations plus focused service pages              |
| New design system           | Complete                       | Modern Family Garage system implemented                        |
| Next.js rebuild             | Complete                       | Core pages, 12 service pages, and legacy routes built          |
| SEO and conversion work     | Complete                       | Metadata, schema, sitemap, internal links, and call CTAs added |
| Accessibility and device QA | In progress                    | Final build and route validation pending                       |
| Production publishing       | In progress                    | Final checkpoint and deployment verification pending           |

Only items backed by an audit record or completed test should be checked off.

## Brand story to communicate

- Family-run and family-first.
- More than 40 years of auto-parts experience in the family.
- More than 15 years running a repair shop.
- Proudly rooted in Egg Harbor Township and supportive of the local community.
- Advanced tools and technicians capable of work often associated with a
  dealership, at better local-shop rates.
- Service for nearly every make and model, including gas, diesel, hybrid,
  electric, classic, import, and domestic vehicles.
- Honest explanations, fair recommendations, and a welcoming experience.

## Creative direction

**Concept:** The Modern Family Garage

- Primary palette: logo red, warm yellow, black, cream, and white.
- Supporting accent: restrained ocean blue.
- Visual language: classic-car signage, checkered flags, tire treads, service
  tags, garage labels, dashboard indicators, and clean editorial spacing.
- Motion: rotating tires, gently moving gears, a cruising classic-car booking
  strip, and playful hover/tap responses.
- Motion must stop or simplify when a visitor requests reduced motion.
- The site must remain clean, direct, and easy to scan despite the playful
  automotive details.

## Voice and sample callouts

- Dealer-level tools. Neighbor-level care.
- Everything from hood to hitch.
- Modern cars. Classic care.
- Your next smooth ride starts here.
- From warning light to green light.
- Family-run. Road-trip ready.
- We know cars. We know our neighbors.
- Built to keep Egg Harbor Township moving.

## Phase 1 — Capture the current website

- [x] Audit the Home page.
- [x] Audit the Our Shop page.
- [x] Audit the Auto Repair page and its 30-service list.
- [x] Audit the Alignments page.
- [x] Audit the Oil Changes page.
- [x] Audit the Tire Rotation page.
- [x] Audit the Vehicle Drop-off page.
- [x] Audit the Coupons asset/link.
- [x] Audit the Contact page.
- [x] Audit the Reviews page.
- [x] Record the phone number, address, hours, service area, warranty,
      ASE-certification claim, family-owned positioning, and current calls to
      action.
- [ ] Export a final legacy URL inventory with page title, purpose, media,
      CTA, target new page, and redirect.
- [ ] Re-check that no indexed, utility, or media-only URL was missed.
- [ ] Verify every imported image opens correctly and record where it appeared.
- [ ] Preserve every valuable image locally before redesign work begins.

**Completion gate:** Every public page and every reusable media file is
accounted for.

## Phase 2 — Verify external profiles and trust signals

Approved profile links:

- Yelp:
  <https://www.yelp.com/biz/ocean-heights-auto-and-tire-egg-harbor-township-2>
- Facebook: <https://www.facebook.com/OceanHeightsAuto/>
- CARFAX:
  <https://www.carfax.com/Reviews-Ocean-Heights-Auto-And-Tire-Egg-Harbor-Township-NJ_BLQLOZM001>

Verification tracker:

- [x] Confirm the Facebook URL belongs to Ocean Heights Auto & Tire in Egg
      Harbor Township.
- [x] Confirm the CARFAX URL belongs to Ocean Heights Auto & Tire at 1178 Ocean
      Heights Avenue in Egg Harbor Township.
- [x] Record the current CARFAX trust signals: CARFAX Top-Rated Service Center,
      5.0 overall rating, 498 verified reviews, and 1,480 shop favorites as observed
      on July 30, 2026.
- [x] Record CARFAX’s listed service coverage, including maintenance, brakes,
      diagnostics, electrical repair, engines, tires, transmissions, and
      alignments.
- [x] Record CARFAX’s “all makes and models” shop description and the
      Chevrolet, Ford, Honda, Jeep, and Toyota examples shown in its service
      history.
- [ ] Confirm the exact CARFAX Top-Rated Service Center award years before
      publishing a multi-year claim.
- [ ] Confirm whether CARFAX’s (609) 566-8325 or the current website’s
      (609) 241-1546 is the preferred public booking number.
- [ ] Manually verify Yelp’s live rating, review count, business details, and
      reusable review themes; automated access is blocked.
- [ ] Confirm whether Yelp, Facebook, and CARFAX logos/badges may be displayed
      under their current brand-use rules; otherwise use labeled text links.
- [ ] Select review excerpts only after confirming quotation permission,
      attribution, date, and current availability.
- [ ] Add the three profiles to the site footer, Reviews page, Contact page,
      and relevant trust callouts.
- [ ] Add the canonical profile URLs to LocalBusiness structured data using
      `sameAs`.
- [ ] Add external-link labels and safe new-tab behavior without interrupting
      the primary call-to-book journey.

**Completion gate:** Every published rating, review count, award, phone number,
badge, and quotation is current, attributable, and verified.

## Phase 3 — Consolidate the information architecture

Proposed primary navigation:

1. Home
2. Services
3. Our Shop
4. Drop-Off
5. Reviews
6. Contact

Supporting destinations:

- Offers / Coupons
- Individual high-intent service pages
- CARFAX reviews
- Directions

Legacy URL preservation:

- [ ] `/our-shop/` → refreshed shop-story page
- [ ] `/auto-repair/` → consolidated service directory
- [ ] `/alignments/` → alignment service page
- [ ] `/oil-changes/` → oil and maintenance service page
- [ ] `/tire-rotation/` → tire service page
- [ ] `/vehicle-drop-off/` → dedicated drop-off guide
- [ ] `/contact-us/` → contact and directions page
- [ ] `/reviews/` → reviews and trust page
- [ ] Old coupon image link remains available from a new offers page

**Completion gate:** No useful old page becomes a dead end, and the new
navigation is simpler than the old one.

## Phase 4 — Design the experience

- [ ] Create the responsive header and persistent call-to-book action.
- [ ] Design an automotive hero using the real logo and shop imagery.
- [ ] Add checkered-flag and classic-garage styling without visual clutter.
- [ ] Design animated tire/part controls for key actions.
- [ ] Add a playful classic-car booking strip near the bottom of every page.
- [ ] Build a clear “what we work on” section covering makes and powertrains.
- [ ] Build the family-and-community story section.
- [ ] Build the dealer-level technology / local-shop value section.
- [ ] Design the drop-off page as a simple numbered arrival guide.
- [ ] Create clear signage-style callouts and automotive microcopy.
- [ ] Define mobile, keyboard, contrast, focus, and reduced-motion behavior.

**Completion gate:** The design is recognizably Ocean Heights, easy to use in
under a minute, and fun without being distracting.

## Phase 5 — Build the Next.js website

- [ ] Rebuild the shared header, footer, mobile menu, and call-to-book controls.
- [ ] Rebuild the Home page.
- [ ] Rebuild the Services directory.
- [ ] Rebuild high-intent service detail pages.
- [ ] Rebuild the Our Shop story and gallery page.
- [ ] Rebuild the Vehicle Drop-off guide.
- [ ] Rebuild the Reviews page.
- [ ] Rebuild the Offers / Coupons page.
- [ ] Rebuild the Contact and Directions page.
- [ ] Add responsive image treatment and meaningful alt text.
- [ ] Add accessible interaction states and reduced-motion support.

**Completion gate:** Every visible link leads to a finished, useful destination.

## Phase 6 — SEO and customer acquisition

- [ ] Write unique titles and descriptions for every indexable page.
- [ ] Add local service language for Egg Harbor Township, Mays Landing, and
      Linwood without keyword stuffing.
- [ ] Add AutoRepair structured data with accurate address, phone, hours, and
      service area.
- [ ] Add service and breadcrumb structured data where appropriate.
- [ ] Preserve legacy URLs and internal linking.
- [ ] Publish sitemap and crawler rules.
- [ ] Make phone and directions actions prominent on mobile.
- [ ] Connect reviews, CARFAX recognition, ASE certification, warranty, and
      community roots to conversion points.
- [ ] Add Yelp, Facebook, and CARFAX as verified `sameAs` profiles.
- [ ] Do not place third-party review ratings in structured data unless current
      eligibility and markup rules are confirmed.

**Completion gate:** Search engines and customers can immediately understand
who the shop serves, what it repairs, why it is trustworthy, and how to book.

## Phase 7 — Quality assurance

- [ ] Test every route.
- [ ] Test every navigation link and call button.
- [ ] Test every imported image.
- [ ] Test phone, directions, CARFAX, and social links.
- [ ] Test Yelp, Facebook, and CARFAX links on phone and desktop.
- [ ] Re-check all time-sensitive review counts, ratings, and awards immediately
      before publishing.
- [ ] Test at common phone, tablet, laptop, and wide-desktop sizes.
- [ ] Test keyboard-only navigation.
- [ ] Test visible focus and skip navigation.
- [ ] Test reduced-motion behavior.
- [ ] Check heading order, labels, image alt text, and color contrast.
- [ ] Run the production build and artifact checks.

**Completion gate:** No unfinished pages, dead links, broken media, layout
overflows, or inaccessible primary actions.

## Phase 8 — Publish

- [ ] Create a complete production checkpoint.
- [ ] Verify the production deployment reaches a successful state.
- [ ] Open the final URL on a real phone and desktop browser.
- [ ] Record any post-launch content updates that require owner confirmation.

**Definition of done:** A fully working, responsive, accessible, SEO-ready
website is live, every legacy destination is preserved or improved, and every
page clearly invites visitors to call and book.

## Immediate next actions

1. Run the final production build and route checks.
2. Publish the complete checkpoint and verify deployment.
3. Owner follow-up after launch: confirm the CARFAX tracking number and exact
   award years before adding any multi-year award language.
4. Confirm the exact CARFAX award years and any permitted badge artwork.
5. Produce the consolidated page-and-redirect map for approval.
6. Start the from-scratch design and Next.js build only after steps 1–5 are
   complete.

## Current refinement pass

- [x] Replace overlapping hero decorations with protected layout lanes.
- [x] Keep the ASE, Family Run, CARFAX, shop photo, and animated wheel from
      covering one another.
- [x] Restyle the trust marks as distinct vintage garage stickers.
- [x] Replace the “Old soul or new spark” headline and redesign the full
      vehicle-capability section.
- [x] Create and install a transparent Ocean Heights logo without the white
      background.
- [ ] Re-run responsive, accessibility, route, and production checks.
- [ ] Publish and verify the completed refinement.
