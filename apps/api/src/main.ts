import Anthropic from "@anthropic-ai/sdk";
import { getModels } from "./utils";

import { printResponse } from "./utils";
import { askJudge } from "./ex04-looping";
/*
import { helloClaude } from "./ex01-hello-claude";
import { badGameRule } from "./ex02-bad-game-rule";
import { chooseModel } from "./ex03-choose-model";
*/
// For request logs: new Anthropic({ logLevel: "debug" })
const client = new Anthropic();

const oldModels = await getModels(client, "recent");
const { haiku, sonnet, opus } = oldModels;

if (
  Object.keys(oldModels).length !== 3 ||
  haiku === undefined ||
  sonnet === undefined ||
  opus === undefined
) {
  throw new Error("Some models are missing");
}

process.stdout.write(
  `Old models: \n${Object.values(oldModels)
    .map((m) => m.id)
    .join("\n")}\n `,
);

// Exercise 1: Hello, Claude
/*
const response = await helloClaude(client, haiku);
printResponse("Hello, Claude", response);
*/
// Exercise 2: Bad Game Rule
/*
const response2 = await badGameRule(client, haiku);
printResponse("Bad Game Rule", response2);
*/
// Exercise 3: Choose Model
/*
const response3 = await chooseModel(client, oldModels);
response3.forEach((response) => printResponse(`Choose Model`, response));
*/

const response4 = await askJudge(client, opus);
printResponse("Ask the Judge", response4);
