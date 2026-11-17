/**
 * Behaviour shared by both forms: inline validation, the character counter, the "Did you mean …?" email
 * hint, the honeypot, a short resubmit cooldown and the idle / submitting / success / error states.
 * Markup comes from src/render/sections.ts (field ids: `<id>`, `<id>-err`, `<id>-count`).
 * Never logs what people type.
 */
import { fieldError, normalize, suggestEmail, type FieldName } from "./validate";

type Control = HTMLInputElement | HTMLTextAreaElement;
export type Values<F extends FieldName> = Record<F, string>;
type State = "idle" | "submitting" | "success" | "error";

export interface FormOptions<F extends FieldName> {
  form: HTMLFormElement;
  fields: readonly F[];
  /** sessionStorage key for the cooldown, one per form. */
  cooldownKey: string;
  /** Button label while the write is in flight. */
  busyLabel: string;
  /** Shown on success unless `send` resolves to a message of its own. */
  successMessage: string;
  /** Write the normalised values. May resolve to a different success message. Throws on failure. */
  send: (values: Values<F>) => Promise<string | void>;
  /** Replaces the default success handling (clear the form, confirm in the status line). */
  onSuccess?: (message: string) => void;
}

const COOLDOWN_MS = 10_000;
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Firebase error code, if the thrown value has one. */
export const errorCode = (e: unknown) => (typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : "");

function friendlyError(e: unknown): string {
  const code = errorCode(e);
  // a fetch that never got a response (offline, blocked by an extension, failed chunk load) has no HTTP status
  const unreachable = e instanceof TypeError || (code === "unknown" && /failed to fetch|load failed|networkerror/i.test(String((e as Error)?.message)));
  if (!navigator.onLine || unreachable || code === "unavailable" || code === "deadline-exceeded") {
    return "We could not reach the server. Check your connection and try again.";
  }
  if (code === "resource-exhausted") return "We are getting a lot of messages right now. Please try again in a minute.";
  if (code === "permission-denied" || code === "invalid-argument") return "That could not be saved. Check your details and try again.";
  return "Something went wrong on our side. Please try again in a moment.";
}

