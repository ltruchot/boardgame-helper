import { describe, expect, it } from "vite-plus/test";

import { identityFrom } from "../src/identity.ts";
import {
  checkPublicText,
  findNarration,
  findPersonalData,
  findSecrets,
  isForbiddenPath,
} from "../src/patterns.ts";
import {
  fakeAnthropicKey,
  fakeAwsKey,
  fakeGithubToken,
  fakePrivateKeyHeader,
  homePath,
  identity,
  macHomePath,
  noIdentity,
  personalEmail,
  sessionLink,
} from "./fixtures.ts";

describe("findSecrets", () => {
  it.each([
    fakeAnthropicKey,
    fakeGithubToken,
    fakeAwsKey,
    fakePrivateKeyHeader,
    `API_KEY=${"z".repeat(20)}`,
  ])("flags %s", (secret) => {
    expect(findSecrets(`value: ${secret}`)).not.toHaveLength(0);
  });

  it("masks the secret in the excerpt", () => {
    expect(findSecrets(fakeAnthropicKey)[0]?.excerpt).toBe("sk-ant-a…");
  });

  it.each([
    "ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}",
    "API_KEY=<your key>",
    "MAX_TOKENS = 1024",
    "typescript@7.0.2",
  ])("passes %s", (text) => {
    expect(findSecrets(text)).toHaveLength(0);
  });
});

describe("findPersonalData", () => {
  it.each([homePath, macHomePath, personalEmail, sessionLink, "Reviewed by Ada"])(
    "flags %s",
    (text) => {
      expect(findPersonalData(text, identity)).not.toHaveLength(0);
    },
  );

  it.each([
    "Co-Authored-By: Claude <noreply@anthropic.com>",
    "/home/user/project and /home/<user>/project",
    "git@github.com:org/repo.git",
    "@anthropic-ai/sdk and vite-plus@1.5.0",
    "github.com/adalovelace/repo",
  ])("passes %s", (text) => {
    expect(findPersonalData(text, identity)).toHaveLength(0);
  });

  it("matches author tokens without case or diacritics", () => {
    expect(findPersonalData("Thanks ZOË", identityFrom("Zoe Example", ""))).toHaveLength(1);
  });
});

describe("findNarration", () => {
  it.each([
    "The developer thinks this is cleaner",
    "As requested, rename the helper",
    "the user asked for a smaller bundle",
    "After discussion we decided to drop it",
    "I think this fixes it",
    "Comme demandé, renomme le module",
    "l'utilisateur veut un cache",
  ])("flags %s", (text) => {
    expect(findNarration(text)).not.toHaveLength(0);
  });

  it.each([
    "Show the user their score",
    "Cache Claude responses for 5 minutes",
    "Reject keys that are not strings",
  ])("passes %s", (text) => {
    expect(findNarration(text)).toHaveLength(0);
  });
});

describe("checkPublicText", () => {
  it("combines every detector", () => {
    expect(checkPublicText(`${personalEmail} as requested ${fakeAwsKey}`, noIdentity)).toHaveLength(
      3,
    );
  });
});

describe("isForbiddenPath", () => {
  it.each([
    ".env",
    "apps/api/.env.local",
    ".envrc",
    "certs/server.pem",
    "id_ed25519",
    ".claude/settings.local.json",
    "CLAUDE.local.md",
  ])("forbids %s", (path) => {
    expect(isForbiddenPath(path)).toBe(true);
  });

  it.each(["src/env.ts", ".claude/settings.json", "docs/environment.md", "keys.ts"])(
    "allows %s",
    (path) => {
      expect(isForbiddenPath(path)).toBe(false);
    },
  );
});
