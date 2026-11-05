// First `staged` command of the root vite.config.ts (run by `vp staged` in the pre-commit hook):
// blocks secret files, and secrets or personal data in the staged added lines. `vp staged` passes
// the staged paths as arguments; without arguments every staged file is scanned.

import { execFileSync } from "node:child_process";

import { readIdentity } from "../identity.ts";
import { findPersonalData, findSecrets, formatFindings, isForbiddenPath } from "../patterns.ts";
import type { Identity } from "../patterns.ts";
import { parseAddedLines } from "../staged.ts";
import type { AddedLine } from "../staged.ts";

const MAX_BUFFER = 256 * 1024 * 1024;

function git(args: readonly string[]): string {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: MAX_BUFFER });
}

function lineProblems(added: AddedLine, identity: Identity): readonly string[] {
  // A license names its copyright holder by design.
  const author = added.file.startsWith("LICENSE") ? { tokens: [] } : identity;
  const findings = [...findSecrets(added.text), ...findPersonalData(added.text, author)];
  return findings.length === 0
    ? []
    : [`${added.file}:${String(added.line)}\n${formatFindings(findings)}`];
}

const pathspec = ["--", ...process.argv.slice(2)];
const staged = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z", ...pathspec])
  .split("\0")
  .filter((file) => file !== "");
const forbidden = staged
  .filter((file) => isForbiddenPath(file))
  .map((file) => `${file}: secret or local-only file`);
const identity = readIdentity();
const added = parseAddedLines(
  git([
    "diff",
    "--cached",
    "--unified=0",
    "--no-color",
    "--no-ext-diff",
    "--diff-filter=ACMR",
    ...pathspec,
  ]),
);
const problems = [...forbidden, ...added.flatMap((line) => lineProblems(line, identity))];

if (problems.length > 0) {
  console.error(`Commit blocked: secrets or personal data staged.\n${problems.join("\n")}`);
  process.exitCode = 1;
}
