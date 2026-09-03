## What

A short summary of the change and why it is needed.

## Why

The problem this solves or the value it adds. Link any related issue.

## How

A brief note on the approach, especially anything non-obvious.

## Checks

Before opening, confirm the following pass locally:

- [ ] `npm run check` (format, lint, typecheck, dead code, tests, assets)
- [ ] `npm run check:bloat` (advisory — no new oversized files)
- [ ] `npm run build:static` then `npm run check:bundle`
- [ ] `npm run check:a11y` (zero WCAG 2.1 AA violations)

## Surface-area additions

List and justify any new file, dependency, abstraction, or maintained script
introduced by this change. Prefer reusing or deleting existing code over adding
parallel implementations.

## Cleanup performed

Mention any obsolete files, code, dependencies, or code paths removed as part
of this change.

## Verification

- [ ] Formatting, lint, types, and Knip pass
- [ ] Tests pass
- [ ] Final `git diff` reviewed; no temporary/debug artifacts remain

## Screenshots

Add before/after screenshots for any visual change.
