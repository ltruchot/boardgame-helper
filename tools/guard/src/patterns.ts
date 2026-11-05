// Detectors shared by the git hooks and the Claude Code hook. Patterns are kept as source strings
// (compiled per call) so no mutable RegExp state is shared. Slashes in path patterns are written
// `[/]` so this file does not match its own personal-path detector.

export type Finding = { readonly rule: string; readonly excerpt: string };

/** Lowercase, diacritic-free words that identify the local git author (see identity.ts). */
export type Identity = { readonly tokens: readonly string[] };

type Rule = { readonly id: string; readonly source: string };
type Scan = { readonly flags: "gu" | "giu"; readonly masked: boolean };

const SECRET_RULES: readonly Rule[] = [
  { id: "secret/anthropic-key", source: String.raw`\bsk-ant-[\w-]{20,}` },
  { id: "secret/sk-key", source: String.raw`\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}` },
  {
    id: "secret/github-token",
    source: String.raw`\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_\w{22,})`,
  },
  { id: "secret/aws-access-key", source: String.raw`\b(?:AKIA|ASIA)[0-9A-Z]{16}\b` },
  { id: "secret/google-api-key", source: String.raw`\bAIza[\w-]{35}` },
  { id: "secret/slack-token", source: String.raw`\bxox[abposr]-[\w-]{10,}` },
  { id: "secret/private-key", source: String.raw`-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----` },
  {
    // `NAME_API_KEY=value`; placeholders starting with `$`, `<` or `{` pass.
    id: "secret/assignment",
    source: String.raw`\b[A-Z0-9_]*(?:API_KEY|SECRET|TOKEN|PASSWORD)[A-Z0-9_]*\s*[:=]\s*["']?[^\s"'$<{]{12,}`,
  },
];

const PERSONAL_RULES: readonly Rule[] = [
  {
    id: "personal/home-path",
    source: String.raw`(?:[/]home|[/]Users)[/](?!(?:user|username|runner|node|me|you)[/])[^/\s<>"'$\x60]+[/]`,
  },
  {
    id: "personal/windows-home-path",
    source: String.raw`\b[A-Za-z]:\\Users\\(?!(?:user|username|Public)\\)[^\\\s<>"'$]+`,
  },
  {
    id: "personal/session-link",
    source: String.raw`claude\.ai[/]code[/]session_\w+|Claude-Session[:]`,
  },
];

const EMAIL_SOURCE = String.raw`[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[A-Za-z]{2,}\b`;
const ALLOWED_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  "users.noreply.github.com",
  "example.com",
  "example.org",
]);
const ALLOWED_EMAILS: ReadonlySet<string> = new Set(["noreply@anthropic.com", "git@github.com"]);

// Narration about people or the conversation, in English and French. Domain wording such as
// "show the user their score" passes: only a person acting as a source of decisions is flagged.
const ACTOR = String.raw`(?:the|this|our) (?:user|developer|dev|maintainer|owner|author|human|client|customer|team)`;
const SPEECH = String.raw`(?:said|says|asked|asks|wants|wanted|requested|requests|told|tells|thinks|thought|prefers|preferred|suggested|suggests|decided|decides|mentioned|believes|likes|feels|noted)`;
// `\b` treats accented letters as non-word characters; French rules end on any Unicode letter.
const WORD_END = String.raw`(?![\p{L}\p{N}_])`;
const NARRATION_RULES: readonly Rule[] = [
  { id: "narration/actor", source: String.raw`\b${ACTOR}\s+${SPEECH}\b` },
  {
    id: "narration/developer",
    source: String.raw`\b(?:the|this) (?:developer|maintainer|project owner)\b`,
  },
  {
    id: "narration/request",
    source: String.raw`\b(?:as|per) (?:requested|asked|discussed|agreed|suggested|request|discussion)\b`,
  },
  {
    id: "narration/conversation",
    source: String.raw`\b(?:told|asked) me\b|\bafter (?:discussion|discussing|some thought|reflection)\b`,
  },
  {
    id: "narration/first-person",
    source: String.raw`\bI (?:think|believe|decided|chose|tried|guess|feel)\b|\bwe (?:decided|agreed|discussed|chose)\b`,
  },
  {
    id: "narration/agent",
    source: String.raw`\b(?:claude|the assistant|the agent|the ai) (?:thinks|thought|decided|suggested|said|was asked)\b`,
  },
  {
    id: "narration/fr-actor",
    source: String.raw`\bl[’']utilisateur (?:a|veut|voulait|pense|préfère|souhaite|demande)${WORD_END}|\ble (?:développeur|dev|mainteneur)${WORD_END}`,
  },
  {
    id: "narration/fr-conversation",
    source: String.raw`\bm[’']a (?:dit|demandé|suggéré)${WORD_END}|\bcomme (?:demandé|convenu|discuté)${WORD_END}|\baprès (?:discussion|réflexion)${WORD_END}`,
  },
  {
    id: "narration/fr-first-person",
    source: String.raw`\bje (?:pense|crois|trouve|vais)${WORD_END}|\bon a (?:décidé|discuté|convenu)${WORD_END}`,
  },
];

