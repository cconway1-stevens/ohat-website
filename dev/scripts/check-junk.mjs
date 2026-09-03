#!/usr/bin/env node
/**
 * Repository-junk check: fails when a file that git would actually commit looks
 * like a temporary/debug artifact.
 *
 * It scans exactly the set of files git would commit — tracked files plus
 * untracked, non-ignored files (`git ls-files` + `git ls-files --others
 * --exclude-standard`). Anything already covered by `.gitignore` (node_modules,
 * dist, build output) is never flagged, and legitimate source is never hidden.
 *
 * Conservative by design: only obvious scratch/debug names are matched, and an
 * explicit allowlist exists for any legitimate file that happens to match.
 *
 * Run via `npm run check` (cheapest-first step in pre-push.sh).
 */
import { execFileSync } from "node:child_process";
import { basename, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

// Basename patterns for obvious temporary/debug artifacts. Keep this narrow so
// it never blocks a legitimate project file.
const JUNK_PATTERNS = [
  /\.(bak|orig|tmp|dump|swp|swo|rej)$/i,
  /^scratch[-_.]/i,
  /[-_.]copy\.md$/i,
  /\.(old|orig)$/i,
  // Debug/temp markers embedded in an otherwise real-looking name, e.g.
  // `lh-debug-tmp.mjs` or `check-tmp-notes.md`.
  /[-_.](?:debug|tmp)[-_.]/i,
];

// Legitimate files that intentionally match a pattern above. Add only with a
// comment explaining why the file is real and must stay.
const ALLOWLIST = new Set([]);

function gitFiles(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const tracked = gitFiles(["ls-files"]);
const untracked = gitFiles(["ls-files", "--others", "--exclude-standard"]);
const candidates = [...new Set([...tracked, ...untracked])].sort();

const offenders = [];
for (const file of candidates) {
  const name = basename(file);
  if (ALLOWLIST.has(file)) continue;
  if (JUNK_PATTERNS.some((pattern) => pattern.test(name))) {
    offenders.push(file);
  }
}

if (offenders.length === 0) {
  console.log("Repo-junk check: no temporary/debug artifacts found.");
  process.exit(0);
}

console.error(`Repo-junk check: ${offenders.length} temporary/debug artifact(s) found:`);
for (const file of offenders) {
  console.error(`  ${relative(ROOT, join(ROOT, file.split(sep).join(sep)))}`);
}
console.error(
  "\nRemove these before committing. If one is a legitimate file, add it to the\n" +
    "ALLOWLIST in dev/scripts/check-junk.mjs with a comment explaining why.",
);
process.exit(1);
