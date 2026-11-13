import "./styles/base.css";
import "./styles/hero.css";
import "./styles/sections.css";
import { initHero } from "./hero";
import { startCountdown } from "./lib/countdown";
import { splitLines } from "./lib/split";
import { initGallery } from "./sections/gallery";
import { initNav } from "./sections/nav";

const $ = (id: string) => document.getElementById(id)!;

startCountdown($("count"), $("doorsLabel"));
startCountdown($("countFinal"), $("finalLabel").firstElementChild as HTMLElement);

// statements that reveal line by line: split now, and again when the measure changes
const splits = [...document.querySelectorAll<HTMLElement>("[data-split]")];
const resplit = () => splits.forEach(splitLines);
resplit();
(document as Document & { fonts?: FontFaceSet }).fonts?.ready.then(resplit);
let rz = 0, lastW = innerWidth;
addEventListener("resize", () => { if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rz); rz = window.setTimeout(resplit, 150); });

initNav();
initGallery();
initHero();
