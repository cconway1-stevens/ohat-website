# AGENTS.md

Next.js App Router site for Ocean Heights Auto & Tire, built on **vinext** (Vite + Cloudflare Workers) with a static-export path for GitHub Pages. Read `README.md` for the full architecture, site map, and quality bars; this file only records what an agent is likely to get wrong.

## Commands

- `npm run check` — the real pre-push gate (junk scan → Biome format → Biome lint → Next.js lint → typecheck → dead code → architecture → tests → real-browser asset check), ordered cheapest-first. Run this before pushing, not just `lint`/`test`.
- `npm run check:fix` — same, but lets Biome write formatting fixes.
- `npm run report` — same full gate but pushes through failures and writes per-step timings to the gitignored `dev/reports/report.md` (`--fix`, `--no-build` flags supported).
- `npm test` — builds BOTH the Cloudflare and static artifacts, then runs route/SEO/hours/static-export tests. Slow; run it last.
- `npm run typecheck` — required locally and in CI; TypeScript errors block merging.
- `npm run check:deadcode` — `knip`; unused files/exports/deps fail CI.
- `npm run check:architecture` — `dependency-cruiser`; circular deps, `src`→`dev` imports, and worker→component imports fail CI.
- `npm run lint:next` — ESLint running only `@next/next/*` rules (Biome has no Next.js rules).
- `npm run dev` — Vite dev server at `http://localhost:5173` (not 3000).

`dev/docs/test-program.md` is the canonical testing document: the master test matrix, page-discovery rules, and which checks gate PRs vs run scheduled. Any change to a `check:*` script's coverage must update it.

## Environment / toolchain gotchas

- Requires **Node 24.x**. The build/test/check scripts are **bash** (`dev/scripts/*.sh`) and need `flock`, `curl`, GNU `timeout` — on Windows run them under WSL/Git Bash.
- Every tool in `pre-push.sh` is invoked as `./node_modules/.bin/<tool>` (biome, eslint, tsc, knip, depcruise), never `npx` (npx silently downloads a different version and reports false success).
- There is **no `wrangler.jsonc`**; Cloudflare bindings are simulated in `vite.config.ts`. `.openai/hosting.json` is optional and only wires D1/R2 on hosted previews.
- `.vinext/fonts/` is gitignored on purpose — the cached CSS bakes absolute filesystem paths and 404s on other machines. It regenerates on first build/dev.
- `@/*` maps to `./src/*` (not repo root).

## Single source of truth

- Shop details (phone, email, hours, address, structured data) live in **`src/lib/shop/shop.mjs`** — plain ESM, not TS, because the static-build scripts run under plain Node and can't import `.ts`. `src/lib/shop/shop.ts` re-exports it with types for components. Edit `.mjs`, never duplicate the data.
- Keep the phone number `(609) 241-1546` consistent everywhere.
- `lib/` files use explicit `.ts` extensions in relative imports (`allowImportingTsExtensions`) so they run unbuilt under `node --test` and through the bundler.
- `src/lib/chat/answers.ts` is Tread's brain — the fully local Q&A matcher (no API, no fetch) behind the contact-page tire-pal widget. It builds its index from `services.ts` + `shop.mjs` + `shop-hours.mjs`; never duplicate that data into the chat copy. All mascot copy (greeting, identity, fallback) is one uniform template auto-filled from a `ChatPersona` (`{name, kind, self}`); every sprite in `pixel-crew.ts` carries that metadata in its `persona` field, and the studio passes it via `MatcherConfig.persona`. Production defaults to `TREAD_PERSONA` — keep its copy byte-identical. The widget (`src/components/contact/tire-pal.tsx` + `tire-pal-scene.tsx`) lazy-loads Three.js only after the panel first opens — keep it that way.
- `/adgent` is a noindex dev playground (`src/components/adgent/adgent-studio.tsx`) for evaluating the pixel-crew mascot and the chat brain before it replaces the 3D Tread on the contact page. `src/components/adgent/pixel-crew.ts` is the shared canvas-2D character builder — five auto-part characters (Tread the tire, Wrenchy the wrench, Volt the car battery, Drip the oil can, Sparky the spark plug) on a 32×32 grid, each a pure `draw(ctx, frame, emote, look?)` with an ink outline and a customizable face (`PixelLook`: eyeSize + mouth). The same file also exports two bot families that share `drawBotBody` + `drawTerminalFace` (a glowing `>_` screen): `RETRO_CREW` — cloud-headed bots (Bit, Pico, Dot, Chip) from the palette-driven `makeRetroBot` factory — and `TIRE_BOTS` — the tire theme combined onto the bot body (Torque, Whitewall, Blaze, Slick) from `makeTireBot`. Keep both out of `PIXEL_CREW` (a test pins it at five). `PART_ICONS` is the faceless set (Rotor, Piston, Gear, Wheel, Bulb) — plain part icons with no eyes/mouth; emotes read through motion plus the corner badge, and a test pins that a `PixelLook` changes nothing. Character mode groups these into themed sets (`CHARACTER_SETS` in the studio: Auto Parts, Part Icons, Retro Bots, Tire Bots) with a set picker — add new themes there, not as new modes. A fifth theme, 3D Objects (`OBJECTS_3D` in the studio), renders faceless low-poly parts (Tire, Gear, Wrench, Piston, Rotor) from `part-objects-3d.ts` through `object-3d-canvas.tsx`, lazy-loaded via `next/dynamic` so Three.js stays out of the studio's initial chunk; its metadata lives in the studio so the builders are never imported eagerly. The 3D set is view-only — it stays out of `CHARACTER_SETS`/`findCharacter`, so the sidebar adgent, Motion mode and Test Drive remain pixel-only. The sidebar "YOUR ADGENT" picker chooses the mascot used across every mode (saved to `adgent-looks` in localStorage); Motion mode also has its own mini picker that writes the same selection. The studio has nine modes — Character, Motion, Test Drive (live chat + ▲/▼ rating), Brain, Engine, Results, Feedback (research notes with an element picker), Options, Source — and persists looks/settings/history/notes to localStorage. The 3D `tread-character.ts` builder is still used by the production contact-page widget only.

## Build / deploy quirks

- `npm run build` produces the deployable Cloudflare artifact; the remote Sites builder runs it against the pushed commit — don't repeat install/build as a routine pre-push step.
- `npm run build:static` (`STATIC_EXPORT=1`) emits `dist/client`. The static site **must be served from a domain root** — vinext ignores `basePath` and doesn't implement `assetPrefix`, so subpath hosting breaks. `dev/scripts/build-static.mjs` patches the gaps (image URLs, vCard, sitemap, legacy redirects).
- `dev/scripts/check-assets.mjs` (real browser) exists because `next/image` recomputes URLs on the client and 404s in a static export even when markup is correct — only a browser catches it.

## Style

- Design tokens live in `:root` in `src/app/styles/base.css`; styles are split per-section under `src/app/styles/` and re-imported from `src/app/globals.css`.
- Biome owns formatting and general lint (`biome.json`): `lineWidth: 100`, double quotes, semicolons, trailing commas. Formatting is enforced by the build.
- Every animation must respect `prefers-reduced-motion`.
