---
name: vp
description: Vite+ (vp) in this TypeScript monorepo (apps/*, packages/*, tools/*). Always `vp <command>` instead of pnpm/npm/node/vite/vitest/oxlint/tsc directly; strict lint and tsconfig, git hooks, the TypeScript LSP. Load before touching package.json, vite.config.ts, tsconfig*.json, pnpm-workspace.yaml, .vite-hooks/, or running install/build/dev/test.
globs:
  - "**/package.json"
  - "**/vite.config.ts"
  - "**/tsconfig*.json"
  - "pnpm-workspace.yaml"
  - ".vite-hooks/*"
---

# Vite+ here

Local docs: `node_modules/vite-plus/docs/guide/` (lint: `guide/lint.md`, hooks:
`guide/commit-hooks.md`). Online: <https://viteplus.dev/guide/>. Official agent text: `AGENTS.md`
(rewritten by `vp config`; project rules live in `CLAUDE.md`).

Vite+ 1.5.0 (pinned in the `pnpm-workspace.yaml` catalog) = Vite + Rolldown + Vitest 5 + Oxlint +
Oxfmt + tsgolint + tsdown, on TypeScript 7 (native). Vite+ owns Node (resolved from
`engines.node`) and pnpm (`devEngines`, 12.16.1): both downloaded on demand, no global install.

## Workspace

| Path             | What                                         | Key commands                                   |
| ---------------- | -------------------------------------------- | ---------------------------------------------- |
| `apps/website`   | Vite app                                     | `vp -C apps/website dev` / `build` / `preview` |
| `apps/api`       | Vite app using `@anthropic-ai/sdk` + `utils` | `vp -C apps/api dev` / `build`                 |
| `packages/utils` | library built with `vp pack` (tsdown)        | `vp -C packages/utils test` / `build`          |
| `tools/guard`    | secret/privacy/writing checks used by hooks  | `vp -C tools/guard test`                       |

Shared versions live in the `catalog:` of `pnpm-workspace.yaml`; a package lists
`"<dep>": "catalog:"`, workspace deps `"workspace:*"`. The root `vite.config.ts` owns `fmt`,
`lint` and `staged` for the whole workspace (Vite+ ignores nested lint/fmt blocks); a package's
`vite.config.ts` owns only its Vite/pack/test config.

## Rule #1: `vp <command>`, never the tool underneath

| Task                       | Command                                         | Notes                                                |
| -------------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| Install deps               | `vp install` (root)                             | after every pull; CI: `vp install --frozen-lockfile` |
| Add a dep                  | `vp -C <package> add <pkg>` (`-D` dev)          | then move the version to the catalog                 |
| Format + lint + type check | `vp check` / `vp check --fix` (root)            | whole workspace, type-aware lint on TS 7             |
| Tests                      | `vp -C <package> test`, all: `vp run -r test`   | Vitest; import from `vite-plus/test`                 |
| Build                      | `vp -C <package> build`, all: `vp run -r build` | `vp build` at the root needs a target package        |
| Everything ("done")        | `vp run ready`                                  | check → tests → builds                               |
| Run a TS/JS file           | `vpx <file>` (hooks, scripts, CI)               | no `tsx` / `ts-node`                                 |
| Outdated deps              | `vp outdated`                                   |                                                      |

`vp build` = the builtin; `vp run <name>` = a package.json script or task. Scripts cannot shadow
builtins.

## Strictness

- `tsconfig.base.json`: `strict` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noImplicitOverride`,
  `noUncheckedSideEffectImports`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, unused code and
  unreachable code as errors. Each package `tsconfig.json` extends it and adds only `lib`/`types`.
- Oxlint (root `vite.config.ts`): categories correctness, suspicious, pedantic and perf as errors,
  plus selected restriction/style rules (no `any`, no `!`, no unsafe assertion, explicit return
  types, readonly parameters, strict boolean expressions, exhaustive switch, complexity and size
  limits, kebab-case file names, no default export except `vite.config.ts`). Warnings fail the run
  (`denyWarnings`); unused disable directives are errors.
- A rule is relaxed only for a whole category of legitimate code, in `lint.overrides` or the rule
  options, with a comment that says why. Never per line.

## Git hooks

Vite+ owns the hook plumbing; the project only adds commands
(`node_modules/vite-plus/docs/guide/commit-hooks.md`).

| Piece         | Where                                 | Role                                                                                                                       |
| ------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Dispatcher    | `.vite-hooks/_/` (git-ignored)        | installed by `"prepare": "vp config"` on every `vp install`; sets `core.hooksPath`, puts `node_modules/.bin` first on PATH |
| `pre-commit`  | `.vite-hooks/pre-commit`              | the stock one-liner `vp staged`; never add commands here                                                                   |
| Staged checks | `staged` in the root `vite.config.ts` | lint-staged 17 rules: `"*": ["vpx tools/guard/src/bin/scan-staged.ts", "vp check --fix"]`                                  |
| `commit-msg`  | `.vite-hooks/commit-msg`              | `vpx tools/guard/src/bin/commit-msg.ts "$1"`: Vite+ has no config block for this hook, so the script is project-owned      |

How the `staged` rules run: for each glob, the array runs in order and stops at the first failure,
with the staged paths appended as arguments. The guard scan comes first so a secret is rejected
before `vp check --fix` rewrites and re-stages files. The glob `*` matches dotfiles, so a
force-added `.env` reaches the scan.

Adding a check: append a command to the `staged` array (it must accept file paths), or for
another git hook create `.vite-hooks/<hook>` (no shebang needed, the dispatcher runs it with
`sh`). TypeScript in a hook runs with `vpx <file>`: inside a hook `vp` is the project-local CLI,
which has no `vp node`.

Check the wiring: `vp hooks status` lists `Project hooks: commit-msg, pre-commit` and
`core.hooksPath: .vite-hooks/_`. Run a check by hand: `vpx tools/guard/src/bin/scan-staged.ts`
(every staged file) or `vpx tools/guard/src/bin/commit-msg.ts <message file>`.

Never `git commit --no-verify`, `VP_GIT_HOOKS=0` or `vp hooks disable`: the Claude Code hook
blocks them, and a failing check is fixed in the content.

## TypeScript LSP (Claude Code plugin `typescript-lsp`)

`.claude/settings.json` enables `typescript-lsp@claude-plugins-official`, which runs
`typescript-language-server` from PATH. TypeScript 7 ships no `tsserver`: the server reports the
workspace TS 7 as unusable and falls back to the TypeScript installed next to itself ("bundled").
One-time setup per machine:

```bash
vp install -g typescript-language-server
npm install -g --prefix "$(ls -d ~/.vite-plus/packages/typescript-language-server/*/ | head -1)" typescript@6
rm -f ~/.vite-plus/bin/tsc ~/.vite-plus/bin/tsserver ~/.vite-plus/bins/tsc.json ~/.vite-plus/bins/tsserver.json
```

The last line removes the global `tsc`/`tsserver` shims npm adds, so `tsc` stays the project's
TS 7. Redo the second and third lines after `vp update -g typescript-language-server`. Restart
Claude Code to start the server. Editor diagnostics come from TS 6; `vp check` and the builds
(TS 7) are the authority. TS 6 is never added to the workspace: a root `typescript@6` makes pnpm
create a second `vite-plus` copy, and `vp run -r test` then fails with
`Cannot read properties of undefined (reading 'config')`.

## Traps

| Symptom                                                                         | Cause                                                                                                  | Fix                                                                                          |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `TS4111: Property 'X' comes from an index signature`                            | `noPropertyAccessFromIndexSignature`                                                                   | `process.env["X"]`, not `process.env.X`                                                      |
| `no-unsafe-*` on `res.json()` / `JSON.parse`                                    | the platform returns `any`                                                                             | annotate `const data: unknown = …`, narrow with `typeof` / `in` guards, never cast           |
| `prefer-readonly-parameter-types` on a DOM element or event                     | DOM types are mutable                                                                                  | listed in the rule's `allow` (root `vite.config.ts`); add the type there if it is a DOM type |
| `no-array-callback-reference` on `.filter(fn)`                                  | the callback would receive index and array                                                             | `.filter((item) => fn(item))`                                                                |
| `\b` misses accented words in a regex                                           | `\b` is ASCII-only                                                                                     | `(?![\p{L}\p{N}_])` with the `u` flag                                                        |
| `vp build` at the root: `needs a target package`                                | root is a workspace                                                                                    | `vp -C apps/<app> build`                                                                     |
| `node: command not found`                                                       | Vite+ owns Node                                                                                        | `vpx <file>` or `vp node <file>`                                                             |
| `error: Command 'node' not found` in a git hook                                 | the hook dispatcher puts the project-local `vp` first on PATH; `vp node` exists only in the global CLI | `vpx <file>`                                                                                 |
| `vp install` asks to reinstall modules, pnpm prints an old version              | Vite+ in `system-first` mode runs the pnpm on PATH                                                     | `vp env on pnpm`; `vp env doctor` must show `Source devEngines.packageManager`               |
| `Could not find a valid TypeScript installation` from the LSP                   | no TS 6 next to the language server                                                                    | the one-time setup above                                                                     |
| `EBUSY` / `Device or resource busy` spawning `tsgolint` or `tsc` under `vp run` | script caching tracks files and cannot spawn static binaries                                           | keep `run.cache.scripts: false` (root `vite.config.ts`)                                      |
| A `console.log` in a test prints nothing                                        | the reporter hides test stdout                                                                         | log to a git-ignored file, read it after the run, remove the calls                           |

## Dev server under WSL

Use `server: { host: true, port, strictPort: true }` in an app's `vite.config.ts` so the editor
can forward the port and a busy port fails loudly. Stop a server by PID (`ss -ltnp | grep <port>`),
never `pkill -f <pattern>` (it matches the calling shell). `Port <n> is already in use` while
`ss -ltn` shows nothing: a Windows process holds it (`netstat.exe -ano -p tcp | grep ':<port> '`,
then `tasklist.exe /FI "PID eq <pid>"`); editors that auto-forward WSL ports keep them bound.
