# Accessibility and privacy review

The website’s privacy notice and accessibility statement needed factual corrections before they could be relied on. The most consequential problems were an unsupported accessibility conformance claim, an unapproved response-time promise, incomplete speech-service disclosures, and consent withdrawal paths that did not fully stop previously activated features. The revisions address those findings and preserve direct phone and email access to the shop.

This review covers the public website of Ocean Heights Auto & Tire, a business providing vehicle services locally in New Jersey. The owner confirmed that geographic scope. Research and source review were conducted September 9, 2026. The review does not establish complete WCAG conformance, verify private vendor account settings, determine annual consumer counts, or certify compliance with every applicable law.

## Applicable framework

### Accessibility

The U.S. Department of Justice treats the goods and services offered online by public accommodations as subject to the ADA. Its business guidance distinguishes accessibility obligations from a particular automated score and recommends combining automated and manual evaluation. The specific Title II web rules for state and local governments should not be presented as this private repair shop’s compliance timetable.[^1]

New Jersey’s Law Against Discrimination also prohibits disability discrimination in public accommodations and requires reasonable accommodation, subject to the applicable undue-burden standard. Accessible contact options support that obligation but do not erase barriers on the website.[^2]

W3C recommends statements that explain the commitment, standard, contact route, known limitations, and useful technical context in plain language. A statement is primarily a practical resource for visitors, not a substitute for an evaluation. The revised page follows that approach and avoids presenting a source-code check as certification.[^3]

WCAG 2.2 is the newer published standard. The existing repository audit uses WCAG 2.1 A/AA tags, so the statement identifies 2.1 AA as its current testing baseline and acknowledges 2.2 as informing improvements. Full conformance applies to complete pages and processes; a successful scan cannot justify inventing a “substantially conformant” status.[^4]

### Privacy

The NJ Data Privacy Act’s general coverage depends on processing at least 100,000 consumers’ data, excluding payment-only processing, or at least 25,000 consumers’ data plus revenue or discounts from data sales. A small physical shop is not automatically exempt: unique New Jersey consumers across relevant processing must be counted. The earlier report’s assertion that the shop was two orders of magnitude below the thresholds had no supporting figures and has been removed.[^5]

For covered controllers, the statute calls for an accessible notice identifying processing categories, purposes, disclosures, rights, contact routes, and material-change information. Requests and appeals have 45-day response periods; a permitted request extension requires timely notice. The public notice describes those periods conditionally, rather than treating a legal deadline as a voluntary accessibility-support promise.[^6]

The June 30, 2026 amendment also prohibits sensitive-data sales regardless of consumer counts. It establishes data-broker and data-collector provisions, with a delayed start for the registry establishment subsection. No sale or brokerage activity appears in the website code, but code alone cannot establish the shop’s contracts or entire business practices. The prior report’s unsupported April–June 2027 registration-window assertion is removed.[^7]

The June 2025 implementing rules found in the state’s proposal materials are described as proposals. No final adoption was established in the accessible material during this review; proposed details are not treated as binding requirements here. Recheck the state’s official rules inventory before relying on a specific implementing-rule provision.[^8]

Truthfulness matters independently of threshold coverage. FTC guidance says businesses must honor express and implied privacy promises. Maintaining a statement that matches real collection and withdrawal behavior is therefore important even where a comprehensive state statute’s coverage has not been established.[^9]

The site is intended for vehicle-service customers, but its arcade does not make children’s privacy irrelevant. FTC guidance considers the overall audience and actual knowledge; persistent identifiers can be personal information even where no name or account is requested. The revised notice avoids equating an account-free arcade with no provider data processing.[^10]

## Findings and changes

| Area | Finding | Correction |
| --- | --- | --- |
| Accessibility status | “Substantially conformant” was asserted without a complete evaluation. | Status now says “not fully evaluated”; the baseline and limitations remain explicit. |
| Support deadline | Two business days was an invented operating commitment. | Removed the deadline; retained direct contact and a request for the visitor’s preferred communication method. |
| Deployment claims | A failed CI check was described as preventing every publication. | Described repository checks without claiming universal host enforcement. |
| Audit scope | “Every page, every change” overstated route and interaction coverage. | Identified static-route discovery, exclusions, main-branch triggers, and selected-state limits. |
| Human testing | A recurring screen-reader review schedule was stated without evidence. | Distinguished focused browser review from an outstanding complete assistive-technology audit. |
| Accessibility alternatives | Phone access and third-party alternatives were overstated. | Kept phone and email options; disclosed that radio lacks transcripts and alternatives do not make embeds conformant. |
| Chat input | The notice said visitors could not type personal details. | Explained typed chat, local matching, storage, clearing, export, and sensitive-information avoidance. |
| Voice | “No data leaves your device” overlooked browser speech services. | Updated chat wording and disclosed potentially remote audio/text processing. |
| Service inventory | Weather was absent from the data table; Speed Insights fields were incomplete. | Added weather and expanded the performance-data description. |
| Preference center | The detailed description named only three of six controls. | Named all six optional services and distinguished browser voice permissions. |
| GPC | Copy described two analytics services although the gate covers three. | Named Google Analytics, Vercel Analytics, and Speed Insights; kept map/weather/radio separate. |
| Termly | The notice implied no data reaches Termly before form submission. | Explained that opening its site exposes connection information; direct email/phone remain alternatives. |
| Withdrawal | Loaded analytics code and delayed requests could outlive a choice. | Added dispatch-time checks and stronger cancellation/teardown paths. |
| Dates | Statements were dated September 10 during a September 9 review. | Used September 9, 2026 and accurate “last updated”/review labels. |
| Source guard | A string scan claimed to verify every public claim. | Reframed it as limited consistency checks and guarded against the unsupported claims returning. |

