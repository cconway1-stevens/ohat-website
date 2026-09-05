#!/usr/bin/env node
//
// One command to run the ENTIRE repo quality gate before a PR, pushing through
// failures, then write a single markdown report of everything that needs fixing.
// Every step documents its run time.
//
//   npm run report                 full gate (junk, biome, eslint, tsc, knip,
//                                  depcruise, both builds, all tests, assets)
//   npm run report -- --no-build   skip the two builds + browser asset check
//                                  (fast pass; build-dependent tests report
//                                  stale dist honestly if artifacts are missing)
//   npm run report -- --fix        let Biome write formatting fixes before checking
//
// Unlike `npm run check` (which stops at the first failing step), every step
// here runs independently and its full output lands in dev/reports/report.md.
// Steps mirror dev/scripts/pre-push.sh 1:1 so local results match CI.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
// dev/reports/ is gitignored (see .gitignore), so reports never get committed.
const reportsDir = join(root, "dev", "reports");
const reportPath = join(reportsDir, "report.md");

const FIX = process.argv.includes("--fix");
const NO_BUILD = process.argv.includes("--no-build");

// npm scripts in this repo shell out to `bash` (build, test, check). On this
// machine plain `bash` on PATH can resolve to the WSL launcher stub, not Git
// Bash — route npm's script shell there explicitly (mirrors run.ps1).
if (process.platform === "win32") {
  const gitBashBin = "C:\\Program Files\\Git\\bin";
  if (existsSync(gitBashBin)) {
    if (!process.env.PATH?.includes(gitBashBin)) {
      process.env.PATH = `${gitBashBin};${process.env.PATH}`;
    }
    process.env.npm_config_script_shell = `${gitBashBin}\\bash.exe`;
  }
}

// Windows resolves `npm` through npm.cmd; spawning it directly (no shell)
// avoids the classic "C:\Program is not recognized" breakage from spawning a
// path with spaces through a shell.
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function resolveCmd(cmd) {
  return cmd === "npm" ? npmCmd : cmd;
}

function fmtDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${Math.floor(s / 60)}m ${(s % 60).toFixed(0)}s`;
}

function run(cmd, args) {
  return new Promise((resolve) => {
    let child;
    try {
      if (cmd === "npm" && process.platform === "win32") {
        // Node refuses to spawn .cmd/.bat directly (EINVAL), so npm goes
        // through cmd.exe. The args are npm script names — no metacharacters.
        child = spawn(`npm ${args.join(" ")}`, {
          cwd: root,
          stdio: ["ignore", "pipe", "pipe"],
          shell: true,
        });
      } else {
        // process.execPath contains spaces ("C:\Program Files\...") and must
        // never go through a shell.
        child = spawn(resolveCmd(cmd), args, {
          cwd: root,
          stdio: ["ignore", "pipe", "pipe"],
          shell: false,
        });
      }
    } catch (error) {
      resolve({ code: 127, out: "", err: `${error.message}\n` });
      return;
    }
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => {
      out += d;
      process.stdout.write(d);
    });
    child.stderr.on("data", (d) => {
      err += d;
      process.stderr.write(d);
    });
    child.on("close", (code) => resolve({ code, out, err }));
    child.on("error", (e) => resolve({ code: 127, out, err: `${err}${e.message}\n` }));
  });
}

async function step(name, cmd, args) {
  console.log(`\n=== ${name} ===`);
  const started = Date.now();
  const result = await run(cmd, args);
  result.name = name;
  result.ms = Date.now() - started;
  result.ok = result.code === 0;
  console.log(
    `${result.ok ? "PASS" : "FAIL"} ${name} (${fmtDuration(result.ms)}${result.ok ? "" : `, exit ${result.code}`})`,
  );
  return result;
}

const overallStart = Date.now();
const results = [];

// 0. Repo junk scan — cheapest, fails in seconds.
results.push(await step("repo junk", process.execPath, ["dev/scripts/check-junk.mjs"]));

// 1. Formatting. The build enforces it, so catch it first.
results.push(await step("biome format", "npm", FIX ? ["run", "format"] : ["run", "format:check"]));
results.push(await step("biome lint", "npm", ["run", "lint"]));

// 2. Next.js rules Biome cannot express, then types.
results.push(await step("next lint (eslint)", "npm", ["run", "lint:next"]));
results.push(await step("typecheck", "npm", ["run", "typecheck"]));

// 3. Dead code and architecture.
results.push(await step("dead code (knip)", "npm", ["run", "check:deadcode"]));
results.push(await step("architecture (depcruise)", "npm", ["run", "check:architecture"]));

// 4. Builds. Tests need the artifacts these produce.
if (!NO_BUILD) {
  results.push(await step("build (cloudflare)", "npm", ["run", "build"]));
  results.push(await step("build (static export)", "npm", ["run", "build:static"]));
}

// 5. Every test file in dev/tests, each in its own process.
const tests = readdirSync(join(root, "dev", "tests"))
  .filter((f) => f.endsWith(".test.mjs"))
  .sort();
for (const file of tests) {
  results.push(await step(`test ${file}`, process.execPath, ["--test", `dev/tests/${file}`]));
}

// 6. Real-browser asset check — only meaningful against a fresh static export.
if (!NO_BUILD) {
  const browser = await step("browser preflight", "npm", ["run", "check:browser:preflight"]);
  results.push(browser);
  if (browser.ok) {
    results.push(await step("asset check (browser)", "npm", ["run", "check:assets"]));
  }
}

const failed = results.filter((r) => !r.ok);
const totalMs = Date.now() - overallStart;
const lines = [];
lines.push("# Repo Check Report");
lines.push("");
lines.push(`Generated ${new Date().toISOString()}`);
lines.push("");
lines.push(`- **Passed:** ${results.length - failed.length}/${results.length}`);
lines.push(`- **Failed:** ${failed.length}/${results.length}`);
lines.push(`- **Total run time:** ${fmtDuration(totalMs)}`);
lines.push(
  `- **Flags:** ${[FIX && "--fix", NO_BUILD && "--no-build"].filter(Boolean).join(" ") || "(none)"}`,
);
lines.push("");

if (failed.length === 0) {
  lines.push("All checks passed.");
} else {
  lines.push("## Findings to fix");
  lines.push("");
  for (const r of failed) {
    lines.push(`### ${r.name} (${fmtDuration(r.ms)})`);
    lines.push("");
    lines.push("```");
    lines.push(`${r.err}${r.out}`.trim() || "(no output)");
    lines.push("```");
    lines.push("");
  }
}

lines.push("");
lines.push("## Full results");
lines.push("");
lines.push("| Check | Status | Run time |");
lines.push("| --- | --- | --- |");
for (const r of results) {
  lines.push(`| ${r.name} | ${r.ok ? "pass" : "fail"} | ${fmtDuration(r.ms)} |`);
}
lines.push("");

mkdirSync(reportsDir, { recursive: true });
writeFileSync(reportPath, lines.join("\n"), "utf8");
console.log(`\nTotal: ${fmtDuration(totalMs)} — report written to ${reportPath}`);
process.exit(failed.length === 0 ? 0 : 1);
