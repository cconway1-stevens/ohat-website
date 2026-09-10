#!/usr/bin/env node
/**
 * Keeps the accessibility statement honest.
 *
 * An accessibility statement is a public claim about how a site is built and
 * tested. The risk is not that it is written badly — it is that it stays on
 * the site unchanged after the practice it describes has been weakened or
 * removed. That turns a good-faith statement into a false one, which is worse
 * than having published nothing.
 *
 * So every factual claim on /accessibility is asserted here against the thing
 * that makes it true: the audit script, the CI workflow, the stylesheets, and
 * the shop config. Weaken the testing without correcting the page and this
 * check fails.
 *
 * Source-only — no build required. Run with `npm run check:a11y-statement`.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { shop } from "../../src/lib/shop/shop.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (...parts) => readFileSync(join(ROOT, ...parts), "utf8");

const statementDir = join(ROOT, "src/components/accessibility");
const statement = [
  read("src/app/accessibility/page.tsx"),
  ...readdirSync(statementDir).map((file) => readFileSync(join(statementDir, file), "utf8")),
].join("\n");

const a11yScript = read("dev/scripts/check-a11y.mjs");
const ci = read(".github/workflows/ci.yml");
const footer = read("src/components/layout/site-footer.tsx");
const sitemap = read("src/app/sitemap.ts");

const styles = readdirSync(join(ROOT, "src/app/styles"))
  .map((file) => readFileSync(join(ROOT, "src/app/styles", file), "utf8"))
  .join("\n");

const failures = [];
const claim = (condition, message) => {
  if (!condition) failures.push(message);
};

// The statement is only useful if every section it advertises actually exists.
for (const id of [
  "commitment",
  "conformance",
  "testing",
  "limitations",
  "feedback",
  "technical",
  "assessment",
]) {
  claim(statement.includes(`id="${id}"`), `statement is missing its "${id}" section`);
}

// "targets WCAG 2.1 Level AA" — the audit must actually run that rule set.
if (statement.includes("WCAG 2.1 Level AA") || statement.includes("WCAG 2.1 AA")) {
  for (const tag of ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]) {
    claim(
      a11yScript.includes(`"${tag}"`),
      `statement claims WCAG 2.1 AA but check-a11y.mjs does not run the ${tag} rule set`,
    );
  }
}

// "Every public page on the site" — the audit must discover routes from the
// build rather than a hand-kept list that can silently shrink.
claim(
  statement.includes("Every public page") || statement.includes("every public page"),
  "statement no longer claims full-site coverage — confirm that is intended",
);
claim(
  a11yScript.includes("auditableRoutes"),
  "statement claims every public page is tested, but check-a11y.mjs no longer discovers routes from the build",
);

// "a failure blocks the change from publishing" — the audit must exit non-zero
// and CI must actually run it.
claim(
  /process\.exit\(1\)/.test(a11yScript),
  "statement claims a violation blocks publishing, but check-a11y.mjs never exits non-zero",
);
claim(
  ci.includes("npm run check:a11y"),
  "statement claims the audit runs on every change, but CI does not run check:a11y",
);
claim(
  ci.includes("npm run check:lighthouse"),
  "statement lists Lighthouse scoring, but CI does not run check:lighthouse",
);

// "We have not installed an accessibility overlay" — the single most damaging
// claim to leave standing if one is ever added.
const overlays = ["accessibe", "userway", "audioeye", "equalweb", "max-access", "adally"];
const sourceText = (function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return /\.(?:ts|tsx|js|mjs|css)$/.test(path) ? [readFileSync(path, "utf8")] : [];
  });
})(join(ROOT, "src")).join("\n");
for (const vendor of overlays) {
  claim(
    !new RegExp(vendor, "i").test(sourceText),
    `statement says no accessibility overlay is used, but "${vendor}" appears in src/`,
  );
}

// Features the statement lists by name.
claim(
  styles.includes("prefers-reduced-motion"),
  "statement claims reduced-motion support, but no stylesheet honors prefers-reduced-motion",
);
claim(
  sourceText.includes("skip-link"),
  "statement claims a skip link, but no skip-link markup exists in src/",
);

// Contact routes must be real, and must match the one shop config.
claim(
  statement.includes("phoneHref") && statement.includes("contactEmail"),
  "statement must take its phone and email from the shop config, not hardcode them",
);
claim(
  Boolean(shop.phone?.href) && Boolean(shop.email?.service),
  "shop config is missing the phone or email the statement points people to",
);

// Findability: a statement nobody can reach does not do its job.
claim(
  footer.includes('href="/accessibility"'),
  "the site footer no longer links to /accessibility",
);
claim(sitemap.includes("/accessibility"), "the sitemap no longer includes /accessibility");
claim(
  existsSync(join(ROOT, "src/app/accessibility/page.tsx")),
  "/accessibility page is missing entirely",
);

if (failures.length) {
  console.error(
    `Accessibility statement check failed:\n${failures.map((f) => `  - ${f}`).join("\n")}`,
  );
  process.exit(1);
}
console.log("Accessibility statement check passed: every published claim matches the code.");
