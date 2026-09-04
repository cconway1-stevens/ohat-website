#!/usr/bin/env node
/**
 * Wipe local build/runtime caches so the working tree looks tidy again.
 *
 * Everything this script removes is gitignored — nothing tracked is touched,
 * and everything deleted regenerates on the next build/dev/typecheck. Use
 * `--deep` to also wipe `node_modules` (a full reinstall takes minutes, so
 * it's deliberately opt-in).
 *
 * Run via `npm run clean`. Intended for local use, not CI.
 */
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

// Directories removed by default. Mirrors `.gitignore` exactly — keep the two
// in sync; this list intentionally duplicates the ignore patterns so the
// script still works even if .gitignore gets edited.
const DEFAULT_DIRS = [
  ".next",
  ".vinext",
  ".wrangler",
  ".sites-runtime",
  "dist",
  "dev/reports",
  "public/media/rs",
];

// Files removed by default. Generated artifacts that next to a tracked file
// (e.g. the responsive-image variants live next to their source under
// public/media/rs, which is handled by DEFAULT_DIRS).
const DEFAULT_FILES = ["tsconfig.tsbuildinfo", "src/lib/image-manifest.json"];

// Only removed with `--deep`. Listed separately so the default never wipes
// dependencies by accident.
const DEEP_DIRS = ["node_modules"];

function isGitignored(relPath) {
  // `git check-ignore` exits 0 + prints the path when git would ignore it,
  // exits 1 when it would NOT be ignored. Treat anything else as "not
  // ignored" — better to leave a cache file alone than to refuse to run.
  // Also try a trailing-slash variant: a `/dir/` rule only matches when the
  // path is queried as a directory, and git won't even answer about a path
  // that doesn't exist on disk without the trailing slash.
  const candidates = relPath.endsWith("/") ? [relPath] : [relPath, `${relPath}/`];
  for (const candidate of candidates) {
    try {
      execFileSync("git", ["check-ignore", "--", candidate], {
        cwd: ROOT,
        stdio: ["ignore", "pipe", "ignore"],
      });
      return true;
    } catch {
      // try next variant
    }
  }
  return false;
}

function dirSize(path) {
  // Cheap size estimate via `du -sb` on POSIX, recursive fs scan on Windows
  // where `du` isn't guaranteed. Used only for the "freed N MB" summary —
  // accuracy within a few MB is fine.
  try {
    const out = execFileSync("du", ["-sb", path], { encoding: "utf8" });
    const first = out.split("\t")[0];
    const bytes = Number.parseInt(first, 10);
    if (Number.isFinite(bytes)) return bytes;
  } catch {
    // fall through to the cross-platform path below
  }
  let total = 0;
  const stack = [path];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const child = join(current, entry.name);
      try {
        if (entry.isDirectory()) stack.push(child);
        else if (entry.isFile()) total += lstatSync(child).size;
      } catch {
        // symlinks / permission errors — skip
      }
    }
  }
  return total;
}

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function remove(target) {
  const abs = join(ROOT, target);
  if (!existsSync(abs)) return { removed: false, bytes: 0 };
  const bytes = dirSize(abs);
  rmSync(abs, { recursive: true, force: true });
  return { removed: true, bytes };
}

function main() {
  const deep = process.argv.includes("--deep");

  const targets = [
    ...DEFAULT_DIRS.map((p) => ({ path: p, kind: "dir" })),
    ...DEFAULT_FILES.map((p) => ({ path: p, kind: "file" })),
  ];
  if (deep) {
    targets.push(...DEEP_DIRS.map((p) => ({ path: p, kind: "dir", deep: true })));
  }

  // Defence in depth: every target must be gitignored. If a future edit
  // drops a path from .gitignore, refuse to remove it instead of silently
  // deleting tracked work.
  const notIgnored = targets.filter((t) => !isGitignored(t.path));
  if (notIgnored.length > 0) {
    console.error(
      "Refusing to remove paths that are not in .gitignore — update this script\n" +
        "and .gitignore together so they stay in sync:",
    );
    for (const t of notIgnored) console.error(`  ${t.path}`);
    process.exit(2);
  }

  console.log(
    deep
      ? "Deep clean: removing build caches + node_modules."
      : "Clean: removing build caches (pass --deep to also wipe node_modules).",
  );

  let totalBytes = 0;
  let removedCount = 0;
  for (const target of targets) {
    const label = target.deep ? `${target.path} (deep)` : target.path;
    const { removed, bytes } = remove(target.path);
    if (removed) {
      totalBytes += bytes;
      removedCount += 1;
      console.log(`  \x1b[32m✓\x1b[0m ${label}  (${humanSize(bytes)})`);
    } else {
      console.log(`  \x1b[2m–\x1b[0m ${label}  (not present)`);
    }
  }

  console.log(
    `\nDone. Removed ${removedCount} of ${targets.length} target(s); freed ${humanSize(totalBytes)}.`,
  );
}

main();
