import { reducedMotion } from "../lib/env";

/** Page chrome: the nav backing, the active link, the phone menu, section reveals and the scroll-linked light. */
export function initNav() {
  const root = document.documentElement;
  const hero = document.getElementById("top")!;
  const world = document.querySelector<HTMLElement>(".world")!;
  const links = [...document.querySelectorAll<HTMLAnchorElement>(".nav__links a")];

  // one rAF-throttled scroll handler: nav backing, and two numbers the light reads (transform/opacity only)
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = scrollY, max = root.scrollHeight - innerHeight;
      root.classList.toggle("nav-solid", y > hero.offsetHeight - 80);
      if (!reducedMotion) {
        world.style.setProperty("--sp", (max > 0 ? y / max : 0).toFixed(4));
        hero.style.setProperty("--hp", Math.min(1, y / hero.offsetHeight).toFixed(4));
      }
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // the active link follows whichever section holds the middle of the screen
  const setActive = (id: string) => links.forEach(a => {
    if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
  });
  const spy = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) setActive(e.target.id); }, { rootMargin: "-50% 0px -50% 0px" });
  document.querySelectorAll<HTMLElement>("main > section[id]").forEach(s => spy.observe(s));

  // each section reveals once, as it comes into view
  const reveal = new IntersectionObserver(es => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add("in"); reveal.unobserve(e.target); }
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0 });
  document.querySelectorAll(".sec, .final, .foot, #footMark").forEach(s => reveal.observe(s));

  // phone menu: full screen; Escape and any link close it
  const menu = document.getElementById("menu")!, btn = document.getElementById("menuBtn")!;
  const setMenu = (open: boolean) => {
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? "Close" : "Menu";
    root.classList.toggle("menu-open", open);
  };
  btn.addEventListener("click", () => setMenu(menu.hidden));
  menu.addEventListener("click", e => { if ((e.target as HTMLElement).closest("a")) setMenu(false); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { setMenu(false); btn.focus(); } });
  matchMedia("(min-width: 900px)").addEventListener("change", e => { if (e.matches) setMenu(false); });
}
