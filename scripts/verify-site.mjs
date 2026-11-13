// Screenshots every section at several viewport sizes and runs page-level checks.
// usage: node scripts/verify-site.mjs [baseUrl] [sizes]   e.g. node scripts/verify-site.mjs http://localhost:4174/ 1440x900,390x844
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const base = process.argv[2] || "http://localhost:5173/";
const sizes = (process.argv[3] || "1440x900,1280x720,820x1180,390x844,2560x1080,1280x620").split(",").map(s => s.split("x").map(Number));
const out = new URL("../docs/shots/site/", import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const errs = [];
const ids = ["summit", "about", "highlights", "programme", "venue", "partners", "faq", "register", "notify"];

for (const [w, h] of sizes) {
  const mobile = w < 900;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: mobile, isMobile: mobile });
  const page = await ctx.newPage();
  page.on("pageerror", e => errs.push(`${w}: ${e.message}`));
  page.on("console", m => { if (m.type() === "error") errs.push(`${w}: ${m.text()}`); });
  await page.goto(base + "?intro=0");
  await page.waitForTimeout(3200);
  for (const id of ids) {
    await page.evaluate(id => { const el = document.getElementById(id); scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: "instant" }); }, id);
    await page.waitForTimeout(id === "about" ? 2200 : 1500);
    await page.screenshot({ path: `${out}${w}-${ids.indexOf(id) + 1}-${id}.jpg`, type: "jpeg", quality: 80 });
  }
  const report = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth - innerWidth,
    h1: document.querySelectorAll("h1").length,
    headings: [...document.querySelectorAll("h1,h2,h3")].map(h => h.tagName + ":" + (h.getAttribute("aria-label") || h.textContent).trim().slice(0, 28)),
    imgsNoAlt: [...document.images].filter(i => !i.alt).length,
    upscaled: [...document.images].filter(i => i.complete && i.naturalWidth && i.getBoundingClientRect().width * devicePixelRatio > i.naturalWidth + 1 && !i.src.endsWith(".svg")).map(i => i.src.split("/").pop()),
    activeNav: document.querySelector('.site-nav__links a[aria-current="true"]')?.textContent,
  }));
  console.log(`${w}x${h}`, JSON.stringify(report));
  await ctx.close();
}

// interaction: gallery drag, FAQ by keyboard, nav jump
{
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(base + "?intro=0"); await page.waitForTimeout(3000);
  await page.evaluate(() => scrollTo({ top: document.getElementById("highlights").offsetTop, behavior: "instant" })); await page.waitForTimeout(900);
  const before = await page.evaluate(() => document.getElementById("hlNow").textContent);
  await page.mouse.move(900, 450); await page.mouse.down(); await page.mouse.move(300, 450, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(1500);
  const afterDrag = await page.evaluate(() => document.getElementById("hlNow").textContent);
  await page.click("#hlNext"); await page.waitForTimeout(900);
  const afterNext = await page.evaluate(() => document.getElementById("hlNow").textContent);
  console.log("gallery counter: start", before, "after drag", afterDrag, "after Next", afterNext);
  await page.evaluate(() => scrollTo({ top: document.getElementById("faq").offsetTop, behavior: "instant" })); await page.waitForTimeout(600);
  await page.focus(".qa:nth-child(3) summary"); await page.keyboard.press("Enter"); await page.waitForTimeout(300);
  console.log("FAQ opens with Enter:", await page.evaluate(() => document.querySelector(".qa:nth-child(3)").open));
  await page.click('.site-nav__links a[href="#venue"]'); await page.waitForTimeout(2500);
  console.log("nav click lands on venue:", await page.evaluate(() => Math.abs(document.getElementById("venue").getBoundingClientRect().top) < 4), "| active:", await page.evaluate(() => document.querySelector('.site-nav__links a[aria-current="true"]')?.textContent));
  await page.context().close();
}
console.log("errors:", errs);
await browser.close();
