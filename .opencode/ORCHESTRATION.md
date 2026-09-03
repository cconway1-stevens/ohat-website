# OpenCode multi-model orchestration policy

This file governs how OpenCode agents behave in this repo. It is loaded into every
agent's context automatically (`instructions` in `opencode.jsonc`). See
`opencode.jsonc` for the actual model IDs and permission enforcement — this file is
policy/behavior, the config is the technical enforcement. Read `AGENTS.md` first for
project conventions (build/test commands, architecture); this file is about *how to
work*, not *what the site does*.

## Reality check: there is no "local model" here

Every model configured for this project is a **Together AI cloud call**. None of them
run on this machine. "Local/trusted" in this policy means "the primary agent the human
is watching turn-by-turn"; it does not mean the data stays on-device. Treat *every*
prompt sent to *any* of these agents as data that leaves the machine. That is why the
sensitive-path denials below are hard `deny`, not `ask` — an approved "ask" would
still ship the file content to Together AI.

## Model capability matrix

Checked live against Together AI's serverless catalog (see `opencode.jsonc` for exact
model IDs). Prices are input/output per million tokens.

| Agent | Model | Vision | Cost tier | Can edit? | Job |
|---|---|---|---|---|---|
| `dev` | GLM-5.3-Flash | Yes | Cheapest ($0.15 / $0.50) | Yes (primary) | Default orchestrator — short, mechanical, well-scoped work |
| `turbo` | DeepSeek-V4-Pro-0813 | No | Mid ($1.32 / $3.96) | Yes (primary) | Time-crunch sibling of `dev` |
| `strong-reasoner` | DeepSeek-V4-Pro-0813 | No | Mid ($1.32 / $3.96) | No (advisor) | Hard reasoning, architecture, concurrency |
| `glm-specialist` | GLM-5.3 | No | Mid-high ($1.40 / $4.40) | No (advisor) | Alternative implementation angle |
| `minimax-specialist` | MiniMax M3 | Yes | Cheap ($0.30 / $1.20) | No (advisor) | Second alternative angle; bonus UI second opinion |
| `third-reviewer` | GLM-5.2 | No | Mid-high ($1.40 / $4.40) | No (advisor) | Third independent pass, high-risk changes only |
| `kimi-reviewer` | Kimi-K3 | Yes | Highest ($3.00 / $15.00) | No (advisor) | Long-context independent review, finds omissions |
| `ui-reviewer` | GLM-5.3-Flash | Yes | Cheapest vision ($0.15 / $0.50) | No (advisor) | Judges rendered UI from screenshots |
| `closer` | MiniMax M3 | Yes | Cheap ($0.30 / $1.20) | **Yes** (edit only, no bash) | Fixes big/stuck/large-context problems directly |
| `kimi-closer` | Kimi-K3 | Yes | Highest ($3.00 / $15.00) | **Yes** (edit only, no bash) | Last-resort fixer, ask-first |

What this table exists to make obvious:

- **No configured model runs locally.** All of them are Together AI cloud calls.
- **Vision is the exception, not the rule.** Only `minimax-specialist`, `kimi-reviewer`,
  `ui-reviewer`, `closer`, and `kimi-closer` are *treated* as vision-capable. `turbo`,
  `strong-reasoner`, `glm-specialist`, and `third-reviewer` are genuinely text-only —
  never hand them a screenshot expecting them to look at it. `dev` now happens to run
  on GLM-5.3-Flash (same underlying model as `ui-reviewer`), which can technically see
  images, but the routing policy is unchanged on purpose: never let `dev` make a visual
  judgment call itself — route it to `ui-reviewer` for a consistent, focused pass
  instead of a side effect of whatever model `dev` happens to be pinned to today.
- **Cost spans roughly 100x** across the roster, cheapest input token to priciest
  output token. Match the model to the stakes — see "Cost-aware delegation" below.

## Token efficiency policy

- Inspect before reading: filenames, `git status`, `git diff --stat` before opening
  file contents.
- Grep/glob for symbols before opening large files; read targeted line ranges, not
  whole files, when you already know the region you need.
- Never dump the whole repo into context. Don't re-read a file you already have
  unchanged content for.
