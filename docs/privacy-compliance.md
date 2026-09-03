# Privacy compliance record — Ocean Heights Auto & Tire

Prepared 2026-08-01, after adding Google Analytics 4 to the site. This is the
working record of what the site collects, which laws reach it, and what was
done about them.

**This is engineering research, not legal advice.** Nobody here is a lawyer.
The conclusion below — that the NJDPA's obligations do not currently bind this
shop — rests on a visitor-volume threshold, and it is worth ten minutes of an
attorney's time to confirm, particularly before any marketing campaign that
could change the traffic picture.

## Bottom line

The New Jersey Data Privacy Act almost certainly does **not** apply to this
business: it is roughly two orders of magnitude below the volume thresholds
that make an entity a covered controller. The new NJ data broker law does not
apply either — the shop neither sells nor licenses personal data.

The obligation that _does_ bind, regardless of size, is contractual: Google's
Analytics Terms of Service require any site running the tag to publish a
privacy policy disclosing the use of analytics and cookies. The site had no
privacy policy at all, so adding GA4 put it out of compliance with Google's
terms the moment the tag shipped. That is now fixed.

## Does the NJDPA apply?

The NJDPA took effect January 15, 2025. It applies to a controller that, in a
calendar year, either:

1. controls or processes the personal data of **at least 100,000 consumers**
   (excluding data processed solely to complete a payment transaction), or
2. controls or processes the personal data of **at least 25,000 consumers**
   _and_ derives revenue or a price discount from the **sale** of personal
   data.

Two features matter for a small business. First, "consumers" means New Jersey
residents acting in a personal capacity. Second — and this catches people out —
the NJDPA has **no revenue floor**. Unlike California's CCPA, which exempts
businesses under roughly $26.6M in annual revenue, a small company crosses into
NJDPA coverage purely on data volume. Being small is not, by itself, a defence.

**Against threshold 1:** a single-location repair shop serving Egg Harbor
Township, Mays Landing and Linwood does not touch 100,000 New Jersey residents
in a year. Its customer base is in the thousands, and website visitors are in
the same order. Even counting every unique visitor as a "consumer" whose data
is processed, the shop is far below the line.

**Against threshold 2:** it requires _sale_ of personal data. The shop sells
none. See the note on "sale" below, which is the only part of this worth
watching.

**Conclusion: not a covered controller.** The obligations that follow from
coverage — a conforming privacy notice, data protection assessments, honouring
universal opt-out signals, the 30-day cure window (which sunset around July 2026) — are not currently triggered.

## Is running Google Analytics a "sale"?

This is the one place a small business can back into coverage without noticing,
so it is worth being precise.

State privacy laws define "sale" broadly — typically as disclosing personal
data to a third party for monetary **or other valuable consideration**. Under
that wording, standard ad-tech configurations can count as a sale even when no
money changes hands, because the business receives targeting value back. If
analytics were configured to feed Google's advertising products, the argument
that "we don't sell data" would get considerably weaker.

The tag is therefore configured to stay strictly on the measurement side:

| Setting                            | Value       | Why                                                  |
| ---------------------------------- | ----------- | ---------------------------------------------------- |
| `ad_storage`                       | denied      | No advertising cookies                               |
| `ad_user_data`                     | denied      | Nothing sent to Google for ad purposes               |
| `ad_personalization`               | denied      | No personalised advertising                          |
| `allow_google_signals`             | false       | No cross-device tracking from signed-in Google users |
| `allow_ad_personalization_signals` | false       | Belt and braces on the above                         |
| `anonymize_ip`                     | true        | Truncates the visitor's IP                           |
| `analytics_storage`                | follows GPC | Cookieless when the visitor signals opt-out          |

With advertising off across the board, this is first-party measurement, and the
"no sale" position is a straightforward one to defend. **If anyone later
enables Google Ads linking, remarketing, or Google Signals, this analysis stops
holding and should be redone.**

## The new NJ data broker law (A.5328)

Signed June 30, 2026. It creates an annual registration regime, with the first
registration window running April 1 – June 30, 2027, and bans the sale or
licensing of sensitive data. It reaches two categories:

