import "./styles/base.css";
import "./styles/hero.css";
import "./styles/sections.css";
import "./styles/forms.css";
import "./styles/rework.css";
import { runIntro } from "./intro";
import { startCountdown } from "./lib/countdown";
import { splitLines } from "./lib/split";
import { initGallery } from "./sections/gallery";
import { initHeroLight } from "./sections/hero";
import { initNav } from "./sections/nav";
import { initNotify } from "./sections/notify";
import { initFooter } from "./sections/footer";

startCountdown(document.getElementById("count")!);

// statements that reveal line by line: split now, again once fonts land, and when the measure changes
// fit the IEEE YESS wordmark to the footer's full inner width
const mark = document.getElementById("footMark")!, markIn = mark.firstElementChild as HTMLElement;
const fitMark = () => {
  mark.style.fontSize = "100px";
  const box = mark.parentElement!, cs = getComputedStyle(box);
  const content = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  mark.style.fontSize = `${(content * 0.85 / markIn.scrollWidth) * 100}px`;
};

const splits = [...document.querySelectorAll<HTMLElement>("[data-split]")];
// the organizer marquee moves at a constant ~50 px/s whatever the logo sizes: one half of the track per loop
const mqTrack = document.querySelector<HTMLElement>(".mq__track"), mqHalf = document.querySelector<HTMLElement>(".mq__half");
const fitMarquee = () => { if (mqTrack && mqHalf && mqHalf.offsetWidth) mqTrack.style.setProperty("--mq-dur", `${(mqHalf.offsetWidth / 50).toFixed(2)}s`); };

const resplit = () => { splits.forEach(splitLines); fitMark(); fitMarquee(); };
resplit();
document.fonts?.ready.then(resplit);
addEventListener("load", fitMarquee);
let rz = 0, lastW = innerWidth;
addEventListener("resize", () => { if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rz); rz = window.setTimeout(resplit, 150); });

initNav();
initGallery();
initNotify();
initFooter();
initHeroLight();
runIntro(() => document.documentElement.classList.add("ready"));

// A small, eased pointer response gives the otherwise still wordmark a sense of depth.
const hero = document.getElementById("top");
if (hero && matchMedia("(hover: hover) and (pointer: fine)").matches) {
  let pointerFrame = 0, px = 0, py = 0;
  hero.addEventListener("pointermove", event => {
    px = event.clientX; py = event.clientY;
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      const box = hero.getBoundingClientRect();
      const x = px - box.left, y = py - box.top;
      hero.style.setProperty("--cursor-x", `${x}px`);
      hero.style.setProperty("--cursor-y", `${y}px`);
      hero.style.setProperty("--logo-x", `${((x / box.width) - .5) * 12}px`);
      hero.style.setProperty("--logo-y", `${((y / box.height) - .5) * 10}px`);
    });
  }, { passive: true });
  hero.addEventListener("pointerleave", () => {
    hero.style.setProperty("--logo-x", "0px");
    hero.style.setProperty("--logo-y", "0px");
    hero.style.setProperty("--cursor-x", "50%");
    hero.style.setProperty("--cursor-y", "50%");
  });
}

// Drive the pinned date-to-destination transition from scroll progress.
const hostJourney = document.querySelector<HTMLElement>(".host-journey");
if (hostJourney) {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const updateJourney = () => {
    const rect = hostJourney.getBoundingClientRect();
    const distance = Math.max(1, hostJourney.offsetHeight - innerHeight);
    const raw = reducedMotion ? 0 : Math.max(0, Math.min(1, -rect.top / distance));
    const progress = raw * raw * raw * (raw * (raw * 6 - 15) + 10);
    hostJourney.style.setProperty("--journey-progress", progress.toFixed(3));
    hostJourney.style.setProperty("--spiral-scale", (0.9 + progress * 2.8).toFixed(3));
    hostJourney.style.setProperty("--venue-reveal", (Math.max(0, Math.min(1, (progress - .24) / .62)) * 220).toFixed(1) + "%");
    hostJourney.style.setProperty("--destination-opacity", Math.max(0, Math.min(1, (progress - .55) / .3)).toFixed(3));
    hostJourney.style.setProperty("--date-opacity", Math.max(0, Math.min(1, 1 - progress / .58)).toFixed(3));
    hostJourney.style.setProperty("--spiral-opacity", Math.max(0, Math.min(1, 1 - Math.max(0, progress - .56) / .3)).toFixed(3));
    const destination = hostJourney.querySelector<HTMLElement>(".host-destination");
    // Make the destination controls interactive as soon as the panel begins to appear.
    if (destination) destination.style.pointerEvents = reducedMotion || progress > .52 ? "auto" : "none";
  };
  let journeyFrame = 0;
  const queueJourney = () => { if (!journeyFrame) journeyFrame = requestAnimationFrame(() => { journeyFrame = 0; updateJourney(); }); };
  addEventListener("scroll", queueJourney, { passive: true });
  addEventListener("resize", queueJourney, { passive: true });
  updateJourney();
  const portal = hostJourney.querySelector<HTMLElement>(".host-journey__spiral");
  if (portal && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let portalFrame = 0, pointerX = 0, pointerY = 0;
    portal.addEventListener("pointermove", event => {
      const rect = portal.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - .5;
      pointerY = (event.clientY - rect.top) / rect.height - .5;
      if (portalFrame) return;
      portalFrame = requestAnimationFrame(() => {
        portalFrame = 0;
        portal.style.setProperty("--portal-x", `${(pointerX * 12).toFixed(1)}px`);
        portal.style.setProperty("--portal-y", `${(pointerY * 12).toFixed(1)}px`);
      });
    }, { passive: true });
    portal.addEventListener("pointerleave", () => {
      portal.style.setProperty("--portal-x", "0px");
      portal.style.setProperty("--portal-y", "0px");
    });
  }
}
