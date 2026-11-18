/**
 * The site's sign-up write. Loaded lazily by the "Get notified" form, so Firebase is
 * fetched on first interaction with a form, not with the page.
 */
import { doc, serverTimestamp, setDoc } from "firebase/firestore/lite";
import { db } from "./firebase";
import type { NotifiedDoc, NotifiedInput } from "./validate";

const TIMEOUT_MS = 15000;
const withTimeout = <T>(p: Promise<T>) =>
  Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "deadline-exceeded" })), TIMEOUT_MS))]);

/**
 * The lowercased email is the document ID, so one address can sign up once. A second create of the same
 * ID is an update, which the rules deny: that permission-denied means "already on the list".
 */
export async function saveNotified({ name, email, college }: NotifiedInput): Promise<"created" | "exists"> {
  const data: NotifiedDoc = { name, email, college, createdAt: serverTimestamp() };
  try {
    await withTimeout(setDoc(doc(db, "notified", email), data));
    return "created";
  } catch (e) {
    if ((e as { code?: string })?.code === "permission-denied") return "exists";
    throw e;
  }
}

