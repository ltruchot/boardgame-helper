// Decides whether a Claude Code tool call is allowed. Pure: the hook entry point reads stdin, the
// identity and the project directory, then exits 2 with the returned reasons.

import { isAbsolute, relative, resolve } from "node:path";

import {
  checkPublicText,
  findPersonalData,
  findSecrets,
  formatFindings,
  isForbiddenPath,
} from "./patterns.ts";
import type { Identity } from "./patterns.ts";

export type ToolCall = { readonly tool: string; readonly input: Readonly<Record<string, unknown>> };
export type Context = {
  readonly projectDir: string;
  readonly cwd: string;
  readonly identity: Identity;
};

// `.env`, `.env.local`, `apps/api/.env`, `**/.env*`; not `process.env` or `.envrc`-like words.
const ENV_FILE = String.raw`(?:^|[\s"'=:/<>|;&(*])\.env(?:rc)?(?:\.[\w.*-]+)?(?=$|[\s"'/;&|)<>*])`;
const ENV_DUMP_COMMANDS: readonly string[] = [
  "printenv",
  "compgen -v",
  "declare -p",
  "declare -x",
  "export -p",
];
const SECRET_VARIABLE = /\$\{?[A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)[A-Z0-9_]*/u;
const HOOK_BYPASS =
  /--no-verify|\b(?:VP_GIT_HOOKS|HUSKY)=0\b|core\.hooksPath|\bvp hooks disable\b|\bgit\s+commit\b[^|;&"'$]*\s-[A-Za-z]*n[A-Za-z]*\b/u;
const RECURSIVE_GREP =
  /^(?:e|f)?grep\b.*\s(?:-[A-Za-z]*[rR][A-Za-z]*|--recursive|--dereference-recursive)\b/u;
const UNFILTERED_RG = /^rg\b.*\s(?:--no-ignore\S*|-u{1,3})(?:\s|$)/u;
const PUBLISH =
  /\b(?:git\s+(?:commit|tag)|gh\s+(?:pr|issue|release)\s+(?:create|edit|comment|review))\b/u;
const BODY_FILE = /\bgh\s+(?:pr|issue|release)\b.*\s(?:--body-file|-F)\s/u;

const PATH_KEYS: readonly string[] = ["file_path", "path", "notebook_path", "glob", "pattern"];

function mentionsEnvFile(text: string): boolean {
  return new RegExp(ENV_FILE, "u").test(text);
}

function stringField(input: Readonly<Record<string, unknown>>, key: string): string {
  const value = input[key];
  return typeof value === "string" ? value : "";
}

/** Shell segments split on `;`, `&&`, `||`, `|`, newlines and `$(`. */
function segments(command: string): readonly string[] {
  return command
    .split(/;|&&|\|\||\||\n|\$\(|`/u)
    .map((segment) => segment.trim().replace(/^(?:sudo\s+|[A-Z_][A-Z0-9_]*=\S*\s+)+/u, ""))
    .filter((segment) => segment !== "");
}

function isEnvDump(segment: string): boolean {
  if (/^(?:env|set|export)\s*$/u.test(segment) || /^env\s+-/u.test(segment)) {
    return true;
  }
  return ENV_DUMP_COMMANDS.some((dump) => segment === dump || segment.startsWith(`${dump} `));
}

// Text after a publishing command is a message, not shell code: only the part before it runs.
function shellReasons(command: string): readonly string[] {
  const code = command.slice(0, PUBLISH.exec(command)?.index ?? command.length);
  const parts = segments(code);
  const reasons: string[] = [];
  if (mentionsEnvFile(code)) {
    reasons.push(".env files are off-limits: never read, copy, grep or print them.");
  }
  if (parts.some((part) => isEnvDump(part)) || /[/]proc[/](?:self|\d+)[/]environ/u.test(code)) {
    reasons.push("Dumping the environment exposes secrets.");
  }
  if (SECRET_VARIABLE.test(command)) {
    reasons.push(
      "Commands must not expand secret variables (…KEY, …TOKEN, …SECRET): the code reads them.",
    );
  }
  if (HOOK_BYPASS.test(command)) {
    reasons.push(
      "Git hooks are mandatory: no --no-verify, -n, VP_GIT_HOOKS=0 or hooksPath change.",
    );
  }
  if (parts.some((part) => RECURSIVE_GREP.test(part) || UNFILTERED_RG.test(part))) {
    reasons.push(
      "Recursive grep reads ignored files such as .env: use the Grep tool or `git grep`.",
    );
  }
  if (BODY_FILE.test(command)) {
    reasons.push("Pass PR and issue bodies inline (--body) so they can be checked.");
  }
  return reasons;
}

function publishReasons(command: string, identity: Identity): readonly string[] {
  const start = PUBLISH.exec(command)?.index;
  if (start === undefined) {
    return [];
  }
  const findings = checkPublicText(command.slice(start), identity);
  return findings.length === 0
    ? []
    : [`Published text breaks the writing rules:\n${formatFindings(findings)}`];
}

function isInside(projectDir: string, path: string): boolean {
  const offset = relative(projectDir, path);
  return offset === "" || (!offset.startsWith("..") && !isAbsolute(offset));
}

function editText(edit: unknown): string {
  if (typeof edit !== "object" || edit === null || !("new_string" in edit)) {
    return "";
  }
  return typeof edit.new_string === "string" ? edit.new_string : "";
}

function writtenText(input: Readonly<Record<string, unknown>>): string {
  const edits: unknown = input["edits"];
  const fromEdits = Array.isArray(edits) ? edits.map((edit: unknown) => editText(edit)) : [];
  return [
    stringField(input, "content"),
    stringField(input, "new_string"),
    stringField(input, "new_source"),
    ...fromEdits,
  ].join("\n");
}

function writeReasons(call: ToolCall, context: Context): readonly string[] {
  const filePath = stringField(call.input, "file_path");
  const target = resolve(
    context.cwd,
    filePath === "" ? stringField(call.input, "notebook_path") : filePath,
  );
  if (!isInside(context.projectDir, target)) {
    return [];
  }
  if (isForbiddenPath(target)) {
    return ["This file holds secrets or local-only settings and must not be written."];
  }
  const relativePath = relative(context.projectDir, target);
  const identity = relativePath.startsWith("LICENSE") ? { tokens: [] } : context.identity;
  const findings = [
    ...findSecrets(writtenText(call.input)),
    ...findPersonalData(writtenText(call.input), identity),
  ];
  return findings.length === 0
    ? []
    : [`Content for a public repository contains:\n${formatFindings(findings)}`];
}

/** Reasons to block the call; empty when it is allowed. */
export function blockReasons(call: ToolCall, context: Context): readonly string[] {
  if (call.tool === "Bash") {
    const command = stringField(call.input, "command");
    return [...shellReasons(command), ...publishReasons(command, context.identity)];
  }
  const pathReasons = PATH_KEYS.some((key) => mentionsEnvFile(stringField(call.input, key)))
    ? [".env files are off-limits: never read, search or write them."]
    : [];
  const isWrite = ["Write", "Edit", "MultiEdit", "NotebookEdit"].includes(call.tool);
  return [...pathReasons, ...(isWrite ? writeReasons(call, context) : [])];
}