- Summarize findings in a few lines before delegating — don't paste transcripts.
- Give subagents the smallest context that lets them answer (see Delegation format).
- Prefer diffs over full-file retransmission when describing changes.
- No speculative multi-page plans for small tasks. Stop investigating once you have
  enough evidence to implement safely — more reading has diminishing returns.

## Repository exploration policy

1. `git status` / `git diff --stat` / directory listing first.
2. Grep for the symbol, component, or string you're chasing.
3. Read only the files that turned up, and only the relevant ranges of large ones.
4. Only widen the search if the targeted pass didn't answer the question.

## Testing policy — triage first, verify progressively

Do not reflexively run `npm test`, `npm run check`, or even the Level 1 checks after
every small edit. This repo's `test` script builds the Cloudflare *and* static
artifacts twice — it's expensive — but re-running *any* check after each micro-edit
burns time for no extra signal even at Level 1.

**Triage before touching code**: identify the issue's complexity and likely cause,
decide which tier should own it — `dev` itself, or which specialist (see "Model
escalation rules") — and only then start editing. Route by complexity and issue type
up front; don't attempt it at the wrong tier first and escalate only after producing a
bad result.

Once you're editing, escalate through these verification levels and stop as soon as
you have enough signal:

- **Level 1 — static/local**: `npx tsc --noEmit` (or scoped to the touched files if
  the toolchain allows), `npx biome check <changed files>`, read-through for
  obvious errors.
- **Level 2 — targeted test**: run the single `node --test dev/tests/<name>.test.mjs`
  file that covers the changed behavior (see `dev/docs/test-program.md` for the
  matrix). Don't run the others.
- **Level 3 — affected suite**: `npm run lint`, `npm run check:deadcode` (knip) when
  the change affects exports/imports broadly, or the small set of test files that
  share a fixture with your change.
- **Level 4 — full**: `npm test`, `npm run check`, or `npm run check:all` — only when
  the user explicitly asks, the change touches shared infrastructure
  (`shop.mjs`/`shop.ts`, `vite.config.ts`, build scripts), crosses many packages, or
  a targeted test just failed in a way that suggests a broader regression.

Batch a full fix attempt, then verify once. Never re-run any check — not just the
broad Level 4 suite — unless an edit since the last run could plausibly change its
result.

## Security rules

**Sensitive paths** (hard `deny` for read/edit/grep/glob, enforced in
`opencode.jsonc`, not just written here as a suggestion): `.env`, `.env.*` (except
`.env.example`), `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.crt`, `*.tfstate*`,
`**/secrets/**`, `**/secrets*`, `**/credentials*`, `**/.ssh/**`, `**/.aws/**`,
`**/.config/gcloud/**`, `**/.docker/config.json`, `**/.kube/config`, `**/.netrc`,
`**/.git-credentials`. `**/.npmrc` is `ask` at the human-facing layer (`dev`/`turbo`;
repo's root `.npmrc` is committed and non-secret today, but treat any edit/exfil
attempt as worth a human look) and hard `deny` for every specialist subagent, since
there's no human present in their loop to answer an "ask".

**These denies are enforced by OpenCode's permission engine** (glob-pattern rules
per tool), not by asking the model nicely. See `opencode.jsonc` → `permission`.

**Shell**: bash permission is a **string-match allow/ask/deny list**, not a real
sandbox — it gates whether a command *string* is allowed to reach a real shell, it
does not parse or rewrite the string. The top-level (global) config guards against
two consequences of that; `dev` deliberately opts out of both for low friction, so
read this as "how `build`/`plan` behave," not "how `dev` behaves":

1. Any `"allow"` rule that ends in a wildcard (e.g. `"git diff *": "allow"`) would
   also match `git diff --stat && cat .env`, because `*` swallows everything after
   the fixed prefix and the *entire* matched string is handed to the shell verbatim.
   **The global baseline therefore never uses a wildcard-suffixed `"allow"` rule** —
   every global `"allow"` bash entry is an exact, argument-free literal (`git
   status`, `git diff`, `pwd`, ...), so appending `&&`/`;`/args changes the string
   and it falls through to `"ask"` instead of silently running. `dev` overrides this
   with a single `"*": "allow"`, accepting the chaining risk in exchange for not
   being asked about every command (secret-pattern and destructive-command denies
   below still apply and still block outright).
