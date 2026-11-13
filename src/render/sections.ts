/**
 * Build-time HTML for the sections that come from data files. vite.config.ts drops the results
 * into index.html, so the shipped page contains this content as plain markup.
 */
import { CONFIG, directionsUrl } from "../content/config";
import { HIGHLIGHTS } from "../content/highlights";
import { FAQ, SPONSOR_TIERS } from "../content/placeholders";
import { PROGRAMME } from "../content/programme";

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pad = (n: number) => String(n).padStart(2, "0");

/** The primary action: a real button once registration has a URL, a plain status line until then. */
export const cta = (where: "hero" | "final") =>
  CONFIG.REGISTER_URL
    ? `<a class="btn" href="${esc(CONFIG.REGISTER_URL)}" target="_blank" rel="noopener">Register now</a>`
    : `<p class="status" role="status"><i aria-hidden="true"></i>Registration opens soon</p>
       <a class="btn btn--line" href="#notify" data-from="${where}">Get notified</a>`;

/** Photographs are drawn at half their pixel width at most (sharp on 2x screens), and never above 1100px. */
export function highlights() {
  return HIGHLIGHTS.map((p, i) => {
    const maxW = Math.min(Math.round(p.w / 2), 1100);
    return `<li class="plate${p.w < 1000 ? " plate--s" : ""}" style="--w:${maxW}px;--ar:${p.w}/${p.h};--arn:${(p.w / p.h).toFixed(4)}">
      <img src="./assets/yess25/${p.file}" width="${p.w}" height="${p.h}" alt="${esc(p.alt)}" loading="lazy" decoding="async" draggable="false">
      <span class="plate__n" aria-hidden="true">${pad(i + 1)}</span>
    </li>`;
  }).join("\n");
}
export const highlightsCount = () => pad(HIGHLIGHTS.length);

const hour = (iso: string) => Number(iso.slice(11, 13)) + Number(iso.slice(14, 16)) / 60;
const label = (h: number) => `${((Math.floor(h) + 11) % 12) + 1}${h % 1 ? ":" + pad(Math.round((h % 1) * 60)) : ""} ${h < 12 ? "AM" : "PM"}`;

/** The day as a rail from opening to closing. Sealed while PROGRAMME is empty; real sessions replace the seal. */
export function programme() {
  const a = hour(CONFIG.START), b = hour(CONFIG.END);
  const ticks: string[] = [];
  for (let h = Math.ceil(a); h <= b; h++) ticks.push(`<li style="--x:${(((h - a) / (b - a)) * 100).toFixed(3)}%"><span>${label(h)}</span></li>`);
  const rail = `<ol class="day__ticks" aria-hidden="true">${ticks.join("")}</ol>`;
  if (!PROGRAMME.length) {
    return `<div class="day day--sealed">
      ${rail}
      <div class="day__seal"><p>Programme to be announced</p></div>
      <p class="day__note">${label(a)} to ${label(b)} IST. Sessions, speakers and tracks will be revealed here.</p>
    </div>`;
  }
  const toH = (t: string) => Number(t.slice(0, 2)) + Number(t.slice(3, 5)) / 60;
  const rows = PROGRAMME.map(s => `<li class="slot" style="--x:${(((toH(s.start) - a) / (b - a)) * 100).toFixed(3)}%;--w:${(((toH(s.end) - toH(s.start)) / (b - a)) * 100).toFixed(3)}%">
      <time>${label(toH(s.start))} to ${label(toH(s.end))}</time><h3>${esc(s.title)}</h3>${s.by ? `<p>${esc(s.by)}</p>` : ""}${s.track ? `<p class="slot__track">${esc(s.track)}</p>` : ""}
    </li>`).join("");
  return `<div class="day">${rail}<ol class="day__slots">${rows}</ol></div>`;
}

export function sponsors() {
  return SPONSOR_TIERS.filter(t => t.items.length).map(t => `<div class="tier tier--${t.size}">
    <h3 class="tier__name">${esc(t.tier)}</h3>
    <ul class="tier__grid">${t.items.map(s => {
      const inner = s.logo ? `<img src="${esc(s.logo)}" alt="${esc(s.name)}" loading="lazy">` : `<span>${esc(s.name)}</span>`;
      return `<li>${s.url ? `<a class="tile" href="${esc(s.url)}" target="_blank" rel="noopener">${inner}</a>` : `<div class="tile${s.placeholder ? " tile--open" : ""}">${inner}</div>`}</li>`;
    }).join("")}</ul>
  </div>`).join("\n");
}

export function faq() {
  return FAQ.map((f, i) => `<details class="qa"${i === 0 ? " open" : ""}>
    <summary><span class="qa__n" aria-hidden="true">${pad(i + 1)}</span><span class="qa__q">${esc(f.q)}</span><span class="qa__x" aria-hidden="true"></span></summary>
    <p class="qa__a">${esc(f.a)}</p>
  </details>`).join("\n");
}

/** The notify form only exists once it has somewhere to post; until then the footer says so plainly. */
export function notify() {
  // TODO: set CONFIG.NOTIFY_ENDPOINT (a form endpoint that accepts POST with an "email" field).
  if (!CONFIG.NOTIFY_ENDPOINT) {
    return `<p class="notify__off">The notification list opens with registration.${CONFIG.CONTACT_EMAIL ? ` Until then, write to <a class="link" href="mailto:${esc(CONFIG.CONTACT_EMAIL)}">${esc(CONFIG.CONTACT_EMAIL)}</a>.` : ""}</p>`;
  }
  return `<form class="notify__form" method="post" action="${esc(CONFIG.NOTIFY_ENDPOINT)}">
    <label class="sr-only" for="notifyEmail">Email address</label>
    <input id="notifyEmail" name="email" type="email" required autocomplete="email" placeholder="Email address">
    <button class="btn" type="submit">Notify me</button>
  </form>`;
}

export function socials() {
  // TODO: fill CONFIG.SOCIALS with the 2026 handles. Empty entries are not shown.
  const items = Object.entries(CONFIG.SOCIALS).filter(([, url]) => url);
  if (!items.length) return "";
  return `<ul class="foot__list">${items.map(([k, url]) => `<li><a class="link" href="${esc(url as string)}" target="_blank" rel="noopener">${k[0].toUpperCase() + k.slice(1)}</a></li>`).join("")}</ul>`;
}

export const directions = () => esc(directionsUrl());
