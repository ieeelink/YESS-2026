import "./styles/base.css";
import "./styles/hero.css";
import "./styles/sections.css";
import { runIntro } from "./intro";
import { startCountdown } from "./lib/countdown";
import { splitLines } from "./lib/split";
import { initGallery } from "./sections/gallery";
import { initNav } from "./sections/nav";
import { initNotify } from "./sections/notify";

startCountdown(document.getElementById("count")!, document.getElementById("countLabel"));

// statements that reveal line by line: split now, again once fonts land, and when the measure changes
const splits = [...document.querySelectorAll<HTMLElement>("[data-split]")];
const resplit = () => splits.forEach(splitLines);
resplit();
document.fonts?.ready.then(resplit);
let rz = 0, lastW = innerWidth;
addEventListener("resize", () => { if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rz); rz = window.setTimeout(resplit, 150); });

initNav();
initGallery();
initNotify();
runIntro(() => document.documentElement.classList.add("ready"));
