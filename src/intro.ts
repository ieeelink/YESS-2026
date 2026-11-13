/**
 * The light reveals the crowd. On every load the hero's beam sweeps once across last year's crowd
 * (about 1.2 s) and settles at its resting line. On the first visit of a session the type waits behind
 * it: everything but the lit crowd is dark, and once the beam has settled the page opens outward from
 * the beam's line like a pair of doors (about 0.85 s). The opening uses the same vw position as the beam,
 * so it starts exactly where the light rests at every breakpoint.
 *
 * Nothing is locked: any key, click, touch or scroll finishes it at once. Never with reduced motion
 * (decided before first paint in index.html, where the beam also starts at rest); ?intro=1 forces the
 * reveal, ?intro=0 skips it. The earlier title-card trailer is in git history (commit 7079529).
 */
export function runIntro(done: () => void) {
  const root = document.documentElement;
  const sweep = () => root.classList.add("sweep");
  // two frames: the beam's starting position must paint once before it moves
  const nextPaint = (fn: () => void) => requestAnimationFrame(() => requestAnimationFrame(fn));

  if (!root.classList.contains("has-intro")) { done(); nextPaint(sweep); return; }
  try { sessionStorage.setItem("yess26-intro", "1"); } catch { /* private mode: it may replay, that is fine */ }
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  scrollTo(0, 0);

  const timers: number[] = [];
  const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
  const inputs = ["keydown", "pointerdown", "wheel", "touchstart"] as const;
  let opened = false, ended = false;

  const open = () => {
    if (opened) return;
    opened = true;
    root.classList.add("opened");
    done();
  };
  const end = () => {
    if (ended) return;
    ended = true;
    timers.forEach(clearTimeout);
    inputs.forEach(t => removeEventListener(t, skip));
    root.classList.remove("has-intro", "opened", "fast");
  };
  const skip = () => {
    if (ended) return;
    timers.forEach(clearTimeout);
    root.classList.add("fast", "sweep");
    open();
    window.setTimeout(end, 380);
  };
  inputs.forEach(t => addEventListener(t, skip, { passive: true }));

  nextPaint(() => {
    sweep(); //            0.00–1.20 s  the beam sweeps across the crowd and settles
    at(900, open); //      0.90–1.75 s  the page opens outward from the beam's line
    at(1800, end); //      1.80 s       done
  });
}
