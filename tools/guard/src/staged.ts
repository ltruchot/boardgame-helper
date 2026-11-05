export type AddedLine = { readonly file: string; readonly line: number; readonly text: string };

const FILE_HEADER = /^\+\+\+ b\/(?<file>.+)$/u;
const HUNK_HEADER = /^@@ -\d+(?:,\d+)? \+(?<start>\d+)(?:,\d+)? @@/u;

type Cursor = { readonly file: string; readonly next: number };

function step(
  cursor: Cursor,
  row: string,
): { readonly cursor: Cursor; readonly added?: AddedLine } {
  const file = FILE_HEADER.exec(row)?.groups?.["file"];
  if (file !== undefined) {
    return { cursor: { file, next: 0 } };
  }
  const start = HUNK_HEADER.exec(row)?.groups?.["start"];
  if (start !== undefined) {
    return { cursor: { file: cursor.file, next: Number(start) } };
  }
  if (row.startsWith("+") && !row.startsWith("+++")) {
    return {
      cursor: { ...cursor, next: cursor.next + 1 },
      added: { file: cursor.file, line: cursor.next, text: row.slice(1) },
    };
  }
  return { cursor: row.startsWith("-") ? cursor : { ...cursor, next: cursor.next + 1 } };
}

/** Added lines of a `git diff --unified=0` output, with their file and line number. */
export function parseAddedLines(diff: string): readonly AddedLine[] {
  const added: AddedLine[] = [];
  let cursor: Cursor = { file: "", next: 0 };
  for (const row of diff.split("\n")) {
    const result = step(cursor, row);
    cursor = result.cursor;
    if (result.added !== undefined) {
      added.push(result.added);
    }
  }
  return added;
}
