// Maps every rule in globals.css to the pages that actually use it.
//
// The sheet is 10k+ lines served whole on every page, and Lighthouse reckons
// about half of it goes unused on any given load. Splitting it by hand would
// be guesswork, so this answers the question with data: it matches each
// selector against the real exported DOM, in a real browser, and reports which
// routes each rule serves.
//
// It reports. It does not edit — the buckets below are an argument for a
// split, not the split itself, and the runtime-class caveat is the reason a
// human still has to read it.
//
//   node scripts/css-usage-report.mjs [--json <path>]
//
// Requires `npm run build:static` to have run: the exported HTML is the
// ground truth for what markup each route actually ships.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("..", import.meta.url));
const OUT_DIR = join(root, "dist/client");
const SHEET = join(root, "app/globals.css");

// Rules that exist to be referenced rather than matched. A selector-based
// audit cannot see the reference, so these are never candidates for removal.
const ALWAYS_GLOBAL = /^(:root|html|body|\*|::selection|::backdrop)/;

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

// Classes toggled by JavaScript never appear in exported HTML, so a purely
// static audit would call their rules dead and quietly break the site when
// they were removed. Scrape every class-ish string literal out of the sources
// and treat those as live wherever they turn up.
function runtimeClasses() {
  const sources = [];
  for (const dir of ["components", "app", "lib"]) {
    sources.push(...walk(join(root, dir)).filter((f) => /\.(tsx|ts|mjs|js)$/.test(f)));
  }
  // Every identifier-shaped token in the sources, not just the ones sitting
  // in a `className=` string. Class names reach the attribute through
  // ternaries, template holes, variables and helpers — this repo really
  // contains `className={paper ? "paper-game" : "match-game"}` and
  // `` className={`match-grid${won ? " match-grid-won" : ""}`} ``, and
  // pattern-matching the attribute missed both, reporting a live game's
  // styles as dead.
  //
  // So the test is deliberately blunt: is this class name written down
  // anywhere in the source at all? It over-collects, and that is the point —
  // the set is only ever used to *keep* rules, so a false positive costs a
  // few bytes while a false negative deletes something the site needs.
  const found = new Set();
  for (const file of sources) {
    for (const token of readFileSync(file, "utf8").split(/[^\w-]+/)) {
      if (token) found.add(token);
    }
  }
  return found;
}

// Reduce a selector to something the static DOM can be asked about: drop the
// state pseudo-classes and pseudo-elements that no exported page can satisfy,
// so `.a:hover .b::after` is judged on whether `.a .b` exists at all.
const STATE = new Set([
  "hover",
  "focus",
  "focus-visible",
  "focus-within",
  "active",
  "visited",
  "target",
  "checked",
  "disabled",
  "enabled",
  "placeholder-shown",
  "autofill",
  "open",
  "defined",
  "user-invalid",
  "invalid",
  "valid",
]);

function staticForm(selector) {
  return (
    selector
      .replace(/::[\w-]+(\([^)]*\))?/g, "")
      .replace(/:([\w-]+)(\([^)]*\))?/g, (match, name) => (STATE.has(name) ? "" : match))
      // A selector that was nothing but state (`:hover`) leaves a bare
      // combinator behind; tidy so querySelector does not throw.
      .replace(/\s+/g, " ")
      .replace(/^\s*[>+~]\s*|\s*[>+~]\s*$/g, "")
      .trim()
  );
}

function classesIn(selector) {
  return [...selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]);
}

const args = process.argv.slice(2);
const jsonPath = args.includes("--json") ? args[args.indexOf("--json") + 1] : null;

const pages = walk(OUT_DIR)
  .filter((f) => f.endsWith(".html"))
  // The legacy-redirect stubs are a meta refresh and nothing else. They carry
  // no styled markup, and left in they navigate out from under the audit.
  .filter((f) => !/<meta\s+http-equiv="refresh"/i.test(readFileSync(f, "utf8")));
if (pages.length === 0) {
  console.error("No exported pages found. Run `npm run build:static` first.");
  process.exit(1);
}

// Collect the rules, keeping each one's at-rule context so a split can carry
// the surrounding @media with it.
const sheet = readFileSync(SHEET, "utf8");
const rules = [];
postcss.parse(sheet).walkRules((rule) => {
  const parents = [];
  for (let node = rule.parent; node && node.type !== "root"; node = node.parent) {
    if (node.type === "atrule") parents.unshift(`@${node.name} ${node.params}`);
  }
  // Keyframe steps are not selectors.
  if (parents.some((p) => p.startsWith("@keyframes"))) return;
  rules.push({
    selector: rule.selector.replace(/\s+/g, " ").trim(),
    context: parents.join(" / "),
    line: rule.source?.start?.line ?? 0,
    bytes: rule.toString().length,
  });
});

