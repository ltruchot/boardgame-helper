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

## Rulebooks

The exercises send Brass: Lancashire rulebooks to the API as documents. The PDF rulebooks are
copyrighted, so they are git-ignored: download them from the
[Brass: Lancashire files on BoardGameGeek](https://boardgamegeek.com/boardgame/28720/brass-lancashire/files)
into `apps/api/assets/` under the names below.

| File in `apps/api/assets/`            | Content                                                |
| ------------------------------------- | ------------------------------------------------------ |
| `brass-player-aid-2-sided.pdf`        | two-page player aid                                    |
| `brass-lancashire-precise-aid.md`     | text summary: tile costs, actions, scoring (committed) |
| `brass-restructured-rules-v2.pdf`     | condensed rules, no examples                           |
| `brass-lancashire-official-rules.pdf` | publisher rulebook                                     |

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
narrate instead of describing the change. Rules: [`AGENTS.md`](AGENTS.md),
[`.claude/skills/public-writing`](.claude/skills/public-writing/SKILL.md).