## Website data flow

The website’s own chat matcher does not call an AI API. Its transcript implementation retains at most 200 entries and restores at most 20 entries from the previous day. The restoration window is not a deletion policy: older stored entries remain until cleared or displaced by the cap. The notice now makes that distinction. Microphone dictation and text-to-speech are separate browser facilities; the Web Speech API permits local or remote services, so browser-native does not mean offline.[^11]

Klaro stores choices in local storage. All six registered services default off. The map is activated by its Klaro choice, without an additional per-visit map button. Radio requires its choice plus station/category interaction. GPC overrides the three measurement services in the application, while functional services retain separate opt-in choices. Consent does not retroactively delete data already delivered to providers.

The Google tag previously relied on removing a script element and changing consent storage. Google documents both cookieless behavior under consent mode and a specific `ga-disable-<measurement-id>` mechanism. The revised implementation uses the disable mechanism for withdrawal and gates custom phone events by the current stored choice. Reapproval clears the disable flag and restores granted measurement consent.[^12]

Vercel’s installed React packages inject scripts but do not unload their execution when the wrapper unmounts. Each wrapper now supplies a `beforeSend` function that checks the current consent when invoked, allowing retained callbacks to reject later events. Both wrappers still mount only after permission and only on intended Vercel hosts. Live provider behavior remains an integration point to verify on the deployment host.

Vercel Web Analytics documents cookie-free aggregated measurement, a request-derived visitor hash with a 24-hour session lifespan, and page/referrer/device/location data. The notice attributes those descriptions to Vercel rather than making an independent anonymity guarantee. Private retention settings and provider contracts were not accessible in this review.[^13]

Speed Insights documents URL/route, network speed, browser, device, OS, country, performance metrics, attribution, SDK information, and event time. A browser request necessarily exposes connection information even if a provider does not attach an IP address to retained metrics. The revised table avoids reducing this service to page speed alone.[^14]

Weather now rechecks permission before its delayed request, cancels the pending timer and request on a changed choice, and rejects a result received after withdrawal. The radio players recheck consent at lookup/playback boundaries, reject late directory results, clear audio sources on withdrawal, and prevent an asynchronous fallback from restarting a stream after permission is removed.

## Provider and operating checks still needed

**Consumer counts and account configuration.** Determine annual unique New Jersey consumers across applicable website and business processing, not merely appointment totals. Confirm analytics retention, Google product links/data sharing, vendor agreements, and operational retention of repair and customer records. The website source is evidence of configured browser behavior, not proof of those administrative facts.

**Weather commercial permission.** The website calls Open-Meteo’s public API. Its published terms restrict the free service to noncommercial use and describe commercial promotional use as requiring an appropriate plan. The review found no account entitlement in the source and did not assume one exists or buy a subscription. Confirm permission or replace/disable the integration before relying on it for the business site. Open-Meteo also documents IP/request logging and a 90-day log period; this is the provider’s stated practice, not an independently observed deletion result.[^15]

**Accessibility evaluation.** Complete a human audit with representative screen readers, keyboard-only navigation, browser zoom, text resizing, voice control, high contrast, and reduced motion. Include the contact chat, every consent state, navigation menus, forms/dialogs, and arcade interactions. Maintain concrete issue records with affected pages, workarounds, remediation owners, and retest evidence. These are remaining evaluation tasks, not facts that can be written into a statement as already completed.

**Request handling.** Confirm that the published shop email is monitored, the Termly request URL belongs to the shop and reaches the intended recipient, and someone owns request verification, response tracking, and escalation. Do not submit a fake request merely to test delivery. Retain direct email and phone routes even if an external form becomes unavailable.

**Deployment controls.** Verify the actual hosting integration and branch protection settings before saying an accessibility failure prevents production publication. The repository’s GitHub Pages release path has prerequisites; that does not establish the behavior of a separate Vercel deployment integration.

