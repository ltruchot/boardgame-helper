import type Anthropic from "@anthropic-ai/sdk";
import type { Models, Message } from "@anthropic-ai/sdk/resources";

import { readAssetBase64 } from "../utils";

const rulesPdf = readAssetBase64("brass-lancashire-official-rules.pdf");
const persona =
  "You are a judge at an annual board game convention. You keep an eye on the rules books, the players, and the game. You are given a rule assessment and you need to answer the player's question with proof from the rules books.";
const prompt = `In Brass Lancashire, can a player build an Iron Works during its very first turn? If so, in which case is it possible?`;

export function chooseModel(
  client: Anthropic,
  models: Partial<Record<Models.ModelLine, Models.ModelInfo>>,
): Promise<Message[]> {
  return Promise.all(
    Object.values(models).map((model) =>
      client.messages.create({
        model: model.id,
        max_tokens: 1024,
        system: persona,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: rulesPdf },
              },
            ],
          },
        ],
      }),
    ),
  );
}
