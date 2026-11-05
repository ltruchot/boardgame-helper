import { execFileSync } from "node:child_process";

import { normalize } from "./patterns.ts";
import type { Identity } from "./patterns.ts";

const MIN_TOKEN_LENGTH = 3;

/** Builds the author tokens from a git name and email, so no name is ever stored in the repo. */
export function identityFrom(name: string, email: string): Identity {
  const words = normalize(name)
    .split(/[\s-]+/u)
    .filter((word) => word.length >= MIN_TOKEN_LENGTH);
  const address = normalize(email.trim());
  const local = address.split("@")[0] ?? "";
  const extra = address.includes("@") ? [address, local] : [];
  return {
    tokens: [...new Set([...words, ...extra])].filter((token) => token.length >= MIN_TOKEN_LENGTH),
  };
}

function gitConfig(key: string): string {
  try {
    return execFileSync("git", ["config", "--get", key], { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

/** Identity of the local git author (`user.name`, `user.email`). */
export function readIdentity(): Identity {
  return identityFrom(gitConfig("user.name"), gitConfig("user.email"));
}
