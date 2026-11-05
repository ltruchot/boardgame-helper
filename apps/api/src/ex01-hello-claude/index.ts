import type Anthropic from "@anthropic-ai/sdk";
import type { Models, Message } from "@anthropic-ai/sdk/resources";

export function helloClaude(
  client: Anthropic,
  cheapHaikuModel: Models.ModelInfo,
): Promise<Message> {
  return client.messages.create({
    model: cheapHaikuModel.id,
    max_tokens: 1024,
    messages: [{ role: "user", content: "Hello, Claude" }],
  });
}
