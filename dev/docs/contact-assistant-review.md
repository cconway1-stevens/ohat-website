# Contact assistant review — September 10, 2026

## What it actually is

A browser-local retrieval and intent matcher over published service FAQs, shop details, and the shared hours calendar. It is not a language model, does not inspect a vehicle, and has no connection to repair orders, appointment availability, or live prices. Typed matching makes no external AI request; browser voice features remain subject to the existing privacy disclosure.

## Strengths

- Shared shop data and holiday calendar avoid duplicating business facts.
- Local execution, lazy loading, and no AI API fees.
- Service-page links and direct phone/email handoffs.
- Existing typo matching and a substantial phrase regression corpus.

## Issues corrected

- Ordinary service questions received irrelevant diagnostic hedging: provide service availability copy instead.
- Price follow-ups lost the topic: retain only the immediately preceding service in memory and ask which service when unknown. Explicit new topics override context; clearing chat resets it. Restored transcripts do not restore a topic.
- Tomorrow questions reported today's status: use the existing shop-local forecast, including holiday closures.
- Repair-status questions implied generic turnaround guidance: explicitly state that repair orders are inaccessible.
- Booking copy did not clearly state its limits: explain that chat cannot confirm an appointment.
- Leading thanks swallowed substantive requests: restrict the courtesy shortcut to standalone thanks.
- Accented service words were split incorrectly: normalize diacritics before tokenization.
- Fault codes produced a generic fallback: explain diagnostic testing without asserting a failed part.
- Explicit brake failure produced service marketing: prioritize a stop-driving/roadside handoff.
- Clearing chat during a delayed module load could resurrect a response: recheck the session after the promise resolves and in its error path.
- Identity copy overstated capability; inspection copy implied first-time success: replace those claims.

## Remaining limitations and next steps

The system still uses keyword scores: it cannot reliably understand arbitrary multi-part questions, negation, vehicle-specific technical questions, or broad conversation. Accent recognition is not Spanish translation. Context is deliberately limited to a service-price follow-up, not general memory. Full screen-reader and live browser interaction checks remain outstanding.

The next useful work is an expanded evaluation set of anonymized, owner-selected real customer questions, especially ambiguous and multi-part requests. A future generative model should retrieve only approved shop content, abstain on unsupported claims, and require explicit confirmation for real booking actions. That would be a separate integration with server-side credentials, usage limits, and reviewed data handling—not a capability added by this patch.

## Validation

87 chat tests passed, including nine regression scenarios covering the corrected routing and follow-ups. No external model, API, tracking service, or new persistent customer data was added.
