import "./styles/book-loader.css";

const LOAD_DURATION_MS = 3000;
const COMPLETE_HOLD_MS = 400;

function easeInOut(value: number) {
  return value < .5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

export function runIntro(done: () => void) {
  const root = document.documentElement;
  const overlay = document.querySelector<HTMLElement>(".intro");
  if (!overlay || !root.classList.contains("has-intro")) { done(); return; }

  const label = document.getElementById("loadPercent");
  const start = performance.now();
  let raf = 0, completedAt = 0, ended = false;

  const finish = () => {
    if (ended) return;
    ended = true;
    cancelAnimationFrame(raf);
    root.classList.add("loading-complete");
    root.classList.remove("is-loading", "has-intro");
    done();
    window.setTimeout(() => {
      root.classList.remove("loading-complete");
      overlay.remove();
    }, 700);
  };

  const tick = (now: number) => {
    if (ended) return;
    const progress = Math.min(1, Math.max(0, (now - start) / LOAD_DURATION_MS));
    const value = Math.min(100, Math.max(1, Math.round(1 + 99 * easeInOut(progress))));
    if (label) label.textContent = String(value);
    overlay.setAttribute("aria-valuenow", String(value));

    if (progress >= 1) {
      if (!completedAt) completedAt = now;
      if (now - completedAt >= COMPLETE_HOLD_MS) { finish(); return; }
    }
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);
}
