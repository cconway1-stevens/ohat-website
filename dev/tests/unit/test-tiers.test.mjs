import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

/**
 * The guard on the suite's own wiring.
 *
 * Test files are gated by which directory they sit in — `npm test` runs
 * `dev/tests/<tier>/*.test.mjs` for each tier, so a file outside a tier
 * directory is a file nothing runs. That is not hypothetical: six chat tests
 * (chat-legal and five chat-training-*) sat in `dev/tests/` for months while
 * the gate ran a hand-maintained list in package.json that never mentioned
 * them. They passed the whole time and would have gone on passing if they had
 * broken.
 *
 * So: every test file lives in exactly one tier, and every tier is a script.
 * Add a tier here and in package.json together, or don't add one.
 */

const TIERS = ["unit", "server", "static"];
const testsRoot = fileURLToPath(new URL("..", import.meta.url));

const isDir = (path) => statSync(path).isDirectory();

test("every test file sits inside a tier directory", () => {
  const stray = readdirSync(testsRoot).filter(
    (entry) => !isDir(join(testsRoot, entry)) && entry.endsWith(".test.mjs"),
  );
  assert.deepEqual(
    stray,
    [],
    `Test files outside a tier directory are run by nothing. Move each into ` +
      `dev/tests/{${TIERS.join(",")}}/ — see dev/docs/test-program.md.`,
  );
});

test("every directory under dev/tests is a known tier", () => {
  const dirs = readdirSync(testsRoot).filter((entry) => isDir(join(testsRoot, entry)));
  const unknown = dirs.filter((dir) => !TIERS.includes(dir));
  assert.deepEqual(
    unknown,
    [],
    `A tier directory with no npm script behind it runs nothing. Either add ` +
      `test:<tier> to package.json and list it here, or fold these files into ` +
      `an existing tier.`,
  );
});

test("every tier holds at least one test file", () => {
  for (const tier of TIERS) {
    const files = readdirSync(join(testsRoot, tier)).filter((f) => f.endsWith(".test.mjs"));
    assert.ok(
      files.length > 0,
      `Tier "${tier}" is empty, so npm run test:${tier} asserts nothing. Remove ` +
        `the tier and its script, or move its tests back.`,
    );
  }
});
