import { describe, expect, it } from "vite-plus/test";

import { parseAddedLines } from "../src/staged.ts";

const diff = [
  "diff --git a/src/a.ts b/src/a.ts",
  "--- a/src/a.ts",
  "+++ b/src/a.ts",
  "@@ -3,0 +4,2 @@",
  "+const a = 1;",
  "+const b = 2;",
  "@@ -10 +12 @@",
  "-old",
  "+new",
  "diff --git a/b.md b/b.md",
  "--- /dev/null",
  "+++ b/b.md",
  "@@ -0,0 +1 @@",
  "+# Title",
].join("\n");

describe("parseAddedLines", () => {
  it("reports each added line with its file and line number", () => {
    expect(parseAddedLines(diff)).toStrictEqual([
      { file: "src/a.ts", line: 4, text: "const a = 1;" },
      { file: "src/a.ts", line: 5, text: "const b = 2;" },
      { file: "src/a.ts", line: 12, text: "new" },
      { file: "b.md", line: 1, text: "# Title" },
    ]);
  });
});
