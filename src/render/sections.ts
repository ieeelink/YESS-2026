/**
 * Build-time HTML for the parts of the page that come from data files. vite.config.ts drops the
 * results into index.html, so the shipped page contains this content as plain markup.
 */
import { CONFIG, directionsUrl } from "../content/config";
import { HIGHLIGHTS } from "../content/highlights";
import { FAQ, SPONSOR_TIERS } from "../content/placeholders";
import { PROGRAMME } from "../content/programme";

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pad = (n: number) => String(n).padStart(2, "0");
const arrow = `<svg class="btn__icon" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
const out = `<svg class="btn__icon" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4 3h5v5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;

/** The primary button: a chamfered label block and a separate chamfered arrow block. Used for every primary action. */
export const primary = (label: string, icon: string = arrow) =>
  `<span class="btn__label">${label}</span><span class="btn__arrow" aria-hidden="true">${icon}</span>`;

/**
 * The one primary action. "Register now" once CONFIG.REGISTER_URL is set; until then a short "Get notified"
 * that points at the footer form, with "Registration opens soon" as a small note beside it.
 */
export const cta = () =>
  CONFIG.REGISTER_URL
    ? `<div class="cta"><a class="btn btn--primary" href="${esc(CONFIG.REGISTER_URL)}" target="_blank" rel="noopener">${primary("Register now", out)}<span class="sr-only"> (opens in a new tab)</span></a></div>`
    : `<div class="cta"><p class="cta__note">Registration opens soon</p><a class="btn btn--primary" href="#notify">${primary("Get notified")}</a></div>`;

/**
 * The organizer marquee. One set of logos, repeated so each half of the track is wider than any
 * screen, then the whole track doubled; CSS moves it by exactly -50% for a loop with no seam.
 * Only the first set is exposed to assistive tech; the repeats are aria-hidden.
 */
export function marquee() {
  const set = (hidden: boolean) =>
    CONFIG.ORGANIZERS.map(o => `<li class="mq__item"${hidden ? ' aria-hidden="true"' : ""}><img src="./assets/partners/${o.file}" width="${o.w}" height="${o.h}" style="--hh:${o.hh}" alt="${hidden ? "" : esc(o.name)}" decoding="async"></li>`).join("");
  const half = (first: boolean) => Array.from({ length: 4 }, (_, i) => set(!(first && i === 0))).join("");
  return `<ul class="mq__half">${half(true)}</ul><ul class="mq__half" aria-hidden="true">${half(false)}</ul>`;
}

/** Photographs are drawn at half their pixel width at most (sharp on 2x screens), never larger than the file. */
export function highlights() {
  return HIGHLIGHTS.map((p, i) => {
    const maxW = Math.min(Math.round(p.w / 2), 900);
    return `<li class="plate" style="--w:${maxW}px;--ar:${p.w}/${p.h};--arn:${(p.w / p.h).toFixed(4)}">
      <img src="./assets/yess25/${p.file}"${p.w >= 1800 ? ` srcset="./src/img/yess25/${p.file.replace(".webp", "-900.webp")} 900w, ./assets/yess25/${p.file} ${p.w}w" sizes="(min-width: 900px) min(900px, ${Math.round(62 * p.w / p.h)}vh), 82vw"` : ""} width="${p.w}" height="${p.h}" alt="${esc(p.alt)}" loading="lazy" decoding="async" draggable="false">
      <span class="plate__n" aria-hidden="true">${pad(i + 1)}</span>
    </li>`;
  }).join("\n");
}
export const highlightsCount = () => pad(HIGHLIGHTS.length);

const hourOf = (iso: string) => Number(iso.slice(11, 13)) + Number(iso.slice(14, 16)) / 60;
const clock = (h: number) => `${((Math.floor(h) + 11) % 12) + 1}:${pad(Math.round((h % 1) * 60))}`;
const meridiem = (h: number) => (h < 12 ? "AM" : "PM");

/**
 * The day from opening to closing. While PROGRAMME is empty every hour is a sealed slot;
 * once sessions are added they replace the seals. Driven entirely by src/content/programme.ts.
 */
