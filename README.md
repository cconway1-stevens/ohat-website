# Ocean Heights Auto & Tire — Website

[![CI](https://github.com/cconway1-stevens/ohat-website/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/cconway1-stevens/ohat-website/actions/workflows/ci.yml)
[![GitHub Pages build](https://github.com/cconway1-stevens/ohat-website/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/cconway1-stevens/ohat-website/actions/workflows/ci.yml)
[![Production website](https://img.shields.io/website?url=https%3A%2F%2Fohat-website.vercel.app%2F&up_message=online&down_message=offline&label=production)](https://ohat-website.vercel.app/)

The website for **Ocean Heights Auto & Tire**, a family-run auto repair shop
at 1178 Ocean Heights Avenue, Egg Harbor Township, NJ. Built as a retro
service-catalog experience — "Service & Repair Annual, Issue No. 1178" — with
a modern Next.js stack on Cloudflare.

The primary conversion on every page: **call (609) 241-1546 to book service.**

## Website status

| Area                    | Status                                                                 | What it means                                                                                                                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production              | **Online** — [open the Vercel site](https://ohat-website.vercel.app/)  | The homepage returned HTTP 200 when verified on August 1, 2026. The badge above checks availability continuously.                                                                                                         |
| Main-branch quality     | **Passing locally; CI enforced on GitHub**                             | Every push and pull request runs formatting, lint, both production builds, rendered-route tests, service SEO checks, hours logic, and static-export validation.                                                           |
| Static deployment       | **Latest completed workflow passed**                                   | GitHub Pages builds the same static artifact configured for Vercel and publishes it when Pages is served from a domain root.                                                                                              |
| Last PageSpeed snapshot | **Mobile: 78 performance; 100 accessibility, best practices, and SEO** | Measured August 1, 2026 before the latest AVIF/responsive-image improvements. Lighthouse reports performance against a 60 reference floor, with **80+ as the optimization goal**; performance is advisory because shared-runner scores vary. |

The status badges are the fastest way to read health: **CI** proves the checked-in code builds and passes tests, **GitHub Pages build** proves the static deployment path works, and **Production website** confirms the public URL responds.

## Build and test workflow

GitHub Actions is the visible source of truth for repository health. A single
workflow, [`.github/workflows/ci.yml`](.github/workflows/ci.yml), runs on every
push to `main` and every pull request, cheapest and most decisive first:

- **Formatting** — Biome.
- **Static analysis** — Biome lint, Next.js framework lint
  (`@next/eslint-plugin-next`), `tsc --noEmit`, dead code (`knip`), architecture
  rules (`dependency-cruiser`), and a code-bloat report (advisory).
- **Test and build** — `npm test`, which builds both the Cloudflare and
  static/Vercel artifacts and runs the route, SEO, hours, and static-export
  tests. The tested static site is uploaded as an artifact for the browser
  jobs.
- **Browser quality** — against that artifact: the page smoke test (every page
  loads, links resolve, the call CTA works), the bundle-size budget, a
  single-run parallel **Lighthouse audit on every indexable page**, and an
  axe-core accessibility audit on every page.
- **Dependency security** — `npm audit` (fails on high/critical) plus a
  dependency-review action on PRs.
- **CodeQL** — GitHub's static security analysis, plus a weekly scheduled scan.
- **Windows compatibility** — build, lint, Next.js lint, and typecheck on
  `windows-latest`.
- **Resilience** (scheduled weekly + manual `workflow_dispatch`) — slow-3G load
  and memory-leak checks, plus **Lighthouse on every indexable page with a median
  of 3 runs** as the performance stability reference.
- **Package + deploy** — packages the tested static site and publishes it to
  GitHub Pages when Pages is configured at a domain root.

Every check is also runnable locally via `npm run check:<name>`; `npm run
check:all` runs the whole sequence in CI order, using the fast all-indexable-page
Lighthouse pass. `npm run report` runs that same
full sequence but pushes through failures, records each step's run time, and
writes the combined results to the gitignored `dev/reports/report.md` (`--fix`
lets Biome write formatting fixes; `--no-build` skips the two builds and the
browser asset check). The individual checks are:

| Command                      | What it verifies                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| `npm run check`              | Format, lint, types, tests, and a real-browser asset check                                                |
| `npm run check:deadcode`     | No unused files, exports, or dependencies (`knip`)                                                        |
| `npm run check:architecture` | No circular deps, no `src`→`dev` imports, no worker→component imports (`dependency-cruiser`)               |
| `npm run check:bloat`        | No source file exceeds its role-based line budget (advisory)                                              |
| `npm run check:pages`        | Every page loads with a title, H1, no errors, and no dead links                                           |
| `npm run check:bundle`       | Shipped JS+CSS stays under the byte budget                                                                |
| `npm run check:lighthouse:fast` | Single-run, parallel Lighthouse on every indexable page; same page/category coverage as the stable audit |
| `npm run check:lighthouse`   | Stable serial Lighthouse benchmark: 3 performance runs per indexable page; a11y/BP/SEO run once          |
| `npm run check:a11y`         | Zero axe-core WCAG 2.1 AA violations on **every page**                                                    |
| `npm run check:slow-network` | Every page loads within budget on a throttled slow-3G connection                                          |
| `npm run check:memory`       | No DOM-node or heap growth across repeated navigation                                                     |
| `npm run report`             | Full CI-order gate that runs **every step even after a failure** and writes a per-step report to `dev/reports/report.md` |

The canonical testing document is `dev/docs/test-program.md`: the master test
matrix, the page-discovery rules, and which checks gate PRs vs run scheduled.
Any change to a `check:*` script's coverage must update it.

To investigate a failure, open the failing badge, select the newest run, then
open the failed step. A red **Lint** step points to source-quality errors; a
red **Full test suite** step can identify a production build, route, SEO,
hours, or static-export regression.

## Design language

A vintage car-catalog system ("The Modern Family Garage"):

- Cream paper surfaces, deep garage red, signal yellow, and gulf blue, with
  thick ink borders and hard offset shadows.
- Georgia serif display headlines with double-rule catalog mastheads; Geist
  for body text.
- Catalog artifacts throughout: cover sheet hero, bay-numbered service cards,
  proof-of-work tickets, rubber-stamp seals, a brand marquee, and an animated
  drive-off footer.
- Every animation respects `prefers-reduced-motion`.

Design tokens live in `:root` in `app/styles/base.css` (including the
accessibility tints `--yellow-tint` / `--blue-tint` used on red and blue
surfaces). The stylesheet is split into per-section files under `app/styles/`
and re-imported from `app/globals.css`.

## Site map

| Route                                                                                              | Purpose                                                                                 |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `/`                                                                                                | Catalog-cover homepage: hero, credentials, services, diagnostics, makes, reviews, visit |
| `/services`                                                                                        | The service board — all 14 service categories                                           |
| `/services/[slug]`                                                                                 | Bay-ticket detail page per service (14 pages, data in `lib/services.ts`)                |
| `/our-shop`                                                                                        | Family story and shop photo gallery                                                     |
| `/reviews`                                                                                         | Review themes plus CARFAX / Yelp / Facebook profiles                                    |
| `/offers`                                                                                          | Current offers and the preserved legacy coupon                                          |
| `/contact`                                                                                         | Call, visit, and after-hours contact options                                            |
| `/vehicle-drop-off`                                                                                | Secure after-hours key-drop guide                                                       |
| `/links`                                                                                           | Link-tree hub for social bios                                                           |
| `/links/qr`                                                                                        | QR-code landing for the link tree (noindex)                                             |
| `/privacy`                                                                                         | Privacy notice (noindex)                                                                |
| `/arcade` (+ 15 games)                                                                             | The Garage Arcade — easter-egg games, all noindex                                       |
| `/agent`                                                                                          | Dev playground for the pixel-crew mascot and chat brain (noindex)                       |
| `/contact-card.vcf`                                                                                | Downloadable vCard                                                                      |
| Legacy: `/auto-repair`, `/contact-us`, `/coupons`, `/oil-changes`, `/tire-rotation`, `/alignments` | Permanent redirects to the new structure                                                |

A branded 404 ("Bay 404") handles everything else. `sitemap.xml` and
`robots.txt` are generated from `app/sitemap.ts` and `app/robots.ts`.

## Quality bars

These are maintained deliberately — please keep them green when contributing:

- **Accessibility:** zero axe-core WCAG 2.1 AA violations across all routes;
  skip links, screen-reader annotations on external links, reduced-motion
  support.
- **SEO:** per-page titles/descriptions/canonicals, Open Graph + Twitter
  cards, `LocalBusiness`, `Service`, and `BreadcrumbList` JSON-LD.
- **Performance:** responsive AVIF photo ladders, a roughly 25 KB phone-sized
  hero candidate, a 6.5 KB AVIF masthead logo, self-hosted fonts, and no
  external image dependencies on the homepage.
- **Code health:** no dead files/exports/dependencies (`knip`), no source file
  over its role-based line budget, and a shipped JS+CSS bundle under budget.
- **Resilience:** pages load within budget on a throttled slow-3G connection
  and show no DOM-node or heap growth across repeated navigation.
- **Security:** `npm audit` fails on high/critical vulnerabilities and CodeQL
  scans every push and pull request.

## Stack

- [Next.js](https://nextjs.org) App Router running on
  [vinext](https://github.com/cloudflare/vinext) (Vite + Cloudflare Workers)
- Tailwind CSS v4 base with a hand-rolled design system in `app/styles/`
  (imported from `app/globals.css`)
- Cloudflare Images for `next/image` optimization (`worker/index.ts`; local
  dev falls back to serving originals when the bindings are absent)

## Project structure

```
src/            Production source code
  app/            Routes (App Router), layout, global styles, sitemap/robots
  components/     React components, grouped by concern
    layout/         site-header, site-footer
    analytics/      GA4 + Vercel analytics
    ui/             Shared widgets (site-image, directions, copy, share, …)
    shop/           Shop widgets (hours status, almanac, service icon)
    arcade/         Game components (incl. the logo-match game)
  lib/            Non-UI logic and data
    shop/           Single source of truth for shop details (shop.mjs + re-exports)
    arcade/         Game logic (word games, audio, presets)
    services.ts     Service catalog data (pages + sitemap)
    makes.ts        Car-make brand data
    seo.ts          Metadata builder
    analytics.ts    Measurement IDs / host detection
  worker/         Cloudflare Worker entry (image optimization + app handler)
  build/          Vite plugin that packages Sites metadata
public/         Static assets (brand SVGs, shop photos, favicon)
dev/            Development tooling (not shipped to production)
  scripts/        Install/build/QA helpers
  tests/          Node test suites (hours, arcade, rendered HTML, SEO, static export)
  docs/           Audits, playbook, and production-readiness notes
  reports/        Lighthouse snapshots
```

`dev/docs/project-playbook.md` documents the rebuild goals, brand story, content
inventory, and owner follow-ups.

## Development

Requires Node.js `24.x` (Linux with `flock`, `curl`, GNU `timeout`).

```bash
npm run install:ci   # one bounded lockfile install
npm run dev          # Vite dev server at http://localhost:5173
npm run format       # format all maintained repository files (Biome)
npm run format:check # verify formatting without changing files
npm run lint         # Biome lint
npm run lint:next    # Next.js framework lint (ESLint)
npm test             # production build + rendered-HTML tests
npm run build        # build and validate the deployable Sites artifact
```

Notes:

- The dev server simulates Cloudflare bindings via `vite.config.ts`; there is
  no `wrangler.jsonc`.
- Google Fonts are cached in `.vinext/fonts/`, which is **gitignored on
  purpose**: the cached CSS bakes in absolute filesystem paths, so a committed
  cache 404s on every machine but the one that generated it. It regenerates on
  first build/dev (falling back to the Google CDN if the network is blocked).
- The remote Sites builder runs `npm run build` against the pushed commit —
  don't repeat install/build as a routine pre-push step.

## Static site (GitHub Pages)

Alongside the Cloudflare Worker build, the whole site can be emitted as plain
pre-rendered HTML:

```bash
npm run build:static   # -> dist/client, servable by any static host
```

The `package-pages` and `deploy` jobs in `.github/workflows/ci.yml` run this on
every push to `main` and publish to GitHub Pages (enable it once under
**Settings → Pages → Source: GitHub Actions**).

`scripts/build-static.mjs` closes the gaps a bare export leaves: it rewrites
the Worker-only `/_vinext/image` URLs to the original assets, writes
`contact-card.vcf`, `sitemap.xml` (derived from the pages actually emitted, so
it cannot drift) and `robots.txt`, turns the legacy server redirects into
meta-refresh pages with canonicals, reshapes `about.html` into
`about/index.html` so every host resolves URLs identically, and adds
`.nojekyll`.

**The Pages site must be served from the root of a domain** — either a custom
domain or an `<owner>.github.io` repo. A project-site subpath
(`owner.github.io/repo/`) cannot work: vinext's prerenderer ignores `basePath`
(the dynamic service routes fail to export) and it does not implement
`assetPrefix`, so its runtime JS and CSS stay pinned to the domain root.
Rewriting the emitted URLs is not a way around it either — the client chunks
and RSC router still request `/assets/*.js` and `/services.txt`, so scripts and
navigation break even though the pages render. The build fails early with that
explanation rather than publishing a broken site.

Canonical URLs still point at `oceanheightsautorepair.com`, so a Pages copy
will not compete with the production domain in search results.

## Content guardrails

- Keep the phone number `(609) 241-1546` consistent everywhere (see the
  CARFAX tracking-number follow-up in the playbook).
- Only make claims backed by the playbook's audit records (e.g., ASE
  certification, CARFAX Top-Rated, 40+ years of parts experience).
- Brand marks in `public/brands/` belong to their respective owners and are
  shown as representative makes serviced.
