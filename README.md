# Ocean Heights Auto & Tire

[![CI](https://github.com/cconway1-stevens/ohat-website/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/cconway1-stevens/ohat-website/actions/workflows/ci.yml)

Website for Ocean Heights Auto & Tire in Egg Harbor Township, New Jersey. Visitors can explore services, find hours and directions, and call **(609) 241-1546**.

[Website](https://ohat-website.vercel.app/) · [CI runs](https://github.com/cconway1-stevens/ohat-website/actions) · [Open tasks](TODO.md) · [Contributor instructions](AGENTS.md)

## Start here

Use **Node.js 24.x** and npm. Build and check scripts also require Bash, `flock`, `curl`, and GNU `timeout`; on Windows, use WSL or a suitably configured Bash environment.

```bash
git clone https://github.com/cconway1-stevens/ohat-website.git
cd ohat-website
npm run install:ci
npm run dev
```

Open **http://localhost:5173**. Run checks in a second terminal:

```bash
npm run test:unit
npm run typecheck
```

`npm run check` is the full local gate. It includes builds and browser checks, so it takes longer than the two commands above. Browser checks require Chrome or Chromium; use `CHROMIUM_PATH` for an existing installation or install the pinned Playwright browser:

```bash
./node_modules/.bin/playwright install chromium
npm run check:browser:preflight
```

## What is in the site?

| Area | Routes | Purpose |
| --- | --- | --- |
| Shop information | `/`, `/our-shop`, `/hours` | Shop introduction, story, hours, and closures |
| Services | `/services`, `/services/[slug]` | Catalog and individual service pages |
| Contact | `/contact`, `/vehicle-drop-off` | Phone, email, directions, local assistant, and night drop |
| Reviews and offers | `/reviews`, `/offers` | Customer feedback and published offers |
| Quick links | `/links`, `/links/qr`, `/contact-card.vcf` | Link hub, QR landing, and downloadable contact card |
| Privacy and accessibility | `/privacy`, `/accessibility` | Data practices, consent choices, accessibility status, and support |
| Optional extras | `/arcade`, `/agent` and their subroutes | Games and mascot/assistant development tools |

Legacy redirects and a custom 404 page are included. Route-discovery tests check emitted pages and sitemap consistency. Arcade and agent routes use noindex metadata; noindex is not access control.

## Architecture and hosting

The project uses **React and Next.js App Router conventions on vinext**, with Vite and a Cloudflare Worker entry. Tailwind and section styles provide the visual system.

| Source | Responsibility |
| --- | --- |
| `src/app/` | Routes, layouts, styles, metadata, sitemap, and robots |
| `src/components/` | Navigation, shop information, consent controls, chat, and games |
| `src/lib/shop/shop.mjs` | Shared phone, email, address, hours, and other shop facts |
| `src/lib/shop/shop-hours.mjs` | Open/closed calculations, holidays, exceptions, and forecasts |
| `src/lib/services.ts` | Service descriptions, FAQs, and service-page data |
| `src/lib/chat/answers.ts` | Local assistant matching and response rules |
| `src/worker/index.ts` | Worker request handling and image endpoint |
| `public/` | Static images, brand assets, icons, and other public files |
| `dev/` | Build scripts, tests, audits, and contributor documentation |

The same source supports a Worker build and a static export. Core informational content is rendered as HTML; interactive features still require JavaScript.

<!-- AUTOGEN:hosting START -->
| Target | Vercel static site | Cloudflare Worker | GitHub Pages |
| --- | --- | --- | --- |
| **Role** | Configured static deployment | Alternate deployment target checked by CI | Optional manual deployment |
| **Build command** | `npm run build:static` | `npm run build` | `npm run build:static` |
| **Serves** | `dist/client` — pre-rendered HTML | Worker + Cloudflare Images | `dist/client` |
| **Framework preset** | `none` — this repo owns its build | vinext (Vite + Workers) | none |
| **Config** | [`vercel.json`](vercel.json) | [`src/worker/index.ts`](src/worker/index.ts) | `pages-package` + `pages-publish` jobs |
<!-- AUTOGEN:hosting END -->

The Vercel configuration specifies the build command and output directory; it does not prove that a deployment is live or that hosting waits for every GitHub check. Check the deployment provider and CI results separately.

Static output must be served from a **domain root**. A GitHub Pages project subpath is unsupported by the current export pipeline. Canonical URLs come from the shared shop configuration.

Important implementation details:

- `vite.config.ts` configures the local Worker environment; there is no `wrangler.jsonc`.
- Optional `.openai/hosting.json` connects a Sites preview to its hosting identity and bindings. Reuse it when present.
- Keep `.vinext/fonts/` out of Git: cached font CSS can contain machine-specific paths.
- Use `SiteImage` for site imagery. It disables runtime image optimization so hydrated images continue to work on static hosting. The Worker also contains an image endpoint for supported requests.
- Builds share the `dist/` output location. Do not run competing builds against the same checkout. If route tests report duplicate pages, investigate stale generated output and rebuild into a clean output directory.

## Privacy and the contact assistant

Klaro controls six optional services: Google Analytics, Vercel Web Analytics, Vercel Speed Insights, shop weather, Google Maps, and arcade radio. These default off. The privacy settings button lets visitors change their choices. Global Privacy Control overrides the three measurement services.

The contact assistant is a **local matcher, not a generative AI model**. Typed questions are matched in the browser against shop information and service FAQs. It supports limited service-topic price follow-ups, but cannot diagnose a vehicle, access repair orders, quote live prices, or confirm appointments. Browser voice features may use remote processing as described on the privacy page.

Do not add third-party requests without reviewing consent behavior, withdrawal handling, and the service inventory in `dev/privacy-services.json`.

- [Privacy review and operational follow-ups](dev/docs/privacy-compliance.md)
- [Contact assistant review](dev/docs/contact-assistant-review.md)
- [Accessibility statement source](src/components/accessibility/accessibility-statement-sections.tsx)

Automated checks do not establish full accessibility conformance or legal compliance. The public statements distinguish implemented behavior from outstanding evaluation and business settings that need confirmation.

## Testing

Tests are organized by the artifacts they need. Add new tests under the appropriate tier so the npm scripts discover them.

<!-- AUTOGEN:tests START -->
| Tier | Command | Files | Needs a build? | Covers |
| --- | --- | --- | --- | --- |
| `unit` | `npm run test:unit` | 10 | **No** — pure logic only | shop hours, notices, chat answers, arcade, transcripts, suite wiring |
| `server` | `npm run test:server` | 2 | Yes — `dist/server` from the Worker build or static-export pipeline | server-rendered HTML, per-service SEO |
| `static` | `npm run test:static` | 2 | Yes — `npm run build:static` → `dist/client` | static export, route discovery and classification |

`npm test` runs all three in order: `npm run test:unit && npm run build:static && npm run test:server && npm run test:static`.
<!-- AUTOGEN:tests END -->

The static-export pipeline also produces the server artifact used by server tests; `npm test` therefore does not need a separate Worker build before those tests. `npm run check` additionally validates the standalone Worker target and runs broader audits.

For coverage, thresholds, page discovery, and scheduled checks, use the [test program](dev/docs/test-program.md). A passing unit suite does not replace browser testing.

## GitHub checks and releases

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) is the source of truth for jobs, dependencies, and event conditions. Some jobs intentionally skip events: Windows runs on PR/manual events, resilience checks run weekly or when requested manually, and GitHub Pages publishing requires a manual deployment request on main.

<!-- AUTOGEN:ci START -->
| Job | Runs on | Waits for |
| --- | --- | --- |
| **Source · format, lint, types, unit tests** | push, PR, manual | — |
| **Supply chain · dependency vulnerabilities** | push, PR, weekly, manual | — |
| **Security · CodeQL scan** | push, PR, weekly, manual | — |
| **Windows · build + all test tiers (PR/manual)** | PRs + manual | — |
| **Build · Cloudflare Worker artifact** | push, PR, weekly, manual | — |
| **Build · static site + export tests** | push, PR, weekly, manual | — |
| **Browser · pages, assets, bundle, accessibility** | push, PR, manual | `build-site` |
| **Lighthouse · speed, SEO, accessibility — sharded** | push, PR, manual | `build-site` |
| **Resilience · slow network, memory, stable Lighthouse (weekly/manual)** | weekly + manual | `build-site` |
| **Release · package the tested site (manual)** | manual deploy on main | `source`, `build-worker`, `build-site`, `browser`, `lighthouse`, `dependencies`, `code-scan` |
| **Release · publish to GitHub Pages (manual)** | manual deploy on main | `pages-package` |
<!-- AUTOGEN:ci END -->

A failed check identifies a problem; whether it blocks merging or publication also depends on repository protections and hosting settings. To diagnose a failure, open the failed job and step in [Actions](https://github.com/cconway1-stevens/ohat-website/actions). `npm run ci:report` can collect a local failure report when GitHub CLI access is configured.

## Command reference

These tables are generated from `package.json`. Run `npm run readme` after changing scripts, workflow jobs, hosting configuration, or test-tier contents. The README consistency test catches stale generated blocks.

<details>
<summary>Expand all commands</summary>

<!-- AUTOGEN:scripts START -->
**Everyday**

| Command | Runs |
| --- | --- |
| `npm run dev` | `vite` |
| `npm run build` | `bash dev/scripts/build-verified.sh` |
| `npm run build:static` | `node dev/scripts/generate-image-variants.mjs && node dev/scripts/build-static-export.mjs && node dev/scripts/build-static.mjs` |
| `npm run start` | `vinext start` |
| `npm run format` | `biome format --write .` |
| `npm run lint` | `biome lint .` |
| `npm run typecheck` | `tsc --noEmit` |

**Tests**

| Command | Runs |
| --- | --- |
| `npm run test` | `npm run test:unit && npm run build:static && npm run test:server && npm run test:static` |
| `npm run test:unit` | `node --test --test-isolation=none "dev/tests/unit/*.test.mjs"` |
| `npm run test:server` | `node --test "dev/tests/server/*.test.mjs"` |
| `npm run test:static` | `node --test "dev/tests/static/*.test.mjs"` |

**Gates and reports**

| Command | Runs |
| --- | --- |
| `npm run check` | `bash dev/scripts/pre-push.sh` |
| `npm run check:all` | `bash dev/scripts/check-all.sh` |
| `npm run report` | `node dev/scripts/run-tests-report.mjs` |
| `npm run readme` | `node dev/scripts/build-readme.mjs` |

**Individual audits**

| Command | Runs |
| --- | --- |
| `npm run check:fix` | `bash dev/scripts/pre-push.sh --fix` |
| `npm run check:assets` | `node dev/scripts/check-assets.mjs` |
| `npm run check:browser:preflight` | `node dev/scripts/check-browser.mjs` |
| `npm run check:browser` | `node dev/scripts/check-browser-suite.mjs` |
| `npm run check:browser:full` | `node dev/scripts/check-browser-suite.mjs --full` |
| `npm run check:bloat` | `node dev/scripts/check-bloat.mjs` |
| `npm run check:bundle` | `node dev/scripts/check-bundle.mjs` |
| `npm run check:lighthouse` | `node dev/scripts/check-lighthouse.mjs` |
| `npm run check:lighthouse:fast` | `node dev/scripts/check-lighthouse.mjs --fast` |
| `npm run check:a11y` | `node dev/scripts/check-a11y.mjs` |
| `npm run check:deadcode` | `knip` |
| `npm run check:architecture` | `depcruise src dev --config .dependency-cruiser.cjs` |
| `npm run check:pages` | `node dev/scripts/check-pages.mjs` |
| `npm run check:privacy` | `node dev/scripts/check-privacy.mjs` |
| `npm run check:a11y-statement` | `node dev/scripts/check-accessibility-statement.mjs` |
| `npm run check:slow-network` | `node dev/scripts/check-slow-network.mjs` |
| `npm run check:memory` | `node dev/scripts/check-memory.mjs` |

**Other commands**

| Command | Runs |
| --- | --- |
| `npm run install:ci` | `bash dev/scripts/install-ci.sh` |
| `npm run format:check` | `biome format .` |
| `npm run clean` | `node dev/scripts/clean.mjs` |
| `npm run clean:deep` | `node dev/scripts/clean.mjs --deep` |
| `npm run qa:production` | `node dev/scripts/production-readiness.mjs` |
| `npm run ci:report` | `node dev/scripts/ci-report.mjs` |
| `npm run validate:artifact` | `bash dev/scripts/validate-artifact.sh` |
| `npm run lint:next` | `eslint .` |
<!-- AUTOGEN:scripts END -->

</details>

## Editing guide

- Update shop facts in `src/lib/shop/shop.mjs`; do not copy phone numbers, hours, or addresses into unrelated components.
- Update service content in `src/lib/services.ts`. Keep customer-facing claims supported by shop records.
- Preserve the original logo proportions. Shared navigation lives in `src/components/layout/site-header.tsx`.
- Use the tokens in `src/app/styles/base.css`. Fraunces is the display face; Geist is the body face. Keep text readable and respect reduced-motion preferences.
- Keep consent gates around optional services and retain direct phone/email alternatives.
- Keep assistant replies honest about their capabilities. Never turn a matched symptom or fault code into a claimed diagnosis.
- Use the repository's installed tools and lockfile. Do not silently substitute newer tool versions while checking a change.
- Update the [test program](dev/docs/test-program.md) when changing a check's coverage.

See [AGENTS.md](AGENTS.md) for implementation rules, the [project playbook](dev/docs/project-playbook.md) for background, and [TODO.md](TODO.md) for open work.
