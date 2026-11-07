import type Anthropic from "@anthropic-ai/sdk";
import type { Models } from "@anthropic-ai/sdk/resources";
import type {
  BetaMessage,
  BetaRequestDocumentBlock,
  BetaTextBlockParam,
} from "@anthropic-ai/sdk/resources/beta";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

import { readAssetBase64, readAssetText } from "../utils";

const rulebookSchema = z.enum(["playerAid", "preciseAid", "condensedRulebook", "officialRulebook"]);
type Rulebook = z.infer<typeof rulebookSchema>;

function pdfDocument(title: string, file: string): BetaRequestDocumentBlock {
  return {
    type: "document",
    title,
    source: { type: "base64", media_type: "application/pdf", data: readAssetBase64(file) },
    citations: { enabled: true },
  };
}

const listItem = /^(\d+\.|-) /u;

function textBlock(heading: string, text: string): BetaTextBlockParam {
  return { type: "text", text: heading === "" ? text : `${heading}\n${text}` };
}

// Indented lines continue the item above them.
function listItems(lines: readonly string[]): string[] {
  const items: string[] = [];
  for (const line of lines) {
    const last = items.at(-1);
    if (last === undefined || listItem.test(line)) {
      items.push(line);
    } else {
      items[items.length - 1] = `${last}\n${line}`;
    }
  }
  return items;
}

function paragraphBlocks(heading: string, lines: readonly string[]): BetaTextBlockParam[] {
  const [first = "", second = ""] = lines;
  if (first.startsWith("|") && second.startsWith("| -")) {
    return lines.slice(2).map((row) => textBlock(heading, `${first}\n${row}`));
  }
  if (listItem.test(first)) {
    return listItems(lines).map((item) => textBlock(heading, item));
  }
  return first === "" ? [] : [textBlock(heading, lines.join("\n"))];
}

// One block per rule, list item or table row, so that a citation points at one rule or one tile
// instead of a whole section. Each block repeats its section heading, each row its table header.
function markdownBlocks(markdown: string): BetaTextBlockParam[] {
  const blocks: BetaTextBlockParam[] = [];
  let heading = "";
  for (const paragraph of markdown.split(/\n\s*\n/u)) {
    const lines = paragraph.trim().split("\n");
    const [first = ""] = lines;
    if (first.startsWith("#")) {
      heading = first;
    } else {
      blocks.push(...paragraphBlocks(heading, lines));
    }
  }
  return blocks;
}

function markdownDocument(title: string, file: string): BetaRequestDocumentBlock {
  return {
    type: "document",
    title,
    source: { type: "content", content: markdownBlocks(readAssetText(file)) },
    citations: { enabled: true },
  };
}

// The game name in each title keeps the model on Brass: Lancashire, not Brass: Birmingham.
const rulebooks: Readonly<Record<Rulebook, BetaRequestDocumentBlock>> = {
  playerAid: pdfDocument("Brass: Lancashire - player aid", "brass-player-aid-2-sided.pdf"),
  preciseAid: markdownDocument(
    "Brass: Lancashire - precise aid",
    "brass-lancashire-precise-aid.md",
  ),
  condensedRulebook: pdfDocument(
    "Brass: Lancashire - condensed rulebook",
    "brass-restructured-rules-v2.pdf",
  ),
  officialRulebook: pdfDocument(
    "Brass: Lancashire - official rulebook",
    "brass-lancashire-official-rules.pdf",
  ),
};