- **Data broker** — collects or buys personal data about consumers it has _no
  direct relationship with_, and sells or licenses it.
- **Data collector** — has a direct relationship with the consumer and sells or
  licenses their personal data _to a data broker_.

The shop is neither. It has a direct relationship with its customers (so not a
broker) and sells or licenses their data to nobody (so not a collector). **No
registration obligation.** Worth re-checking only if the shop ever starts
sharing a customer list with a marketing vendor.

## Google Analytics Terms of Service — the obligation that does apply

Google's Analytics ToS (§7) requires anyone running the tag to publish a
privacy policy, disclose the use of Analytics and how it collects and processes
data, and give notice of cookies and similar identifiers. This is contractual,
applies at any size, and was the real gap. Fixed by `/privacy`.

## What this site actually collects

Audited by reading the source, not by assumption:

- **No contact forms anywhere.** Every "contact us" affordance is a `tel:` or
  `mailto:` link that hands off to the visitor's own phone or mail app. The site
  receives no form submissions and stores no visitor input.
- **No accounts, no logins, no cart, no payment processing.**
- **Google Analytics 4** — page views plus a `call_click` event on taps of any
  phone-number link. Sets cookies. Configured as in the table above.
- **Vercel Web Analytics** — page-view counts, cookieless, no personal data.
  Loaded through Vercel's own `@vercel/analytics` package.

  Worth recording, because this tag has moved three times. It began as a plain
  `<script src="/_vercel/insights/script.js">` in the layout. That path is
  served only by Vercel's edge, and the site was then published to GitHub Pages
  as well, so it 404'd on every Pages page load — which is why "Prepare
  production deployment checks" removed it and added a readiness check that
  fails on any `/_vercel/` script. GitHub Pages has since been retired, and the
  official package is now used instead: it injects from a client effect, so the
  exported HTML stays free of provider tags and the readiness check is
  satisfied on its own terms. That check was narrowed to scan the built HTML
  rather than the live DOM, since the runtime injection is the legitimate case.

  Cookieless, so it changes nothing in the consent analysis above.

- **Vercel Speed Insights** — page load performance timings, cookieless, no
  personal data. Loaded through `@vercel/speed-insights`, gated the same way
  as `@vercel/analytics` (see `components/vercel-speed-insights.tsx`): a
  client effect, enabled only on a Vercel host, satisfying the same
  `/_vercel/` readiness check.

- **Local storage** — arcade high scores, game settings, and a 30-minute
  weather cache. Never transmitted; lives on the visitor's device.
- **Third-party requests that necessarily expose the visitor's IP:** Google
  (analytics script, webfont), Open-Meteo (header weather), Radio-Browser
  (arcade radio game only).
- **Open-Meteo is queried with the shop's own coordinates**, never the
  visitor's. No geolocation is requested from the browser anywhere on the site.

That is a genuinely small footprint, and it is most of why compliance here is
straightforward.

## What was implemented

1. **`/privacy`** — a plain-English privacy notice covering collection, cookies,
   third-party requests, local storage, choices, NJ residents, children,
   retention and contact details. Linked from the sitewide footer and listed in
   both sitemaps, since a notice has to be reasonably accessible to count.
2. **Global Privacy Control honoured** — `analytics_storage` is set to `denied`
   when `navigator.globalPrivacyControl` is true, via Google Consent Mode. A
   visitor with GPC set is measured without cookies, with no banner to dismiss.
   Not legally required of this shop; implemented because it is the right
   default and it costs nothing.
3. **Advertising disabled** in the Google tag, per the table above.
4. **Stale comment corrected** in `app/layout.tsx`, which claimed no consent
   banner was needed — true of Vercel's cookieless analytics, not of GA4.
5. **Privacy policy corrected when Vercel Analytics was removed.** The policy
   had described it as a live tool. This is exactly the drift warned about
   under "Keep the policy true": an inaccurate privacy policy is a worse
   position than none, because it is a representation to consumers.

## Deliberately not done

- **No cookie consent banner.** Under current US state law, banners are not
  required for first-party analytics with advertising disabled, and the NJDPA
  does not reach this business at all. A banner would add friction for every
  visitor — on a site whose entire goal is getting someone to tap a phone
  number — in exchange for no compliance benefit. The GPC signal is honoured
  instead, which serves the same purpose without the interruption. Revisit if
  the shop ever advertises to EU/UK visitors, where consent rules are stricter
  and genuinely do require a prompt.
