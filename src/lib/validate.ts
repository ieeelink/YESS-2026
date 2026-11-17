/**
 * The one place both forms validate and normalise. The limits mirror firestore.rules exactly: if you
 * change a number here, change it there too (and the other way round).
 */
import type { FieldValue } from "firebase/firestore/lite";

export const LIMITS = { name: 100, email: 254, college: 150, message: 2000 } as const;
export const EMAIL_MIN = 5;
export type FieldName = keyof typeof LIMITS;

/** What lands in Firestore. No other fields, ever (the rules reject anything else). */
export interface NotifiedDoc { name: string; email: string; college: string; createdAt: FieldValue }
export interface QuestionDoc { name: string; email: string; message: string; createdAt: FieldValue }
export type NotifiedInput = Omit<NotifiedDoc, "createdAt">;
export type QuestionInput = Omit<QuestionDoc, "createdAt">;

/**
 * Trim everything. Single-line fields also collapse runs of whitespace; the message keeps its line breaks.
 * Email is lowercased (it is also the `notified` document ID).
 */
export function normalize(field: FieldName, raw: string): string {
  if (field === "message") return raw.replace(/\r\n?/g, "\n").trim();
  const v = raw.replace(/\s+/g, " ").trim();
  return field === "email" ? v.toLowerCase() : v;
}

// Local part: dot-separated atoms (so no leading, trailing or doubled dots). Domain: dot-separated labels
// that never start or end with a hyphen, ending in a letters-only TLD of 2+ characters. Stricter than the
// rules' regex, never looser, so anything that passes here also passes there.
const ATOM = "[a-z0-9!#$%&'*+=?^_`{|}~-]+";
const EMAIL_RE = new RegExp(`^${ATOM}(?:\\.${ATOM})*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z]{2,}$`);

/** Expects a normalised (trimmed, lowercased) address. */
export const isValidEmail = (email: string) =>
  email.length >= EMAIL_MIN && email.length <= LIMITS.email && EMAIL_RE.test(email);

const EMPTY: Record<FieldName, string> = {
  name: "Enter your name.",
  email: "Enter your email address.",
  college: "Enter your college.",
  message: "Write your question or message.",
};

/** A friendly error for one normalised value, or null when it is fine. */
export function fieldError(field: FieldName, value: string): string | null {
  if (!value) return EMPTY[field];
  if (value.length > LIMITS[field]) return `Use ${LIMITS[field]} characters or fewer.`;
  if (field === "email" && !isValidEmail(value)) return "Enter a valid email address, like name@example.com.";
  return null;
}

/* ---- "Did you mean …?" for misspelt common providers ---- */

const PROVIDERS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "yahoo.co.in", "rediffmail.com"];
/** Real domains that sit within two edits of a provider above: never "correct" these. */
const KNOWN = new Set([...PROVIDERS, "mail.com", "email.com", "gmx.com", "ymail.com", "live.com", "me.com", "mac.com", "aol.com", "msn.com",
  "yahoo.in", "yahoo.co.uk", "outlook.in", "hotmail.co.uk", "googlemail.com", "rocketmail.com", "proton.me", "protonmail.com", "zoho.com"]);

/** Edit distance where swapping two neighbouring letters counts as one edit ("gmial" → "gmail"). */
function distance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** The corrected address when the domain is 1–2 edits from a common provider, otherwise null. Never applied silently. */
export function suggestEmail(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const domain = email.slice(at + 1);
  if (domain.length < 4 || KNOWN.has(domain)) return null;
  let best: string | null = null, bestD = 3;
  for (const p of PROVIDERS) {
    const dist = distance(domain, p);
    if (dist >= 1 && dist < bestD) { best = p; bestD = dist; }
  }
  return best && email.slice(0, at + 1) + best;
}
