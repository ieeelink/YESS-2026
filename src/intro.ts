import "./styles/book-loader.css";

const MINIMUM_MS = 1200;
const MAXIMUM_MS = 2600;

export function runIntro(done: () => void) {
  const root = document.documentElement;
  const overlay = document.querySelector<HTMLElement>(".intro");
  if (!overlay || !root.classList.contains("has-intro")) { done(); return; }

  const label = document.getElementById("loadPercent");
  const bar = document.getElementById("loadProgress");
  let assetProgress = 0;
  const assets: Promise<unknown>[] = [];
  if (document.fonts?.ready) assets.push(document.fonts.ready.catch(() => undefined));
  document.querySelectorAll<HTMLImageElement>("#heroLogo,.hero img").forEach(image => {
    if (image.complete && image.naturalWidth) return;
    assets.push(new Promise(resolve => {
      image.addEventListener("load", resolve, { once:true });
      image.addEventListener("error", resolve, { once:true });
    }));
  });
  let assetsDone = assets.length === 0;
  Promise.all(assets).then(() => { assetsDone = true; });

  const start = performance.now();
  let raf = 0, ended = false;
  const finish = () => {
    if (ended) return;
    ended = true;
    cancelAnimationFrame(raf);
    root.classList.add("loading-complete");
    root.classList.remove("is-loading", "has-intro");
    done();
    window.setTimeout(() => { root.classList.remove("loading-complete"); overlay.remove(); }, 700);
  };
  const tick = (now: number) => {
    if (ended) return;
    const elapsed = now - start;
    const timedProgress = Math.min(98, elapsed / MAXIMUM_MS * 100);
    const value = Math.max(1, Math.floor(Math.max(timedProgress, assetProgress * 95)));
    if (label) label.textContent = `${String(value).padStart(2,"0")}%`;
    if (bar) bar.style.width = `${value}%`;
    if (elapsed >= MINIMUM_MS && assetsDone) {
      if (label) label.textContent = "100%";
      if (bar) bar.style.width = "100%";
      finish(); return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}
