import { defineConfig, type Plugin } from "vite";
import { CONFIG } from "./src/content/config";
import { cta, directions, esc, faq, highlights, highlightsCount, marquee, notify, programme, socials, sponsors } from "./src/render/sections";

/**
 * Fills {{TOKENS}} in index.html from the content files at build time, so the facts live in one
 * place and the built HTML still contains them as plain text (readable without JavaScript, and by
 * crawlers). Runs before Vite's own HTML pass, so image paths in the generated markup are hashed
 * and copied like any other asset.
 */
function contentTokens(): Plugin {
  return {
    name: "yess-content-tokens",
    buildStart() {
      // Launch checklist: say out loud which facts are still missing.
      const todo = Object.entries({ REGISTER_URL: CONFIG.REGISTER_URL, NOTIFY_ENDPOINT: CONFIG.NOTIFY_ENDPOINT, CONTACT_EMAIL: CONFIG.CONTACT_EMAIL, SITE_URL: CONFIG.SITE_URL })
        .filter(([, v]) => !v).map(([k]) => k);
      if (!Object.values(CONFIG.SOCIALS).some(Boolean)) todo.push("SOCIALS");
      if (todo.length) this.warn(`CONFIG still empty (src/content/config.ts): ${todo.join(", ")}`);
      if (CONFIG.WHAT_LINE) this.warn(`CONFIG.WHAT_LINE is marked TODO-confirm: "${CONFIG.WHAT_LINE}"`);
    },
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        const site = CONFIG.SITE_URL as string | null;
        const meta = site
          ? `<link rel="canonical" href="${esc(site)}/">\n<meta property="og:url" content="${esc(site)}/">\n<meta property="og:image" content="${esc(site)}/og.jpg">\n<meta name="twitter:image" content="${esc(site)}/og.jpg">`
          : `<!-- TODO: set CONFIG.SITE_URL to emit canonical and absolute Open Graph URLs -->\n<meta property="og:image" content="og.jpg">\n<meta name="twitter:image" content="og.jpg">`;
        const map: Record<string, string> = {
          EVENT_NAME: esc(CONFIG.EVENT_NAME),
          EVENT_FULL_NAME: esc(CONFIG.EVENT_FULL_NAME),
          DATE_DAY_MONTH: esc(CONFIG.DATE_DAY_MONTH),
          DATE_DAY: esc(CONFIG.DATE_DAY_MONTH.split(" ")[0]),
          DATE_MONTH: esc(CONFIG.DATE_DAY_MONTH.split(" ").slice(1).join(" ")),
          DATE_YEAR: esc(CONFIG.DATE_YEAR),
          HOURS_LABEL: esc(CONFIG.HOURS_LABEL),
          HOURS_SHORT: esc(CONFIG.HOURS_SHORT),
          VENUE_NAME: esc(CONFIG.VENUE_NAME),
          VENUE_SHORT: esc(CONFIG.VENUE_SHORT),
          VENUE_L1: esc(CONFIG.VENUE_LINES[0]),
          VENUE_L2: esc(CONFIG.VENUE_LINES[1]),
          VENUE_CITY: esc(CONFIG.VENUE_CITY),
          ORGANIZED_BY: esc(CONFIG.ORGANIZED_BY),
          MARQUEE: marquee(),
          ABOUT: esc(CONFIG.ABOUT),
          WHAT: CONFIG.WHAT_LINE ? `<p class="about__what lede fade">${esc(CONFIG.WHAT_LINE)}</p>` : "",
          LINK_IEEE: esc(CONFIG.LINKS.ieee),
          LINK_KERALA: esc(CONFIG.LINKS.ieeeKerala),
          LINK_LINK: esc(CONFIG.LINKS.ieeeLink),
          LINK_YESS25: esc(CONFIG.LINKS.yess25),
          WORDMARK: [..."IEEE YESS"].map((c, i) => `<span class="ch" style="--i:${i}">${c === " " ? "&nbsp;" : c}</span>`).join(""),
          DIRECTIONS_URL: directions(),
          CTA: cta(),
          HIGHLIGHTS: highlights(),
          HIGHLIGHTS_COUNT: highlightsCount(),
          PROGRAMME: programme(),
          SPONSORS: sponsors(),
          FAQ: faq(),
          NOTIFY: notify(),
          SOCIALS: socials(),
          SITE_META: meta,
        };
        return html.replace(/\{\{([A-Z0-9_]+)\}\}/g, (m, k: string) => (k in map ? map[k] : m));
      },
    },
  };
}

export default defineConfig({
  base: "./", // works from any sub-path or subdomain; the domain is never hard-coded
  plugins: [contentTokens()],
  build: { target: "es2019", assetsInlineLimit: 0, chunkSizeWarningLimit: 200 }, // the logo and marks always ship as files, never inlined
});
