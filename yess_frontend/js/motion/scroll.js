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
    scrollTrigger: { trigger: '.host', start: 'top 85%', end: 'top 40%', scrub: SCRUB.base },
  });

  initHostGate();

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

// --- Host: the closed gate parts along its centre seam onto the campus -------------------------
// The photo is never scaled past its native size: the start scale stays inside the frame's cap.
function initHostGate() {
  const gate = document.querySelector('.host__gate');
  const seams = gsap.utils.toArray('.host__seam');

  const open = (scrollTrigger) => {
    gsap.timeline({ defaults: { ease: EASE.none, duration: 1 }, scrollTrigger: { ...scrollTrigger, scrub: SCRUB.base, invalidateOnRefresh: true } })
      .fromTo('.host__view', { clipPath: 'inset(0 50% 0 50%)' }, { clipPath: 'inset(0 0% 0 0%)' }, 0)
      .fromTo('.host__view img', { scale: 1.06 }, { scale: 1 }, 0)
      .fromTo(seams[0], { x: 0 }, { x: () => -gate.offsetWidth / 2 }, 0)
      .fromTo(seams[1], { x: 0 }, { x: () => gate.offsetWidth / 2 }, 0);
  };

  gsap.matchMedia().add({
    pinned: '(min-width: 1024px) and (min-height: 620px)',
    flow: '(max-width: 1023px), (max-height: 619px)',
  }, ({ conditions }) => {
    open(conditions.pinned
      ? { trigger: '.host', start: 'top 18%', end: 'top -60%' }
      : { trigger: '.host__frame', start: 'top 85%', end: 'top 40%' });
  });
}

// --- Smoke director: density, arch and brightness follow the page ------------------------------
// Keys are [scrollY, density, arch, dim], rebuilt on refresh; state eases toward the interpolated
// value every tick, so it needs no scrubbed tweens fighting over the same properties.
export function initSmokeDirector({ smoke, logo }) {
  if (!smoke) return;

  const whenBox = document.querySelector('#when-box');
  const hostFrame = document.querySelector('.host__frame');
  const pageTop = (element) => element.getBoundingClientRect().top + scrollY;

  let keys = [];
  let coverStart = 0;
  let coverEnd = 0;
  let aboutTop = Infinity;
  let focusSwitch = 0;
  let hostSwitch = 0;

  function measure() {
    const vh = innerHeight;
    const hero = document.querySelector('.hero');
    const highlights = document.querySelector('#highlights');
    const introTop = pageTop(document.querySelector('#intro'));
    const whenTop = pageTop(document.querySelector('#when'));
    const highlightsTop = pageTop(highlights);
    const hostTop = pageTop(document.querySelector('.host'));
    aboutTop = pageTop(document.querySelector('#about'));
    hostSwitch = hostTop - vh * 0.5;

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
      [hostSwitch, 0.62, 1, 1],
      [hostTop, 0.6, 1, 0.8],
      [aboutTop, 0.6, 1, 0.8],
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

    smoke.setFocus(y < focusSwitch ? logo : y < hostSwitch ? whenBox : hostFrame);
    smoke.setCovered((y > coverStart && y < coverEnd) || y >= aboutTop);
  });
}

// --- Footer wordmark ------------------------------------------------------------------------
// Sized from the footer container, so its ink meets the same edges as the columns and divider.
// If that would be too tall, the height cap wins and the word sits centred, short of both edges.
const MAX_SCREEN_HEIGHT = 0.22;
const CLIP_ROOM = 1;  // px kept above and below the ink, so the clip never shaves a soft edge

export function initWordmark(element) {
  const letters = [...element.querySelectorAll('span')];

  // Measured on a canvas, never by resizing the live text: reduced motion puts a transition on
  // every property, so a temporary font size would read back stale. A new canvas each time, because
  // one that measured before the font loaded keeps the fallback's metrics.
  const fit = () => {
    const style = getComputedStyle(element);
    const measureCanvas = document.createElement('canvas').getContext('2d');
    measureCanvas.font = `${style.fontWeight} 100px ${style.fontFamily}`;
    const measure = (text) => measureCanvas.measureText(text);

    const currentSize = parseFloat(style.fontSize);
    const gap = parseFloat(style.columnGap || 0) / currentSize;
    const lineHeight = parseFloat(style.lineHeight) / currentSize;
    const width = letters.reduce((sum, letter) => sum + measure(letter.textContent).width, 0) / 100;

    const metrics = measure(element.textContent);
    // Above and below the baseline, including the S's overshoot past the flat letters.
    const inkTop = metrics.actualBoundingBoxAscent / 100;
    const inkBottom = metrics.actualBoundingBoxDescent / 100;
    const content = (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent) / 100;
    const baseline = (lineHeight - content) / 2 + metrics.fontBoundingBoxAscent / 100;

    // Side bearings: the blank space a font leaves beside the first and last letters.
    const first = measure(letters[0].textContent);
    const last = measure(letters[letters.length - 1].textContent);
    const bearingLeft = -first.actualBoundingBoxLeft / 100;
    const bearingRight = (last.width - last.actualBoundingBoxRight) / 100;
    const inkWidth = width + (letters.length - 1) * gap - bearingLeft - bearingRight;

    const inkHeight = inkTop + inkBottom;
    const size = Math.min(element.clientWidth / inkWidth, (innerHeight * MAX_SCREEN_HEIGHT) / inkHeight);

    element.style.fontSize = `${size}px`;
    letters.forEach((letter) => { letter.style.marginTop = `${CLIP_ROOM - (baseline - inkTop) * size}px`; });
    // Trim both bearings so the row's box is exactly the ink; centring the box then centres the ink.
    letters[0].style.marginLeft = `${-bearingLeft * size}px`;
    letters[letters.length - 1].style.marginRight = `${-bearingRight * size}px`;
    element.style.height = `${inkHeight * size + CLIP_ROOM * 2}px`;
  };

  fit();
  const { fontWeight, fontFamily } = getComputedStyle(element);
  document.fonts.load(`${fontWeight} 100px ${fontFamily}`, element.textContent).then(() => {
    fit();
    ScrollTrigger.refresh();
  });
  addEventListener('resize', fit, { passive: true });
}
