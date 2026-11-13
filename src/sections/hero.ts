import { reducedMotion } from "../lib/env";

/**
 * Desktop only: the beam leans a little toward the pointer (at most 1.5vw either side of its resting
 * line), carrying the lit window over the crowd with it. One CSS number (--px), transform only, eased by
 * the beam's own transition. Off for touch screens and reduced motion. The logo is never reached: the
 * beam rests on the right two-thirds of the hero.
 */
export function initHeroLight() {
  if (reducedMotion || !matchMedia("(hover: hover) and (pointer: fine) and (min-width: 820px)").matches) return;
  const hero = document.getElementById("top")!;
  let x = 0, raf = 0;
  hero.addEventListener("pointermove", e => {
    x = e.clientX;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const rest = parseFloat(getComputedStyle(hero).getPropertyValue("--rest")) || 66;
      const d = (x / innerWidth) * 100 - rest; // vw from the resting line
      hero.style.setProperty("--px", Math.max(-1, Math.min(1, d / 30)).toFixed(3));
    });
  }, { passive: true });
  hero.addEventListener("pointerleave", () => hero.style.setProperty("--px", "0"));
}

/**
 * Phones: the lit crowd lives in the band between the logo and the date, so neither the logo nor the
 * date ever sits on the photo. The band's edges are measured (they move with font loading and screen
 * height) and handed to CSS as --st (top) and --sh (height). Wider screens use the full-bleed scene.
 */
export function fitScene() {
  const hero = document.getElementById("top")!;
  const logo = hero.querySelector<HTMLElement>(".hero__logo")!, date = hero.querySelector<HTMLElement>(".hero__date")!;
  const run = () => {
    if (innerWidth >= 820) { hero.style.removeProperty("--st"); hero.style.removeProperty("--sh"); return; }
    const top = hero.getBoundingClientRect().top;
    const a = logo.getBoundingClientRect().bottom - top + 6, b = date.getBoundingClientRect().top - top + parseFloat(getComputedStyle(date).fontSize) * 0.12;
    hero.style.setProperty("--st", `${Math.round(a)}px`);
    hero.style.setProperty("--sh", `${Math.max(80, Math.round(b - a))}px`);
  };
  run();
  document.fonts?.ready.then(run);
  let t = 0;
  addEventListener("resize", () => { clearTimeout(t); t = window.setTimeout(run, 120); }, { passive: true });
}
