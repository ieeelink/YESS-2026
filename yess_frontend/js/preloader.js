import { DUR, EASE } from './motion/tokens.js';

const { gsap } = window;
const BUDGET_MS = 1250;  // the curtain starts opening by now, whatever is still loading

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function markSeen() {
  try { sessionStorage.setItem('yess-preloader-seen', '1'); } catch (e) { /* private mode */ }
}

function revealPage() {
  const root = document.documentElement;
  // Let a returning visitor's CSS fade finish; only the loader's state ends here.
  root.classList.remove('is-loading');
  return gsap.timeline()
    .fromTo('.soon__text span', { yPercent: 112 }, { yPercent: 0, duration: DUR.d3, ease: EASE.out }, 0)
    .from('.nav, .rail, .hero__cue', { opacity: 0, duration: DUR.d3, ease: EASE.out }, 0.1);
}

// First visit in a session. The hero logo itself is the loader: it enters small as one object,
// a thin rule tracks real readiness, then smoke eats the curtain as the logo rises to full size.
export function runPreloader({ smoke, logo }) {
  const curtain = document.querySelector('.curtain');
  const rules = gsap.utils.toArray('.soon__rule');

  gsap.set('.soon__text span', { yPercent: 112 });
  gsap.set(rules, { scaleX: 0 });
  gsap.set(logo, { scale: 0.42 });

  const progress = gsap.to(rules, { scaleX: 0.82, duration: BUDGET_MS / 1000, ease: EASE.out });

  const assetsReady = Promise.all([
    document.fonts.ready,
    logo.decode().catch(() => {}),
    smoke ? smoke.ready : Promise.resolve(),
  ]);

  return Promise.all([wait(BUDGET_MS * 0.6), Promise.race([assetsReady, wait(BUDGET_MS)])]).then(() => {
    progress.kill();

    const open = gsap.timeline({ onComplete: markSeen });
    open.to(rules, { scaleX: 1, duration: DUR.d2, ease: EASE.out }, 0);

    if (smoke) {
      // The shader now draws its own black, under the logo, so the DOM curtain can go at once.
      curtain.style.display = 'none';
      open.to(smoke.state, { reveal: 1, duration: DUR.d3, ease: EASE.inOut }, 0);
    } else {
      const reach = Math.hypot(innerWidth, innerHeight);
      open.to(curtain, { '--iris': `${reach}px`, duration: DUR.d3, ease: EASE.inOut }, 0);
    }

    open.to(logo, { scale: 1, duration: DUR.d3, ease: EASE.inOut, clearProps: 'transform' }, 0);
    open.add(revealPage(), 0.15);
    return open;
  });
}

// Repeat visits in a session skip the loader; the logo still arrives as one object.
export function enterHero({ logo }) {
  gsap.fromTo(logo, { scale: 0.97 }, { scale: 1, duration: DUR.d4, ease: EASE.out, clearProps: 'transform' });
  revealPage();
  return Promise.resolve();
}
