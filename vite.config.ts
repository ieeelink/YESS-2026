import { defineConfig, type Plugin } from "vite";
import { CONFIG } from "./src/content/config";
import { cta, directions, esc, faq, highlights, highlightsCount, notify, programme, socials, sponsors } from "./src/render/sections";

/**
 * Fills {{TOKENS}} in index.html from the content files at build time, so the facts live in one
 * place and the built HTML still contains them as plain text (readable without JavaScript, and by
 * crawlers). Runs before Vite's own HTML pass, so image paths in the generated markup are hashed
 * and copied like any other asset.
 */
function contentTokens(): Plugin {
  return {
    name: "yess-content-tokens",
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
          KICKER: esc(CONFIG.KICKER),
          DATE_DAY_MONTH: esc(CONFIG.DATE_DAY_MONTH),
          DATE_YEAR: esc(CONFIG.DATE_YEAR),
          HOURS_LABEL: esc(CONFIG.HOURS_LABEL),
          VENUE_NAME: esc(CONFIG.VENUE_NAME),
          VENUE_CITY: esc(CONFIG.VENUE_CITY),
          ORGANIZED_BY: esc(CONFIG.ORGANIZED_BY),
          ABOUT: esc(CONFIG.ABOUT),
          LINK_IEEE: esc(CONFIG.LINKS.ieee),
          LINK_KERALA: esc(CONFIG.LINKS.ieeeKerala),
          LINK_LINK: esc(CONFIG.LINKS.ieeeLink),
          DIRECTIONS_URL: directions(),
          CTA_HERO: cta("hero"),
          CTA_FINAL: cta("final"),
          HIGHLIGHTS: highlights(),
          HIGHLIGHTS_COUNT: highlightsCount(),
          PROGRAMME: programme(),
          SPONSORS: sponsors(),
          FAQ: faq(),
          NOTIFY: notify(),
          SOCIALS: socials(),
          SITE_META: meta,
        };
        return html.replace(/\{\{([A-Z_]+)\}\}/g, (m, k: string) => (k in map ? map[k] : m));
      },
    },
  };
}

export default defineConfig({
  base: "./", // works from any sub-path or subdomain; the domain is never hard-coded
  plugins: [contentTokens()],
  build: { target: "es2019", assetsInlineLimit: 0 }, // the logo and marks always ship as files, never inlined
});
