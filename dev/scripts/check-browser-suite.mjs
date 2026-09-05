#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const FULL = process.argv.includes("--full");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const steps = [
  ["browser preflight", "check:browser:preflight"],
  ["page loading, links, runtime errors", "check:pages"],
  ["hydrated assets", "check:assets"],
  ["bundle budget", "check:bundle"],
  ["Lighthouse", "check:lighthouse:fast"],
  ["accessibility", "check:a11y"],
];
if (FULL) {
  steps.push(["slow network", "check:slow-network"], ["memory", "check:memory"]);
}

const failed = [];
for (const [name, script] of steps) {
  console.log(`\n=== ${name} ===`);
  const result = spawnSync(npm, ["run", script], { stdio: "inherit", shell: false });
  if (result.status === 0) console.log(`PASS ${name}`);
  else {
    console.error(`FAIL ${name}`);
    failed.push(name);
    // Every remaining browser-backed step would only repeat the same setup
    // error. Bundle is browser-free, so still run it for useful diagnostics.
    if (script === "check:browser:preflight") {
      const bundle = spawnSync(npm, ["run", "check:bundle"], { stdio: "inherit", shell: false });
      if (bundle.status !== 0) failed.push("bundle budget");
      break;
    }
  }
}

console.log("\n────────────────────────────────");
if (failed.length === 0) {
  console.log(`All ${steps.length} browser quality groups passed.`);
  process.exit(0);
}
console.error(`Failed: ${failed.join(", ")}`);
process.exit(1);
