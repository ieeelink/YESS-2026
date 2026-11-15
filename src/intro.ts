/** Ease the YESS mark from the loading screen into the event hero. */
export function runIntro(done: () => void) {
  const root = document.documentElement;
  const overlay = document.querySelector<HTMLElement>(".intro");
  if (!overlay || !root.classList.contains("has-intro")) { done(); return; }

  const label = document.getElementById("loadPercent");
  const bar = document.getElementById("loadProgress");
  let start = 0, raf = 0, ended = false;
  const duration = 2200;
  const finish = () => {
    if (ended) return;
    ended = true;
    cancelAnimationFrame(raf);
    if (label) label.textContent = "100%";
    if (bar) bar.style.width = "100%";
    root.classList.add("loading-complete");
    done();
    window.setTimeout(() => { root.classList.remove("has-intro", "loading-complete"); overlay.remove(); }, 900);
  };
  const progress = (now: number) => {
    if (ended) return;
    if (!start) start = now;
    const p = Math.min(1, (now - start) / duration);
    const eased = p * p * (3 - 2 * p);
    const value = Math.min(100, Math.max(1, Math.floor(1 + eased * 99)));
    if (label) label.textContent = `${String(value).padStart(2, "0")}%`;
    if (bar) bar.style.width = `${value}%`;
    if (p >= 1) { finish(); return; }
    raf = requestAnimationFrame(progress);
  };
  window.setTimeout(() => { if (overlay.isConnected) raf = requestAnimationFrame(progress); }, 140);
}
