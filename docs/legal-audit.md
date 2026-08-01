# Legal audit — Ocean Heights Auto & Tire website

Prepared 2026-08-01. Covers the website only: what it says, what it claims,
and what it collects. It does not cover shop operations, employment, insurance,
licensing or the paperwork handed to a customer at the counter — several of
those are noted below as things to check, but they cannot be audited from a
codebase.

**Not legal advice.** This is a careful engineering review by someone who is
not a lawyer. The three items under "Needs the owner" are the ones worth an
attorney's time; the rest are code-level fixes already applied.

Privacy and analytics are audited separately in
[`privacy-compliance.md`](./privacy-compliance.md). The short version: the
NJDPA does not reach a business this size, Google's Analytics terms did require
a privacy policy, and that policy now exists.

## 1. Advertising claims and substantiation — *fixed*

New Jersey's general advertising rules (N.J.A.C. 13:45A-9.2) require an
advertiser to **substantiate any claim about the safety, performance,
availability, efficiency, quality or price** of what it advertises, and to keep
written proof available for inspection **for 90 days** after the advertisement
runs. A website is a continuously running advertisement, so the 90-day clock
never really stops.

Separately, N.J.A.C. 13:45A-26C.2 makes it an unlawful practice for an
automotive repair dealer to make any statement, written or oral, that is untrue
or misleading and that the dealer knows or should know is untrue or misleading.

Claims inventoried on the site, and where each one stands:

| Claim | Where | Status |
| --- | --- | --- |
| "CARFAX customers **currently** rate Ocean Heights 5.0 out of 5" | homepage | **Fixed** — see below |
| "5.0-star rating across hundreds of verified reviews" | /reviews, /links | **Fixed** — now dated |
| "ASE-certified technicians" | metadata, /our-shop, service pages | Verifiable; keep certificates on file |
| "40+ years" / "more than 15 years running a repair shop" | homepage, /our-shop | Owner's own history; substantiable |
| "Dealer-level diagnostics / tools / scan capability" | homepage, service pages | Capability claim; tie to actual equipment |
| Named review excerpts (Jim K., Kimberly J., Kevin B.) | /reviews | **Gated** — not rendering until verified |
| Legacy coupon image | /offers | Already well disclaimed |

### The one that mattered

The homepage said CARFAX customers **currently** rate the shop 5.0 out of 5.
That is a live, present-tense assertion about a third-party number this website
cannot see. If the CARFAX average slips to 4.9, the site keeps asserting 5.0
and nobody notices — an unsubstantiated quality claim, running continuously, in
the exact category the rule names.

The fix is the standard one: state what was observed and when. The site now
reads "rated 5.0 out of 5 … **as of July 30, 2026**", sourced from a single
`shop.rating` field in `lib/shop.mjs` so the homepage, the reviews page and the
links hub cannot drift apart. An observed-on-a-date statement is verifiable,
stays true, and is exactly the sort of written proof the rule contemplates.

**To maintain:** when you refresh that date, actually re-check the profile
first. A stale date is honest; a moved date that nobody verified is not.

### Still worth confirming

- **ASE certification.** Keep current certificates for the technicians on file.
  This is the single most repeated claim on the site — it is in the site-wide
  meta description, so it appears under every search result.
- **The review excerpts — resolved defensively, still needs you.** Three
  quotes were attributed by name to verified CARFAX reviews. They could not be
  verified from here: carfax.com is blocked at this environment's gateway, and
  the repository's history is squashed into one bulk commit, so nothing records
  where the quotes came from.

  Rather than guess, `reviewExcerpts` in `app/reviews/page.tsx` now carries a
  `verifiedOn` date per quote, and a quote only renders as an attributed
  testimonial once that date is set. All three are `null`, so the page shows an
  invitation to read the reviews at the source instead — which is stronger
  proof anyway, being dated, attributed and outside the shop's control.

  Nothing was deleted. To restore a quote: open the CARFAX profile, find the
  review, confirm the wording and the name, then set `verifiedOn` to the date
  you checked. This is the safe default rather than a pessimistic one — a
  testimonial that cannot be traced to a real review is deceptive under both
  the state rule and the FTC's rule on consumer reviews, and unlike a stale
  statistic there is no innocent reading of it.
- **"Dealer-level."** Defensible if the shop genuinely runs factory-level scan
  tools and subscribes to factory service information. Worth being able to name
  the specific equipment if asked.

## 2. The coupon page — *no change needed*

`/offers` displays a coupon image carried over from the old website. NJ rules
on gifts and discount offers (N.J.A.C. 13:45A-16.2 and the price-advertising
sections) require the terms and conditions of an offer, including expiration,
to be disclosed.

The page already handles this about as well as it can: the image is labelled a
"legacy coupon", described as "preserved for continuity", and accompanied by
"pricing and eligibility may have changed; please call the shop before relying
on any pictured discount", with a matching caption and alt text. A visitor
cannot reasonably read it as a live offer.

The residual risk is small but real: any specific dollar figure printed inside
that image is still a published price. If the shop would not honour the pictured
amounts today, the cleanest position is to retire the image or overlay it
plainly as expired. Left as-is because the disclaimers are prominent and this is
a judgement call for the owner, not a defect.

## 3. Vehicle-drop-off page vs. the estimate rules — *already correct*

N.J.A.C. 13:45A-26C.2 prohibits commencing repair work for compensation without
a written estimate and the customer's signed authorization stating the nature
of the problem and the odometer reading. An after-hours key-drop is the obvious
place for a website to accidentally imply that leaving a car authorizes work.

`/vehicle-drop-off` gets this right already, and explicitly:

> "Leaving a vehicle does not authorize repairs — we'll speak with you before
> proceeding."

