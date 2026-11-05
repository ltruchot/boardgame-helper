import type Anthropic from "@anthropic-ai/sdk";
import type { Models, Message } from "@anthropic-ai/sdk/resources";

const persona =
  "You are a judge at an annual board game convention. You keep an eye on the players and answer their questions.";
const badRule =
  "While playing Yatzhee, if you already have scored the fullhouse, you can score a better fullhouse.";
const prompt = `Review the following rule assessment and tell if it is correct or not: ${badRule}`;

export function badGameRule(
  client: Anthropic,
  cheapHaikuModel: Models.ModelInfo,
): Promise<Message> {
  return client.messages.create({
    model: cheapHaikuModel.id,
    max_tokens: 1024,
    system: persona,
    messages: [{ role: "user", content: prompt }],
  });
}
