#!/usr/bin/env bash
#
# The full repository check, in the order CI runs it. Cheapest and most
# decisive first, so a trivial mistake fails in seconds instead of after a
# multi-minute build.
#
#   npm run check:all
#
# Stages:
#   1. Static (no build): format, lint, next lint, typecheck, dead code,
#      architecture, bloat.
#   2. Build + tests: both production builds and the route/SEO/hours tests.
#   3. Browser audits (need dist/client + Chromium): bundle, Lighthouse,
#      accessibility, slow-bandwidth, memory.
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

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

# 1. Static checks.
step "format" npm run format:check
step "lint" npm run lint
step "next lint" npm run lint:next
step "typecheck" npm run typecheck
step "dead code" npm run check:deadcode
step "architecture" npm run check:architecture
step "bloat (advisory)" npm run check:bloat

# 2. Build and tests.
step "tests (both builds)" npm test

# 3. Browser audits against the static export.
step "page smoke test" npm run check:pages
step "bundle budget" npm run check:bundle
step "lighthouse" npm run check:lighthouse
step "accessibility" npm run check:a11y
step "slow bandwidth" npm run check:slow-network
step "memory" npm run check:memory

printf '\n────────────────────────────────\n'
if [[ ${#FAILED[@]} -eq 0 ]]; then
  printf '\033[32mAll checks passed.\033[0m\n'
  exit 0
fi
printf '\033[31mFailed: %s\033[0m\n' "${FAILED[*]}"
exit 1
