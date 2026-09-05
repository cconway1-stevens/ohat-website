#!/usr/bin/env node
//
// Pull the latest GitHub Actions runs for this repo and export every failure
// into one markdown file that can be handed straight to an AI as "here is what
// to fix". Uses the `gh` CLI (already authenticated) — no tokens in the repo.
//
//   npm run ci:report                        last 10 runs, failures detailed
//   npm run ci:report -- --limit 30          scan further back
//   npm run ci:report -- --run 33967898226   one specific run
//   npm run ci:report -- --workflow CI --branch main
//   npm run ci:report -- --all               also detail runs that passed
//   npm run ci:report -- --max-lines 400     more log context per failed job
//   npm run ci:report -- --out path.md       write somewhere else
//
// Output, all in the gitignored dev/reports/ (see .gitignore) so nothing gets
// committed:
//   ci-failures.md     the raw evidence — every failing job, step and log excerpt
//   ci-failures.json   the same data, structured
//   ci-fix-prompt.md   a ready-to-paste AI prompt: repo context, what each
//                      failing check enforces, how to reproduce it locally, and
//                      the failures grouped by check rather than by run
import { execFile } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("../..", import.meta.url));

// ---------------------------------------------------------------- arguments

function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const LIMIT = Number(argValue("--limit", "10"));
const MAX_LINES = Number(argValue("--max-lines", "200"));
const WORKFLOW = argValue("--workflow", null);
const BRANCH = argValue("--branch", null);
const RUN_ID = argValue("--run", null);
const INCLUDE_PASSING = process.argv.includes("--all");
const OUT = argValue("--out", join(root, "dev", "reports", "ci-failures.md"));

if (!Number.isFinite(LIMIT) || LIMIT < 1) {
  console.error("--limit must be a positive number");
  process.exit(2);
}

// ---------------------------------------------------------------- gh helpers

async function gh(args, { json = true } = {}) {
  const { stdout } = await execFileAsync("gh", args, {
    cwd: root,
    maxBuffer: 128 * 1024 * 1024,
    windowsHide: true,
  });
  return json ? JSON.parse(stdout) : stdout;
}

async function ghSafe(args, options) {
  try {
    return { ok: true, value: await gh(args, options) };
  } catch (error) {
    const detail = `${error.stderr || ""}${error.message || ""}`.trim();
    return { ok: false, error: detail.split("\n")[0] || String(error) };
  }
}

// ---------------------------------------------------------------- log mining

// Actions prefixes every log line with an ISO timestamp; it is pure noise for
// an AI reader and pushes the useful text off to the right.
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s?/;

const ERROR_PATTERNS = [
  /##\[error\]/i,
  /::error\b/,
  /\berror TS\d+/,
  /\bAssertionError\b/,
  /^\s*not ok \d+/,
  /^npm (error|ERR!)\b/,
  /\bERR_[A-Z_]+\b/,
  /^\s*(FAIL|FAILED|Failing tests)\b/,
  // Symbol markers (axe, vitest, biome) are followed by a space, so \b after
  // the symbol would never match — anchor on the whitespace instead.
  /^\s*[✗✖×❌]\s/,
  // "1 violation(s)", "3 errors", "2 failures" — the per-page detail a11y and
  // Lighthouse print hundreds of lines above the final summary.
  /\b[1-9]\d* (violation|error|failure|problem)s?\(?s?\)?/i,
  /\bUnhandled(Promise)?Rejection\b/,
  /\b(Error|Exception|Traceback):/,
  /Process completed with exit code [1-9]/,
  /\bexited with (code|status) [1-9]/i,
  /\b(timed out|Timeout) (after|exceeded)\b/i,
];

