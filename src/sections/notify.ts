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
    if (form.hasAttribute("data-off")) { say("This form is not connected yet."); return; }
    if (form.dataset.mail) {
      const body = encodeURIComponent(`Please reply to: ${input.value}\n\n`);
      location.href = `mailto:${form.dataset.mail}?subject=${encodeURIComponent("IEEE YESS 2026: a question")}&body=${body}`;
      say("Your mail app should open with the message ready to send.", true);
      return;
    }
    button.disabled = true;
    say("Sending…");
    try {
      const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      say("Thank you. We will be in touch.", true);
    } catch {
      say("That did not go through. Please try again in a moment.");
    } finally {
      button.disabled = false;
    }
  });
}
