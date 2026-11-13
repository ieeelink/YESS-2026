/**
 * Splits a block of text into its rendered lines so each can rise out of its own mask.
 * Re-run on resize. The original sentence stays available to assistive tech through aria-label.
 */
export function splitLines(el: HTMLElement) {
  const text = el.dataset.text ?? (el.dataset.text = el.textContent!.trim());
  el.setAttribute("aria-label", text);
  el.innerHTML = text.split(/\s+/).map(w => `<span class="w" style="display:inline-block">${w}</span>`).join(" ");
  const lines: string[][] = [];
  let top = -1;
  el.querySelectorAll<HTMLElement>(".w").forEach(w => {
    if (w.offsetTop !== top) { lines.push([]); top = w.offsetTop; }
    lines[lines.length - 1].push(w.textContent!);
  });
  el.innerHTML = lines.map((l, i) => `<span class="ln" aria-hidden="true" style="--i:${i}"><span>${l.join(" ")}</span></span>`).join("");
}
