import { createQuad, runLoop } from "../gl/quad";
import { clamp, easeIO, query, smooth, stacked, tier } from "../lib/env";
import { BEATS, CUTS, HA, T_END, T_LOGO, T_OPEN, WA, ZEND, FOCAL, heroFrame, norm, project, shot } from "./camera";
import { HALL_FRAG } from "./hall.frag";
import { bindSoundToggle, hit } from "./sound";

const SESSION_KEY = "yess26-intro-played";
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

/**
 * The intro and the hero are one piece: a clock runs the cut, the last shot settles at the arch and
 * stays live, and from then on scroll position drives the doors and the walk through them.
 */
export function initHero() {
  const root = document.documentElement, body = document.body;
  const hero = $("summit"), stage = $("stage"), cut = $("cut"), lockup = $("lockup"), doors = $("doors");
  const aboutStage = $("aboutStage"), about = $("about"), hint = stage.querySelector<HTMLElement>(".hint")!;
  const skip = $("skip"), skipLabel = $("skipLabel");
  const cards = ([[".c1", 0.42, 1.72], [".c2", 1.98, 3.42], [".c3", 3.68, 5.22]] as const).map(([s, a, b]) => ({ el: stage.querySelector<HTMLElement>(s)!, a, b }));

  const canvas = $<HTMLCanvasElement>("gl");
  const quad = createQuad(canvas, HALL_FRAG, ["uRo", "uFw", "uLD", "uShift", "uSafe", "uF", "uSun", "uCasc", "uFlash", "uDoor", "uFlood", "uKey", "uKeyT"]);
  // calm mode: reduced motion or no WebGL. A still of the arch, no intro, no pinned scroll, same content.
  const calm = !quad || tier === "still";
  if (!quad) canvas.remove(); else quad.gl.uniform1f(quad.U.uF, FOCAL);
  if (calm && !query.get("capture")) root.classList.add("calm");
  if (query.get("capture")) root.classList.add("capture");      // scripts/render-stills.mjs: the scene alone
  if (query.get("og")) root.classList.add("og");                // and the scene with the lockup, for the share image

  let seen = false;
  try { seen = sessionStorage.getItem(SESSION_KEY) === "1"; } catch { /* private mode */ }
  const at = query.get("at") ? Number(query.get("at")) : null;           // ?at=4.0 freezes the clock (for review frames)
  const forced = query.get("intro");
  const play = !calm && (at !== null || (forced ? forced === "1" : !seen));
  let clock = play ? 0 : 30, done = false;
  const fired = new Set<number | string>();

  function setStage(c: number) {
    stage.classList.toggle("beat", c >= T_LOGO);
    stage.classList.toggle("open", c >= T_OPEN);
    stage.classList.toggle("in", c >= T_OPEN + 0.05);
    root.classList.toggle("nav-on", c >= T_OPEN + 0.05);
    if (c >= T_END && !done) {
      done = true; body.classList.remove("locked"); skipLabel.textContent = "↺ Replay intro";
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* private mode */ }
    }
  }
  setStage(clock);

  const toFinalBeat = () => { if (!done) clock = Math.max(clock, T_LOGO - 0.02); };   // skipping lands on the last beat, not past it
  skip.addEventListener("click", () => {
    if (!done) return toFinalBeat();
    scrollTo(0, 0); body.classList.add("locked"); done = false; clock = 0; fired.clear(); skipLabel.textContent = "Skip intro";
  });
  addEventListener("keydown", e => { if (e.key === "Escape") toFinalBeat(); });
  bindSoundToggle($<HTMLButtonElement>("snd"));

  // the viewer: cursor on desktop, tilt where the browser offers it without a prompt, scroll everywhere
  let mx = 0, my = 0, tx = 0, ty = 0;
  addEventListener("pointermove", e => { if (e.pointerType !== "touch") { tx = (e.clientX / innerWidth) * 2 - 1; ty = (e.clientY / innerHeight) * 2 - 1; } }, { passive: true });
  addEventListener("deviceorientation", e => { if (e.gamma != null && e.beta != null) { tx = clamp(e.gamma / 25, -1, 1); ty = clamp((e.beta - 45) / 30, -1, 1); } }, { passive: true });

  const frame = (t: number, dt: number) => {
    if (at !== null) clock = at; else clock += dt;
    const c = clock;
    setStage(c);
    const span = Math.max(1, hero.offsetHeight - innerHeight);
    const p = done && !calm ? clamp(scrollY / span) : 0;

    // cuts, cards and beats
    cut.classList.toggle("on", CUTS.some(([a, b]) => c >= a && c < b));
    for (const k of cards) k.el.classList.toggle("on", c >= k.a && c < k.b);
    if (!done) skip.style.setProperty("--p", clamp(c / T_END).toFixed(3));
    BEATS.forEach((b, i) => { if (c >= b && c < b + 0.3 && !fired.has(i)) { fired.add(i); hit(i === 4 ? 1 : 0.7); } });
    let flash = 0; for (const b of BEATS) if (c >= b) flash += Math.exp(-(c - b) / 0.11);

    const kf = dt ? 1 - Math.exp(-dt * 3) : 1; mx += (tx - mx) * kf; my += (ty - my) * kf;
    const cam = shot(c, t, p, mx, my);
    const door = easeIO((p - 0.02) / 0.5);
    if (door > 0.02 && !fired.has("door")) { fired.add("door"); hit(1); }
    if (door < 0.01) fired.delete("door");

    // DOM that belongs to the scene
    const out = smooth(0.02, 0.20, p), phone = stacked();
    lockup.style.opacity = String(1 - out); lockup.style.pointerEvents = out > 0.5 ? "none" : "";
    hint.style.opacity = out > 0.05 ? "0" : "";
    if (!calm) {
      const dc = project([0, phone ? 5.5 : 4.6, ZEND], cam), dw = ((2 * WA * FOCAL) / dc[2]) * innerHeight;      // the doors, in pixels
      doors.style.transform = `translate(${dc[0].toFixed(1)}px, ${dc[1].toFixed(1)}px)`;
      doors.style.setProperty("--fs", clamp(dw * 0.125, 22, 64).toFixed(1) + "px");
      doors.style.opacity = String(1 - smooth(0.01, 0.10, p));

      // the next chamber is seen through the gap between the leaves; when the camera reaches the doors the gap is the screen
      const fixed = scrollY < about.offsetTop;
      aboutStage.classList.toggle("is-fixed", fixed);
      if (!fixed) { aboutStage.style.clipPath = ""; aboutStage.style.opacity = ""; aboutStage.style.visibility = ""; }
      else if (door < 0.04) aboutStage.style.visibility = "hidden";
      else {
        aboutStage.style.visibility = "visible";
        aboutStage.style.opacity = String(smooth(0.25, 0.85, door));
        if (dc[2] < 1.6 || p > 0.9) aboutStage.style.clipPath = "none";
        else {
          const g = door * WA * 1.03, pts: string[] = [];
          for (let i = 0; i <= 14; i++) {
            const x = -g + (2 * g * i) / 14, s = project([x, Math.max(0, HA * (1 - (x * x) / (WA * WA))), ZEND], cam);
            pts.push(`${s[0].toFixed(1)}px ${s[1].toFixed(1)}px`);
          }
          const br = project([g, 0, ZEND], cam), bl = project([-g, 0, ZEND], cam);
          aboutStage.style.clipPath = `polygon(${pts.join(",")},${br[0].toFixed(1)}px ${br[1].toFixed(1)}px,${bl[0].toFixed(1)}px ${bl[1].toFixed(1)}px)`;
        }
      }
      aboutStage.classList.toggle("in", p > 0.82);
    }
    if (!quad || (p >= 1 && scrollY > hero.offsetHeight)) return;         // nothing to draw once the hall is off screen

    const g = quad.gl, U = quad.U, hk = heroFrame().key;
    // the light leans with the viewer: a little with the cursor or tilt, a little with scroll
    const ld = norm([-0.80, -0.52 - my * 0.05, 0.30 + mx * 0.16 + p * 0.3]);
    const settled = smooth(T_OPEN, T_END + 0.6, c) * (1 - out);
    const keyOn = c < T_LOGO ? 0 : (1 + 0.8 * Math.exp(-(c - T_LOGO) / 0.35)) * (1 - 0.6 * door);
    g.uniform3fv(U.uRo, cam.ro); g.uniform3fv(U.uFw, cam.fw); g.uniform3fv(U.uLD, ld); g.uniform2fv(U.uShift, cam.shift);
    g.uniform2f(U.uSafe, phone ? 0 : settled, phone ? settled : 0);
    g.uniform1f(U.uSun, cam.sun * (1 - 0.12 * my) * (phone ? 1.35 : 1)); g.uniform1f(U.uCasc, cam.casc);
    g.uniform1f(U.uFlash, Math.min(flash, 1.3)); g.uniform1f(U.uDoor, door); g.uniform1f(U.uFlood, smooth(0.86, 0.98, p));
    g.uniform1f(U.uKey, keyOn); g.uniform3f(U.uKeyT, hk[0] + mx * 1.4, 0, hk[2] - my * 1.2);
    quad.draw(t);
  };

  if (calm) aboutStage.classList.add("in");
  // wait for the display face before the first card (never longer than 1.5s), then roll
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  Promise.race([fonts ? fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1500))]).then(() => runLoop(quad, frame));
}
