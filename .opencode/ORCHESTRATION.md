# OpenCode multi-model orchestration policy

This file governs how OpenCode agents behave in this repo. It is loaded into every
agent's context automatically (`instructions` in `opencode.jsonc`). See
`opencode.jsonc` for the actual model IDs and permission enforcement — this file is
policy/behavior, the config is the technical enforcement. Read `AGENTS.md` first for
project conventions (build/test commands, architecture); this file is about *how to
work*, not *what the site does*.

## Reality check: there is no "local model" here

Every model configured for this project (`dev`'s default, `strong-reasoner`,
`glm-specialist`, `kimi-reviewer`) is a **Together AI cloud call**. None of them run
on this machine. "Local/trusted" in this policy means "the primary agent the human is
watching turn-by-turn"; it does not mean the data stays on-device. Treat *every*
prompt sent to *any* of these agents as data that leaves the machine. That is why the
sensitive-path denials below are hard `deny`, not `ask` — an approved "ask" would
still ship the file content to Together AI.

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

## Testing policy — progressive verification

Do not reflexively run `npm test` or `npm run check`. This repo's `test` script
builds the Cloudflare *and* static artifacts twice — it's expensive. Escalate through
these levels and stop as soon as you have enough signal:

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

Never rerun a broad suite that nothing has invalidated since the last run.

## Security rules

**Sensitive paths** (hard `deny` for read/edit/grep/glob, enforced in
`opencode.jsonc`, not just written here as a suggestion): `.env`, `.env.*` (except
`.env.example`), `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.crt`, `*.tfstate*`,
`**/secrets/**`, `**/secrets*`, `**/credentials*`, `**/.ssh/**`, `**/.aws/**`,
`**/.config/gcloud/**`, `**/.docker/config.json`, `**/.kube/config`, `**/.netrc`,
`**/.git-credentials`. `**/.npmrc` is `ask` (repo's root `.npmrc` is committed and
non-secret today, but treat any edit/exfil attempt as worth a human look).

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
   is fully `deny`d for the three specialist subagents specifically because their
   inputs are automated (no human eyeballing each proposed command), which is the
   only place this gap actually matters — `dev` defaults bash to `allow`
   (low-friction by design; see below), so this gap is real for `dev` and not
   just theoretical. Nothing sensitive lives outside the hard-denied secret
   patterns, so the residual risk is accepted deliberately, not overlooked.

**Remote/specialist subagents** (`strong-reasoner`, `glm-specialist`,
`kimi-reviewer`) additionally get, unconditionally: `bash: deny`, `edit: deny`,
`task: deny` (no further sub-delegation), `external_directory: deny`,
`webfetch: deny`, `websearch: deny`. They are read-only advisors — they receive a
delegation packet, read what they need (minus sensitive paths), and return
recommendations as text. `dev` integrates and applies changes.

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
  normal serial strong-reasoner → kimi-reviewer chain.
- **Model**: runs on `DeepSeek-V4-Pro-0813` instead of `dev`'s cheaper
  default, trading cost for a better one-shot answer under time pressure.

**Never relaxed in turbo mode**: the security rules and sensitive-path
denies, the "ask, don't guess" policy above, and the definition-of-done check
that no unrelated files changed. Turbo trades verification depth and
delegation latency for speed — it does not trade away safety or correctness
checks on the diff itself.

## Model escalation rules

- `dev` (primary agent, `togetherai/deepseek-ai/DeepSeek-V4-Flash-0731` — a
  separate agent from OpenCode's built-in `build`/`plan`; start with
  `opencode --agent dev` or Tab-cycle to it) — handles navigation, simple edits,
  straightforward bugs, boilerplate, small refactors, targeted tests, and decides
  whether to escalate. Low-friction: bash and external_directory default to
  `allow` for this agent instead of `ask` (see "Security rules" below) — only
  secret-file access and a short list of irreversible commands are blocked.
- `turbo` (primary agent, `togetherai/deepseek-ai/DeepSeek-V4-Pro-0813`) — same
  permissions and role as `dev`, but for explicit time crunches; see "Turbo
  mode" above for exactly what changes.
- `strong-reasoner` (`togetherai/deepseek-ai/DeepSeek-V4-Pro-0813`) — difficult bugs,
  architecture, concurrency, subtle state, security-sensitive reasoning, complex
  multi-file refactors, or tasks where `dev`'s first attempt failed.
- `glm-specialist` (`togetherai/zai-org/GLM-5.3`) — an alternative implementation
  angle or specialist second opinion when another model's perspective would help.
- `kimi-reviewer` (`togetherai/moonshotai/Kimi-K3`) — independent review, long-context
  reasoning over many files, finding omissions, second opinion on a risky change.

**Escalate when**: uncertainty remains after a targeted look, an architectural choice
has real consequences, a bug spans multiple abstractions, the first attempt failed,
security-sensitive logic is changing, concurrency/distributed behavior is involved, a
migration could destroy or alter data, or independent review meaningfully reduces
risk on something risky.

**Do not escalate for**: renaming, formatting, one-line fixes, simple CRUD,
straightforward tests, small doc edits, mechanical refactors, repo navigation. The
marginal quality gain doesn't justify the added latency/tokens/cost.

**Multi-model review** (`strong-reasoner` proposes → `kimi-reviewer` reviews →
`dev` integrates and fixes → targeted tests) is for high-risk changes only. Don't
reach for two expensive models routinely.

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

The specialist returns a recommendation or patch strategy, not applied edits (they
can't edit — permission-enforced). `dev` remains responsible for integrating the
result and running the appropriate verification level.

## Definition of done

1. Requested behavior is implemented.
2. The smallest appropriate verification level (above) passes.
3. No unrelated files changed — check `git status` / `git diff` before calling it
   finished.
4. Diff reviewed for the actual intent, not just "it runs."
5. No sensitive-path content was read, echoed, or sent to any model, ever.
6. Expensive/full test runs (`npm test`, `npm run check`, `npm run check:all`) only
   happened when Level 4 criteria were actually met.
