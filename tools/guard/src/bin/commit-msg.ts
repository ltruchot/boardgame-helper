// Git commit-msg hook: `vpx tools/guard/src/bin/commit-msg.ts <message file>`.

import { readFileSync } from "node:fs";

import { checkCommitMessage } from "../commit-message.ts";
import { readIdentity } from "../identity.ts";
import { formatFindings } from "../patterns.ts";

const [messageFile] = process.argv.slice(2);
if (messageFile === undefined) {
  console.error("usage: commit-msg.ts <message file>");
  process.exitCode = 1;
} else {
  const findings = checkCommitMessage(readFileSync(messageFile, "utf8"), readIdentity());
  if (findings.length > 0) {
    console.error(
      `Commit message rejected (see .claude/skills/public-writing/SKILL.md):\n${formatFindings(findings)}`,
    );
    process.exitCode = 1;
  }
}
