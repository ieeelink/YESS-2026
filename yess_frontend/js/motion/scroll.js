import { DUR, EASE, SCRUB, STAGGER } from './tokens.js';

const { gsap, ScrollTrigger, SplitText, Lenis } = window;

// --- Smooth scroll: Lenis on wheel, native on touch ------------------------------------------
export function initScroll({ reduced }) {
  if (reduced) return null;
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

// --- Text: masked lines rise, the single reveal style on the site ------------------------------
export function initReveals() {
  gsap.utils.toArray('[data-reveal]').forEach((element) => {
    SplitText.create(element, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'line',
      aria: 'none',  // the words stay real text in the DOM, so no label is needed
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 112,
          duration: DUR.d4,
          ease: EASE.out,
          stagger: STAGGER.line,
          scrollTrigger: { trigger: element, start: 'top 82%', once: true },
        });
      },
    });
  });

  gsap.utils.toArray('[data-rise]').forEach((element) => {
    gsap.from(element, {
      y: 16,
      opacity: 0,
      duration: DUR.d3,
      ease: EASE.out,
      // Inside a pinned section, tie the reveal to the section: its contents may never cross the line.
      scrollTrigger: element.dataset.riseWith
        ? { trigger: element.dataset.riseWith, start: 'top 55%', once: true }
        : { trigger: element, start: 'top 90%', once: true },
    });
  });
}

// --- Scroll scenes -----------------------------------------------------------------------------
export function initScenes() {
  // A section taller than the screen pins by its foot, so all of it gets seen first.
  const intro = document.querySelector('.intro');
  const setStick = () => intro.style.setProperty('--stick', `${Math.min(0, innerHeight - intro.offsetHeight)}px`);
  setStick();
  ScrollTrigger.addEventListener('refreshInit', setStick);

  // Hero: the lockup recedes into the thickening smoke.
  gsap.timeline({
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: SCRUB.base },
  })
    .to('.hero__stack', { y: () => -innerHeight * 0.07, ease: EASE.none, duration: 1 }, 0)
    .to('.hero__stack', { opacity: 0, ease: EASE.none, duration: 0.5 }, 0.42)
    .to('.hero__cue', { opacity: 0, ease: EASE.none, duration: 0.15 }, 0);

  // Intro: settles back and fades as the Highlights panel slides over it.
  gsap.to('.intro__inner', {
    opacity: 0,
    scale: 0.965,
    ease: EASE.none,
    scrollTrigger: { trigger: '#highlights', start: 'top 70%', end: 'top 8%', scrub: SCRUB.base },
  });

  // Intro headline pushes up through the smoke at a slightly different pace from the page.
  gsap.fromTo('.intro__title', { y: () => innerHeight * 0.05 }, {
    y: 0,
    ease: EASE.none,
    scrollTrigger: { trigger: '#intro', start: 'top bottom', end: 'top top', scrub: SCRUB.base },
  });

  // When: the date grows slightly while it holds under the arch, then yields to About.
  gsap.fromTo('#countdown', { scale: 0.94 }, {
    scale: 1,
    ease: EASE.none,
    scrollTrigger: { trigger: '#when', start: 'top 60%', end: 'top -40%', scrub: SCRUB.base },
  });
  gsap.to('.when__box', {
    opacity: 0,
    y: () => -innerHeight * 0.04,
    ease: EASE.none,
    scrollTrigger: { trigger: '#about', start: 'top 45%', end: 'top 2%', scrub: SCRUB.base },
  });

  // Depth layers. Never applied to any logo.
  gsap.utils.toArray('[data-parallax]').forEach((element) => {
    const amount = Number(element.dataset.parallax);
    gsap.fromTo(element, { yPercent: amount * 100 }, {
      yPercent: -amount * 40,
      ease: EASE.none,
      scrollTrigger: { trigger: element.parentElement, start: 'top bottom', end: 'bottom top', scrub: SCRUB.base },
    });
  });

  // Footer: the giant wordmark hauls itself up, letter by letter, as the page ends.
  gsap.from('.wordmark span', {
    yPercent: 101,
    ease: EASE.none,
    stagger: STAGGER.wordmark,
    // Lands as the word's own foot reaches the screen's, so it is whole whenever it is fully in view.
    scrollTrigger: { trigger: '#wordmark', start: 'top 96%', end: 'bottom bottom', scrub: SCRUB.wordmark },
  });
}

