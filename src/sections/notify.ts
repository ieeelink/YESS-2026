import { bindForm } from "../lib/form";

/**
 * "Get notified": every [data-notify-open] (the primary CTA, the phone menu link) opens a native modal
 * <dialog> with the sign-up form, which writes to the `notified` collection. Without <dialog> support
 * (or without JS) the link simply goes to the footer.
 */
export function initNotify() {
  const dialog = document.getElementById("notifyDialog") as HTMLDialogElement | null;
  if (!dialog || typeof dialog.showModal !== "function") return;
  const root = document.documentElement;
  const form = dialog.querySelector<HTMLFormElement>("form")!;
  const formView = dialog.querySelector<HTMLElement>("[data-view=form]")!;
  const doneView = dialog.querySelector<HTMLElement>("[data-view=done]")!;
  const doneTitle = doneView.querySelector<HTMLElement>("h2")!;
  let opener: HTMLElement | null = null;
  let done = false;

  const showView = (isDone: boolean) => {
    done = isDone;
    formView.hidden = isDone;
    doneView.hidden = !isDone;
    dialog.setAttribute("aria-labelledby", (isDone ? doneTitle : formView.querySelector("h2")!).id);
  };

  const controller = bindForm({
    form,
    fields: ["name", "email", "college"],
    cooldownKey: "notified",
    busyLabel: "Saving…",
    successMessage: "You're on the list.",
    send: async values => {
      const { saveNotified } = await import("../lib/db");
      return (await saveNotified(values)) === "exists" ? "You're already on the list." : undefined;
    },
    onSuccess: message => {
      doneTitle.textContent = message;
      showView(true);
      doneTitle.focus();
    },
  });

  const open = (from: HTMLElement | null) => {
    opener = from;
    if (done) { controller.reset(); showView(false); }
    dialog.showModal();
    root.classList.add("modal-open");
  };

  dialog.addEventListener("close", () => {
    root.classList.remove("modal-open");
    // back to whatever opened it; the phone menu closes behind the dialog, so fall back to its button
    const target = opener?.isConnected && opener.getClientRects().length ? opener : document.getElementById("menuBtn");
    target?.focus();
    opener = null;
  });

  document.addEventListener("click", e => {
    const trigger = (e.target as HTMLElement).closest<HTMLElement>("[data-notify-open]");
    if (!trigger) return;
    e.preventDefault();
    open(trigger);
  });
  dialog.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => dialog.close()));

  // Close on a backdrop click. The panel fills the <dialog> box, so a press that starts and ends on the
  // dialog element itself is a press outside the panel (dragging a text selection out does not close it).
  let downOutside = false;
  dialog.addEventListener("pointerdown", e => { downOutside = e.target === dialog; });
  dialog.addEventListener("click", e => { if (e.target === dialog && downOutside) dialog.close(); });

  // showModal() already makes the page inert and Escape closes it; keep Tab cycling inside the dialog too.
  dialog.addEventListener("keydown", e => {
    if (e.key !== "Tab") return;
    const items = [...dialog.querySelectorAll<HTMLElement>("button, input, textarea, a[href], [tabindex]")]
      .filter(el => el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled && el.getClientRects().length);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}
