#!/usr/bin/env bash
#
# Everything that has to be true before a push, in one command.
#
#   npm run check
#
# This exists because the same handful of things kept getting missed and only
# surfaced later: a file that was never Prettier-formatted (which now fails the
# build outright), an image that 404s only after hydration, a test that was not
# re-run after a "cosmetic" change. Each step below is here because it caught a
# real bug in this repo, not because it is conventional.
#
# Ordered cheapest-first so an obvious mistake fails in seconds rather than
# after a two-minute build. Pass --fix to let the formatter write instead of
# only reporting.
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

FIX=0
[[ "${1:-}" == "--fix" ]] && FIX=1

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

# 1. Formatting. The build enforces this, so an unformatted file breaks every
#    build until someone notices — worth catching first and cheapest.
if [[ $FIX -eq 1 ]]; then
  step "prettier (writing)" npx prettier --write . --log-level warn
else
  step "prettier --check" npx prettier --check . --log-level warn
fi

# 2. Lint and types.
step "eslint" npm run lint
# tsc has pre-existing errors in worker/ and a few untyped deps, so this
# reports without failing the run; read it, do not ignore it.
printf '\n\033[1m▶ typecheck (advisory)\033[0m\n'
npx tsc --noEmit 2>&1 | head -20 || true

# 3. Tests, which include the static export checks.
step "tests" npm test

# 4. Assets. The one that keeps biting: markup can be perfectly correct and the
#    image still 404s, because next/image recomputes its URL on the client and
#    points at an optimiser endpoint that does not exist in a static export.
#    Only a real browser catches it.
step "asset check (real browser)" node scripts/check-assets.mjs

printf '\n────────────────────────────────\n'
if [[ ${#FAILED[@]} -eq 0 ]]; then
  printf '\033[32mAll checks passed — safe to push.\033[0m\n'
  exit 0
fi
printf '\033[31mFailed: %s\033[0m\n' "${FAILED[*]}"
printf 'Run \033[1mnpm run check:fix\033[0m to auto-fix formatting.\n'
exit 1
