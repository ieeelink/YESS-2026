import { reducedMotion } from "../lib/env";

/**
 * The hall of moments: a native horizontal scroller (so touch, trackpad and keyboard work as the
 * platform intends) with mouse drag and inertia added on top. The plate nearest the centre is the
 * one in focus: it comes up to full light and the counter follows it.
 */
export function initGallery() {
  const strip = document.getElementById("strip");
  if (!strip) return;
  const plates = [...strip.querySelectorAll<HTMLElement>(".plate")];
  const now = document.getElementById("hlNow")!;
  const pad = (n: number) => String(n).padStart(2, "0");
  let current = -1;
  let autoplay = 0;
  const stopAutoplay = () => { clearInterval(autoplay); };
  const startAutoplay = () => {
    stopAutoplay();
    if (!reducedMotion && plates.length > 1) autoplay = window.setInterval(() => goTo((current + 1) % plates.length), 3800);
  };

  const centreOf = (el: HTMLElement) => el.offsetLeft + el.offsetWidth / 2;
  const focus = () => {
    const mid = strip.scrollLeft + strip.clientWidth / 2;
    let best = 0, bd = Infinity;
    plates.forEach((p, i) => { const d = Math.abs(centreOf(p) - mid); if (d < bd) { bd = d; best = i; } });
    if (best !== current) {
      current = best;
      plates.forEach((p, i) => p.classList.toggle("is-on", i === best));
      now.textContent = pad(best + 1);
    }
  };
  const goTo = (i: number) => {
    const p = plates[Math.max(0, Math.min(plates.length - 1, i))];
    strip.scrollTo({ left: centreOf(p) - strip.clientWidth / 2, behavior: reducedMotion ? "auto" : "smooth" });
  };

  let raf = 0;
  strip.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(focus); }, { passive: true });
  addEventListener("resize", focus);
  document.getElementById("hlPrev")!.addEventListener("click", () => { goTo((current - 1 + plates.length) % plates.length); startAutoplay(); });
  document.getElementById("hlNext")!.addEventListener("click", () => { goTo((current + 1) % plates.length); startAutoplay(); });
  strip.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo((current + 1) % plates.length); startAutoplay(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo((current - 1 + plates.length) % plates.length); startAutoplay(); }
    if (e.key === "Home") { e.preventDefault(); goTo(0); }
    if (e.key === "End") { e.preventDefault(); goTo(plates.length - 1); }
  });

  // mouse drag with inertia (touch already has both from the browser)
  let down = false, startX = 0, startLeft = 0, lastX = 0, lastT = 0, v = 0, glide = 0, moved = 0;
  strip.addEventListener("pointerdown", e => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    stopAutoplay(); down = true; moved = 0; startX = lastX = e.clientX; startLeft = strip.scrollLeft; lastT = performance.now(); v = 0;
    cancelAnimationFrame(glide); strip.classList.add("is-drag"); strip.setPointerCapture(e.pointerId);
  });
  strip.addEventListener("pointermove", e => {
    if (!down) return;
    const t = performance.now(), dx = e.clientX - lastX;
    moved += Math.abs(dx);
    strip.scrollLeft = startLeft - (e.clientX - startX);
    if (t > lastT) v = 0.8 * (dx / (t - lastT)) + 0.2 * v;      // px per ms, lightly smoothed
    lastX = e.clientX; lastT = t;
  });
  const release = () => {
    if (!down) return;
    down = false; strip.classList.remove("is-drag");
    if (reducedMotion || Math.abs(v) < 0.05) return;
    let last = performance.now();
    const step = (t: number) => {
      const dt = t - last; last = t;
      strip.scrollLeft -= v * dt;
      v *= Math.pow(0.995, dt);                                   // friction: loses about 95% of its speed in 0.6s
      if (Math.abs(v) > 0.02) glide = requestAnimationFrame(step);
    };
    glide = requestAnimationFrame(step);
  };
  strip.addEventListener("pointerup", release);
  strip.addEventListener("pointercancel", release);
  strip.addEventListener("pointerup", startAutoplay);
  strip.addEventListener("pointercancel", startAutoplay);
  strip.addEventListener("mouseenter", stopAutoplay);
  strip.addEventListener("mouseleave", startAutoplay);
  strip.addEventListener("focusin", stopAutoplay);
  strip.addEventListener("focusout", startAutoplay);
  strip.addEventListener("click", e => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);

  focus();
  startAutoplay();
}
