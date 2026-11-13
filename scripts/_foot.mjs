import { chromium } from "playwright-core";
const out = process.argv[2];
const b = await chromium.launch({ channel: "chrome", headless: true });
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const m = w < 900;
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: m ? 2 : 1, isMobile: m, hasTouch: m })).newPage();
  await p.goto("http://localhost:5180/?intro=0"); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/${w}-hero.jpg`, type: "jpeg", quality: 85 });
  const top = await p.evaluate(() => document.getElementById("notify").offsetTop);
  for (let y = top - 2 * h; y < top + 3000; y += 300) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(120); }
  await p.waitForTimeout(1500);
  await p.addStyleTag({ content: ".nav,.skip-link{visibility:hidden!important}" });
  const fh = await p.evaluate(() => document.getElementById("notify").offsetHeight);
  await p.screenshot({ path: `${out}/${w}-footer.jpg`, type: "jpeg", quality: 85, fullPage: true, clip: { x: 0, y: top - 160, width: w, height: fh + 160 } });
  const ft = await p.evaluate(() => document.getElementById("register").offsetTop);
  await p.screenshot({ path: `${out}/${w}-final.jpg`, type: "jpeg", quality: 85, fullPage: true, clip: { x: 0, y: ft, width: w, height: Math.min(top - ft + 200, 1400) } });
  await p.context().close();
}
await b.close();
