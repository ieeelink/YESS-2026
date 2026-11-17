/**
 * Firestore, and nothing else: no Analytics, Auth or Storage. The site only ever creates documents in
 * two collections (see firestore.rules), so it uses the "lite" SDK: the same API for one-off writes,
 * REST only, no realtime listeners or offline cache, and a fraction of the bundle.
 *
 * Config comes from VITE_FIREBASE_* variables (.env.local locally, Project Settings in Vercel). These
 * web keys are public by design; the security lives in firestore.rules.
 *
 * Import this module lazily (`await import("./firebase")`) so visitors who never touch a form never
 * download Firebase.
 */
import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, setLogLevel } from "firebase/firestore/lite";

// The SDK logs failed requests to the console *with the request body* (name, email, …). A repeat sign-up
// is an expected failure, so keep the SDK quiet; src/lib/form.ts logs the error code only.
setLogLevel("silent");

const env = import.meta.env;
const config: FirebaseOptions = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

if (!config.apiKey || !config.projectId || !config.appId) {
  // Fails the write (the form shows its friendly error) instead of writing to an unknown project.
  throw new Error("Firebase config missing: set the VITE_FIREBASE_* environment variables.");
}

const app = getApps().length ? getApp() : initializeApp(config);
export const db = getFirestore(app);