export function bindForm<F extends FieldName>(o: FormOptions<F>) {
  const { form } = o;
  const controls = new Map(o.fields.map(f => [f, form.elements.namedItem(f) as Control]));
  const ctl = (f: F) => controls.get(f)!;
  const button = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
  const label = button.querySelector<HTMLElement>(".btn__label") ?? button;
  const idleLabel = label.textContent ?? "";
  const status = form.querySelector<HTMLElement>("[data-status]")!;
  const honeypot = form.elements.namedItem("website") as HTMLInputElement | null;
  const touched = new Set<F>();
  let busy = false;

  // Firebase is only fetched once someone starts on a form.
  form.addEventListener("focusin", () => { import("./db").catch(() => {}); }, { once: true });

  const say = (text: string, kind: "ok" | "error" | "" = "") => { status.textContent = text; status.dataset.kind = kind; };
  const setState = (s: State) => { form.dataset.state = s; };

  /* ---- inline errors ---- */
  const check = (f: F) => {
    const c = ctl(f), msg = fieldError(f, normalize(f, c.value));
    c.setAttribute("aria-invalid", String(!!msg));
    document.getElementById(`${c.id}-err`)!.textContent = msg ?? "";
    return msg;
  };
  for (const [f, c] of controls) {
    c.addEventListener("blur", () => { if (c.value || touched.has(f)) { touched.add(f); check(f); } });
    c.addEventListener("input", () => {
      if (touched.has(f)) check(f);
      if (status.dataset.kind === "error" && !busy) say("");
    });
  }

  /* ---- character counters ---- */
  const counters: (() => void)[] = [];
  for (const c of controls.values()) {
    const out = document.getElementById(`${c.id}-count`);
    if (!out) continue;
    const update = () => { out.textContent = `${c.value.length} / ${c.maxLength}`; out.dataset.near = String(c.value.length >= c.maxLength * 0.9); };
    c.addEventListener("input", update);
    counters.push(update);
    update();
  }

  /* ---- "Did you mean …?" ---- */
  const email = controls.get("email" as F);
  const hint = form.querySelector<HTMLElement>("[data-hint]");
  const accept = hint?.querySelector<HTMLButtonElement>("[data-accept]");
  let kept = "", suggestion: string | null = null;
  const updateHint = () => {
    if (!email || !hint || !accept) return;
    const v = normalize("email", email.value);
    suggestion = v && v !== kept ? suggestEmail(v) : null;
    hint.hidden = !suggestion;
    if (suggestion) { accept.textContent = suggestion; accept.setAttribute("aria-label", `Use ${suggestion}`); }
  };
  if (email && hint && accept) {
    email.addEventListener("change", updateHint);
    email.addEventListener("input", () => { if (!hint.hidden) updateHint(); });
    accept.addEventListener("click", () => {
      if (!suggestion) return;
      email.value = suggestion;
      updateHint();
      if (touched.has("email" as F)) check("email" as F);
      email.focus();
    });
    hint.querySelector("[data-keep]")!.addEventListener("click", () => { kept = normalize("email", email.value); updateHint(); email.focus(); });
  }

  /* ---- cooldown: after a successful send, wait ~10s (kept across reloads in this tab) ---- */
  const KEY = `yess:sent:${o.cooldownKey}`;
  let until = 0, timer = 0;
  try { until = Number(sessionStorage.getItem(KEY)) || 0; } catch { /* storage blocked: memory only */ }
  const cooling = () => Date.now() < until;
  const syncButton = () => {
    button.disabled = busy || cooling();
    clearTimeout(timer);
    if (cooling()) timer = window.setTimeout(syncButton, until - Date.now() + 50);
  };
  const startCooldown = () => {
    until = Date.now() + COOLDOWN_MS;
    try { sessionStorage.setItem(KEY, String(until)); } catch { /* ignore */ }
    syncButton();
  };
  syncButton();

  const setBusy = (on: boolean) => {
    busy = on;
    label.textContent = on ? o.busyLabel : idleLabel;
    form.setAttribute("aria-busy", String(on));
    syncButton();
  };

  const clear = () => {
    form.reset();
    touched.clear();
    kept = "";
    for (const f of o.fields) { ctl(f).removeAttribute("aria-invalid"); document.getElementById(`${ctl(f).id}-err`)!.textContent = ""; }
    counters.forEach(u => u());
    updateHint();
  };

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (busy) return;
    if (cooling()) { say("Please wait a few seconds before sending again."); return; }

    o.fields.forEach(f => touched.add(f));
    const invalid = o.fields.filter(f => check(f));
    if (invalid.length) {
      say(invalid.length > 1 ? "Please fix the highlighted fields." : "Please fix the highlighted field.", "error");
      setState("error");
      ctl(invalid[0]).focus();
      return;
    }

    const values = Object.fromEntries(o.fields.map(f => [f, normalize(f, ctl(f).value)])) as Values<F>;
    setState("submitting");
    setBusy(true);
    say("");
    try {
      // A filled honeypot is a bot: act as if it worked, write nothing.
      const msg = honeypot?.value ? (await wait(800), undefined) : await o.send(values);
      startCooldown();
      setState("success");
      const text = msg || o.successMessage;
      if (o.onSuccess) o.onSuccess(text);
      else { clear(); say(text, "ok"); }
    } catch (err) {
      setState("error");
      say(friendlyError(err), "error");
      console.error("[form] write failed:", errorCode(err) || (err as Error)?.name); // the code only, never the values
    } finally {
      setBusy(false);
    }
  });

  setState("idle");
  return {
    /** Back to a clean idle form (values, errors, status). The cooldown stays. */
    reset() { clear(); say(""); setState("idle"); },
  };
}
