# Test Program — Ocean Heights Auto & Tire

The canonical testing document. Every required automated test in this repository
is listed here with its local command, its GitHub Actions home, and its pass/fail
rule. If a test exists but is not in this document, it is not required. If a row
here disagrees with a script, the script is wrong.

**Absolute rules (binding on every change):**

1. If GitHub Actions can test it, a developer/AI must have a documented local
   command for the same underlying check.
2. Every eligible page is discovered automatically for each page-level test.
   No hand-maintained route lists; documented page classes may be excluded when
   an audit does not apply to them.
3. Local and CI run the same repository script with the same configuration.
   Never two implementations of one check.
4. Validation is a **gated feedback loop**, not a one-way waterfall. A failed gate
   returns the change to the implementer for diagnosis and repair; it does not
   permit skipping, weakening, or deleting the failing check.
5. Run the **cheapest, fastest, most deterministic checks first**. Do not spend
   browser, security, performance, or AI-review time on code that does not type,
   lint, test, and build cleanly.
6. After any repair, rerun the fast gate. Then rerun the failed outer gate and any
   checks directly affected by the repair. Before handoff or merge, run the full
   required pipeline from a clean state.
7. An AI may fix product code, tests, configuration, or scripts only when the fix
   preserves the documented requirement. It may **never make CI green by lowering
   a threshold, disabling a rule, adding a broad ignore/allowlist, deleting a test,
   or suppressing an error** unless this document is deliberately amended and the
   reason is recorded.
8. AI repair loops are bounded. After **3 unsuccessful repair attempts at the same
   gate**, stop, summarize the root-cause evidence and attempted fixes, and hand off
   for review. Do not thrash, rewrite unrelated code, or keep spending tokens.
9. Prefer existing code, scripts, dependencies, and abstractions. Search before
   creating a new helper, dependency, workflow, or `*-v2` replacement. Delete code
   made obsolete by the change.
10. A passing tool is evidence only for the property that tool measures. Build,
    lint, dead-code, architecture, browser behavior, security, accessibility, and
    performance are separate gates; none substitutes for another.

---

## Table of contents