// --- Smoke director: density, arch and brightness follow the page ------------------------------
// Keys are [scrollY, density, arch, dim], rebuilt on refresh; state eases toward the interpolated
// value every tick, so it needs no scrubbed tweens fighting over the same properties.
export function initSmokeDirector({ smoke, logo }) {
  if (!smoke) return;

  const whenBox = document.querySelector('#when-box');
  const pageTop = (element) => element.getBoundingClientRect().top + scrollY;

  let keys = [];
  let coverStart = 0;
  let coverEnd = 0;
  let aboutTop = Infinity;
  let focusSwitch = 0;

  function measure() {
    const vh = innerHeight;
    const hero = document.querySelector('.hero');
    const highlights = document.querySelector('#highlights');
    const introTop = pageTop(document.querySelector('#intro'));
    const whenTop = pageTop(document.querySelector('#when'));
    const highlightsTop = pageTop(highlights);
    aboutTop = pageTop(document.querySelector('#about'));

    coverStart = highlightsTop;
    coverEnd = highlightsTop + highlights.offsetHeight - vh;
    focusSwitch = highlightsTop;

    keys = [
      [0, 0.55, 1, 1],
      [(hero.offsetHeight - vh) * 0.85, 1, 0, 1.08],
      [introTop, 0.72, 0, 0.72],
      [highlightsTop - vh * 0.25, 0.55, 0, 0.56],
      [whenTop - vh, 0.5, 0, 0.5],
      [whenTop, 0.62, 1, 1],
      [aboutTop, 0.62, 1, 1],
    ];
  }

  function targetAt(y) {
    if (y <= keys[0][0]) return keys[0];
    for (let i = 1; i < keys.length; i++) {
      if (y <= keys[i][0]) {
        const [y0, d0, a0, b0] = keys[i - 1];
        const [y1, d1, a1, b1] = keys[i];
        const t = (y - y0) / Math.max(y1 - y0, 1);
        return [y, d0 + (d1 - d0) * t, a0 + (a1 - a0) * t, b0 + (b1 - b0) * t];
      }
    }
    return keys[keys.length - 1];
  }

  measure();
  ScrollTrigger.addEventListener('refresh', measure);

  gsap.ticker.add((time, deltaMs) => {
    const y = scrollY;
    const [, density, arch, dim] = targetAt(y);
    const ease = 1 - Math.exp(-(deltaMs / 1000) * 7);
    const { state } = smoke;
    state.density += (density - state.density) * ease;
    state.arch += (arch - state.arch) * ease;
    state.dim += (dim - state.dim) * ease;

    smoke.setFocus(y < focusSwitch ? logo : whenBox);
    smoke.setCovered((y > coverStart && y < coverEnd) || y >= aboutTop);
  });
}

// --- Footer wordmark ------------------------------------------------------------------------
// Fits the width whatever the display font's proportions, and the box to the letters' real ink,
// so the word always shows whole. Very wide, short screens hold it to a share of the height,
// which leaves room for the legal row in the same view.
const MAX_SCREEN_HEIGHT = 0.78;

export function initWordmark(element) {
  const letters = [...element.querySelectorAll('span')];
  const measureCanvas = document.createElement('canvas').getContext('2d');

  const fit = () => {
    const style = getComputedStyle(element);
    element.style.height = 'auto';
    element.style.fontSize = '100px';
    letters.forEach((letter) => { letter.style.marginTop = '0'; });

    const width = letters.reduce((sum, letter) => sum + letter.getBoundingClientRect().width, 0);
    const gaps = (letters.length - 1) * parseFloat(style.columnGap || 0);
    const available = element.parentElement.clientWidth * 0.965;

    measureCanvas.font = `${style.fontWeight} 100px ${style.fontFamily}`;
    const metrics = measureCanvas.measureText('YESS');
    // Above and below the baseline, including the S's overshoot past the flat letters.
    const inkTop = metrics.actualBoundingBoxAscent / 100;
    const inkBottom = metrics.actualBoundingBoxDescent / 100;
    const content = (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent) / 100;
    const lineHeight = parseFloat(style.lineHeight) / 100;
    const baseline = (lineHeight - content) / 2 + metrics.fontBoundingBoxAscent / 100;

    const inkHeight = inkTop + inkBottom;
    const size = Math.min((100 * available) / (width + gaps), (innerHeight * MAX_SCREEN_HEIGHT) / inkHeight);

    element.style.fontSize = `${size}px`;
    letters.forEach((letter) => { letter.style.marginTop = `${-(baseline - inkTop) * size}px`; });
    element.style.height = `${inkHeight * size}px`;
  };

  fit();
  document.fonts.ready.then(fit);
  addEventListener('resize', fit, { passive: true });
}