const persona = `You are a rules judge at a board game convention.

<scope>
- When the player names a game, look up rules for that game only, in its rulebooks only.
- Games with close names or mechanics, such as Brass: Lancashire, Brass: Birmingham and the original Brass, have different rules, costs, maps and locations. Never apply the rules of one to another.
- If no rulebook is available for the named game, say so and give no ruling.
- Your memory of any game is never a source. The only sources are the rulebooks you fetch with the get_rulebook tool.
</scope>

<method>
1. Fetch at least one rulebook before answering, in the order given by the tool.
2. State only facts that a fetched rulebook supports. Quote the official rulebook as proof. Use the other rulebooks to find rules, not as proof: quote one of them only for a point the official rulebook does not cover, and say so. If they disagree with the official rulebook, the official rulebook wins.
3. If the fetched rulebooks do not cover a point, such as a price or a map location, fetch the next rulebook. If none covers it, and no deduction from quoted rules settles it, write "Not covered by the rulebooks" for that point. Never fill the gap from memory.
4. Answer the question asked, and add no facts beyond it.
5. Before ruling on a situation, work out the exact game state at that moment: tiles and links on the board, including tiles that players earlier in the same round may have built, and which players have already played this round. Check each requirement against that state.
6. You may draw conclusions that follow logically from quoted rules. Label each one as a deduction and name the rules it comes from.
7. When asked whether something is possible, list every way each requirement can be met, and check each one against the game state, including what earlier players may have built.
</method>

<format>
- Start with the ruling in one or two sentences: who can, who cannot, and under which conditions.
- When you name a rule, use its section title or quote it, never a document index.
</format>`;
const prompt =
  "In Brass: Lancashire, can a player build an Iron Works on their very first turn? If so, in what situation?";

function getRulebook(name: Rulebook): BetaRequestDocumentBlock {
  return rulebooks[name];
}

const getRulebookTool = betaZodTool({
  name: "get_rulebook",
  description:
    "Fetch one Brass: Lancashire rulebook, to find and quote the rule that settles a question or an in-game situation. These rulebooks are the only valid sources for a ruling.",
  inputSchema: z.object({
    name: rulebookSchema.describe(
      "Which rulebook to fetch, in the order to search them: playerAid (a two-page visual summary), preciseAid (a text summary with the cost, income, VPs, coal and iron needs of every industry tile, the connection rules and every action), condensedRulebook (every rule, no in-game examples), then officialRulebook (the publisher's full rulebook: long and noisy, but the reference to quote as proof).",
    ),
  }),
  // A document block, not text: as text, a base64 PDF costs over a million tokens.
  run: ({ name }) => [getRulebook(name)],
});

export async function askJudge(client: Anthropic, model: Models.ModelInfo): Promise<BetaMessage> {
  const runner = client.beta.messages.toolRunner({
    system: persona,
    model: model.id,
    // Thinking tokens count against max_tokens: at 1024, thinking can use them all and leave no answer.
    max_tokens: 16000,
    messages: [{ role: "user", content: prompt }],
    thinking: { type: "adaptive", display: "summarized" },
    output_config: { effort: "high" },
    tools: [getRulebookTool],
  });

  for await (const message of runner) {
    for (const block of message.content) {
      if (block.type === "thinking" && block.thinking !== "") {
        process.stdout.write(`  thinking: ${block.thinking}\n`);
      }
      if (block.type === "tool_use") {
        process.stdout.write(`→ ${block.name} ${JSON.stringify(block.input)}\n`);
      }
    }
    process.stdout.write(
      `  stop=${message.stop_reason} in=${message.usage.input_tokens} out=${message.usage.output_tokens}\n`,
    );
  }

  return runner.done();
}

/*
async function runTool(name: string, toolInput: any) {
  if (name === "get_weather") {
    if (toolInput?.city === undefined || typeof toolInput.city !== "string") {
      throw new Error("City is a required string in input record");
    }
    return `15°C in ${toolInput["city"]} right now`;
  }
  throw new Error(`Tool ${name} not found`);
}

export function loopUntilWeather(
  client: Anthropic,
  model: Models.ModelInfo,
): Promise<Message> {
  const messages: Anthropic.Messages.MessageParam[] = [
    { role: "user", content: "What should I wear in Paris today?" },
  ];
  while (true) {
    const response = await client.messages.create({
      tools,
      model: model.id,
      max_tokens: 1024,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      process.stdout.write(`End turn: ${response.content.map((r) => r.text)}\n`);
      for (const block of response.content) {
        if (block.type === "text") {
          return response;
        }
      }
      throw new Error("No text block found in response");
    }

    if (response.stop_reason === "tool_use") {
      process.stdout.write(
        `Tool use: ${response.content.map((r) => r.text || r.name).join("\n -> ")}\n`,
      );
      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          const result = await runTool(block.name, block.input);
          toolResults.push({ tool_use_id: block.id, content: result, type: "tool_result" });
        }
      }
      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });
    }
  }
}
*/