It also asks for the concern, the mileage and a callback number, which lines up
with what the authorization has to record. No change needed. **Do not let this
sentence get edited away** in future copy passes; it is the page's most
important line.

## 4. Accessibility (ADA / WCAG) — *good, no defects found*

Not New Jersey–specific, but the most common source of demand letters against
small-business websites in the US. Title III claims over inaccessible sites are
a live cottage industry, and NJ's LAD is read broadly on public accommodation.

The site is in unusually good shape here — this was clearly built with care:

- Skip-to-content link on every page.
- Alt text on essentially every image, and it is descriptive rather than
  keyword-stuffed.
- `aria-label` on icon-only and decorative-numeric controls.
- Decorative elements correctly marked `aria-hidden`.
- Semantic landmarks (`main`, `nav`, `aside`, `figure`/`figcaption`).
- Real `<button>` and `<a>` elements rather than clickable `div`s.
- `lang="en"` set on the document.

**One thing that looks like a bug and is not:** copying the footer's text
yields "Google(opens in a new tab)". That string is a `.sr-only` span, and
`.sr-only` is implemented correctly — clipped to a 1px box, off-screen,
invisible on the page. It is *supposed* to be in the DOM: it is how a screen
reader warns that the link opens a new tab, which is a WCAG recommendation
rather than a defect. It surfaces only when the page text is copied
wholesale. Left exactly as it is.

**Worth doing, not code:** run the live site through Lighthouse's accessibility
audit and check colour contrast on the cream-on-yellow and muted-grey text
combinations. Contrast is the one category a static source review cannot settle,
because it depends on the computed colours.

## 5. Third-party content and licensing — *check one item*

- **Photography** appears to be the shop's own — building exteriors, bays,
  waiting area, the drop box.
- **Brand logos** (vehicle makes) come from `simple-icons`, which is CC0. Used
  to indicate makes serviced, which is nominative fair use.
- **`pixabay.com` appears in an arcade file.** Pixabay's licence is permissive
  and does not require attribution, but confirm the specific asset was taken
  from Pixabay and not a lookalike. Noted because it is the one asset on the
  site whose provenance is a URL in a comment rather than an original file.
- **ASE logo** (`/media/ase-certified.jpg`) — ASE controls use of its marks and
  generally permits display by shops that actually employ certified
  technicians. Contingent on item 1 above being true.

## 6. Terms of use — *deliberately not added*

A brochure site with no accounts, no forms, no e-commerce and no user-generated
content gets very little from a terms-of-use page. There is nothing for a
visitor to agree to and nothing to govern. Adding one would be cargo-culting a
SaaS pattern onto a repair shop.

The one thing a terms page might carry — a disclaimer that the site's service
descriptions are not a quote or a warranty — is already handled better in
context: every service page says "call for quote" rather than posting prices.

Revisit if the site ever adds online booking, payments, or a review form.

## Summary of code changes

1. `shop.rating` added to `lib/shop.mjs`, carrying the value, source and the
   date it was observed.
2. Homepage rating claim changed from "currently rate" to "rated … as of
   {date}".
3. CARFAX profile blurb (`lib/business.ts`, used by /reviews and /links) dated
   the same way, from the same field.
4. Privacy policy updated to disclose the **Google Maps iframe** on `/contact`,
   which loads Google content and can set Google's cookies. This was missed in
   the first privacy pass and found while doing layout work on that page.
5. Footer spacing and column balance tightened (cosmetic, in the footer
   cleanup commit) — no accessibility defect was found there.
6. Review quotes gated behind a `verifiedOn` date, and the schema comment that
   asserted they were genuine corrected.

## Needs the owner

1. **Confirm the ASE certifications are current** and keep the certificates
   where they can be produced. This claim runs under every search result.
2. **Confirm the three named review quotes are real**, then set each
   `verifiedOn` date to restore them. They are currently hidden, so this is a
   feature that is switched off rather than a risk that is live.
3. **Have an attorney review `/privacy` and the claims table above.** An hour
   converts this from a diligent engineering judgment into an actual opinion.

Two operational items outside the website, flagged because they interact with
what the site says:

- **Written estimates and signed authorizations** are a hard requirement of
  N.J.A.C. 13:45A-26C.2 at the counter, regardless of what the website says.
- **Review solicitation by text** pulls in the TCPA, which carries statutory
  damages per message. Get advice before any SMS campaign — this is a much
  sharper regime than anything else in this document.

## Sources

- [N.J.A.C. 13:45A-26C.2 — Deceptive practices; automotive repairs (Cornell LII)](https://www.law.cornell.edu/regulations/new-jersey/N-J-A-C-13-45A-26C-2)
- [N.J.A.C. 13:45A-26C.2 (Justia)](https://regulations.justia.com/states/new-jersey/title-13/chapter-45a/subchapter-26c/section-13-45a-26c-2)
- [N.J.A.C. 13:45A-9.2 — General advertising practices (Cornell LII)](https://www.law.cornell.edu/regulations/new-jersey/N-J-A-C-13-45A-9-2)
- [N.J.A.C. 13:45A-9.3 — Price reduction advertisements (Cornell LII)](https://www.law.cornell.edu/regulations/new-jersey/N-J-A-C-13-45A-9-3)
- [N.J.A.C. 13:45A-16.2 — Unlawful practices; gifts and free items (Cornell LII)](https://www.law.cornell.edu/regulations/new-jersey/N-J-A-C-13-45A-16-2)
- [NJ Division of Consumer Affairs — Regulations (N.J.A.C. 13:45A-1 et seq.)](https://www.mercercounty.org/Home/ShowDocument?id=876)
- [Nolo — New Jersey Auto Repair Shop Laws](https://www.nolo.com/legal-encyclopedia/new-jersey-auto-repair-shop-laws.html)