const selectors = rules.map((r) => r.selector);
// Each comma-separated part is matched on its own: one live part keeps the
// rule, but knowing which parts are dead is what makes a split possible.
const parts = selectors.map((s) =>
  s
    .split(",")
    .map((p) => staticForm(p))
    .filter(Boolean),
);

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
});
const page = await browser.newPage();
const usage = rules.map(() => new Set());

for (const file of pages) {
  const route =
    "/" +
    relative(OUT_DIR, file)
      .split(sep)
      .join("/")
      .replace(/(?:^|\/)index\.html$/, "");
  await page.goto("file://" + file, { waitUntil: "domcontentloaded" });
  const matched = await page.evaluate(
    (list) =>
      list.map((group) => {
        for (const sel of group) {
          try {
            if (document.querySelector(sel)) return 1;
          } catch {
            return -1; // Unparseable here; reported separately, never as dead.
          }
        }
        return 0;
      }),
    parts,
  );
  matched.forEach((hit, i) => {
    if (hit === 1) usage[i].add(route);
    if (hit === -1) usage[i].add("?unparseable");
  });
}
await browser.close();

const live = runtimeClasses();
const report = rules.map((rule, i) => {
  const routes = [...usage[i]].filter((r) => r !== "?unparseable").sort();
  const unparseable = usage[i].has("?unparseable");
  const runtimeOnly = routes.length === 0 && classesIn(rule.selector).some((c) => live.has(c));
  return {
    ...rule,
    routes,
    pageCount: routes.length,
    unparseable,
    runtimeOnly,
    alwaysGlobal: ALWAYS_GLOBAL.test(rule.selector),
  };
});

const total = report.reduce((n, r) => n + r.bytes, 0);
const bucket = (predicate) => {
  const hit = report.filter(predicate);
  return { count: hit.length, bytes: hit.reduce((n, r) => n + r.bytes, 0) };
};

const dead = (r) => r.pageCount === 0 && !r.unparseable && !r.runtimeOnly && !r.alwaysGlobal;
const single = (r) => r.pageCount === 1;
const shared = (r) => r.pageCount > 1;

const pct = (bytes) => `${((bytes / total) * 100).toFixed(1)}%`;
const line = (label, b) =>
  `  ${label.padEnd(34)} ${String(b.count).padStart(5)} rules  ${String(b.bytes).padStart(7)} B  ${pct(b.bytes)}`;

console.log(`\nglobals.css — ${rules.length} rules, ${total} B, across ${pages.length} pages\n`);
console.log(line("matched on no page (dead)", bucket(dead)));
console.log(line("matched on exactly one page", bucket(single)));
console.log(line("matched on many pages", bucket(shared)));
console.log(
  line(
    "runtime-only classes (keep)",
    bucket((r) => r.runtimeOnly),
  ),
);
console.log(
  line(
    "always global (keep)",
    bucket((r) => r.alwaysGlobal),
  ),
);
console.log(
  line(
    "selector not parseable (check)",
    bucket((r) => r.unparseable),
  ),
);

const perRoute = new Map();
for (const rule of report.filter(single)) {
  const route = rule.routes[0];
  const entry = perRoute.get(route) ?? { count: 0, bytes: 0 };
  entry.count += 1;
  entry.bytes += rule.bytes;
  perRoute.set(route, entry);
}
console.log("\nSplit candidates — rules used by exactly one route:\n");
for (const [route, entry] of [...perRoute].sort((a, b) => b[1].bytes - a[1].bytes).slice(0, 15)) {
  console.log(line(route, entry));
}

const deadRules = report.filter(dead);
console.log(`\nFirst 25 of ${deadRules.length} rules that matched nothing:\n`);
for (const rule of deadRules.slice(0, 25)) {
  const where = rule.context ? `  [${rule.context}]` : "";
  console.log(`  globals.css:${String(rule.line).padStart(5)}  ${rule.selector}${where}`);
}

if (jsonPath) {
  writeFileSync(jsonPath, JSON.stringify({ total, pages: pages.length, rules: report }, null, 2));
  console.log(`\nFull report written to ${jsonPath}`);
}
console.log(
  "\nRules matched on no page are candidates, not conclusions: anything a\n" +
    "component adds at runtime, or a state this export cannot reach, will\n" +
    "land here too. Read before cutting.\n",
);
