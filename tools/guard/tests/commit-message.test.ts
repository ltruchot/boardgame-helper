import { describe, expect, it } from "vite-plus/test";

import { checkCommitMessage, cleanMessage } from "../src/commit-message.ts";
import { homePath, identity, sessionLink } from "./fixtures.ts";

const rules = (message: string): readonly string[] =>
  checkCommitMessage(message, identity).map((finding) => finding.rule);

describe("checkCommitMessage format", () => {
  it.each([
    "feat(api): stream Claude responses to the page",
    "fix: keep the retry delay under the rate limit\n\nThe API returns 429 when two requests overlap.",
    "chore(deps)!: move to Vite+ 1.5\n\nCo-Authored-By: Claude <noreply@anthropic.com>",
    "Merge branch 'main' into feature",
  ])("accepts %s", (message) => {
    expect(rules(message)).toStrictEqual([]);
  });

  it.each([
    ["Add a cache", "format/conventional-commit"],
    ["feat: add a cache.", "format/header-period"],
    [`feat: ${"x".repeat(80)}`, "format/header-length"],
    ["feat: add a cache\nwithout blank line", "format/blank-line"],
    ["# only a comment", "format/empty"],
  ])("rejects %s", (message, rule) => {
    expect(rules(message)).toContain(rule);
  });
});

describe("checkCommitMessage content", () => {
  it.each([
    ["fix: the developer thinks the cache is stale", "narration/developer"],
    [`docs: link ${sessionLink}`, "personal/session-link"],
    [`fix: read config from ${homePath}`, "personal/home-path"],
    ["docs: thanks Ada for the review", "personal/author-identity"],
  ])("rejects %s", (message, rule) => {
    expect(rules(message)).toContain(rule);
  });
});

describe("cleanMessage", () => {
  it("drops comments and the verbose diff", () => {
    const raw =
      "feat: x\n# comment\n# ------------------------ >8 ------------------------\ndiff --git a b";
    expect(cleanMessage(raw)).toBe("feat: x");
  });
});
