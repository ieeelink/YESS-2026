import { bindForm } from "../lib/form";

/** "Still have questions?": open a prefilled email in the visitor's configured mail app. */
export function initQuestions() {
  const form = document.getElementById("askForm") as HTMLFormElement | null;
  if (!form) return;
  bindForm({
    form,
    fields: ["name", "email", "message"],
    cooldownKey: "questions",
    busyLabel: "Opening…",
    successMessage: "Your email app should open with your message ready to send.",
    send: async values => {
      const body = `Name: ${values.name}\n\nEmail: ${values.email}\n\nMessage:\n\n${values.message}`;
      const params = new URLSearchParams({
        subject: "IEEE YESS 2026 – New Inquiry",
        body,
      });
      window.location.href = `mailto:ieeeyess2026@gmail.com?${params.toString()}`;
    },
  });
}
