#!/usr/bin/env bash
#
# One command to test local changes, staged so you can see exactly where it
# is at any point:
#
#   1. Dependencies  - node_modules and the Playwright browser are installed
#   2. Tests/checks  - prettier, eslint, typecheck (advisory), unit tests,
#                       and a production build + static export as part of that
#   3. Build verify  - confirm the static export in dist/client is present
#   4. Dev server    - boot the app so you can see it in a browser
#
#   ./scripts/run.sh          run everything, then start dev server
#   ./scripts/run.sh --fix    auto-fix formatting first, then everything
#   ./scripts/run.sh --no-dev run stages 1-3 only, skip the dev server
#   ./scripts/run.sh --redo   wipe node_modules and every generated/cache dir first,
#                     then reinstall from scratch before everything else
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.." || exit 1

FIX=0
SKIP_DEV=0
REDO=0
for arg in "$@"; do
  case "$arg" in
    --fix) FIX=1 ;;
    --no-dev) SKIP_DEV=1 ;;
    --redo) REDO=1 ;;
  esac
done

section() {
  printf '\n\033[1;36m==== %s ====\033[0m\n' "$1"
}

# ---------------------------------------------------------------------------
section "1/4 Dependencies"

if [[ $REDO -eq 1 ]]; then
  echo "--redo: wiping node_modules and every generated/cache dir..."
  if ! rm -rf \
    node_modules \
    dist .next out coverage .vercel \
    .wrangler .sites-runtime .vinext \
    public/media/rs src/lib/image-manifest.json \
    tsconfig.tsbuildinfo next-env.d.ts; then
    printf '\033[31mCould not fully wipe generated state - some files are locked, likely by a running dev server or wrangler/miniflare process.\033[0m\n'
    printf '\033[31mStop that process (check for a lingering "npm run dev" or vite/wrangler) and re-run --redo.\033[0m\n'
    exit 1
  fi
  printf '\033[33mWiped. Reinstalling from scratch...\033[0m\n'
fi

if [[ ! -d node_modules ]]; then
  echo "node_modules missing - running npm install..."
  npm install || exit $?
fi

if ! find "${LOCALAPPDATA:-$HOME/.cache}/ms-playwright" -maxdepth 1 -iname 'chromium-*' 2>/dev/null | grep -q .; then
  echo "Playwright's Chromium browser missing - installing..."
  npx playwright install chromium || exit $?
fi

printf '\033[32mDependencies OK (node_modules + Playwright browser present).\033[0m\n'

# ---------------------------------------------------------------------------
section "2/4 Tests & checks"

if [[ $FIX -eq 1 ]]; then
  npm run check -- --fix
else
  npm run check
fi
STATUS=$?

if [[ $STATUS -ne 0 ]]; then
  echo
  printf '\033[31mSome checks failed - see above.\033[0m\n'
  printf '\033[33m(Known exception: '"'"'only the latin font subset is preloaded'"'"' fails on Windows due to an upstream vinext path bug - not your code, safe to ignore locally.)\033[0m\n'
  exit $STATUS
fi

# ---------------------------------------------------------------------------
section "3/4 Build verify"

if [[ -f dist/client/index.html ]]; then
  PAGE_COUNT=$(find dist/client -name '*.html' | wc -l | tr -d ' ')
  printf '\033[32mdist/client present - %s HTML pages exported by the checks above.\033[0m\n' "$PAGE_COUNT"
else
  printf '\033[31mdist/client missing after checks passed - something is wrong, investigate.\033[0m\n'
  exit 1
fi

# ---------------------------------------------------------------------------
section "4/4 Dev server"

if [[ $SKIP_DEV -eq 1 ]]; then
  echo "Skipping dev server (--no-dev)."
  exit 0
fi

printf '\033[32mStarting dev server...\033[0m\n'
npm run dev