const FORBIDDEN_FILE_SOURCE = String.raw`(?:^|[/])(?:\.env(?:rc)?(?:\.[\w.-]+)?|[^/]+\.(?:pem|key|p12|pfx)|id_(?:rsa|ed25519|ecdsa|dsa)(?:\.pub)?|CLAUDE\.local\.md|\.claude[/]settings\.local\.json)$`;

const EXCERPT_LENGTH = 8;

function mask(match: string): string {
  return match.length > EXCERPT_LENGTH ? `${match.slice(0, EXCERPT_LENGTH)}…` : match;
}

function findAll(text: string, rules: readonly Rule[], scan: Scan): readonly Finding[] {
  return rules.flatMap((rule) => {
    return [...text.matchAll(new RegExp(rule.source, scan.flags))].map((match) => ({
      rule: rule.id,
      excerpt: scan.masked ? mask(match[0]) : match[0],
    }));
  });
}

function isAllowedEmail(email: string): boolean {
  const lower = email.toLowerCase();
  const domain = lower.slice(lower.indexOf("@") + 1);
  return ALLOWED_EMAILS.has(lower) || ALLOWED_EMAIL_DOMAINS.has(domain);
}

/** Folds case and diacritics so "Zoë" and "ZOE" compare equal. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function escapeRegExp(text: string): string {
  return text.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`);
}

function findIdentity(text: string, identity: Identity): readonly Finding[] {
  const folded = normalize(text);
  return identity.tokens
    .filter((token) =>
      new RegExp(String.raw`(?<![\w.])${escapeRegExp(token)}(?![\w])`, "u").test(folded),
    )
    .map((token) => ({ rule: "personal/author-identity", excerpt: token }));
}

export function findSecrets(text: string): readonly Finding[] {
  return findAll(text, SECRET_RULES, { flags: "gu", masked: true });
}

export function findPersonalData(text: string, identity: Identity): readonly Finding[] {
  const emails = [...text.matchAll(new RegExp(EMAIL_SOURCE, "gu"))]
    .map((match) => match[0])
    .filter((email) => !isAllowedEmail(email))
    .map((email) => ({ rule: "personal/email", excerpt: email }));
  return [
    ...findAll(text, PERSONAL_RULES, { flags: "giu", masked: false }),
    ...emails,
    ...findIdentity(text, identity),
  ];
}

export function findNarration(text: string): readonly Finding[] {
  return findAll(text, NARRATION_RULES, { flags: "giu", masked: false });
}

/** Every check that applies to text published under the project's name (commits, PRs). */
export function checkPublicText(text: string, identity: Identity): readonly Finding[] {
  return [...findSecrets(text), ...findPersonalData(text, identity), ...findNarration(text)];
}

/** Files that hold secrets or local-only settings and must never be committed or written. */
export function isForbiddenPath(path: string): boolean {
  return new RegExp(FORBIDDEN_FILE_SOURCE, "u").test(path.replaceAll("\\", "/"));
}

export function formatFindings(findings: readonly Finding[]): string {
  return findings.map((finding) => `  - ${finding.rule}: ${finding.excerpt}`).join("\n");
}
