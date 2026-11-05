// Sample secrets and personal data are assembled at runtime so this file itself passes the
// pre-commit scan.

import type { Identity } from "../src/patterns.ts";

export const fakeAnthropicKey = ["sk", "ant", "api03", "A".repeat(40)].join("-");
export const fakeGithubToken = ["ghp", "B".repeat(36)].join("_");
export const fakeAwsKey = `AKIA${"C".repeat(16)}`;
export const fakePrivateKeyHeader = `${"-".repeat(5)}BEGIN RSA PRIVATE KEY${"-".repeat(5)}`;
export const homePath = ["", "home", "ada", "projects", "x"].join("/");
export const macHomePath = ["", "Users", "ada", "code"].join("/");
export const personalEmail = ["ada.lovelace", "mail.test"].join("@");
export const sessionLink = ["https://claude.ai", "code", "session_01ABC"].join("/");
export const identity: Identity = { tokens: ["ada", "lovelace"] };
export const noIdentity: Identity = { tokens: [] };
