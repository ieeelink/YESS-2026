/** What kind of device and viewer this is. Decides how much the scene is allowed to cost. */
export const query = new URLSearchParams(location.search);
export const coarse = matchMedia("(pointer: coarse)").matches;
export const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const nav = navigator as Navigator & { deviceMemory?: number };
const weak = coarse || (nav.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 4;

/**
 * high : laptops and desktops. Full resolution (DPR capped at 1.5), all light samples.
 * low  : phones and weak machines. Half resolution, fewer samples, cheaper noise.
 * still: reduced motion. One frame, no loop, no intro.
 */
export type Tier = "high" | "low" | "still";
export const tier: Tier = (query.get("tier") as Tier) || (reducedMotion ? "still" : weak ? "low" : "high");

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeIO = (x: number) => { x = clamp(x); return x * x * (3 - 2 * x); };

/** Stacked layout (lockup under the arch): phones, and anything taller than it is wide. Mirrors the CSS query. */
export const stacked = () => { const a = innerWidth / innerHeight; return a < 1 || (innerWidth < 900 && a < 1.2); };
