# Ocean Heights Auto & Tire — Website

[![CI](https://github.com/cconway1-stevens/ohat-website/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/cconway1-stevens/ohat-website/actions/workflows/ci.yml)
[![GitHub Pages build](https://github.com/cconway1-stevens/ohat-website/actions/workflows/deploy-pages.yml/badge.svg?branch=main)](https://github.com/cconway1-stevens/ohat-website/actions/workflows/deploy-pages.yml)
[![Production website](https://img.shields.io/website?url=https%3A%2F%2Fohat-website.vercel.app%2F&up_message=online&down_message=offline&label=production)](https://ohat-website.vercel.app/)

The website for **Ocean Heights Auto & Tire**, a family-run auto repair shop
at 1178 Ocean Heights Avenue, Egg Harbor Township, NJ. Built as a retro
service-catalog experience — "Service & Repair Annual, Issue No. 1178" — with
a modern Next.js stack on Cloudflare.

The primary conversion on every page: **call (609) 241-1546 to book service.**

## Website status

| Area                    | Status                                                                 | What it means                                                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production              | **Online** — [open the Vercel site](https://ohat-website.vercel.app/)  | The homepage returned HTTP 200 when verified on August 1, 2026. The badge above checks availability continuously.                                               |
| Main-branch quality     | **Passing locally; CI enforced on GitHub**                             | Every push and pull request runs formatting, lint, both production builds, rendered-route tests, service SEO checks, hours logic, and static-export validation. |
| Static deployment       | **Latest completed workflow passed**                                   | GitHub Pages builds the same static artifact configured for Vercel and publishes it when Pages is served from a domain root.                                    |
| Last PageSpeed snapshot | **Mobile: 78 performance; 100 accessibility, best practices, and SEO** | Measured August 1, 2026 before the latest AVIF/responsive-image improvements. Re-run PageSpeed after deployment before treating 78 as the current score.        |

The status badges are the fastest way to read health: **CI** proves the checked-in code builds and passes tests, **GitHub Pages build** proves the static deployment path works, and **Production website** confirms the public URL responds.

## Build and test workflow

GitHub Actions is the visible source of truth for repository health:

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push to `main`, every pull request targeting `main`, and manual dispatch. It uses Node.js 24, installs from the lockfile, runs ESLint, and executes the full test command.
- `npm test` first runs the Cloudflare/Sites production build, then rendered HTML, service SEO, and shop-hours tests. It also builds the Vercel/static export and validates every exported route and asset URL.
- Prettier is a build gate. Both `npm run build` and `npm run build:static` stop if maintained files are not formatted.
- [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) builds the static site on `main` and publishes it when GitHub Pages is configured at a domain root.
- [`vercel.json`](vercel.json) tells Vercel to run the same `npm run build:static` path and serve `dist/client`.

To investigate a failure, open the failing badge, select the newest run, then open the failed step. A red **Lint** step points to source-quality errors; a red **Full test suite** step can identify a production build, route, SEO, hours, or static-export regression.

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

Design tokens live in `:root` in `app/globals.css` (including the
accessibility tints `--yellow-tint` / `--blue-tint` used on red and blue
surfaces).

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

## Stack

- [Next.js](https://nextjs.org) App Router running on
  [vinext](https://github.com/cloudflare/vinext) (Vite + Cloudflare Workers)
- Tailwind CSS v4 base with a hand-rolled design system in `app/globals.css`
- Cloudflare Images for `next/image` optimization (`worker/index.ts`; local
  dev falls back to serving originals when the bindings are absent)
- Optional Cloudflare D1 + Drizzle scaffolding (`db/`, unused so far)

## Project structure

```
app/            Routes, layout, global styles, sitemap/robots
  page.tsx        Homepage (catalog cover)
  globals.css     The entire design system
  not-found.tsx   Branded 404
components/     Site header/footer, directions dialog
lib/services.ts Service catalog data (single source for pages + sitemap)
public/         Brand SVGs, shop photos, favicon
worker/         Cloudflare Worker entry (image optimization + app handler)
scripts/        Install/build helpers for the Sites platform
tests/          Rendered-HTML smoke tests
```

`PROJECT-PLAYBOOK.md` documents the rebuild goals, brand story, content
inventory, and owner follow-ups.

## Development

Requires Node.js `24.x` (Linux with `flock`, `curl`, GNU `timeout`).

```bash
npm run install:ci   # one bounded lockfile install
npm run dev          # Vite dev server at http://localhost:5173
npm run format       # format all maintained repository files
npm run format:check # verify formatting without changing files
npm run lint         # ESLint
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

`.github/workflows/deploy-pages.yml` runs this on every push to `main` and
publishes to GitHub Pages (enable it once under **Settings → Pages → Source:
GitHub Actions**).

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
and RSC router still request `/assets/*.js` and `/services.rsc`, so scripts and
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
