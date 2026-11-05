# boardgame-helper

Experiments with the Claude API for board game assistance, in a Vite+ TypeScript monorepo.

| Path             | Content                                                          |
| ---------------- | ---------------------------------------------------------------- |
| `apps/website`   | Vite web app                                                     |
| `apps/api`       | Node script running Claude API exercises (`@anthropic-ai/sdk`)   |
| `packages/utils` | shared helpers                                                   |
| `tools/guard`    | checks that keep secrets and personal data out of the repository |

## Setup

Requires the [Vite+ CLI](https://viteplus.dev/guide/) (`vp`); it provides Node.js and pnpm.

```bash
vp install
```

## Environment variables

Read from the environment or from a git-ignored `.env` file. Never commit them and never expose
them to browser code (Vite inlines `VITE_*` variables into the bundle).

| Name                | Used by    | Purpose        |
| ------------------- | ---------- | -------------- |
| `ANTHROPIC_API_KEY` | `apps/api` | Claude API key |

## Development

```bash
vp run dev          # website dev server
vp run api          # Claude API exercises, rerun on every saved change (each run calls the API)
vp check            # format, lint, type check
vp run -r test      # tests
vp run ready        # everything above plus the builds
```

## Contributing

Commits follow [Conventional Commits](https://www.conventionalcommits.org/). The `pre-commit` and
`commit-msg` hooks (installed by `vp install`) reject secrets, personal data and messages that
narrate instead of describing the change. Rules: [`CLAUDE.md`](CLAUDE.md),
[`.claude/skills/public-writing`](.claude/skills/public-writing/SKILL.md).
