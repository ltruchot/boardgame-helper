// Checks text meant for publication (PR body, release notes, docs) read from stdin.
// `vpx tools/guard/src/bin/check-text.ts < body.md`

import { readFileSync } from "node:fs";

import { readIdentity } from "../identity.ts";
import { checkPublicText, formatFindings } from "../patterns.ts";

const findings = checkPublicText(readFileSync(0, "utf8"), readIdentity());
if (findings.length > 0) {
  console.error(`Text rejected:\n${formatFindings(findings)}`);
  process.exitCode = 1;
} else {
  console.info("Text passes the public writing checks.");
}