- **No consent management platform.** See below.

## On buying a compliance tool

A consent management platform (Osano, Termly, CookieYes, iubenda, Cookiebot,
Usercentrics) will auto-scan the site, generate a policy, show a banner and
maintain a consent log. They are the right answer for a business that is a
covered controller, runs ad-tech, or operates across many jurisdictions.

For this shop they would mostly manufacture the appearance of a compliance
problem it does not have. The site has no forms, no ad-tech, one analytics tool
with advertising switched off, and sits far below every applicable threshold.
The honest recommendation is to keep the hand-written policy — which is
accurate, specific to this site, and free — and revisit if any of these change:

- the shop starts running Google Ads, remarketing, or a Meta pixel
- a contact, quote, or booking form is added to the site
- customer data is shared with a marketing vendor
- traffic approaches six figures of NJ residents annually

Any one of those is a genuine trigger to reassess. Absent them, a subscription
buys a banner nobody needs.

## Recommended next steps for the owner

1. **Have an attorney glance at `/privacy`.** Cheap, and it converts this from
   a well-researched engineering judgment into an actual legal opinion.
2. **Keep the policy true.** If a booking form, a chat widget, an ad pixel, or a
   mailing list gets added, the policy needs updating the same day — an
   inaccurate privacy policy is a worse position than none, because it is a
   representation to consumers.
3. **Note the interaction with review requests.** Texting customers for reviews
   pulls in the TCPA, which is a genuinely strict regime with statutory damages
   and is unrelated to everything above. Get advice before running any SMS
   campaign.

## Sources

- [NJ Division of Consumer Affairs — NJ Data Privacy Law FAQs](https://www.njconsumeraffairs.gov/ocp/Pages/NJ-Data-Privacy-Law-FAQ.aspx)
- [NJ Legislature — S332 bill text (NJDPA)](https://www.njleg.state.nj.us/bill-search/2022/S332/bill-text?f=S0500&n=332_R6)
- [WilmerHale — New Jersey Enacts Comprehensive Privacy Law](https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/20240117-new-jersey-enacts-comprehensive-privacy-law)
- [White & Case — New Jersey Enacts Comprehensive Data Privacy Law](https://www.whitecase.com/insight-alert/new-jersey-enacts-comprehensive-data-privacy-law)
- [Akin — New Jersey Data Protection Act: What Businesses Need to Know](https://www.akingump.com/en/insights/alerts/new-jersey-data-protection-act-what-businesses-need-to-know)
- [Osano — The New Jersey Data Privacy Act: The Basics](https://www.osano.com/articles/new-jersey-data-privacy-act-njdpa)
- [Tannenbaum Helpern — Universal Opt-Out Mechanisms and Global Privacy Control](https://www.thsh.com/publications/universal-opt-out-mechanisms-and-global-privacy-control-state-law-requirements-and-compliance-guidance/)
- [Koley Jessen — Universal Opt-Out Mechanisms Explained](https://www.koleyjessen.com/insights/publications/universal-opt-out-mechanisms-explained)
- [WilmerHale — New Jersey Data Broker Registration Regime (A.5328)](https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/20260721-new-jersey-enacts-law-establishing-data-broker-registration-regime-and-imposing-prohibitions-on-sensitive-data-sales)
- [Future of Privacy Forum — Navigating New Jersey's Data Broker & "Data Collector" Registration Law](https://fpf.org/blog/data-brokers-beyond-navigating-new-jerseys-data-broker-data-collector-registration-law/)
- [Hunton — New Jersey Adopts Data Broker Registration Regime](https://www.hunton.com/privacy-and-cybersecurity-law-blog/new-jersey-adopts-new-data-broker-registration-regime-and-sensitive-data-sale-and-licensing-restrictions)
- [Google Analytics Terms of Service](https://marketingplatform.google.com/about/analytics/terms/us/)
- [Google Analytics opt-out browser add-on](https://tools.google.com/dlpage/gaoptout)
