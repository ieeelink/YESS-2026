import { createSmoke } from './smoke/smoke.js';
import { initCountdown } from './countdown.js';
import { initContact, initSocials } from './contact.js';
import { initReel } from './reel.js';
import { initMarquee } from './marquee.js';
import { runPreloader, enterHero } from './preloader.js';
import { initScroll, initReveals, initScenes, initSmokeDirector, initWordmark } from './motion/scroll.js';
import { initCursor, initButtons } from './motion/pointer.js';
import { initNav } from './nav.js';

const { gsap, ScrollTrigger, SplitText, Draggable, InertiaPlugin } = window;
gsap.registerPlugin(ScrollTrigger, SplitText, Draggable, InertiaPlugin);

const root = document.documentElement;
const reduced = root.classList.contains('reduced');
const loading = root.classList.contains('is-loading');
const logo = document.querySelector('.hero__logo');

// Content first: these work with or without motion.
initCountdown(document.querySelector('#countdown'));
initContact();
initSocials();
initMarquee(document.querySelector('#marquee'), { reduced });
initReel(document.querySelector('#reel'), { reduced });
initWordmark(document.querySelector('#wordmark'));

// Smoke
let smoke = null;
if (!reduced) {
  smoke = createSmoke(document.querySelector('.smoke'), {
    focus: logo,
    reveal: loading ? 0 : 1,
    onFail: () => root.classList.add('smoke-off'),
  });
}
if (!smoke) root.classList.add('smoke-off');

const lenis = initScroll({ reduced });
initNav({ lenis, reduced });

if (reduced) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
} else {
  lenis.stop();
  initCursor();
  initSmokeDirector({ smoke, logo });

  const intro = loading ? runPreloader({ smoke, logo }) : enterHero({ logo });
  intro.then(() => lenis.start());

  document.fonts.ready.then(() => {
    initButtons();
    initReveals();
    initScenes();
    ScrollTrigger.refresh();

    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) lenis.scrollTo(target, { immediate: true, force: true });
    }
  });
}