- [1. Stage-1 audit findings (complete)](#1-stage-1-audit-findings-complete)
- [2. Route census and classification](#2-route-census-and-classification)
- [3. Architecture decisions](#3-architecture-decisions)
- [4. Page discovery specification](#4-page-discovery-specification)
- [5. Lighthouse policy](#5-lighthouse-policy)
- [6. Master test matrix](#6-master-test-matrix)
- [7. Implementation plan](#7-implementation-plan)
- [8. Gated feedback-loop workflow](#8-gated-feedback-loop-workflow)
- [9. Three-tier AI orchestration and handoff protocol](#9-three-tier-ai-orchestration-and-handoff-protocol)
- [10. Security, performance, and best-practice ownership](#10-security-performance-and-best-practice-ownership)
- [11. Risks and revisit triggers](#11-risks-and-revisit-triggers)

---

## 1. Stage-1 audit findings (complete)

Audited against the working tree on 2026-09-02. Stage 1 is **done**; its results
are embedded here so no second audit pass is needed.

### 1.1 What exists today

| Area             | State                                                                                                                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Workflows        | **Only `.github/workflows/ci.yml` exists.** `quality.yml`, `performance.yml`, `codeql.yml`, `deploy-pages.yml` were consolidated into it. The README still describes the old four-workflow layout — **stale, must be fixed**.                                |
| Formatting / lint | **Biome** owns formatting (`npm run format`/`format:check`) and general lint (`npm run lint`) via `biome.json`. **ESLint** is kept as a narrow exception running only `@next/next/*` rules (`npm run lint:next`). Prettier and `eslint-config-next` are removed. |
| Fast gate        | `npm run check` → `dev/scripts/pre-push.sh`: junk scan, Biome format, Biome lint, Next.js lint, `tsc`, knip, dependency-cruiser, `npm test` (both builds + route/SEO/hours/static-export tests), real-browser asset check.                                    |
| Full gate        | `npm run check:all` → `dev/scripts/check-all.sh`: everything in `check` plus `check:pages`, `check:bundle`, the fast all-indexable-page Lighthouse pass, `check:a11y`, `check:slow-network`, and `check:memory`.                                              |
| Report           | `npm run report` → `dev/scripts/run-tests-report.mjs`: mirrors `pre-push.sh` step-for-step but pushes through failures and writes the gitignored `dev/reports/report.md` with per-step run times. Flags: `--fix` lets Biome write fixes, `--no-build` skips both builds and the asset check. |
| Page discovery   | `check-pages.mjs` already walks `dist/client` for `.html` and tests **50 of 60 routes** (excludes only `/404`). This is the proven source of truth.                                                                                                          |
| Lighthouse       | `check-lighthouse.mjs` runs the raw `lighthouse` package against Playwright's Chromium. It discovers every indexable page by default (`LH_ROUTES` can select a subset); console errors remain owned by the preceding browser page sweep.                         |
| Accessibility    | `check-a11y.mjs` runs axe-core WCAG 2.1 AA on a **hardcoded 6-route subset**. README claims "all routes" — currently false.                                                                                                                                  |
| Slow network     | `check-slow-network.mjs`, hardcoded 4-route subset, scheduled/manual in CI.                                                                                                                                                                                  |
| Memory           | `check-memory.mjs`, hardcoded 4-route navigation set, scheduled/manual in CI.                                                                                                                                                                                |
| Bundle budget    | `check-bundle.mjs`, whole-tree JS+CSS ceiling (1650 KB). Fine as-is.                                                                                                                                                                                         |
| CI jobs (ci.yml) | formatting, static-analysis (lint, lint:next, typecheck, deadcode, architecture, bloat), test-build (uploads `dist/client` artifact), browser-quality (pages/bundle/fast Lighthouse/a11y on the artifact), dependency-security, codeql, windows (build, lint, lint:next, typecheck), resilience (slow-network + memory + stable Lighthouse, scheduled/manual), package-pages, deploy. |

### 1.2 Gaps against the requirements

| #   | Gap                                                                                                                                                                               | Severity                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| G1  | Lighthouse audits 1 of 60 routes. New pages silently escape performance/SEO testing.                                                                                              | **Critical**              |
| G2  | a11y audits 6 of 60 routes; README overclaims.                                                                                                                                    | High                      |
| G3  | slow-network / memory use hand-picked route lists that can drift from reality.                                                                                                    | Medium                    |
| G4  | Six scripts (`check-pages`, `check-lighthouse`, `check-a11y`, `check-slow-network`, `check-memory`, `check-assets`) each re-implement the same static file server and MIME table. | Medium (maintenance)      |
| G5  | No canonical testing document; no per-test local/CI parity matrix.                                                                                                                | High (this file fixes it) |
| G6  | README references four workflow files that no longer exist; site map omits `/arcade`, `/agent`, `/privacy`, `/links/qr`.                                                         | Medium                    |
| G7  | No consistency test pinning "sitemap routes == exported indexable routes".                                                                                                        | Medium                    |

### 1.3 Local/CI parity audit

Every required GitHub check already has a local command (`npm run check:*` —
that part of the requirement is met). The parity gaps are **coverage** gaps
(G1–G3), not missing-command gaps. Platform-specific checks that legitimately
have no local equivalent: CodeQL (GitHub infrastructure), dependency-review
action, Pages deployment permissions, branch rulesets. `npm audit --audit-level=high`
covers dependency security locally.

---

## 2. Route census and classification

Counted from `dist/client` (60 `.html` files). Classes are derived from each
page's own markup — never from a list in a test file.

| Class              | Count | Routes                                                                                                                                                          | Detection rule                                             |
| ------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Indexable**      | 24    | `/`, `/services`, 14 × `/services/[slug]`, `/our-shop`, `/reviews`, `/offers`, `/contact`, `/vehicle-drop-off`, `/hours`, `/links`, `/privacy`                  | Has `<h1>`, no `noindex`, no meta refresh                  |
| **Noindex pages**  | 26    | `/agent` + 8 agent tabs, `/arcade` + 15 arcade games, `/links/qr`                                                                                             | `<meta name="robots" content="noindex…">`, no meta refresh |
| **Redirect stubs** | 9     | `/auto-repair`, `/contact-us`, `/coupons`, `/oil-changes`, `/tire-rotation`, `/alignments`, `/services/tires-alignments`, `/logo-match`, `/arcade/drag-strip`   | `<meta http-equiv="refresh">`                              |
| **Error page**     | 1     | `/404`                                                                                                                                                          | filename `404.html`                                        |

**Audited by browser page-level tests: 50 routes** (24 indexable + 26 noindex).
Redirect stubs are validated by `static-export.test.mjs` (stub exists, target
exists, noindex present) — auditing a meta-refresh page in a browser tests
nothing. The 404 page is validated by the rendered-HTML tests.

---

## 3. Architecture decisions

Stage 2/3 design, amended by the Stage 4 (Kimi K3) review. Each decision records
the review fix where the original requirement was wrong.

### AD-1 — `dist/client` is the single source of truth for pages

Page discovery walks the built static tree (the algorithm already proven in
`check-pages.mjs`). A newly added page is discovered, classified, and tested
with zero edits to any test file. Framework route manifests and hand-written
lists are rejected: the build output is what users actually get.

### AD-2 — Routes are classified by their own markup

Each discovered HTML file is read once and classified by the rules in
[section 2](#2-route-census-and-classification). This replaces every hardcoded
`ROUTES` array in `check-a11y`, `check-slow-network`, `check-memory`, and the
`LH_ROUTES` default in `check-lighthouse`.

### AD-3 — Tiered Lighthouse policy (review fix #1)

**The original requirement said "run all four categories against EVERY page."
That is impossible:** Lighthouse's SEO category contains the `is-crawlable`
audit, which _fails by design_ on any `noindex` page. Running SEO on `/arcade`
or `/agent` would be a permanent deterministic failure, not a real signal.

Therefore:

- **Indexable pages** — all four categories audited. Accessibility,
  best-practices, and SEO are blocking; performance is advisory.
- **Noindex pages** — performance, accessibility, and best-practices audited.
  SEO is intentionally not asserted (the page is noindex _on purpose_); this is
  the documented exclusion the requirements ask for.
- **Redirect stubs / 404** — not browser-audited (see section 2).

**Update (2026-09-03):** the noindex tier (arcade, agent — dev/demo content,
not the indexable production surface) is now skipped by `check-lighthouse.mjs`
by default, in every invocation including CI, rather than audited with a
relaxed policy. Pass `--include-noindex` (or `LH_SKIP_NOINDEX=0`) to restore
the tiered audit above for a one-off run. `check:pages` (console/page-error
gate) is unaffected and still covers every route.

### AD-4 — Keep the raw `lighthouse` package; do not add `@lhci/cli` (review fix #2)

The requirement says "use Lighthouse CI" but also says "audit the repository
first; if Lighthouse CI is already installed/configured, reuse it; do not add
another performance framework." The repository already integrates the Lighthouse
engine directly with threshold assertions running in CI — that _is_ the
Lighthouse-CI function. Adding `@lhci/cli` would import a second orchestrator,
a parallel config format, and a server/autodiscovery we do not need. Median
aggregation (the one `@lhci` feature worth having) is ~15 lines of code.

**Decision:** extend `check-lighthouse.mjs`. No new dependency.

### AD-5 — Extract shared `dev/scripts/lib/` modules (review fix #3)

Two small modules delete ~150 duplicated lines across six scripts:

- `dev/scripts/lib/static-server.mjs` — the `dist/client` file server + MIME
  table (currently copied into six files).
- `dev/scripts/lib/routes.mjs` — `walk()`, `discoverRoutes(clientDir)` returning
  `{ route, class }[]` per AD-2.

This is de-duplication of existing code, not new test infrastructure. knip's
`project` glob (`dev/**/*.mjs`) already covers the subdirectory; both modules
are imported by entry scripts so dead-code analysis keeps passing.

### AD-6 — Variance policy: deterministic vs measured

| Audit type                                         | Runs                  | Aggregation | Gate                                                                                 |
| -------------------------------------------------- | --------------------- | ----------- | ------------------------------------------------------------------------------------ |
| Accessibility, best-practices, SEO                 | 1                     | —           | Hard, per page. These are deterministic; a failure is a real bug, never noise.       |
| Performance category + LCP/CLS/FCP/TBT/Speed Index | `LH_RUNS` (default 3) | **Median**  | Advisory against the **60 reference floor**; 80 remains the optimization goal.       |

`npm run check:lighthouse:fast` sets `LH_RUNS=1` and fans pages out across up to
six workers. The performance **goal is 80+**, while results are reported against
the mobile reference floor of 60 (`LH_PERF=60`); performance does not fail the
command because shared-runner CPU contention makes it noisy. The deterministic
categories stay blocking at 100 (`LH_A11Y=100`, `LH_BP=100`, `LH_SEO=100`).
The noindex-tier performance floor is set separately because arcade pages ship
heavy client JS by design. No threshold moves without a deliberate commit and a
recorded baseline.

### AD-7 — Fast gate vs full gate

Decided from current architecture and runtime, as the requirements instruct:

- **`npm run check` (fast definition of done, pre-push):** junk scan, Biome
  format, Biome lint, Next.js lint, types, knip, dependency-cruiser, both builds
  + node tests, asset check. Minutes, no Lighthouse.
- **`npm run check:all` (full validation):** adds all-page `check:pages`,
  `check:bundle`, the single-run parallel **`check:lighthouse:fast`** audit,
  **all-page `check:a11y`**, all-page `check:slow-network`, and `check:memory`.
- **CI per-PR (`browser-quality` job):** `check:lighthouse:fast` audits every
  indexable page once, with parallel workers. Accessibility, best-practices,
  and SEO remain blocking; performance is reported against the 60 reference
  floor, while 80 remains the optimization goal.
- **CI scheduled + `workflow_dispatch` (`resilience` job):** all-page
  slow-network and memory checks, plus Lighthouse on every indexable page with
  `LH_RUNS=3` (median) as the stability reference.

**Revisit trigger:** if the per-PR browser-quality job exceeds ~25 minutes or
shows any performance flake in two weeks, move noindex-tier performance to the
scheduled job. Recorded in [section 11](#11-risks-and-revisit-triggers).

### AD-8 — Google PageSpeed Insights: optional, manual, no script

PSI cannot test localhost and needs an API key for scripted quota. It remains a
**secondary, manual** post-deploy verification on the public URL (as the README's
status table already treats it). No `test:psi` script is added: a script nobody
can run without a key is needless infrastructure. If PSI is ever scripted, it
must target the deployed URL, never gate a PR, and never replace AD-3.

### AD-9 — Lighthouse commands orchestrate themselves

Both `npm run check:lighthouse` (stable, serial, three-run performance median)
and `npm run check:lighthouse:fast` (single run, parallel pages) use the same
orchestrator and page/category coverage. The orchestrator will:

1. run `npm run build:static` itself when `dist/client` is missing;
2. serve the build in-process (already does — no `npm run dev` terminal needed);
3. discover and classify all routes (AD-1/AD-2);
4. audit per AD-3/AD-6 and print per-page results (section 5);
5. exit non-zero on a blocking-category failure, naming the page, category,
   expected value, and actual value;
6. close its server and browser; write nothing into the repo by default
   (`LH_REPORT_DIR` opt-in for JSON snapshots, gitignored).

### AD-10 — dependency-cruiser is the deterministic architecture gate

`npm run check:architecture` runs `dependency-cruiser` against `src` and `dev`
(`.dependency-cruiser.cjs`). It enforces the rules that neither Biome nor ESLint
can express: **no circular dependencies**, **no `src`→`dev` imports** (production
code must not reach into development tooling), and **no worker→component
imports** (the Cloudflare Worker entry must not import React components). The
configuration is deliberately minimal — no large false-positive allowlist — and
any future exception must be a narrow, documented `from`/`to` pair, not a blanket
`circular: false`. dependency-cruiser reduces the architectural judgment left to
AI by enforcing known rules deterministically, but it does **not** replace Tier C
review (see [section 9](#9-three-tier-ai-orchestration-and-handoff-protocol)).

---

## 4. Page discovery specification

Exact algorithm (`dev/scripts/lib/routes.mjs`):

```
discoverRoutes(clientDir):
  for each **/*.html under clientDir:            # e.g. services/tires/index.html
    route = "/" + path, with "/index.html" and ".html" stripped
    html  = read file
    if route == "/404"                      → class = "error"     (skip)
    elif html contains 'http-equiv="refresh"' → class = "redirect" (skip browser audits)
    elif html contains 'name="robots" content="noindex' → class = "noindex"
    else                                    → class = "indexable"
  return sorted list
```

Consumers:

| Consumer                 | Uses                                                                                                                                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `check-pages.mjs`        | all classes except `error` (redirects load fine and their links are checked)                                                                                                                                    |
| `check-lighthouse.mjs`   | `indexable` (4 categories) by default; optional `noindex` coverage (3 categories) with `--include-noindex`                                                                                                      |
| `check-a11y.mjs`         | `indexable` + `noindex`                                                                                                                                                                                         |
| `check-slow-network.mjs` | `indexable` + `noindex`                                                                                                                                                                                         |
| `check-memory.mjs`       | curated navigation set: `/`, `/services/`, `/contact/`, `/arcade/`, `/agent/` — it tests _transitions_ under repeated navigation, so it needs the heaviest client pages, not every page (documented exclusion) |
| `check-assets.mjs`       | unchanged (deliberately one-of-each-layout for speed; `check:pages` already covers all routes for 404s)                                                                                                         |

**Consistency test** (new, in `static-export.test.mjs`): the set of
`indexable` routes discovered by `routes.mjs` must equal the URL set in the
emitted `sitemap.xml` (which `build-static.mjs` derives from the same tree).
A page that escapes classification — or a classifier regression — fails CI.

---

## 5. Lighthouse policy

Per-page output format (visible locally and in Actions logs):

```
Lighthouse — /services/brake-repair  [indexable]  (median of 3 runs)
  ✓ performance      82 / 60    LCP 2.1s  CLS 0.01  FCP 1.2s  TBT 180ms  SI 2.6s
  ✓ accessibility   100 / 100
  ✓ best-practices  100 / 100
  ✓ seo             100 / 100

Lighthouse — /contact  [indexable]
  ✗ seo              88 / 100
      - Document does not have a meta description
```

- Every page prints a result per applicable category and lists sub-audits below
  their target. A performance result below its reference floor is marked `!`
  and labeled advisory; deterministic-category failures are marked `✗` and fail
  the command.
- Thresholds: `LH_PERF=60` (reference floor; the performance **goal is 80+**),
  `LH_A11Y=100`, `LH_BP=100`, and `LH_SEO=100` (env-overridable). The optional
  noindex tier has its own performance reference because arcade pages ship
  heavy client JavaScript by design.
- Form factor: Lighthouse defaults (mobile emulation, simulated throttling) —
  unchanged.

---

## 6. Master test matrix

| Test                       | Purpose                                                          | Tool                             | Config                            | Local command                        | GitHub workflow (ci.yml job)                        | All pages?                         | Build required?              | Artifact           | Pass/fail               | Merge blocking?       | Notes                                             |
| -------------------------- | ---------------------------------------------------------------- | -------------------------------- | --------------------------------- | ------------------------------------ | --------------------------------------------------- | ---------------------------------- | ---------------------------- | ------------------ | ----------------------- | --------------------- | ------------------------------------------------- |
| Repo junk                  | No committed temp/debug files                                    | `check-junk.mjs`                 | —                                 | `npm run check` (step)               | static-analysis                                     | n/a                                | No                           | working tree       | 0 junk files            | Yes                   |                                                   |
| Formatting                 | Consistent style                                                 | Biome                            | biome.json                        | `npm run format:check`               | formatting                                          | n/a                                | No                           | working tree       | 0 unformatted           | Yes                   | `check:fix` writes                                |
| Lint                       | Code quality                                                     | Biome                            | biome.json                        | `npm run lint`                       | static-analysis                                     | n/a                                | No                           | working tree       | 0 errors                | Yes                   |                                                   |
| Next.js framework lint     | Next.js-specific rules (Biome has none)                          | ESLint (`@next/eslint-plugin-next`) | eslint.config.mjs               | `npm run lint:next`                  | static-analysis, windows                            | n/a                                | No                           | working tree       | 0 errors                | Yes                   | Narrow documented exception to Biome              |
| Types                      | Type safety                                                      | `tsc --noEmit`                   | tsconfig.json                     | `npm run typecheck`                  | static-analysis, windows                            | n/a                                | No                           | working tree       | 0 errors                | Yes                   |                                                   |
| Dead code                  | No unused files/exports/deps                                     | knip                             | knip.json                         | `npm run check:deadcode`             | static-analysis                                     | n/a                                | No                           | working tree       | 0 findings              | Yes                   |                                                   |
| Architecture               | No circular deps, no `src`→`dev`, no worker→component            | dependency-cruiser               | .dependency-cruiser.cjs           | `npm run check:architecture`         | static-analysis                                     | n/a                                | No                           | working tree       | 0 violations            | Yes                   |                                                   |
| Bloat                      | File size discipline                                             | `check-bloat.mjs`                | role budgets                      | `npm run check:bloat`                | static-analysis                                     | n/a                                | No                           | working tree       | advisory                | **No**                | report-only by design                             |
| Functional/route/SEO/hours | Logic + rendered HTML + static export                            | `node --test`                    | dev/tests/*                       | `npm test`                           | test-build                                          | Yes (rendered-html, static-export) | Yes (both builds)            | dist/, dist/client | all assertions pass     | Yes                   | `announcements.test.mjs` pins the notice-banner chain: manual entry → holiday today → three-business-days-ahead |
| Page smoke                 | Every route 200s, titled, H1, no errors, no dead links, call CTA | Playwright                       | `check-pages.mjs`                 | `npm run check:pages`                | browser-quality                                     | **Yes — 50 routes**                | Yes (dist/client)            | dist/client        | 0 failures              | Yes                   | Discovery: AD-1                                   |
| Assets                     | No 404'd request after hydration                                 | Playwright                       | `check-assets.mjs`                | `npm run check:assets` (via `check`) | test-build (via `npm test`)? — see note             | One per layout (10)                | Yes                          | dist/client        | 0 failed requests       | Yes                   | Full 404 coverage already via check:pages         |
| Bundle budget              | JS+CSS ceiling                                                   | `check-bundle.mjs`               | BUDGET_KB=1650                    | `npm run check:bundle`               | browser-quality                                     | n/a (whole tree)                   | Yes                          | dist/client        | ≤ budget                | Yes                   |                                                   |
| **Lighthouse**             | Perf/a11y/BP/SEO per page                                        | lighthouse + Playwright Chromium | `check-lighthouse.mjs`, AD-3/AD-6 | `check:lighthouse:fast` or `check:lighthouse` | browser-quality (fast), resilience (3-run median)   | **24 indexable routes by default** | Yes (auto-builds if missing) | dist/client        | deterministic thresholds; performance advisory | Yes for a11y/BP/SEO | Noindex routes are opt-in                         |
| **Accessibility**          | 0 axe WCAG 2.1 AA violations                                     | axe-core + Playwright            | `check-a11y.mjs`                  | `npm run check:a11y`                 | browser-quality                                     | **Yes — 50 routes**                | Yes                          | dist/client        | 0 violations            | Yes                   | The G2 fix                                        |
| Slow network               | Loads on slow 3G within budget                                   | Playwright + CDP throttle        | `check-slow-network.mjs`          | `npm run check:slow-network`         | resilience (scheduled/manual)                       | **Yes — 50 routes**                | Yes                          | dist/client        | ≤ 30s & ≤ 2MB/page      | Scheduled, not per-PR | The G3 fix                                        |
| Memory/leak                | No DOM/heap growth across navigation                             | Playwright + CDP metrics         | `check-memory.mjs`                | `npm run check:memory`               | resilience (scheduled/manual)                       | No — curated transitions (see §4)  | Yes                          | dist/client        | ≤1.5× nodes, ≤64MB heap | Scheduled, not per-PR |                                                   |
| Dependency security        | No high/critical vulns                                           | npm audit                        | —                                 | `npm audit --audit-level=high`       | dependency-security                                 | n/a                                | No                           | lockfile           | 0 high/critical         | Yes                   | + dependency-review action on PRs (platform-only) |
| CodeQL                     | Static security analysis                                         | GitHub CodeQL                    | ci.yml                            | — (platform-specific)                | codeql                                              | n/a                                | No                           | source             | 0 alerts                | Yes                   | No local equivalent by nature                     |
| Windows build              | Cross-platform build/lint/lint:next/types                        | ci.yml                           | —                                 | run the same npm commands on Windows | windows                                             | n/a                                | Yes                          | dist/              | steps pass              | Yes (PR)              |                                                   |
| Production readiness       | Live-site endpoints respond                                      | `production-readiness.mjs`       | —                                 | `npm run qa:production`              | — (manual)                                          | sampled                            | No                           | deployed site      | checks pass             | No                    | Post-deploy only                                  |
| PageSpeed Insights         | Deployed-site field/lab snapshot                                 | Google PSI (hosted)              | —                                 | manual against public URL            | —                                                   | sampled                            | No                           | deployed site      | advisory                | No                    | AD-8: secondary, never a gate                     |

---

## 7. Implementation plan

Each step lists its **local effect**, **GitHub effect**, and **all-page effect**.
Ordered so the repo stays green at every step.

| #   | Step                                                                                                                                                                        | Local effect                                            | GitHub effect                               | All-page effect                 |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------- | ------------------------------- |
| 1   | Add `dev/scripts/lib/static-server.mjs` + `dev/scripts/lib/routes.mjs` (AD-1/2/5); unit-test the classifier in `dev/tests/routes.test.mjs` against `dist/client`            | New shared modules; `node --test` covers classification | test-build runs the new test via `npm test` | Discovery is now codified       |
| 2   | Refactor `check-pages.mjs` to consume the lib (behavior identical)                                                                                                          | Same command, less code                                 | None                                        | None (already all-page)         |
| 3   | Rewrite `check-lighthouse.mjs`: all-page discovery, tiered categories, median perf (`LH_RUNS`), per-page metrics output, auto-build when `dist/client` missing (AD-3/4/6/9) | Lighthouse discovers all routes; 24 indexable routes run by default | browser-quality audits every indexable page per PR | **G1 fixed**                    |
| 4   | Rewrite `check-a11y.mjs` on the lib; drop hardcoded list                                                                                                                    | `check:a11y` audits 50 routes                           | browser-quality                             | **G2 fixed**                    |
| 5   | Point `check-slow-network.mjs` at the lib; expand `check-memory.mjs` rotation to include `/arcade/` + `/agent/`                                                            | scheduled checks cover reality                          | resilience job                              | **G3 fixed**                    |
| 6   | **Baseline run**: full `check:all`; record per-page scores; set the noindex-tier perf floor; fix or debt-list any arcade a11y violations (with owner + date in this doc)    | Establishes existing-debt vs new-regression line        | Baseline archived in dev/reports            | Thresholds now evidence-based   |
| 7   | Add sitemap↔indexable consistency test to `static-export.test.mjs` (G7)                                                                                                     | `npm test` catches classification drift                 | test-build                                  | New pages can't escape silently |
| 8   | Wire `ci.yml`: browser-quality runs parallel single-run Lighthouse + all-page a11y; resilience runs the serial `LH_RUNS=3` Lighthouse benchmark                              | fast all-page local command                             | PR gate covers every indexable page         | Enforcement complete            |
| 9   | Fix README (G6): single-ci.yml workflow description, corrected check table, complete site map; point AGENTS.md at this document                                             | Docs match reality                                      | Badges/links correct                        | —                               |
| 10  | **Biome migration**: replace Prettier + ESLint with Biome for formatting and general lint; keep ESLint only for `@next/next/*` (`lint:next`); add dependency-cruiser (`check:architecture`); wire both into `pre-push.sh`, `check-all.sh`, and `ci.yml` | `npm run format`/`lint` run Biome; `lint:next` runs ESLint; `check:architecture` runs depcruise | static-analysis + windows run lint:next + check:architecture | —                               |

---

## 8. Gated feedback-loop workflow

This is the binding execution order for normal AI-assisted changes. It is a
**nested feedback loop**: fast deterministic checks form the inner loop; browser,
security, performance, and independent review form progressively wider gates.
The goal is to find cheap failures early, keep repair context small, and reserve
expensive validation for code that is already structurally sound.

### 8.1 Gate order

| Gate | Question answered | Required checks | Failure behavior |
| ---- | ----------------- | --------------- | ---------------- |
| **0 — Scope / preflight** | What is changing, and can we reuse what exists? | inspect relevant code/tests/scripts; `git diff`; search for existing helpers/deps | revise plan before coding; do not add duplicate infrastructure |
| **1 — Fast static gate** | Is the change mechanically clean? | junk scan, Biome format check, Biome lint, Next.js lint (`lint:next`), `tsc --noEmit`, knip, dependency-cruiser | fix locally; rerun Gate 1 from the beginning |
| **2 — Build + deterministic tests** | Does it compile/build and preserve deterministic behavior? | both builds + `node --test` / `npm test` + asset check | diagnose; repair; rerun Gate 1, then Gate 2 |
| **3 — Browser functional gate** | Does the built site actually work page-by-page? | `check:pages`, Playwright browser checks, route/link/CTA/console/request assertions | repair; rerun Gate 1 plus the failed browser check; rerun full Gate 3 before exit |
| **4 — Quality / accessibility gate** | Is user-facing quality intact? | `check:a11y`, applicable Lighthouse accessibility/best-practices/SEO categories | repair the cause; no broad allowlists; rerun Gate 1 + failed check |
| **5 — Security gate** | Did the change introduce vulnerable code, dependencies, or secrets? | `npm audit --audit-level=high`; GitHub dependency review; CodeQL; GitHub secret scanning where enabled | treat high/critical or confirmed code-security findings as blocking; repair then rerun affected earlier gates |
| **6 — Performance gate** | Did the change make delivery or runtime materially worse? | bundle budget + Lighthouse performance; scheduled slow-network + memory/leak checks | profile first; repair; rerun Gate 1 + affected functional check + performance check |
| **7 — Independent AI review** | Did the implementer miss architectural, safety, duplication, or test-integrity problems? | adversarial review of diff + test changes + gate results | findings return to implementer; repaired changes re-enter at Gate 1 |
| **8 — Clean final validation** | Is the final candidate green as a whole? | `npm run check:all` plus required GitHub-only gates | any failure reopens the loop; merge/deploy only from a clean final pass |

`npm run check` remains the canonical **inner-loop command** and should contain
Gates 1–2 as currently defined. `npm run check:all` remains the canonical **outer
validation command** and must exercise every locally runnable required gate.
GitHub Actions supplies platform-only security and repository-policy checks.

### 8.2 Repair-loop rules

1. **Diagnose before editing.** Capture the failing command, relevant error, and
   likely ownership. Do not shotgun-edit multiple unrelated systems.
2. **Make the smallest coherent fix.** Prefer correcting the defect over adding
   exceptions or new infrastructure.
3. **Rerun Gate 1 after every code/config repair.** This catches syntax, type,
   lint, dead-code, architecture, formatting, and accidental-junk regressions
   immediately.
4. **Then rerun the failed gate.** If the repair can affect browser behavior,
   security, or performance, rerun those directly affected gates as well.
5. **Do not rerun every expensive check after every keystroke.** The full suite is
   mandatory at the final boundary, not inside each micro-iteration.
6. **Three-strike stop rule.** Three unsuccessful attempts against the same
   failure trigger a handoff with evidence. The next reviewer must decide whether
   the diagnosis, architecture, test, or documented requirement is wrong.
7. **Tests are not obstacles.** Changing a test is allowed only when behavior or
   the documented contract intentionally changed. The AI must explain why the old
   assertion became invalid.
8. **No silent debt creation.** Temporary skips, TODOs, threshold reductions,
   dependency additions, and new scripts must be explicitly justified and either
   removed before final validation or recorded as deliberate debt with an owner
   and revisit condition.

### 8.3 Token- and time-efficiency policy

The pipeline is ordered to avoid wasting AI context and CI time. Static analysis
and deterministic tests run before browser/performance work. Knip and the junk
scan reduce repository noise; dependency-cruiser turns architecture rules into
deterministic checks; shared test libraries reduce duplicated scripts; route
discovery prevents hand-maintained lists from becoming additional context.

AI agents should consume **failure-focused evidence**, not entire logs when a
small excerpt is sufficient. On repair, provide the failing gate, error, relevant
diff, and nearby code first. Escalate context only when diagnosis requires it.
Do not ask a second AI to rediscover the entire repository when the previous stage
has produced a trustworthy, current artifact.

### 8.4 What "done" means

A change is not done because it builds, because an AI says it looks correct, or
because one test passed. It is done when:

- the fast gate passes (junk, Biome format/lint, Next.js lint, types, knip,
  dependency-cruiser);
- deterministic build/tests pass;
- applicable browser, accessibility, security, and performance gates pass;
- independent review findings are resolved;
- `npm run check:all` passes from the final candidate; and
- required GitHub merge-blocking checks are green.

### 8.5 AI code-hygiene rules

These are binding on every AI-assisted change, in addition to the absolute rules
in the preamble:

1. **Search before creating.** Grep/glob for an existing helper, component,
   script, or dependency before writing a new one. Do not add a second
   implementation of something that already exists.
2. **Prefer modifying existing abstractions** over introducing `v2`, `new`,
   `fixed`, or `-2` variants. A rename or a small extension is cheaper than a
   parallel copy that must be maintained forever.
3. **Remove debug, temp, and obsolete code** in the same change that makes it
   obsolete. Do not leave `console.log`, scratch files, dead branches, or
   commented-out code behind.
4. **No new dependency when the platform already provides one.** Check the
   existing `dependencies`/`devDependencies` and the runtime (Node, Next.js,
   Vite, Cloudflare) before adding a package.
5. **Avoid `any`, non-null assertions, suppressions, and blanket allowlists**
   without a documented reason. Each escape hatch must name the rule, the
   reason, and a revisit condition.
6. **Do not weaken tests, rules, or budgets to pass.** A failing gate is fixed by
   correcting the code or deliberately amending this document with a recorded
   reason — never by lowering a threshold, disabling a rule, or deleting a test.
7. **Keep files focused.** Do not grow a file past its role; split when a file
   accumulates unrelated responsibilities.
8. **Completion requires all gates plus a final clean validation.** A change is
   not done until the fast gate, deterministic tests, applicable browser/a11y/
   security/performance gates, and `npm run check:all` all pass from the final
   candidate.

---

## 9. Three-tier AI orchestration and handoff protocol

The three-AI method is a **separation-of-duties system**, not three agents doing
the same work. Each tier receives the smallest context needed for its role and
produces an explicit artifact for the next tier. Model names below reflect the
current program; if models change, preserve the roles.

### 9.1 Role ownership

| Tier / role | Current model | Primary job | Must not do | Output |
| ----------- | ------------- | ----------- | ----------- | ------ |
| **Tier A — Audit / final validator** | DeepSeek V4 Flash | establish facts from the repository; run final validation; report exact PASS/FAIL evidence | redesign architecture during final validation or waive failures | audit findings or final validation report |
| **Tier B — Designer / planner / implementer** | GLM 5.2 or designated implementer | design the smallest coherent change, implement it, and operate Gates 0–6 repair loops (deterministic, browser, security, and performance gates, including dependency-cruiser) | self-approve architectural exceptions or weaken gates to finish | implementation diff + commands/results + unresolved issues |
| **Tier C — Adversarial architecture reviewer** | Kimi K3 | challenge duplication, unnecessary dependencies, escape hatches, security assumptions, test integrity, performance policy, and architectural drift — including architecture-rule exceptions, test weakening, threshold lowering, broad ignores, and overengineering | rewrite the project merely to express preference; approve without evidence | prioritized findings with blocking/non-blocking classification |

**dependency-cruiser reduces but does not replace Tier C.** The deterministic
architecture gate (`check:architecture`) catches the three configured rule
classes automatically, but it cannot judge design quality, duplication, or
whether an exception is justified. Tier C remains the authority for challenging
architecture-rule exceptions, test weakening, threshold lowering, broad ignores,
and overengineering.

### 9.2 Stage sequence

| Stage | Owner | Entry condition | Exit condition |
| ----- | ----- | --------------- | -------------- |
| **1 — Audit** | Tier A | new program or material tree change | repository facts and gaps are recorded |
| **2 — Design** | Tier B | audit is current | architecture decisions and acceptance criteria are explicit |
| **3 — Architecture challenge** | Tier C | design exists before expensive implementation, or design materially changes | blocking design findings resolved or deliberately documented |
| **4 — Implement + inner loops** | Tier B | approved design | Gates 0–6 pass locally as applicable |
| **5 — Adversarial diff review** | Tier C | implementation candidate exists | blocking findings resolved; any repair returns to Gate 1 |
| **6 — Final validation** | Tier A | implementation + adversarial review complete | clean Gate 8 pass with per-page evidence where required |
| **7 — GitHub merge gate** | GitHub Actions / repository rules | final candidate pushed/PR opened | every required merge-blocking check green |

This supersedes a pure waterfall. Stages have owners, but failures intentionally
loop backward to the smallest appropriate repair point. A Stage-5 finding, for
example, goes back to the implementer and Gate 1; it does **not** continue to
final validation while knowingly broken.

### 9.3 Handoff packet

Every AI-to-AI handoff must contain, at minimum:

- current stage and objective;
- relevant architecture decisions / acceptance criteria;
- changed files or diff summary;
- commands actually run and their results;
- current failing gate, if any;
- exceptions/debt introduced, if any; and
- the exact question the receiving AI is expected to answer.

Do not hand off a vague instruction such as "review everything." Tier C should be
asked to attack specific risk classes, and Tier A should be asked to validate the
recorded contract by running the commands.

### 9.4 Current program status

The original audit/design work in §§1–7 remains the starting record. Before
implementation begins, treat this replacement workflow as the controlling
orchestration contract. If the working tree has materially changed since the
2026-09-02 audit, Tier A must refresh only the facts invalidated by that change;
it does not need to rediscover stable decisions from scratch.

### 9.5 Stage-status response rule (binding on every AI)

When the user asks for a status update, every AI must answer in chat, in this
order:

1. **The stage we are at.**
2. **Whether that stage is ready** (done / in progress / blocked, and on what).
3. **The next stage and which AI role/model it needs.**

Never assume which AI is currently running. If model identity matters for a
handoff or stage gate, ask the user rather than inferring it.

---

## 10. Security, performance, and best-practice ownership

These concerns intentionally overlap tools. No single package is declared the
"quality tool" for everything.

| Concern | Primary controls | What they prove / catch | Important limit |
| ------- | ---------------- | ---------------------- | --------------- |
| **Syntax / type correctness** | TypeScript `tsc --noEmit`, build | invalid types, compile/build failures | does not prove runtime behavior |
| **Formatting / code hygiene** | Biome | consistent formatting, configured code-quality rules, unused/local issues | not whole-repo reachability |
| **Next.js framework lint** | ESLint (`@next/eslint-plugin-next`) | Next.js-specific rules Biome cannot express | narrow exception; does not replace Biome for general lint |
| **Architecture rules** | dependency-cruiser | circular deps, `src`→`dev` imports, worker→component imports | only the rules explicitly configured; not a substitute for design review |
| **Dead code / dependency hygiene** | Knip + junk scan | unused files/exports/dependencies and repository junk | findings require configuration awareness; do not blindly delete dynamic entry points |
| **Functional behavior** | node tests + Playwright page/browser checks | logic, routes, links, CTAs, browser errors, requests, rendered behavior | only proves asserted behavior; critical flows need explicit assertions |
| **Accessibility** | axe-core + Lighthouse accessibility | WCAG-oriented automated violations and Lighthouse accessibility checks | automated a11y cannot prove full human usability |
| **Application security** | CodeQL | supported static vulnerability/data-flow patterns | not a penetration test and not dependency scanning |
| **Dependency security** | `npm audit`, GitHub dependency review / Dependabot alerts where enabled | known vulnerable dependency versions and risky dependency changes | cannot prove application code is secure |
| **Secret exposure** | GitHub secret scanning / push protection where available | recognized credentials committed or pushed | coverage depends on enabled GitHub features/patterns |
| **Performance / payload** | bundle budget + Lighthouse | asset growth plus advisory lab-performance signals | lab measurements have variance; use the serial three-run median for stable comparisons |
| **Runtime resilience** | slow-network + memory/leak checks | degraded-network loading and repeated-navigation growth | scheduled checks may detect issues after PR-time gates |
| **Architecture / best practices** | dependency-cruiser + documented ADs + Tier C adversarial review | consistency, duplication, escape hatches, needless dependencies, design drift | AI review is judgment, so deterministic gates remain authoritative |

### 10.1 Biome decision (migrated)

**Biome now owns formatting and general lint.** The migration from Prettier +
ESLint is complete: `npm run format`/`format:check` and `npm run lint` run Biome
(`biome.json`), and Prettier has been removed. Biome's `a11y` group is disabled
because accessibility is owned by the dedicated axe-core `check:a11y` gate, not
by a linter.

**ESLint is kept as a narrow, documented exception** running only `@next/next/*`
rules via `@next/eslint-plugin-next` (`npm run lint:next`), because Biome has no
Next.js framework rules. `eslint-config-next` was removed in favor of the plugin
pinned to the Next.js version.

**dependency-cruiser was added** (`npm run check:architecture`) to enforce
architecture rules that neither Biome nor ESLint can express: no circular
dependencies, no `src`→`dev` imports, and no worker→component imports.

Accessibility is owned by axe-core (`check:a11y`), not by any linter.

### 10.2 Functional-flow coverage

`check:pages` already provides broad route smoke coverage, but "the page loaded"
is not equivalent to "the product works." For business-critical interactions,
Playwright tests should model explicit user flows: click the CTA, open/close
interactive controls, submit forms with safe test data where feasible, follow
important navigation, and assert the expected resulting state.

Do not create a test for every incidental implementation detail. Add or strengthen
a flow when failure would materially affect a user, revenue/conversion path,
contact path, navigation, or a previously regressed behavior.

---

## 11. Risks and revisit triggers

| Risk                                             | Trigger                                     | Action                                                                                                |
| ------------------------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Per-PR browser-quality job too slow              | Job > ~25 min                              | Reduce fast-mode concurrency only if contention causes failures; keep deterministic categories per-PR |
| Arcade pages carry existing a11y violations      | Stage-6 baseline shows violations           | Fix what's small; debt-list the rest here with owner + date. Never silently allowlist                 |
| Performance goal 80 is missed on indexable pages | Stable median remains below 80              | Profile LCP/render blocking; keep the advisory 60 reference explicit until the optimization lands     |
| Windows-local Lighthouse                         | Playwright Chromium path differs            | Already handled: scripts launch Playwright's Chromium, no platform Chrome discovery                   |
| New page class appears (e.g. paginated archives) | Classifier returns an unknown shape         | Consistency test (step 7) fails CI; extend `routes.mjs` and this document together                    |
| dependency-cruiser false positives               | A new rule flags legitimate code            | Add a narrow, documented `from`/`to` exception pair; never a blanket `circular: false`                 |
| Biome rule churn on a new code pattern          | A Biome rule flags a legitimate idiom       | Document the exception in `biome.json` with a reason; do not disable a whole group to pass CI          |
