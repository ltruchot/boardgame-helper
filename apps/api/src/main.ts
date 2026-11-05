import Anthropic from "@anthropic-ai/sdk";
import type { Models } from "@anthropic-ai/sdk/resources";
/*
import { printResponse } from "./utils";
import { helloClaude } from "./ex01-hello-claude";
import { badGameRule } from "./ex02-bad-game-rule";
*/
const client = new Anthropic();

const models = await client.models.list();
if (models.data.length === 0) {
  throw new Error("No models found");
}
const cheapHaikuModel: Models.ModelInfo | undefined = models.data.find(
  (model) => model.id === "claude-haiku-4-5-20251001",
);
if (!cheapHaikuModel) {
  throw new Error("Cheap Haiku model not found");
}

// Exercise 1: Hello, Claude
/*
const response = await helloClaude(client, cheapHaikuModel);
printResponse("Hello, Claude", response);
*/

// Exercise 2: Bad Game Rule
/*
const response2 = await badGameRule(client, cheapHaikuModel);
printResponse("Bad Game Rule", response2);
*/
