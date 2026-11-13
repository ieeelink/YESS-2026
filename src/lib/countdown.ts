import { CONFIG } from "../content/config";

/**
 * Counts down to the doors opening. Three states: before (days, hours, minutes, seconds),
 * during the event ("Happening now") and after it ("YESS 2026 has concluded").
 */
export function startCountdown(root: HTMLElement, label?: HTMLElement | null) {
  const start = Date.parse(CONFIG.START), end = Date.parse(CONFIG.END);
  const cells: Record<string, HTMLElement> = {};
  root.querySelectorAll<HTMLElement>("[data-cd]").forEach(el => (cells[el.dataset.cd!] = el));
  const pad = (v: number) => String(v).padStart(2, "0");
  const tick = () => {
    const now = Date.now();
    if (now >= start) {
      if (label) label.textContent = now < end ? "The doors are open" : CONFIG.DATE_DAY_MONTH + " " + CONFIG.DATE_YEAR;
      root.innerHTML = `<span class="count__msg">${now < end ? "Happening now" : "YESS 2026 has concluded"}</span>`;
      if (now < end) setTimeout(tick, Math.min(end - now + 50, 60_000));
      return;
    }
    let s = Math.floor((start - now) / 1000);
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    const v: Record<string, string> = { d: pad(d), h: pad(h), m: pad(m), s: pad(s) };
    for (const k in v) if (cells[k] && cells[k].textContent !== v[k]) cells[k].textContent = v[k];
    setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
  };
  tick();
}
