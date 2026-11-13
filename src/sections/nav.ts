/** Page chrome: scroll progress, the active nav link, the phone menu, and the reveal of each chamber as it is entered. */
export function initNav() {
  const root = document.documentElement;
  const bar = document.getElementById("progress")!;
  const links = [...document.querySelectorAll<HTMLAnchorElement>(".site-nav__links a")];
  const hero = document.getElementById("summit")!;

  // progress + a soft backing for the nav once it sits over text
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
      root.classList.toggle("nav-solid", scrollY > hero.offsetHeight - innerHeight * 0.5);
    });
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // the active link follows whichever chamber holds the middle of the screen
  const setActive = (id: string) => links.forEach(a => {
    if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
  });
  setActive("summit");
  const spy = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) setActive((e.target as HTMLElement).dataset.nav!); }, { rootMargin: "-50% 0px -50% 0px" });
  document.querySelectorAll<HTMLElement>("[data-nav]").forEach(s => spy.observe(s));

  // each chamber reveals once, when a fifth of it is on screen
  const reveal = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { e.target.classList.add("in"); reveal.unobserve(e.target); } }, { threshold: 0.2 });
  document.querySelectorAll(".sec, .foot").forEach(s => reveal.observe(s));

  // menu (phones): a full-screen list; Escape and any link close it
  const menu = document.getElementById("menu")!, btn = document.getElementById("menuBtn")!;
  const setMenu = (open: boolean) => { menu.hidden = !open; btn.setAttribute("aria-expanded", String(open)); btn.textContent = open ? "Close" : "Menu"; };
  btn.addEventListener("click", () => setMenu(menu.hidden));
  menu.addEventListener("click", e => { if ((e.target as HTMLElement).closest("a")) setMenu(false); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { setMenu(false); btn.focus(); } });
}