export function programme() {
  const a = hourOf(CONFIG.START), b = hourOf(CONFIG.END);
  if (!PROGRAMME.length) {
    const slots: string[] = [];
    for (let h = a; h < b; h++) {
      slots.push(`<li class="slot slot--sealed"><time>${clock(h)} <small>${meridiem(h)}</small></time><span class="slot__seal">Sealed</span></li>`);
    }
    return `<ol class="day day--sealed" aria-label="${clock(a)} ${meridiem(a)} to ${clock(b)} ${meridiem(b)}, sessions to be announced">${slots.join("")}
      <li class="slot slot--end"><time>${clock(b)} <small>${meridiem(b)}</small></time><span class="slot__seal">Close</span></li></ol>`;
  }
  const toH = (t: string) => Number(t.slice(0, 2)) + Number(t.slice(3, 5)) / 60;
  return `<ol class="day">${PROGRAMME.map(s => `<li class="slot">
      <time>${clock(toH(s.start))} <small>${meridiem(toH(s.start))}</small></time>
      <div class="slot__body"><h3>${esc(s.title)}</h3>${s.by ? `<p>${esc(s.by)}</p>` : ""}${s.track ? `<p class="slot__track">${esc(s.track)}</p>` : ""}</div>
    </li>`).join("")}</ol>`;
}

export function sponsors() {
  return SPONSOR_TIERS.filter(t => t.items.length).map(t => `<div class="tier tier--${t.size}">
    <h3 class="tier__name">${esc(t.tier)}</h3>
    <ul class="tier__grid">${t.items.map(s => {
      if (s.placeholder) return `<li><div class="tile tile--tba"><span>To be announced</span></div></li>`;
      const inner = s.logo ? `<img src="${esc(s.logo)}" alt="${esc(s.name)}" loading="lazy">` : `<span>${esc(s.name)}</span>`;
      return `<li>${s.url ? `<a class="tile" href="${esc(s.url)}" target="_blank" rel="noopener">${inner}</a>` : `<div class="tile">${inner}</div>`}</li>`;
    }).join("")}</ul>
  </div>`).join("\n");
}

export function faq() {
  return FAQ.map((f, i) => `<details class="qa">
    <summary><span class="qa__n" aria-hidden="true">${pad(i + 1)}</span><span class="qa__q">${esc(f.q)}</span><span class="qa__x" aria-hidden="true"></span></summary>
    <div class="qa__a"><p>${esc(f.a)}</p></div>
  </details>`).join("\n");
}

/**
 * The footer form. Posts the email to CONFIG.NOTIFY_ENDPOINT; without one it falls back to a mail
 * link to CONFIG.CONTACT_EMAIL; with neither it shows a visible TODO (and the build warns).
 */
export function notify() {
  const mode = CONFIG.NOTIFY_ENDPOINT ? "post" : CONFIG.CONTACT_EMAIL ? "mail" : "off";
  const attrs = mode === "post" ? ` action="${esc(CONFIG.NOTIFY_ENDPOINT!)}"` : mode === "mail" ? ` data-mail="${esc(CONFIG.CONTACT_EMAIL!)}"` : " data-off";
  const todo = mode === "off"
    ? `<p class="todo" role="note"><b>TODO</b> Connect this form: set <code>NOTIFY_ENDPOINT</code> or <code>CONTACT_EMAIL</code> in <code>src/content/config.ts</code>.</p>`
    : "";
  return `<form class="notify" id="notifyForm" method="post"${attrs} novalidate>
    <div class="notify__row">
      <label class="sr-only" for="notifyEmail">Your email</label>
      <input id="notifyEmail" name="email" type="email" required autocomplete="email" inputmode="email" placeholder="Enter your email">
      <button class="btn btn--primary" type="submit">${primary("Send")}</button>
    </div>
    <p class="notify__msg" id="notifyMsg" role="status" aria-live="polite"></p>
  </form>${todo}`;
}

export function socials() {
  // TODO: fill CONFIG.SOCIALS with the 2026 handles. Empty entries are not shown.
  const items = Object.entries(CONFIG.SOCIALS).filter(([, url]) => url);
  if (!items.length) return "";
  const names: Record<string, string> = { instagram: "Instagram", linkedin: "LinkedIn", youtube: "YouTube", whatsapp: "WhatsApp" };
  return `<nav aria-label="Social"><ul class="foot__list">${items.map(([k, url]) => `<li><a class="link" href="${esc(url as string)}" target="_blank" rel="noopener">${names[k] ?? k}</a></li>`).join("")}</ul></nav>`;
}

export const directions = () => esc(directionsUrl());