**Scope changes.** Reassess when adding booking/payment forms, advertising, customer accounts, sensitive-data collection, audience targeting, or new providers. The confirmed local New Jersey service model supports this review’s primary jurisdictional focus; it does not establish that every other jurisdiction can never matter.

## Verification record

The final verification results are recorded below after the source and browser checks complete. Browser tests use isolated sessions and intercept optional external requests where appropriate; they do not submit customer reports or transmit test conversations to the shop.

## Sources

[^1]: U.S. Department of Justice, [Guidance on Web Accessibility and the ADA](https://www.ada.gov/resources/web-guidance/), March 18, 2022, with the page’s distinction concerning later Title II rules; accessed September 9, 2026.
[^2]: New Jersey Division on Civil Rights, [NJ Law Against Discrimination](https://www.njoag.gov/about/divisions-and-offices/division-on-civil-rights-home/know-the-law/njlad/), accessed September 9, 2026.
[^3]: W3C WAI, [Developing an Accessibility Statement](https://www.w3.org/WAI/planning/statements/), updated March 11, 2021; accessed September 9, 2026.
[^4]: W3C, [Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/), current published recommendation accessed September 9, 2026.
[^5]: New Jersey Division of Consumer Affairs, [New Jersey Data Privacy Law FAQs](https://www.njconsumeraffairs.gov/ocp/Pages/NJ-Data-Privacy-Law-FAQ.aspx), January 15, 2025. Search-index excerpts were accessible; direct retrieval returned HTTP 403. Thresholds cross-checked against the enacted statute below.
[^6]: New Jersey Legislature, [P.L. 2023, c.266](https://pub.njleg.gov/Bills/2022/PL23/266_.HTM), approved January 16, 2024, especially sections 2–4; accessed September 9, 2026.
[^7]: New Jersey Legislature, [P.L. 2026, c.25](https://pub.njleg.gov/Bills/2026/AL26/25_.HTM), approved June 30, 2026, especially sections 1, 2, and 8; accessed September 9, 2026.
[^8]: New Jersey Division of Consumer Affairs, [Rule Proposals and Adoptions](https://www.njconsumeraffairs.gov/Proposals), and NJ Attorney General, [Proposed Consumer Data Privacy Rules](https://www.njoag.gov/murphy-administration-announces-proposed-rules-establishing-comprehensive-consumer-data-privacy-protections/), June 2, 2025; accessed September 9, 2026.
[^9]: Federal Trade Commission, [Privacy and Security business guidance](https://consumer.ftc.gov/business-guidance/privacy-security), accessed September 9, 2026. Google also requires appropriate privacy disclosures in its [Analytics Terms of Service](https://marketingplatform.google.com/about/analytics/terms/us/).
[^10]: Federal Trade Commission, [Complying with COPPA: Frequently Asked Questions](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions), accessed September 9, 2026.
[^11]: Web Speech API Community Group, [Web Speech API](https://webaudio.github.io/web-speech-api/), draft report accessed September 9, 2026; browser-specific processing varies. Mozilla, [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition), corroborates server-based recognition in some browsers.
[^12]: Google, [Manage privacy settings](https://developers.google.com/tag-platform/security/guides/privacy) and [Consent mode overview](https://developers.google.com/tag-platform/security/concepts/consent-mode), accessed September 9, 2026.
[^13]: Vercel, [Web Analytics Privacy and Compliance](https://vercel.com/docs/analytics/privacy-policy), updated June 26, 2026; accessed September 9, 2026.
[^14]: Vercel, [Speed Insights Privacy and Compliance](https://vercel.com/docs/speed-insights/privacy-policy), updated March 18, 2026; accessed September 9, 2026.
[^15]: Open-Meteo, [Terms and Privacy](https://open-meteo.com/en/terms), accessed September 9, 2026.

## September 10 follow-up

Rechecked the enacted [NJ privacy statute](https://pub.njleg.gov/Bills/2022/PL23/266_.HTM), [DOJ business web accessibility guidance](https://www.ada.gov/resources/web-guidance/), and [W3C statement guidance](https://www.w3.org/WAI/planning/statements/). The statements retain conditional statutory applicability and disclose incomplete conformance evaluation. Account settings and business operations are still not verified by source review.

Restored the shared navbar logo, bundled the existing Klaro stylesheet into application CSS, corrected modal centering and text contrast, clarified service group descriptions, and replaced the inaccurate “Forms & accounts: None” summary with “Customer accounts: None.” Privacy URLs remain host-relative. TypeScript, lint, architecture, dead-code checks, 162 unit tests, and the accessibility statement consistency check passed. Browser verification remains outstanding because this environment has no installed Chromium and the download timed out. See TODO.md for remaining operational and verification work.
