import type { Message } from "@anthropic-ai/sdk/resources";

export function printResponse(exercise: string, response: Message): void {
  process.stdout.write(`Exercise: ${exercise} \n\nResponse:\n`);
  for (const chunk of response.content) {
    if (chunk.type === "text") {
      process.stdout.write(chunk.text + "\n");
    }
  }
}
