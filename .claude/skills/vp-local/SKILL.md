---
name: vp-local
description: This repo's Vite+ setup, on top of the shared `vp` skill - the workspace and its packages, the Node app in apps/api, the strict tsconfig and lint, the git hooks and tools/guard, the TypeScript LSP plugin, and the traps met here. Load with `vp` before touching package.json, vite.config.ts, tsconfig*.json, pnpm-workspace.yaml, .vite-hooks/, or running install/build/dev/test.
paths:
  - "**/package.json"
  - "**/vite.config.ts"
  - "**/tsconfig*.json"
  - "pnpm-workspace.yaml"
  - ".vite-hooks/*"
---

# Vite+ in this repo

The `vp` skill holds what is true of Vite+ anywhere; it is installed by `qol-mini` and never
edited here (`.claude/qol-mini.lock.json`). This file holds what is true of this repo only.

Vite+ 1.5.0 (pinned in the `pnpm-workspace.yaml` catalog), on TypeScript 7 (native). Vite+ owns
Node and pnpm, both pinned in the root `package.json` `devEngines` (`runtime` Node 26.13.0,
written by `vp env pin`; `packageManager` pnpm 12.16.1) and downloaded on demand, no global
install. `engines.node` (`^22.22.1 || ^24.11.0 || >=26.0.0`) states the range the toolchain
supports: `vpx` needs `^22.18.0 || ^24.11.0 || >=26.0.0`, `vp staged` 22.22.1+ or 24.11.0+. Official agent text: `AGENTS.md` (rewritten by `vp config`; project rules
live in `CLAUDE.md`).

## Workspace

| Path             | What                                                                        | Key commands                                                              |
| ---------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `apps/website`   | Vite app                                                                    | `vp -C apps/website dev` / `build` / `preview`                            |
| `apps/api`       | Node script (no Vite) running Claude API exercises with `@anthropic-ai/sdk` | `vp run api` (root, reruns on change) / `vp -C apps/api run start` (once) |
| `packages/utils` | library built with `vp pack` (tsdown)                                       | `vp -C packages/utils test` / `build`                                     |
| `tools/guard`    | secret/privacy/writing checks used by hooks                                 | `vp -C tools/guard test`                                                  |

- The root `vite.config.ts` owns `fmt`, `lint` and `staged` for the whole workspace; a
  package's `vite.config.ts` owns only its Vite/pack/test config.
- Everything ("done"): `vp run ready` = check → tests → builds. All tests: `vp run -r test`,
  all builds: `vp run -r build`.

## `apps/api`, the Node app

`apps/api` is the reference for a Node app without Vite (shared skill, "A Node app without
Vite"). What is specific to it:

- Root entry: `"api": "vp run api#dev"` in the root `package.json`, so `vp run api` starts it.
- `src/main.ts` runs once and exits: it picks `claude-haiku-4-5-20251001` from the model list,
  then runs each exercise (`src/ex<NN>-<name>/index.ts`, a function taking the client and the
  model) and prints the text blocks with `printResponse` (`src/utils.ts`). In `dev`,
  `vpx --watch` reruns it on every saved change: each rerun calls the API.
- `new Anthropic()` reads `ANTHROPIC_API_KEY` from the environment, loaded from the git-ignored
  `apps/api/.env` by `--env-file-if-exists`.
- `tsconfig.json`: `lib: ["es2023"]`, `types: ["node"]`.
- Lint: print with `process.stdout.write` (`no-console` applies outside `tools/**/src/bin`);
  failures `throw new Error(…)` at the top level, which exits with code 1. The SDK's `Anthropic`,
  `ModelInfo` and `Message` are mutable: they are in the `prefer-readonly-parameter-types` allow
  list (root `vite.config.ts`).

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

| Piece         | Where                                 | Role                                                                                                                  |
| ------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `pre-commit`  | `.vite-hooks/pre-commit`              | the stock one-liner `vp staged`; never add commands here                                                              |
| Staged checks | `staged` in the root `vite.config.ts` | `"*": ["vpx tools/guard/src/bin/scan-staged.ts", "vp check --fix"]`                                                   |
| `commit-msg`  | `.vite-hooks/commit-msg`              | `vpx tools/guard/src/bin/commit-msg.ts "$1"`: Vite+ has no config block for this hook, so the script is project-owned |

- The guard scan comes first so a secret is rejected before `vp check --fix` rewrites and
  re-stages files. The glob `*` matches dotfiles, so a force-added `.env` reaches the scan.
- `vp hooks status` lists `Project hooks: commit-msg, pre-commit` and
  `core.hooksPath: .vite-hooks/_`. Run a check by hand:
  `vpx tools/guard/src/bin/scan-staged.ts` (every staged file) or
  `vpx tools/guard/src/bin/commit-msg.ts <message file>`.
- The Claude Code hook blocks `git commit --no-verify`, `VP_GIT_HOOKS=0` and `vp hooks disable`.

## TypeScript LSP

`.claude/settings.json` enables `typescript-lsp@claude-plugins-official`. The one-time setup per
machine for TypeScript 7 is in the shared skill, `references/editor.md`. Restart Claude Code to
start the server.

## Traps met here

| Symptom                                                                         | Cause                                                                     | Fix                                                                                                   |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `prefer-readonly-parameter-types` on a DOM element or event                     | DOM types are mutable                                                     | listed in the rule's `allow` (root `vite.config.ts`); add the type there if it is a DOM type          |
| `no-array-callback-reference` on `.filter(fn)`                                  | the callback would receive index and array                                | `.filter((item) => fn(item))`                                                                         |
| `\b` misses accented words in a regex                                           | `\b` is ASCII-only                                                        | `(?![\p{L}\p{N}_])` with the `u` flag                                                                 |
| `EBUSY` / `Device or resource busy` spawning `tsgolint` or `tsc` under `vp run` | script caching tracks files and cannot spawn static binaries              | keep `run.cache.scripts: false` (root `vite.config.ts`)                                               |
| oxc-vscode#418 workaround (shared skill, `references/editor.md`)                | the standalone `oxfmt` reads each folder's `vite.config.ts` as plain data | keep the root `vite.config.ts` free of functions and Vite plugins: they belong in the package configs |
