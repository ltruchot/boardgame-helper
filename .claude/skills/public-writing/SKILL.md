---
name: public-writing
description: Rules and checks for any text published from this public repo — commit messages, PR titles and descriptions, issue and review comments, release notes, code comments, log and error messages, docs. Load before writing or editing any of them.
---

# Writing for a public repository

Every text describes the code, never the people or the conversation that produced it. A reader
who never saw the session must understand the change from the text alone.

## What to write

- **What** changes, in terms of behavior or structure.
- **Why**: the problem, constraint or fact that makes the change necessary.
- **How**, only when the code is complex enough that a reader would get it wrong: an algorithm, an
  ordering constraint, a workaround for a named upstream bug (link the issue).
- Facts that stay true: versions, limits, error messages, measured numbers with their unit.

## Never

| Forbidden                         | Example                                                            | Write instead                                               |
| --------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| People, roles, names              | "the user wants", "the developer thinks", a name, "@someone said"  | the requirement itself: "Scores persist across reloads"     |
| The conversation                  | "as requested", "as discussed", "after discussion", "per feedback" | nothing: state the change                                   |
| Deliberation, history of attempts | "tried X then Y", "decided to", "we chose"                         | the result and its reason: "Uses X: Y has no streaming API" |
| The agent                         | "Claude suggested", "the assistant", "I"                           | nothing                                                     |
| Hedging, filler                   | "seems to", "hopefully", "basically", "just", "honest"             | a definite statement, or a test that proves it              |
| Personal data                     | emails, home paths, machine names, session links, account IDs      | placeholders: `<user>`, `example.com`, repo-relative paths  |
| Secrets and env values            | any key, token, `.env` content, an expanded variable               | the variable name only: `ANTHROPIC_API_KEY`                 |

## Formats

**Commit** (Conventional Commits, checked by `.vite-hooks/commit-msg`):

```text
type(scope): summary in the imperative, ≤ 72 characters, no period

Why the change is needed, wrapped near 72 columns. How, only if complex.

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: `feat fix docs style refactor perf test build ci chore revert`; scope = the package or area
(`api`, `website`, `utils`, `guard`, `deps`). `!` after the scope marks a breaking change.

**PR**: title = the commit summary format. Body: `## Summary` (what and why, bullets), `## Test
plan` (commands run and their result). Pass the body inline (`gh pr create --body "…"`, a heredoc
is fine); `--body-file` is blocked because the hook cannot check it.

**Code comment**: why the code is this way, or a constraint the code cannot express. Not what the
next line does, not its history. Prefer a better name over a comment.

**Log and error message**: the event and the data needed to act, for example
`Missing environment variable ANTHROPIC_API_KEY (see README)`. Never a value read from the
environment, never a full request body that may contain a key.

## Examples

| Bad                                                           | Good                                                                                             |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `fix: as discussed, the dev wanted me to fix the cache thing` | `fix(api): expire cached responses after 5 minutes`                                              |
| `feat: I think streaming is better so I added it`             | `feat(api): stream model output to the page` + body `Long answers left the page blank for 20 s.` |
| `// tried a Map first but it leaked, so WeakMap`              | `// WeakMap: entries die with their game object.`                                                |
| `console.log("key is", process.env["ANTHROPIC_API_KEY"])`     | `throw new Error("Missing environment variable ANTHROPIC_API_KEY")`                              |

## Check before publishing

```bash
vpx tools/guard/src/bin/check-text.ts < <file with the text>
```

It runs the same detectors as the hooks (secrets, personal data, narration in English and French).
Narration detection is a safety net, not the rule: read the text against the table above.
