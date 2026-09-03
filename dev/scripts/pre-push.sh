#!/usr/bin/env bash
#
# Everything that has to be true before a push, in one command.
#
#   npm run check
#
# This exists because the same handful of things kept getting missed and only
# surfaced later: a file that was never formatted (which now fails the build
# outright), an image that 404s only after hydration, a test that was not
# re-run after a "cosmetic" change. Each step below is here because it caught a
# real bug in this repo, not because it is conventional.
#
# Ordered cheapest-first so an obvious mistake fails in seconds rather than
# after a two-minute build. Pass --fix to let the formatter write instead of
# only reporting.
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

FIX=0
[[ "${1:-}" == "--fix" ]] && FIX=1

# Every tool below is the pinned copy from node_modules, never `npx`. When a
# package is missing, npx quietly downloads a *different* version and reports
# success — which is exactly how a file that passed locally failed the build
# on Vercel, where the pinned version is the one installed.
for tool in biome eslint tsc knip depcruise; do
  if [[ ! -x "./node_modules/.bin/$tool" ]]; then
    echo "node_modules is incomplete — run 'npm install' first." >&2
    exit 1
  fi
done

FAILED=()
step() {
  local name="$1"; shift
  printf '\n\033[1m▶ %s\033[0m\n' "$name"
  if "$@"; then
    printf '\033[32m  ✓ %s\033[0m\n' "$name"
  else
    printf '\033[31m  ✗ %s\033[0m\n' "$name"
    FAILED+=("$name")
  fi
}

# 0. Repository junk. Cheapest of all: a quick scan for accidentally committed
#    temp/debug artifacts (`.bak`, `.orig`, scratch dumps). Fails in seconds.
step "repo junk" node dev/scripts/check-junk.mjs

# 1. Formatting. The build enforces this, so an unformatted file breaks every
#    build until someone notices — worth catching first and cheapest.
if [[ $FIX -eq 1 ]]; then
  step "biome format (writing)" ./node_modules/.bin/biome format --write .
else
  step "biome format --check" ./node_modules/.bin/biome format .
fi

# 2. Lint and types.
step "biome lint" ./node_modules/.bin/biome lint .
step "next lint (eslint)" ./node_modules/.bin/eslint .
step "typecheck" ./node_modules/.bin/tsc --noEmit

# 3. Dead code. Knip flags unused files, exports, types, and dependencies.
step "dead code" ./node_modules/.bin/knip

# 4. Architecture. dependency-cruiser enforces the rules Biome and ESLint
#    cannot express: no circular deps, no src→dev imports, no worker→component
#    imports.
step "architecture (dependency-cruiser)" ./node_modules/.bin/depcruise src dev --config .dependency-cruiser.cjs

# 5. Tests, which include the static export checks.
step "tests" npm test

# 6. Assets. The one that keeps biting: markup can be perfectly correct and the
#    image still 404s, because next/image recomputes its URL on the client and
#    points at an optimiser endpoint that does not exist in a static export.
#    Only a real browser catches it.
step "asset check (real browser)" node dev/scripts/check-assets.mjs

printf '\n────────────────────────────────\n'
if [[ ${#FAILED[@]} -eq 0 ]]; then
  printf '\033[32mAll checks passed — safe to push.\033[0m\n'
  exit 0
fi
printf '\033[31mFailed: %s\033[0m\n' "${FAILED[*]}"
printf 'Run \033[1mnpm run check:fix\033[0m to auto-fix formatting.\n'
exit 1
