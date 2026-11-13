// Renders the stills the site ships with: the arch (wide and tall) for the reduced-motion / no-WebGL
// version, and the Open Graph image. Run against a dev or preview server:
//   node scripts/render-stills.mjs [baseUrl]      (default http://localhost:5173/)
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const base = process.argv[2] || "http://localhost:5173/";
const pub = new URL("../public/", import.meta.url).pathname;
mkdirSync(pub + "stills", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
for (const [file, w, h, q, quality] of [
  ["stills/arch-wide.jpg", 1920, 1080, "?intro=0&tier=high&capture=1", 74],
  ["stills/arch-tall.jpg", 900, 1600, "?intro=0&tier=high&capture=1", 74],
  ["og.jpg", 1200, 630, "?intro=0&tier=high&og=1", 84],
]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })).newPage();
  await page.goto(base + q);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: pub + file, type: "jpeg", quality });
  console.log("wrote public/" + file);
  await page.context().close();
}
await browser.close();
