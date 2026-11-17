import { bindForm } from "../lib/form";

/** "Still have questions?": the footer form, written to the `questions` collection. */
export function initQuestions() {
  const form = document.getElementById("askForm") as HTMLFormElement | null;
  if (!form) return;
  bindForm({
    form,
    fields: ["name", "email", "message"],
    cooldownKey: "questions",
    busyLabel: "Sending…",
    successMessage: "Thank you, your message is in. We'll reply by email.",
    send: async values => {
      const { saveQuestion } = await import("../lib/db");
      await saveQuestion(values);
    },
  });
}
