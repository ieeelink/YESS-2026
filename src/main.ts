import "./styles/base.css";
import "./styles/hero.css";
import "./styles/sections.css";
import { runIntro } from "./intro";
import { startCountdown } from "./lib/countdown";
import { splitLines } from "./lib/split";
import { initGallery } from "./sections/gallery";
import { fitScene, initHeroLight } from "./sections/hero";
import { initNav } from "./sections/nav";
import { initNotify } from "./sections/notify";

startCountdown(document.getElementById("count")!);

// statements that reveal line by line: split now, again once fonts land, and when the measure changes
// the footer wordmark: one line at about 70% of the content width, whatever the font metrics
const mark = document.getElementById("footMark")!, markIn = mark.firstElementChild as HTMLElement;
const fitMark = () => {
  mark.style.fontSize = "100px";
  const box = mark.parentElement!, cs = getComputedStyle(box);
  const content = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  mark.style.fontSize = `${((content * 0.7) / markIn.scrollWidth) * 100}px`;
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
initHeroLight();
fitScene();
runIntro(() => document.documentElement.classList.add("ready"));
