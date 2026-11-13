// Captures the hero checkpoint frames and runs the functional checks.
// usage: node scripts/verify-hero.mjs [baseUrl]   (default http://localhost:5173/)
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const base = process.argv[2] || "http://localhost:5173/";
const out = new URL("../docs/shots/hero/", import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const errs = [];
async function open(w, h, query = "", mobile = false, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, hasTouch: mobile, isMobile: mobile, ...opts });
  const page = await ctx.newPage();
  page.on("pageerror", e => errs.push(e.message));
  page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto(base + query);
  return page;
}
const shot = (page, name) => page.screenshot({ path: `${out}${name}.jpg`, type: "jpeg", quality: 88 });
const cls = (page, id, c) => page.evaluate(([id, c]) => document.getElementById(id).classList.contains(c), [id, c]);

// intro, frozen at exact clock times
for (const [name, at] of [["01-0.5s", 0.5], ["02-2.0s", 2.0], ["03-4.0s", 4.0], ["04-6.0s", 6.0], ["05-7.1s-logo-beat", 7.1]]) {
  const page = await open(1440, 900, "?at=" + at); await page.waitForTimeout(900); await shot(page, name); await page.context().close();
}

// real time: intro -> hero -> scroll through the doors
let page = await open(1440, 900, "?intro=1"); await page.waitForTimeout(10500);
await shot(page, "06-hero-1440");
console.log("after intro:", JSON.stringify(await page.evaluate(() => ({ ...window.__stats, locked: document.body.classList.contains("locked"), skip: document.getElementById("skipLabel").textContent }))));
for (const s of [0.3, 0.5, 0.7, 0.9, 1.0]) {
  await page.evaluate(s => { const el = document.getElementById("summit"); scrollTo(0, (el.offsetHeight - innerHeight) * s); }, s);
  await page.waitForTimeout(1300); await shot(page, "scroll-" + String(s.toFixed(1)).replace(".", ""));
}
await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(700);
await page.click("#skip"); await page.waitForTimeout(900);
console.log("replay restarts the intro:", !(await cls(page, "stage", "open")));
await page.click("#skip"); await page.waitForTimeout(1600);
console.log("skip lands on the hero:", await cls(page, "stage", "in"));
await page.goto(base); await page.waitForTimeout(1500);
console.log("second visit in the same session skips the intro:", await cls(page, "stage", "in"));
await page.keyboard.press("Tab");
console.log("first Tab focuses:", await page.evaluate(() => document.activeElement?.textContent?.trim()));
await page.context().close();

// other sizes
for (const [name, w, h, mobile] of [["07-phone-390", 390, 844, true], ["08-tablet-820", 820, 1180, true], ["09-laptop-1280x620", 1280, 620, false], ["10-ultrawide-2560x1080", 2560, 1080, false], ["11-phone-360", 360, 740, true], ["12-phone-landscape", 844, 390, true]]) {
  page = await open(w, h, "?intro=0", mobile); await page.waitForTimeout(4000); await shot(page, name);
  if (name === "07-phone-390") console.log("phone:", JSON.stringify(await page.evaluate(() => window.__stats)));
  await page.context().close();
}
page = await open(390, 844, "?intro=1", true); await page.waitForTimeout(2700); await shot(page, "phone-intro-2.7s"); await page.context().close();

// calm versions
page = await open(1440, 900, "?nogl=1"); await page.waitForTimeout(1500); await shot(page, "calm-no-webgl");
console.log("no WebGL: hero shown, page scrollable:", (await cls(page, "stage", "in")) && !(await page.evaluate(() => document.body.classList.contains("locked"))));
await page.context().close();
page = await open(1440, 900, "", false, { reducedMotion: "reduce" }); await page.waitForTimeout(1500); await shot(page, "calm-reduced-motion");
console.log("reduced motion: calm class =", await page.evaluate(() => document.documentElement.classList.contains("calm")));
await page.context().close();

console.log("errors:", errs);
await browser.close();
