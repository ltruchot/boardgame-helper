import { readFileSync } from "node:fs";

import type { Message } from "@anthropic-ai/sdk/resources";
import type { BetaMessage } from "@anthropic-ai/sdk/resources/beta";
import type Anthropic from "@anthropic-ai/sdk";
import type { Models } from "@anthropic-ai/sdk/resources";

// Resolved from this file, so the path does not depend on the working directory.
function readAsset(name: string): Buffer {
  return readFileSync(new URL(`../assets/${name}`, import.meta.url));
}

export function readAssetBase64(name: string): string {
  return readAsset(name).toString("base64");
}

export function readAssetText(name: string): string {
  return readAsset(name).toString("utf8");
}

export function printResponse(exercise: string, response: Message | BetaMessage): void {
  process.stdout.write("\n--------------------------------\n");
  process.stdout.write(
    `Exercise: ${exercise} \nModel: [${response.model}] in=${response.usage.input_tokens}, out=${response.usage.output_tokens}\nResponse:\n`,
  );
  // With citations on, the answer comes as many text blocks. Each citation becomes a [n] marker,
  // and the cited passages are listed after the answer, one line each.
  const sources: string[] = [];
  for (const chunk of response.content) {
    if (chunk.type === "text") {
      process.stdout.write(chunk.text);
      for (const citation of chunk.citations ?? []) {
        const title = "document_title" in citation ? citation.document_title : citation.title;
        sources.push(
          `[${sources.length + 1}] ${title ?? "untitled"}: "${oneLine(citation.cited_text)}"`,
        );
        process.stdout.write(` [${sources.length}]`);
      }
    }
  }
  process.stdout.write("\n");
  if (sources.length > 0) {
    process.stdout.write(`\nSources:\n${sources.join("\n")}\n`);
  }
}

// PDF passages keep the line breaks of their columns; one line per source stays readable.
function oneLine(text: string): string {
  const line = text.replaceAll(/\s+/gu, " ").trim();
  return line.length > 200 ? `${line.slice(0, 200)}…` : line;
}

// Only the lines found in the list are present: a missing line is undefined.
export async function getModels(
  client: Anthropic,
  type: "old" | "recent",
): Promise<Partial<Record<Models.ModelLine, Models.ModelInfo>>> {
  const version = type === "old" ? "4-5" : "5-5";
  const page = await client.models.list();
  const models: Partial<Record<Models.ModelLine, Models.ModelInfo>> = {};
  for (const model of page.data) {
    if (model.line !== null && model.id.includes(version)) {
      models[model.line] = model;
    }
  }
  return models;
}
