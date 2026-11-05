# boardgame-helper

> Session handoff: read `TODO.md` first — where the last session stopped, and what is left.
> Open a `todo/` file only for the item you work on. An item done → delete its line and its `todo/` file.

Public monorepo for Claude API experiments. Everything committed, pushed or posted (code, commits,
PRs, issues, comments, logs, docs) is public. Everything is written in English.

@AGENTS.md

## 1. Secrets and privacy

- **Never open, search, copy, print or quote a `.env*` file**, whatever the reason, including to
  debug a missing variable. The code reads secrets from `process.env["NAME"]`; the README lists the
  variable names. A missing variable is reported by name, never by value.
- Never print the environment (`env`, `printenv`, `export -p`) or expand a secret variable in a
  command (`echo $ANTHROPIC_API_KEY`, `curl -H "x-api-key: $…"`).
- No personal data anywhere in the repository or in anything posted: no names, emails, usernames,
  absolute home paths, machine names, session links, private URLs or account IDs. Use placeholders
  (`<user>`, `example.com`) and repository-relative paths.
- A secret never reaches browser code: no `VITE_*` variable holds one (Vite inlines them in the
  bundle); calls that need a key run server-side.
- No secret, key, token or credential in code, tests, fixtures or docs. A test that needs one builds
  a fake value at runtime (`tools/guard/tests/fixtures.ts`).
- Enforced by `tools/guard`: the Claude Code `PreToolUse` hook (`.claude/settings.json`), the git
  `pre-commit` and `commit-msg` hooks (`.vite-hooks/`). A block is fixed in the content, never
  worked around: no `--no-verify`, no `VP_GIT_HOOKS=0`, no `vp hooks disable`.
- The hook reads the whole text of a Bash command, heredocs included: a command whose text
  mentions `.env` or a hook bypass (`--no-verify`, `VP_GIT_HOOKS=0`) is blocked even when it only
  writes that word into a file. Write such files with Write/Edit: their content is checked for
  secrets and personal data only.

## 2. Writing: commits, PRs, comments, logs, docs

Load the skill `public-writing` before writing any of them. In short:

- Describe the code and its behavior: **what** changes and **why**. Add **how** only when the code
  is complex enough that a reader would otherwise get it wrong.
- Never mention people or roles (names, "the user said", "the developer thinks"), the
  conversation ("as requested", "after discussion"), deliberation, abandoned attempts, or the
  agent. No hedging, no filler, no first person.
- Commits follow Conventional Commits: `type(scope): summary` (≤ 72 characters, no period), blank
  line, body that explains the why.

Bad: `fix: as the developer asked, I tried a few things and the cache seems better now`
Good: `fix(api): cache model responses for 5 minutes` + body `Repeated prompts hit the rate limit
during a game turn.`

## 3. Strict TypeScript

Compiler (`tsconfig.base.json`) and Oxlint (root `vite.config.ts`) run at maximum strictness.

- No `any`, no `as` cast, no `!` non-null assertion, no `@ts-ignore` / `@ts-expect-error`, no
  `oxlint-disable` comment. Data from outside (JSON, API responses, env) is `unknown` and narrowed
  with type guards.
- Never relax a lint rule, a tsconfig flag or a test to make code pass: change the code. A rule
  that blocks legitimate code is changed in `vite.config.ts` with a comment that states why.
- Explicit return types, readonly parameters, exhaustive `switch`, no floating promises.

## 4. Done

`vp run ready` passes (`vp check`, then `vp run -r test`, then `vp run -r build`). The skill `vp`
covers the toolchain.
