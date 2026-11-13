// Screenshots for design review. usage: node scripts/shots.mjs <baseUrl> <outDir> <WxH,...> [mode]
// mode: "hero" (first viewport only), "all" (every section), "intro" (trailer frames)
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const [base = "http://localhost:5180/", out = "docs/shots/after", sizes = "1440x900,390x844", mode = "all"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errs = [];
for (const s of sizes.split(",")) {
  const [w, h] = s.split("x").map(Number), mobile = w < 900;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, hasTouch: mobile, isMobile: mobile });
  const page = await ctx.newPage();
  page.on("pageerror", e => errs.push(`${s}: ${e.message}`));
  page.on("console", m => { if (m.type() === "error" || m.type() === "warning") errs.push(`${s} ${m.type()}: ${m.text()}`); });
  if (mode === "intro") {
    await page.goto(base + "?intro=1");
    const t0 = Date.now();
    for (const t of [900, 1900, 2900, 4000, 5000, 5300, 6200]) {
      await page.waitForTimeout(Math.max(0, t - (Date.now() - t0)));
      await page.screenshot({ path: `${out}/${w}x${h}-intro-${t}ms.jpg`, type: "jpeg", quality: 82 });
    }
    await ctx.close(); continue;
  }
  await page.goto(base + "?intro=0");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${out}/${w}x${h}-00-hero.jpg`, type: "jpeg", quality: 82 });
  if (mode === "all") {
    const ids = await page.evaluate(() => [...document.querySelectorAll("main > section[id], footer[id]")].map(e => e.id).slice(1));
    for (const [i, id] of ids.entries()) {
      await page.evaluate(id => { const el = document.getElementById(id); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - (id === "notify" ? 0 : 0), behavior: "instant" }); }, id);
      await page.waitForTimeout(2600);
      await page.screenshot({ path: `${out}/${w}x${h}-${String(i + 1).padStart(2, "0")}-${id}.jpg`, type: "jpeg", quality: 82 });
    }
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })); await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/${w}x${h}-99-end.jpg`, type: "jpeg", quality: 82 });
  }
  const r = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth - innerWidth,
    heroH: Math.round(document.getElementById("top").getBoundingClientRect().height), vh: innerHeight,
    smallTargets: [...document.querySelectorAll("a,button,summary,input")].filter(e => { const b = e.getBoundingClientRect(); return b.width && b.height && b.height < 44 && getComputedStyle(e).visibility !== "hidden" && !e.closest(".nav__links,.skip-link,.mq"); }).map(e => (e.textContent || e.getAttribute("aria-label") || e.tagName).trim().slice(0, 24) + ":" + Math.round(e.getBoundingClientRect().height)).slice(0, 12),
    upscaled: [...document.images].filter(i => i.complete && i.naturalWidth && !i.src.endsWith(".svg") && i.getBoundingClientRect().width > i.naturalWidth + 0.5).map(i => i.src.split("/").pop()),
  }));
  console.log(s, JSON.stringify(r));
  await ctx.close();
}
console.log("errors:", JSON.stringify(errs));
await browser.close();
