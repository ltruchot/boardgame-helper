# TODO

## Where we stopped

Nothing in progress on the tooling: `main` is pushed (`dacc002`), `vp run ready` passes.

- `apps/api/src/main.ts` has an uncommitted local edit (the calls to exercises 1 and 2 are
  commented out): work in progress on the exercises, not part of any commit yet.
- Format on save in Cursor works through the oxc-vscode#418 workaround (machine settings, not
  in the repo): `"oxc.path.oxfmt": "${userHome}/.vite-plus/bin/oxfmt"` in
  `~/.cursor-server/data/Machine/settings.json`, with `oxfmt@0.76.0` installed by
  `vp install -g`. Verified: the server starts, files of this repo format on save.
- TypeScript LSP plugin: `typescript-language-server` (global) falls back to TS 6 installed next
  to it; verified over stdio. Setup per machine: shared skill `vp`, `references/editor.md`.

## Later

- Drop each `minimumReleaseAgeExclude` line of `pnpm-workspace.yaml` once its version is three days old: `@anthropic-ai/sdk@1.4.0` from 2026-11-06, the Vite+ 1.5.0 toolchain from 2026-11-07; then `vp install` must still pass.
- Remove the `oxc.path.oxfmt` machine setting and `vp uninstall -g oxfmt` once oxc-vscode#418 is fixed in a release; check `vp toolchain oxfmt` still matches if kept meanwhile.
- `apps/api` production run: choose `vpx src/main.ts` (`start`) or a `vp pack` bundle when a deployment target exists.
