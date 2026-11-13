/**
 * The notify form. With CONFIG.NOTIFY_ENDPOINT set it posts the email there (JSON accepted, so it
 * works with Formspree, Getform, Basin and similar) and confirms in place. Without an endpoint the
 * form is marked data-off and says the list is not open yet, rather than pretending to sign anyone up.
 */
export function initNotify() {
  const form = document.getElementById("notifyForm") as HTMLFormElement | null;
  if (!form) return;
  const msg = document.getElementById("notifyMsg")!;
  const input = form.querySelector<HTMLInputElement>("input[type=email]")!;
  const button = form.querySelector<HTMLButtonElement>("button")!;
  const say = (text: string, ok = false) => { msg.textContent = text; msg.dataset.ok = String(ok); };

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!input.checkValidity()) { say("Enter a valid email address."); input.focus(); return; }
    if (form.hasAttribute("data-off")) { say("The list opens shortly. Please check back soon."); return; }
    button.disabled = true;
    say("Sending…");
    try {
      const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      say("You are on the list. We will write when registration opens.", true);
    } catch {
      say("That did not go through. Please try again in a moment.");
    } finally {
      button.disabled = false;
    }
  });
}
