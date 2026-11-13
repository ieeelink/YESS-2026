// Renders public/og.jpg (1200x630) from the built hero. Run after `npm run build` with `npx vite preview --port 4180` up.
// usage: node scripts/og.mjs [baseUrl]
import { chromium } from "playwright-core";
const base = process.argv[2] || "http://localhost:4180/";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.emulateMedia({ reducedMotion: "reduce" }); // no trailer, static organizer row
await page.goto(base + "?intro=0");
await page.addStyleTag({ content: ".nav{display:none!important}.hero__count,.hero__cta{visibility:hidden!important}.hero__grid{padding-top:56px!important}.hero__light{margin-top:-56px!important}" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1800);
await page.screenshot({ path: new URL("../public/og.jpg", import.meta.url).pathname, type: "jpeg", quality: 88 });
await browser.close();
console.log("wrote public/og.jpg");
