# AGENTS.md

Next.js App Router site for Ocean Heights Auto & Tire, built on **vinext** (Vite + Cloudflare Workers) with a static-export path for GitHub Pages. Read `README.md` for the full architecture, site map, and quality bars; this file only records what an agent is likely to get wrong.

## Commands

- `npm run check` — the real pre-push gate (format → lint → typecheck → tests → real-browser asset check), ordered cheapest-first. Run this before pushing, not just `lint`/`test`.
- `npm run check:fix` — same, but lets Prettier write.
- `npm test` — builds BOTH the Cloudflare and static artifacts, then runs route/SEO/hours/static-export tests. Slow; run it last.
- `npm run typecheck` — **advisory only**. `tsc` has pre-existing errors in `worker/` and untyped deps; it reports but does not fail. Read it, don't ignore it.
- `npm run check:deadcode` — `knip`; unused files/exports/deps fail CI.
- `npm run dev` — Vite dev server at `http://localhost:5173` (not 3000).

## Environment / toolchain gotchas

- Requires **Node 24.x**. The build/test/check scripts are **bash** (`dev/scripts/*.sh`) and need `flock`, `curl`, GNU `timeout` — on Windows run them under WSL/Git Bash.
- Every tool in `pre-push.sh` is invoked as `./node_modules/.bin/<tool>`, never `npx` (npx silently downloads a different version and reports false success).
- There is **no `wrangler.jsonc`**; Cloudflare bindings are simulated in `vite.config.ts`. `.openai/hosting.json` is optional and only wires D1/R2 on hosted previews.
- `.vinext/fonts/` is gitignored on purpose — the cached CSS bakes absolute filesystem paths and 404s on other machines. It regenerates on first build/dev.
- `@/*` maps to `./src/*` (not repo root).

## Single source of truth

- Shop details (phone, email, hours, address, structured data) live in **`src/lib/shop/shop.mjs`** — plain ESM, not TS, because the static-build scripts run under plain Node and can't import `.ts`. `src/lib/shop/shop.ts` re-exports it with types for components. Edit `.mjs`, never duplicate the data.
- Keep the phone number `(609) 241-1546` consistent everywhere.
- `lib/` files use explicit `.ts` extensions in relative imports (`allowImportingTsExtensions`) so they run unbuilt under `node --test` and through the bundler.
- `src/lib/chat/answers.ts` is Tread's brain — the fully local Q&A matcher (no API, no fetch) behind the contact-page tire-pal widget. It builds its index from `services.ts` + `shop.mjs` + `shop-hours.mjs`; never duplicate that data into the chat copy. The widget (`src/components/contact/tire-pal.tsx` + `tire-pal-scene.tsx`) lazy-loads Three.js only after the panel first opens — keep it that way.
- `/adgent` is a noindex dev playground (`src/components/adgent/adgent-studio.tsx`) for previewing the Tread character variants and brain; `src/components/contact/tread-character.ts` is the shared parametric character builder both it and the widget use.

## Build / deploy quirks

- `npm run build` produces the deployable Cloudflare artifact; the remote Sites builder runs it against the pushed commit — don't repeat install/build as a routine pre-push step.
- `npm run build:static` (`STATIC_EXPORT=1`) emits `dist/client`. The static site **must be served from a domain root** — vinext ignores `basePath` and doesn't implement `assetPrefix`, so subpath hosting breaks. `dev/scripts/build-static.mjs` patches the gaps (image URLs, vCard, sitemap, legacy redirects).
- `dev/scripts/check-assets.mjs` (real browser) exists because `next/image` recomputes URLs on the client and 404s in a static export even when markup is correct — only a browser catches it.

## Style

- Design tokens live in `:root` in `src/app/styles/base.css`; styles are split per-section under `src/app/styles/` and re-imported from `src/app/globals.css`.
- Prettier: `printWidth: 100`, `proseWrap: preserve`. Formatting is enforced by the build.
- Every animation must respect `prefers-reduced-motion`.
