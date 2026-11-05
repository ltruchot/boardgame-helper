// Claude Code PreToolUse hook: reads the tool call on stdin, exits 2 with the reasons on stderr to
// block it. Any internal error also blocks (fail closed).

import { readFileSync } from "node:fs";

import { readIdentity } from "../identity.ts";
import { blockReasons } from "../tool-call.ts";
import type { ToolCall } from "../tool-call.ts";

const BLOCK = 2;

function parseCall(raw: string): ToolCall & { readonly cwd: string } {
  const data: unknown = JSON.parse(raw);
  if (
    typeof data !== "object" ||
    data === null ||
    !("tool_name" in data) ||
    typeof data.tool_name !== "string"
  ) {
    throw new TypeError("PreToolUse payload without tool_name");
  }
  const input =
    "tool_input" in data && typeof data.tool_input === "object" && data.tool_input !== null
      ? data.tool_input
      : {};
  const cwd = "cwd" in data && typeof data.cwd === "string" ? data.cwd : process.cwd();
  return { tool: data.tool_name, input: { ...input }, cwd };
}

try {
  const call = parseCall(readFileSync(0, "utf8"));
  const projectDir = process.env["CLAUDE_PROJECT_DIR"] ?? call.cwd;
  const reasons = blockReasons(call, { projectDir, cwd: call.cwd, identity: readIdentity() });
  if (reasons.length > 0) {
    console.error(`Blocked by tools/guard (public repository rules):\n${reasons.join("\n")}`);
    process.exitCode = BLOCK;
  }
} catch (error: unknown) {
  console.error(
    `tools/guard failed, blocking the call: ${error instanceof Error ? error.message : "unknown error"}`,
  );
  process.exitCode = BLOCK;
}
