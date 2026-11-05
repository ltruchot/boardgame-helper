import { checkPublicText } from "./patterns.ts";
import type { Finding, Identity } from "./patterns.ts";

const MAX_HEADER_LENGTH = 72;
const TYPES = "feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert";
const HEADER = new RegExp(String.raw`^(?:${TYPES})(?:\([a-z0-9-]+(?:,[a-z0-9-]+)*\))?!?: \S`, "u");
const GENERATED_HEADER = /^(?:Merge |Revert "|(?:fixup|squash|amend)! )/u;
const SCISSORS = "# ------------------------ >8 ------------------------";

/** The message as git will store it: comments and the verbose diff removed. */
export function cleanMessage(raw: string): string {
  const [beforeScissors = ""] = raw.split(SCISSORS);
  return beforeScissors
    .split("\n")
    .filter((line) => !line.startsWith("#"))
    .join("\n")
    .trim();
}

function formatProblems(message: string): readonly Finding[] {
  const [header = "", separator] = message.split("\n");
  if (GENERATED_HEADER.test(header)) {
    return [];
  }
  const problems: Finding[] = [];
  if (!HEADER.test(header)) {
    problems.push({
      rule: "format/conventional-commit",
      excerpt: `"${header}" is not "type(scope): summary" (${TYPES})`,
    });
  }
  if (header.length > MAX_HEADER_LENGTH) {
    problems.push({
      rule: "format/header-length",
      excerpt: `${String(header.length)} > ${String(MAX_HEADER_LENGTH)} characters`,
    });
  }
  if (header.endsWith(".")) {
    problems.push({ rule: "format/header-period", excerpt: "the summary ends with a period" });
  }
  if (separator !== undefined && separator.trim() !== "") {
    problems.push({
      rule: "format/blank-line",
      excerpt: "the body must be separated from the summary by a blank line",
    });
  }
  return problems;
}

export function checkCommitMessage(raw: string, identity: Identity): readonly Finding[] {
  const message = cleanMessage(raw);
  if (message === "") {
    return [{ rule: "format/empty", excerpt: "the commit message is empty" }];
  }
  return [...formatProblems(message), ...checkPublicText(message, identity)];
}
