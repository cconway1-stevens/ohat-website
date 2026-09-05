import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

/**
 * The README's generated blocks must match what the repository actually says.
 *
 * `dev/scripts/build-readme.mjs` renders the hosting table, the CI pipeline
 * diagram and job list, the test-tier table, and the script reference straight
 * from vercel.json, ci.yml, the tier directories and package.json. This runs it
 * in --check mode, so renaming a CI job or adding an npm script and forgetting
 * `npm run readme` fails here in the unit tier rather than leaving a confident,
 * wrong README in front of the next reader.
 */

const root = fileURLToPath(new URL("../../..", import.meta.url));

test("README generated blocks are up to date", () => {
  const result = spawnSync(process.execPath, ["dev/scripts/build-readme.mjs", "--check"], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(
    result.status,
    0,
    `${result.stdout}${result.stderr}\nRun \`npm run readme\` to regenerate the README's generated blocks.`,
  );
});
