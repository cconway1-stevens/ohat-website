// Runs `vinext build` with STATIC_EXPORT=1 set, for the `build:static` script.
//
// This exists because the variable used to be set inline in package.json as
// `STATIC_EXPORT=1 vinext build`. That is POSIX shell syntax, and npm runs
// scripts through cmd.exe on Windows, where it fails outright with
// "'STATIC_EXPORT' is not recognized" — taking `npm test` and `npm run check`
// down with it. The earlier workaround pinned script-shell to a Git Bash path
// in .npmrc, which broke `npm install` on every other OS including Linux CI
// (a27de6b). Setting the variable in-process depends on no shell at all, so
// both problems stay fixed.
//
// vinext is invoked as the pinned copy from node_modules rather than through
// npx, for the reason pre-push.sh spells out: npx will quietly fetch a
// different version and report success.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// vinext's `exports` map does not expose dist/cli.js, so resolve the package
// main entry (dist/index.js) and take the CLI sitting next to it. It must be
// import.meta.resolve rather than createRequire().resolve: that map declares
// only an `import` condition, so a require-flavoured resolve of even the bare
// specifier fails with ERR_PACKAGE_PATH_NOT_EXPORTED.
const cli = join(dirname(fileURLToPath(import.meta.resolve("vinext"))), "cli.js");
if (!existsSync(cli)) {
  console.error(`vinext CLI not found at ${cli} — run 'npm install' first.`);
  process.exit(1);
}

const { error, status } = spawnSync(process.execPath, [cli, "build"], {
  stdio: "inherit",
  env: { ...process.env, STATIC_EXPORT: "1" },
});

if (error) throw error;
process.exit(status ?? 1);