2. As defense in depth, the global baseline also hard-`deny`s any command string
   containing a shell metacharacter (`&&`, `;`, `|`, `` ` ``, `$(`, `>`, `<`, `&`),
   so even a careless `"allow"` rule can't be chained into something else. **Cost**:
   legitimate piped/redirected commands (`npm run build 2>&1 | tee log`) are denied
   outright instead of asking for `build`/`plan`. `dev` does not carry this
   metacharacter blanket-deny, so chained/piped commands work there.
3. Known residual gaps (documented, not hidden): quoting/encoding tricks that don't
   contain the literal denied substrings (e.g. building a path via string
   concatenation in a `node -e` one-liner, or reading a file through a language
   runtime's own I/O instead of `cat`) are **not** caught by string matching. `bash`
   is fully `deny`d for every specialist subagent specifically because their
   inputs are automated (no human eyeballing each proposed command), which is the
   only place this gap actually matters — `dev` defaults bash to `allow`
   (low-friction by design; see below), so this gap is real for `dev` and not
   just theoretical. Nothing sensitive lives outside the hard-denied secret
   patterns, so the residual risk is accepted deliberately, not overlooked.

**Remote/specialist subagents** all get, unconditionally: `task: deny` (no further
sub-delegation), `external_directory: deny`, `webfetch: deny`, `websearch: deny`.
They split into two groups beyond that:

- **Read-only advisors** (`strong-reasoner`, `glm-specialist`, `minimax-specialist`,
  `third-reviewer`, `kimi-reviewer`, `ui-reviewer`) additionally get `bash: deny`,
  `edit: deny`. They receive a delegation packet, read what they need (minus
  sensitive paths), and return recommendations as text. `dev` integrates and
  applies changes.
- **Edit-capable fixers** (`closer`, `kimi-closer`) additionally get `bash: deny`
  but `edit: allow` (minus the same hard-denied sensitive paths as everywhere
  else). This is a deliberate exception to the read-only default, made because
  their whole job is fixing code directly rather than describing a fix for `dev`
  to retype. **Know the tradeoff**: the rationale for denying bash to specialists —
  "no human eyeballing each proposed command" — applies just as much to an edit.
  A `closer`/`kimi-closer` patch lands in your working tree unreviewed by a human
  before it's there; `dev` runs the appropriate verification level afterward, but
  that catches breakage, not bad judgment. Reserve them for cases that actually
  warrant it (see "Model escalation rules"), and look at the diff they produce —
  don't just trust that tests passed.

## Todo tracking policy

`dev` (and `turbo`) use OpenCode's built-in `todowrite` tool, not an in-repo
TODO file or GitHub Issues, for any task that takes more than one step:

- Write the todo list before starting multi-step work; check it at the start
  of every turn before picking what to do next.
- Work items **oldest-pending first**. Don't jump to a newer item while an
  older one is still open, unless the user explicitly says to reprioritize
  for this request.
- **Conflict handling**: if a new ask contradicts, invalidates, or reorders an
  existing not-done todo, do not silently drop, overwrite, or reorder it.
  Stop and use the `question` tool to ask the user how to resolve the
  conflict (cancel the old item, supersede it, keep both, do both). Only
  after they answer: update the todo list to reflect the resolution, finish
  the current item, then continue to the next pending item in order.

## Ask, don't guess

Never guess on an ambiguous instruction, an unstated preference, or a
conflict between a new ask and existing in-flight work — use the built-in
`question` tool and ask the user instead of assuming. This applies
everywhere, not just todo conflicts: unclear scope, an instruction that could
mean two different implementations, or a request that looks like it might
undo prior work. Exception: don't ask about things resolvable by reading the
code, running a command, or checking `git status`/`git log` — investigate
first, ask only when investigation genuinely can't resolve it.

## Disagreement policy

"Ask, don't guess" covers ambiguity. This covers something different: what to do
when the instruction is perfectly clear but wrong, risky, or not the best approach.
Every agent in this roster — not just the specialists — is here as the technical
expert in the room, not an order-taker. If a request looks technically unsound,
insecure, likely to regress something, or there's a clearly better approach, say so
plainly, explain why, and propose the alternative *before* doing the work. If the
user still wants to proceed after hearing the pushback, do it — disagreement isn't a
veto, it's making sure the tradeoff was actually seen. This applies to `dev` and
`turbo` directly with the human, and to every specialist reviewing a proposed
approach in its delegation packet — a specialist's job is never to rubber-stamp what
it was handed.

## Turbo mode

`turbo` is a separate primary agent (sibling to `dev`, not a flag on it) —
invoke it directly (`opencode --agent turbo`, Tab-cycle) or tell `dev`
you're in a time crunch and want it to hand off. Use it only when explicitly
time-crunched, not as a routine default — it trades thoroughness for speed:

- **Verification cap**: stop at Level 1-2 (typecheck + the one targeted test)
  even where Level 3 would normally apply. Still honor an explicit Level 4
  ask from the user.
- **Parallel delegation**: when escalation to a specialist is still
  warranted, fire the relevant `task` calls concurrently instead of the
  normal serial chain — but this is still bounded by "Cost-aware delegation"
  below; parallelizing several expensive calls at once isn't a loophole
  around being picky about cost.
- **Model**: runs on `DeepSeek-V4-Pro-0813` instead of `dev`'s cheaper
  default, trading cost for a better one-shot answer under time pressure.

**Never relaxed in turbo mode**: the security rules and sensitive-path denies, the
"ask, don't guess" policy, the disagreement policy, the requirement to ask before
firing `kimi-closer`, and the definition-of-done check that no unrelated files
changed. Turbo trades verification depth and delegation latency for speed — it does
not trade away safety, correctness, or cost checks on the diff itself.

## Model escalation rules

`dev` triages before it edits: identify the issue's complexity and type, decide who
should own it, *then* start work — not attempt-then-escalate-after-a-bad-result. See
"Model capability matrix" above for what each model actually is and costs.

- `dev` (primary, GLM-5.3-Flash) — short, mechanical, well-scoped work
  only: navigation, simple edits, straightforward single-file bugs, boilerplate,
  small refactors, targeted tests. Never guesses at a visual/CSS/layout
  judgment call.
- `turbo` (primary, DeepSeek-V4-Pro-0813) — same role and permissions as `dev`,
  for explicit time crunches; see "Turbo mode" above.
- `strong-reasoner` (DeepSeek-V4-Pro-0813) — difficult bugs, architecture,
  concurrency, subtle state, security-sensitive reasoning, complex multi-file
  refactors, or a retry after `dev`'s first attempt failed. Read-only.
- `glm-specialist` (GLM-5.3) — an alternative implementation angle or specialist
  second opinion when another model's perspective would help. Read-only.
- `minimax-specialist` (MiniMax M3) — a second alternative-implementation angle,
  distinct from `glm-specialist`'s; also vision-capable for a second UI opinion when
  it's worth the extra call. Read-only.
- `third-reviewer` (GLM-5.2) — a third independent reasoning pass, for high-risk
  changes only (see "Multi-model review" below). Not a routine escalation target.
  Read-only.
- `kimi-reviewer` (Kimi-K3) — independent review, long-context reasoning over many
  files, finding omissions, second opinion on a risky change. Read-only.
- `ui-reviewer` (GLM-5.3-Flash) — any visual/CSS/layout/responsive judgment call.
  `dev` has no vision; route these here rather than guessing from the markup alone.
  Cheap — use it liberally, not just when it seems clearly warranted.
- `closer` (MiniMax M3, **edit-capable**) — a problem that's big, stuck (`dev`/
  `turbo` already tried and fell short), or spans enough files/context that it needs
  a large single pass. Actually fixes it directly, doesn't just describe a fix.
- `kimi-closer` (Kimi-K3, **edit-capable**) — last resort: `closer` already tried
  and failed, or the issue is big/urgent enough to justify the highest-cost call in
  the roster. `dev` asks the user before firing this one — see "Cost-aware
  delegation" below.

**Escalate when**: uncertainty remains after a targeted look, an architectural choice
has real consequences, a bug spans multiple abstractions, the first attempt failed,
security-sensitive logic is changing, concurrency/distributed behavior is involved, a
migration could destroy or alter data, a visual/UI judgment call is needed (always —
`dev` can't see it), or independent review meaningfully reduces risk on something
risky.

**Do not escalate for**: renaming, formatting, one-line fixes, simple CRUD,
straightforward tests, small doc edits, mechanical refactors, repo navigation. The
marginal quality gain doesn't justify the added latency/tokens/cost.

**Multi-model review** (`strong-reasoner` + `glm-specialist` + `third-reviewer`
propose independently → `kimi-reviewer` reviews → `dev` integrates and fixes →
targeted tests) is for high-risk changes only. Don't reach for three expensive/
mid-cost models routinely — `third-reviewer` in particular exists for this chain
specifically, not as a general-purpose escalation target.

## UI review workflow

For any visual/CSS/layout change, close the loop with actual pixels instead of
trusting the markup:

1. Screenshot the affected page(s)/component(s) at a couple of viewports (desktop +
   mobile) using Playwright — already a project dependency. Write or reuse a small
   script rather than screenshotting by hand each time.
2. Save the screenshots somewhere referenceable by path (a scratch/output directory
   is fine — they aren't sensitive).
3. Delegate to `ui-reviewer` with the screenshot paths, the touched CSS/markup
   files, and what changed, in the standard delegation-packet shape (see
   "Delegation format" below).
4. Apply its fixes, then re-run the screenshot script to confirm — don't assume the
   fix worked without looking again.

`ui-reviewer` is the cheapest vision model in the roster; run it after every visual
change rather than deciding case-by-case whether it's warranted.

## Cost-aware delegation

Match how liberally you delegate to what a call actually costs (see "Model
capability matrix" above for the numbers):

- **Cheap tier** (`dev`/`turbo`'s own models, `glm-specialist`,
  `minimax-specialist`, `ui-reviewer`, `closer`) — spawn freely, including in
  parallel, whenever it plausibly helps. Don't ration these; the whole point of
  having them is to use them.
- **Expensive tier** (`strong-reasoner`/`turbo`'s Pro-tier calls, `third-reviewer`,
  `kimi-reviewer`, and especially `kimi-closer`) — be picky. Use only when the
  value clearly justifies the cost, not as a routine reflex. Before a call that
  would be notably pricey — stacking multiple `kimi-reviewer`/`kimi-closer` calls,
  running the full multi-model review chain on something that isn't actually
  high-risk, or firing `kimi-closer` at all — use the `question` tool and ask the
  user first rather than assuming it's worth it. `kimi-closer` must never fire
  automatically; it always requires a human go-ahead.

## Delegation format

When `dev` delegates via the `task` tool, send a compact packet, not a transcript:

```text
TASK: <what needs solving>
RELEVANT FILES: <minimal list, paths only unless a snippet is essential>
OBSERVATIONS: <what you already found>
CONSTRAINTS: <project/security constraints that matter for this task>
CURRENT DIFF: <only if useful — a diff, not the whole file>
QUESTION: <the specific thing the specialist should answer>
```

For `ui-reviewer`, `closer`, or `kimi-closer`, extend RELEVANT FILES with screenshot
paths where relevant, and make OBSERVATIONS explicit about what was already tried
and how it fell short — these three exist specifically for cases where a first pass
wasn't enough.

Read-only advisors return a recommendation or patch strategy, not applied edits (they
can't edit — permission-enforced); `dev` remains responsible for integrating the
result and running the appropriate verification level. `closer`/`kimi-closer` return
an applied edit plus a summary of what changed and why; `dev` still runs verification
and still reviews the diff (see "Security rules" — their input isn't human-reviewed
before it lands).

## Definition of done

1. Requested behavior is implemented.
2. The smallest appropriate verification level (above) passes.
3. No unrelated files changed — check `git status` / `git diff` before calling it
   finished.
4. Diff reviewed for the actual intent, not just "it runs" — including, and
   especially, any edit `closer` or `kimi-closer` made directly.
5. No sensitive-path content was read, echoed, or sent to any model, ever.
6. Expensive/full test runs (`npm test`, `npm run check`, `npm run check:all`) only
   happened when Level 4 criteria were actually met.
7. Any pricier-tier call (`kimi-reviewer`, `third-reviewer` chain, `kimi-closer`)
   was actually worth its cost, not a reflexive escalation — see "Cost-aware
   delegation".
