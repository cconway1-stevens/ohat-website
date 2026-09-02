## What

A short summary of the change and why it is needed.

## Why

The problem this solves or the value it adds. Link any related issue.

## How

A brief note on the approach, especially anything non-obvious.

## Checks

Before opening, confirm the following pass locally:

- [ ] `npm run check` (format, lint, typecheck, tests)
- [ ] `npm run check:deadcode`
- [ ] `npm run check:bloat` (advisory — no new oversized files)
- [ ] `npm run build:static` then `npm run check:bundle`
- [ ] `npm run check:a11y` (zero WCAG 2.1 AA violations)

## Screenshots

Add before/after screenshots for any visual change.
