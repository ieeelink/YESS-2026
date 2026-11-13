/**
 * The trailer. About five seconds: a cut of light opens on black, three title cards hard-cut in at
 * different scales, the logo arrives, the doors part along the cut and the logo travels to its place
 * in the hero. Plays once per session (decided before first paint in index.html), never with
 * reduced motion. Skip button, Escape, or ?intro=0 end it at once; ?intro=1 forces it.
 */
export function runIntro(done: () => void) {
  const root = document.documentElement;
  const intro = document.getElementById("intro")!;
  if (!root.classList.contains("has-intro")) { intro.remove(); done(); return; }
  try { sessionStorage.setItem("yess26-intro", "1"); } catch { /* private mode: it may replay, that is fine */ }
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  scrollTo(0, 0);

  const logo = document.getElementById("introLogo")!, heroLogo = document.getElementById("heroLogo")!;
  const skip = document.getElementById("introSkip")!;
  const timers: number[] = [];
  const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
  const shot = (s: string) => { intro.dataset.shot = s; };
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    root.classList.add("handoff");
    root.classList.remove("flying", "has-intro");
    intro.remove();
    removeEventListener("keydown", onKey);
    done();
  };

  const handoff = () => {
    const a = logo.getBoundingClientRect(), b = heroLogo.getBoundingClientRect();
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    root.classList.add("flying", "lit");
    logo.style.transition = "transform 1.1s cubic-bezier(0.76, 0, 0.24, 1)";
    logo.style.transform = `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px)) scale(${(b.width / a.width).toFixed(4)})`;
    intro.classList.add("open");
    at(1150, finish);
  };

  const cut = () => {
    timers.forEach(clearTimeout);
    root.classList.add("ready");
    intro.classList.add("done");
    window.setTimeout(finish, 320);
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") cut(); };
  skip.addEventListener("click", cut);
  addEventListener("keydown", onKey);

  at(180, () => intro.classList.add("cut-on"));
  at(520, () => shot("1"));
  at(1440, () => shot("2"));
  at(2440, () => shot("3"));
  at(3360, () => { shot(""); intro.classList.add("cut-hot"); });
  at(3520, () => shot("logo"));
  at(4480, handoff);
}
