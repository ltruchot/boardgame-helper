import { describe, expect, it } from "vite-plus/test";

import { blockReasons } from "../src/tool-call.ts";
import type { Context } from "../src/tool-call.ts";
import { fakeAnthropicKey, identity, personalEmail } from "./fixtures.ts";

const context: Context = { projectDir: "/repo", cwd: "/repo", identity };
const bash = (command: string): readonly string[] =>
  blockReasons({ tool: "Bash", input: { command } }, context);

describe("Bash commands", () => {
  it.each([
    "cat .env",
    "cd apps/api && head -5 .env.local",
    "cp .env /tmp/x",
    "printenv",
    "env",
    "env | grep KEY",
    "export -p",
    "cat /proc/self/environ",
    "echo $ANTHROPIC_API_KEY",
    'curl -H "x-api-key: ${ANTHROPIC_API_KEY}" https://api.anthropic.com',
    "git commit --no-verify -m 'feat: x'",
    "git commit -nm 'feat: x'",
    "VP_GIT_HOOKS=0 git commit -m 'feat: x'",
    "git config core.hooksPath /dev/null",
    "grep -rn KEY .",
    "rg --no-ignore token",
    "gh pr create --title x --body-file body.md",
    "git commit -m 'fix: the developer thinks so'",
    `cd /repo && gh pr create --title "feat: x" --body "Contact ${personalEmail}"`,
  ])("blocks %s", (command) => {
    expect(bash(command)).not.toHaveLength(0);
  });

  it.each([
    "vp check",
    "env NODE_ENV=test vp test",
    "git grep -n process.env",
    "rg --hidden token",
    "git commit -m 'chore: ignore .env files'",
    "git log --oneline -n 5",
    'gh pr create --title "feat(api): stream responses" --body "Streams Claude output."',
  ])("allows %s", (command) => {
    expect(bash(command)).toStrictEqual([]);
  });
});

describe("file tools", () => {
  it.each([
    { tool: "Read", input: { file_path: "/repo/.env" } },
    { tool: "Grep", input: { pattern: "KEY", glob: "**/.env*" } },
    { tool: "Glob", input: { pattern: "apps/*/.env.*" } },
    { tool: "Write", input: { file_path: "/repo/README.md", content: `key ${fakeAnthropicKey}` } },
    { tool: "Edit", input: { file_path: "/repo/src/a.ts", new_string: `// by ${personalEmail}` } },
    { tool: "Write", input: { file_path: "/repo/certs/dev.pem", content: "x" } },
  ])("blocks $tool $input.file_path", (call) => {
    expect(blockReasons(call, context)).not.toHaveLength(0);
  });

  it.each([
    { tool: "Read", input: { file_path: "/repo/src/env.ts" } },
    { tool: "Write", input: { file_path: "/repo/LICENSE", content: "Copyright Ada Lovelace" } },
    { tool: "Write", input: { file_path: "/elsewhere/notes.md", content: personalEmail } },
  ])("allows $tool $input.file_path", (call) => {
    expect(blockReasons(call, context)).toStrictEqual([]);
  });
});
