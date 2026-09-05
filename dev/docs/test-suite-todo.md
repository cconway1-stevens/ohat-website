# Test suite & CI — what changed, and what's left

Audit and rework, 2026-09-05. `test-program.md` remains canonical; this is the
change record and the open list.

## The problem that started it

Two runners disagreed about which tests counted:

| Runner | Files run |
| --- | --- |
| `npm test` (CI gate + pre-push) | **10** — a hardcoded list in `package.json` |
| `npm run report` | **16** — globbed the directory |

So `chat-legal` and the five `chat-training-*` files — 418 lines, 40 assertions
covering answers that ship to customers — **ran in no gate at all**. They passed
the whole time, and would have gone on "passing" if they had broken. That was a
direct breach of binding rule 3 in `test-program.md`: *never two implementations
of one check*.

## Done

- [x] **Adopted the 6 orphans as required.** They cover customer-facing chat
      answers and they pass; there was no reason they were excluded beyond the
      hand-maintained list never being updated.
- [x] **Tiered the suite by what each test needs**, with the directory as the
      wiring — no list anywhere to drift from:

      dev/tests/unit/     14 files — pure logic, no build      (~2s)
      dev/tests/server/    2 files — needs dist/server
      dev/tests/static/    2 files — needs dist/client

- [x] **Reordered `npm test`** to `test:unit → build → test:server →
      build:static → test:static`. Unit assertions now fail in ~2s instead of
      after two multi-minute builds (binding rule 5, previously not honoured by
      the gate).
- [x] **`--test-isolation=none` for the unit tier.** 352ms → 209ms internal.
      Verified honest: 154 tests, identical pass counts in both isolation modes.
- [x] **Retired the second runner.** `run-tests-report.mjs` now calls the same
      three tier scripts the gate uses, timed separately so the report still
      shows where run time goes.
- [x] **Drift guard** — `dev/tests/unit/test-tiers.test.mjs` fails if a test file
      sits outside a tier, if a tier directory has no npm script, or if a tier is
      empty. Verified it catches a stray file by planting one.
- [x] **CI: unit tests moved into the fast job.** `static-analysis` (renamed
      *Static analysis and unit tests*) already installed dependencies and ran no
      build — the tier costs ~2s there, versus waiting on `test-build`.
- [x] **CI: Windows job made meaningful.** It re-ran Biome, ESLint and `tsc`,
      which reach the same verdict on either OS. It now runs `npm test` — both
      builds and all three tiers — which is where real platform risk lives
      (shell scripts, path separators, the tests' own path resolution).
- [x] **Named every bare CI step**, so a failure reads as *Accessibility* rather
      than *Run npm run check:a11y*.
- [x] **README rebuilt** with generated blocks — `npm run readme` renders the
      hosting table, CI diagram + job list, tier table and script reference from
      `vercel.json`, `ci.yml`, the tier directories and `package.json`.
      `dev/tests/unit/readme.test.mjs` fails the unit tier if they go stale.
- [x] **Removed the duplicate CI badge.** Two badges pointed at the same
      `ci.yml` under different names ("CI" and "GitHub Pages build"), so the
      second was the first wearing a hat. Replaced with Node and Vercel badges.

## Open

- [ ] **Watch the first Windows run.** The job now executes both builds on
      `windows-latest` for the first time. `build-verified.sh` is bash — fine
      under Git Bash on the runner, but this path has never been exercised in
      CI. If it is flaky, split it: `npm run build:static && npm run test:unit`.
- [ ] **Consider a `test:watch`.** The unit tier is fast enough that
      `node --test --watch "dev/tests/unit/*.test.mjs"` would be a genuinely
      usable inner loop. Not added yet — no one has asked for it.
- [ ] **`check-assets.mjs` placement.** `test-program.md` row for Assets still
      carries a "? — see note" against its CI home. Unrelated to this rework,
      but it is the last unresolved cell in the matrix.
- [ ] **Refresh the PageSpeed snapshot.** The figure quoted in docs was measured
      2026-08-01, before the AVIF/responsive-image work — so it understates
      current performance and should be re-measured rather than cited.

## Deliberately not done

- **A test framework** (vitest/jest). `node --test` works, ships with the
  runtime, and every problem here was wiring rather than capability.
- **Touching assertions.** This was entirely about which tests run, in what
  order, and how fast — not about what they check.