const NOISE_PATTERNS = [/^\s*$/, /^##\[(group|endgroup|debug)\]/i];

// A failing `npm ci` prints its real cause ("Missing: X from lock file") and
// then ~50 lines of usage help. The help is never the failure and it buries
// the cause, so it is dropped before the error windows are cut.
const NPM_USAGE = [
  /^npm error (Usage|Options|Run "npm help|aliases:)/,
  /^npm error (\[|npm ci$|Clean install a project$)/,
  /^npm error {2,}/,
];

function cleanLines(raw) {
  const kept = raw
    .split(/\r?\n/)
    .map((line) => line.replace(TIMESTAMP, "").trimEnd())
    .filter((line) => !NPM_USAGE.some((pattern) => pattern.test(line)));
  // Dropping the usage block leaves its bare `npm error` separators behind;
  // collapse each run of them into one so the real cause stays readable.
  const lines = kept.filter(
    (line, index) => line !== "npm error" || kept[index - 1] !== "npm error",
  );
  // Every job ends with the runner's "Post job cleanup" boilerplate (git config,
  // SSH teardown). It is never the failure, and it otherwise trails every
  // excerpt whose error window reaches the end of the log.
  const cleanupAt = lines.findIndex((line) => /^Post job cleanup\.?$/.test(line));
  if (cleanupAt === -1) return lines;
  const hasLaterError = lines.slice(cleanupAt + 1).some((line) => isError(line));
  return hasLaterError ? lines : lines.slice(0, cleanupAt);
}

function isError(line) {
  return ERROR_PATTERNS.some((pattern) => pattern.test(line));
}

// Pull error lines plus a little surrounding context, merging overlapping
// windows so the excerpt reads as continuous log rather than shrapnel.
function extractErrors(lines, { before = 3, after = 8, max = MAX_LINES } = {}) {
  const windows = [];
  lines.forEach((line, index) => {
    if (!isError(line)) return;
    const start = Math.max(0, index - before);
    const end = Math.min(lines.length - 1, index + after);
    const last = windows[windows.length - 1];
    if (last && start <= last.end + 2) {
      last.end = Math.max(last.end, end);
    } else {
      windows.push({ start, end });
    }
  });

  if (windows.length === 0) {
    // Nothing matched (a step can fail without printing a recognisable error) —
    // the tail of the log is the next best evidence.
    const tail = lines.filter((line) => !NOISE_PATTERNS.some((pattern) => pattern.test(line)));
    const keep = Math.min(max, 60);
    return { excerpt: tail.slice(-keep), truncated: tail.length > keep, matched: false };
  }

  const out = [];
  for (const window of windows) {
    if (out.length > 0) out.push("…");
    for (let i = window.start; i <= window.end; i += 1) out.push(lines[i]);
    if (out.length >= max) break;
  }
  return { excerpt: out.slice(0, max), truncated: out.length > max, matched: true };
}

// ---------------------------------------------------------------- collection

const RUN_FIELDS =
  "databaseId,name,displayTitle,status,conclusion,headBranch,headSha,event,createdAt,url,attempt";

async function listRuns(repo) {
  if (RUN_ID) {
    const run = await gh([
      "api",
      `/repos/${repo}/actions/runs/${RUN_ID}`,
      "--jq",
      "{databaseId:.id,name:.name,displayTitle:.display_title,status:.status,conclusion:.conclusion,headBranch:.head_branch,headSha:.head_sha,event:.event,createdAt:.created_at,url:.html_url,attempt:.run_attempt}",
    ]);
    return [run];
  }
  const args = ["run", "list", "--limit", String(LIMIT), "--json", RUN_FIELDS];
  if (WORKFLOW) args.push("--workflow", WORKFLOW);
  if (BRANCH) args.push("--branch", BRANCH);
  return gh(args);
}

async function collectRun(repo, run) {
  const jobsResult = await ghSafe([
    "api",
    `/repos/${repo}/actions/runs/${run.databaseId}/jobs?per_page=100`,
  ]);

  if (!jobsResult.ok) {
    return { ...run, jobsError: jobsResult.error, jobs: [] };
  }

  const failedJobs = [];
  for (const job of jobsResult.value.jobs || []) {
    if (!job.conclusion || ["success", "skipped"].includes(job.conclusion)) continue;

    const failedSteps = (job.steps || []).filter(
      (step) => step.conclusion && !["success", "skipped"].includes(step.conclusion),
    );

    const logResult = await ghSafe(["api", `/repos/${repo}/actions/jobs/${job.id}/logs`], {
      json: false,
    });
    const log = logResult.ok
      ? extractErrors(cleanLines(logResult.value))
      : { excerpt: [`(log unavailable: ${logResult.error})`], truncated: false, matched: false };

    failedJobs.push({
      id: job.id,
      name: job.name,
      conclusion: job.conclusion,
      url: job.html_url,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      failedSteps: failedSteps.map((step) => ({
        number: step.number,
        name: step.name,
        conclusion: step.conclusion,
      })),
      log,
    });
  }

  return { ...run, jobs: failedJobs };
}

// ------------------------------------------------------------- prompt output

// What each CI step actually enforces, so the AI reading the prompt knows what
// it is fixing instead of guessing from a log line. Matched against the failing
// step name; first hit wins.
const CHECK_GUIDE = [
  {
    match: /check:pages/,
    what: "Page smoke test (dev/scripts/check-pages.mjs). Loads every exported route in a real browser and requires: HTTP 200 with a title and an H1, zero console/page errors, no broken raster image, every internal link resolving to a real route, and the call button pointing at the shop phone number.",
    repro: "npm run build:static && npm run check:pages",
  },
  {
    match: /check:a11y/,
    what: "Accessibility audit (dev/scripts/check-a11y.mjs). Runs axe-core over every public page of the static export and fails on ANY WCAG 2.1 AA violation.",
    repro: "npm run build:static && npm run check:a11y",
  },
  {
    match: /Lighthouse/i,
    what: "Lighthouse audit (dev/scripts/check-lighthouse.mjs) over every indexable page. Accessibility, best-practices and SEO are deterministic — a failure there is a real bug, never noise. Performance is advisory (median of N runs).",
    repro: "npm run check:lighthouse:fast",
  },
  {
    match: /Dead code|check:deadcode|knip/i,
    what: "knip — unused files, exports and dependencies fail CI.",
    repro: "npm run check:deadcode",
  },
  {
    match: /npm ci/,
    what: "Dependency install. `npm ci` requires package.json and package-lock.json to be in sync; it never updates the lock file.",
    repro: "npm install (then commit the updated package-lock.json)",
  },
  {
    match: /Audit runtime and development dependencies|npm audit/i,
    what: "Dependency vulnerability audit.",
    repro: "npm audit",
  },
  {
    match: /typecheck|tsc/i,
    what: "TypeScript. Type errors block merging.",
    repro: "npm run typecheck",
  },
  {
    match: /format|biome/i,
    what: "Biome formatting/lint gate.",
    repro: "npm run check:fix",
  },
  {
    match: /domain-root Pages hosting/i,
    what: "Static export must be served from a domain root — vinext ignores basePath and does not implement assetPrefix, so subpath hosting breaks. dev/scripts/build-static.mjs patches image URLs, vCard, sitemap and legacy redirects.",
    repro: "npm run build:static && npm run validate:artifact",
  },
];

function guideFor(stepName) {
  return CHECK_GUIDE.find((entry) => entry.match.test(stepName));
}

// The same check usually fails across many runs. Grouping by step turns 28
// failing jobs into a handful of actual problems to fix.
function groupByCheck(detailed) {
  const groups = new Map();
  for (const run of detailed) {
    for (const job of run.jobs) {
      const steps = job.failedSteps.length ? job.failedSteps.map((step) => step.name) : [job.name];
      for (const step of steps) {
        if (!groups.has(step)) {
          groups.set(step, {
            step,
            jobNames: new Set(),
            runs: new Map(),
            jobCount: 0,
            excerpt: null,
          });
        }
        const group = groups.get(step);
        group.jobNames.add(job.name);
        group.jobCount += 1;
        // One run can fail the same step in several parallel jobs (the install
        // step fails in all four), so key by run to keep the count honest.
        if (!group.runs.has(run.databaseId)) {
          group.runs.set(run.databaseId, { id: run.databaseId, branch: run.headBranch });
        }
        // Runs arrive newest-first, so the first excerpt seen is the freshest.
        if (!group.excerpt) group.excerpt = job.log.excerpt;
      }
    }
  }
  return [...groups.values()].sort((a, b) => b.runs.size - a.runs.size);
}

function renderPrompt(repo, runs, detailed) {
  const groups = groupByCheck(detailed);
  const lines = [];

  lines.push("# Task: fix every CI failure in this repository");
  lines.push("");
  lines.push(
    `You are working in \`${repo}\`, a Next.js App Router site for Ocean Heights Auto & Tire built on **vinext** (Vite + Cloudflare Workers), with a second static-export path that deploys to GitHub Pages. Node 24.x. \`@/*\` maps to \`./src/*\`.`,
  );
  lines.push("");
  lines.push(
    `Its GitHub Actions workflow (\`.github/workflows/ci.yml\`) has been failing. Below is every distinct failure found across the last ${runs.length} run(s), grouped by the check that failed — ${detailed.length} failing run(s) collapse into **${groups.length} actual problem(s)**. Fix all of them.`,
  );
  lines.push("");

  lines.push("## Ground rules");
  lines.push("");
  lines.push(
    "1. **Fix the root cause, never the check.** Do not lower a threshold, add an exclusion, skip a route, or delete a test to make CI green. If a check is genuinely wrong, say so and explain why instead of editing it.",
  );
  lines.push(
    "2. **Reproduce locally before changing anything.** Each problem below lists its exact repro command. A fix you have not reproduced is a guess.",
  );
  lines.push(
    "3. **Verify after each fix** by re-running that same command, and report the real output.",
  );
  lines.push(
    "4. Read `AGENTS.md` first — it records the constraints an agent is most likely to violate (single sources of truth, the `.mjs`/`.ts` split in `src/lib/shop/`, static-export quirks, `./node_modules/.bin/<tool>` over `npx`).",
  );
  lines.push(
    "5. Shop data (phone, hours, address) lives only in `src/lib/shop/shop.mjs` — never duplicate it.",
  );
  lines.push(
    "6. Before you finish, run the full local gate: `npm run check`. Fix anything it surfaces that you introduced.",
  );
  lines.push("");

  if (groups.length === 0) {
    lines.push("## Problems");
    lines.push("");
    lines.push("None — CI is green across the scanned window. Nothing to do.");
    return lines.join("\n");
  }

  lines.push("## Problems to fix");
  lines.push("");
  groups.forEach((group, index) => {
    const guide = guideFor(group.step);
    const runs = [...group.runs.values()];
    const runList = runs
      .slice(0, 6)
      .map((run) => `${run.id}${run.branch && run.branch !== "main" ? ` (${run.branch})` : ""}`)
      .join(", ");
    const jobs = [...group.jobNames].join(", ");

    lines.push(`### Problem ${index + 1} — \`${group.step}\` (job: ${jobs})`);
    lines.push("");
    lines.push(
      `**Seen in ${runs.length} run(s)${group.jobCount > runs.length ? `, ${group.jobCount} job(s)` : ""}:** ${runList}${runs.length > 6 ? ", …" : ""}`,
    );
    lines.push("");
    if (guide) {
      lines.push(`**What this check enforces:** ${guide.what}`);
      lines.push("");
      lines.push(`**Reproduce locally:** \`${guide.repro}\``);
      lines.push("");
    }
    lines.push("**Evidence from the most recent failing run:**");
    lines.push("");
    lines.push("```text");
    lines.push(...group.excerpt.slice(0, 60));
    if (group.excerpt.length > 60) lines.push("… (full log in dev/reports/ci-failures.md)");
    lines.push("```");
    lines.push("");
  });

  lines.push("## Deliverable");
  lines.push("");
  lines.push(
    "For each problem: the root cause in one or two sentences, the files you changed, and the output of the repro command proving it now passes. If you cannot fix one, say exactly what blocks you rather than working around the check.",
  );
  lines.push("");
  lines.push(
    "_Full unabridged logs for every failing job are in `dev/reports/ci-failures.md`; the structured data is in `dev/reports/ci-failures.json`._",
  );

  return lines.join("\n");
}

// ---------------------------------------------------------------- rendering

function renderMarkdown(repo, runs, detailed) {
  const lines = [];
  const failing = runs.filter(
    (run) => run.conclusion && !["success", "skipped", "neutral"].includes(run.conclusion),
  );

  lines.push(`# CI failure report — ${repo}`);
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(
    `Scanned: ${runs.length} run(s)${WORKFLOW ? ` · workflow \`${WORKFLOW}\`` : ""}${BRANCH ? ` · branch \`${BRANCH}\`` : ""}`,
  );
  lines.push(`Failing runs: ${failing.length}`);
  lines.push("");
  lines.push(
    "> Each section below is one failing job: the steps that failed and the error lines pulled from its log. Log excerpts are trimmed to the error windows — fix the root cause in the repo, not the log line.",
  );
  lines.push("");

  lines.push("## Run summary");
  lines.push("");
  lines.push("| Run | Workflow | Branch | Event | Result | When (UTC) |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const run of runs) {
    const when = run.createdAt ? run.createdAt.replace("T", " ").replace("Z", "") : "?";
    lines.push(
      `| [${run.databaseId}](${run.url}) | ${run.name || "?"} | ${run.headBranch || "?"} | ${run.event || "?"} | ${run.conclusion || run.status} | ${when} |`,
    );
  }
  lines.push("");

  if (detailed.length === 0) {
    lines.push("## Failures");
    lines.push("");
    lines.push("None in the scanned window. 🎉");
    return lines.join("\n");
  }

  // A flat checklist first — the fastest thing for an AI (or a human) to act on.
  lines.push("## Failing steps at a glance");
  lines.push("");
  for (const run of detailed) {
    if (run.jobsError) {
      lines.push(`- run ${run.databaseId}: could not read jobs — ${run.jobsError}`);
      continue;
    }
    for (const job of run.jobs) {
      const steps = job.failedSteps.length
        ? job.failedSteps.map((step) => step.name).join(", ")
        : "(job failed with no failing step recorded)";
      lines.push(`- **${job.name}** (run ${run.databaseId}): ${steps}`);
    }
  }
  lines.push("");

  lines.push("## Failure details");
  lines.push("");
  for (const run of detailed) {
    const when = run.createdAt ? run.createdAt.replace("T", " ").replace("Z", "") : "?";
    lines.push(
      `### Run ${run.databaseId} — ${run.name || "workflow"} (${run.conclusion || run.status})`,
    );
    lines.push("");
    lines.push(`- Title: ${run.displayTitle || "(none)"}`);
    lines.push(
      `- Branch: \`${run.headBranch || "?"}\` @ \`${(run.headSha || "").slice(0, 8)}\` · ${when} UTC`,
    );
    lines.push(`- URL: ${run.url}`);
    lines.push("");

    if (run.jobsError) {
      lines.push(`Could not fetch jobs: ${run.jobsError}`);
      lines.push("");
      continue;
    }

    for (const job of run.jobs) {
      lines.push(`#### Job: ${job.name} — ${job.conclusion}`);
      lines.push("");
      lines.push(`- Job log: ${job.url}`);
      if (job.failedSteps.length) {
        lines.push(
          `- Failed step(s): ${job.failedSteps.map((step) => `\`${step.name}\` (${step.conclusion})`).join(", ")}`,
        );
      }
      lines.push("");
      lines.push(
        job.log.matched ? "Error lines from the log:" : "No error pattern matched; log tail:",
      );
      lines.push("");
      lines.push("```text");
      lines.push(...job.log.excerpt);
      if (job.log.truncated)
        lines.push(`… (truncated at ${MAX_LINES} lines — rerun with --max-lines)`);
      lines.push("```");
      lines.push("");
    }
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------- main

async function main() {
  const repoResult = await ghSafe(
    ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"],
    { json: false },
  );
  if (!repoResult.ok) {
    console.error("Could not resolve the GitHub repo via `gh`.");
    console.error(repoResult.error);
    console.error("Install the GitHub CLI and run `gh auth login`, then retry.");
    process.exit(1);
  }
  const repo = repoResult.value.trim();

  process.stdout.write(`Fetching workflow runs for ${repo}…\n`);
  const runs = await listRuns(repo);
  if (runs.length === 0) {
    console.error("No workflow runs matched.");
    process.exit(1);
  }

  const failing = runs.filter(
    (run) => run.conclusion && !["success", "skipped", "neutral"].includes(run.conclusion),
  );
  const targets = INCLUDE_PASSING || RUN_ID ? runs : failing;

  const detailed = [];
  for (const run of targets) {
    process.stdout.write(
      `  run ${run.databaseId} (${run.name} · ${run.conclusion || run.status})…\n`,
    );
    const collected = await collectRun(repo, run);
    if (collected.jobs.length > 0 || collected.jobsError) detailed.push(collected);
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${renderMarkdown(repo, runs, detailed)}\n`, "utf8");

  const jsonPath = `${OUT.replace(/\.md$/, "")}.json`;
  writeFileSync(
    jsonPath,
    `${JSON.stringify({ repo, generatedAt: new Date().toISOString(), scanned: runs, failures: detailed }, null, 2)}\n`,
    "utf8",
  );

  const promptPath = join(dirname(OUT), "ci-fix-prompt.md");
  writeFileSync(promptPath, `${renderPrompt(repo, runs, detailed)}\n`, "utf8");

  const jobCount = detailed.reduce((sum, run) => sum + run.jobs.length, 0);
  const problemCount = groupByCheck(detailed).length;
  process.stdout.write(
    `\n${failing.length} failing run(s), ${jobCount} failing job(s), ${problemCount} distinct problem(s).\n`,
  );
  process.stdout.write(`Wrote ${OUT}\n`);
  process.stdout.write(`Wrote ${jsonPath}\n`);
  process.stdout.write(`Wrote ${promptPath}  <- paste this into an AI\n`);
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
