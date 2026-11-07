import { DUR } from './motion/tokens.js';

const { gsap, ScrollTrigger } = window;

export function initNav({ lenis, reduced }) {
  const nav = document.querySelector('#nav');
  const railLinks = gsap.utils.toArray('#rail a');
  const railFill = document.querySelector('.rail__line i');
  const sections = railLinks.map((link) => document.querySelector(link.getAttribute('href')));

  // In-page links: scroll with the site's easing, then hand keyboard focus to the target.
  const easeInOut = gsap.parseEase('power3.inOut');
  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    if (!link) return;
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    const settle = () => {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      history.replaceState(null, '', link.getAttribute('href'));
    };
    if (lenis) {
      lenis.scrollTo(target, { duration: DUR.d5, easing: easeInOut, onComplete: settle });
    } else {
      target.scrollIntoView();
      settle();
    }
  });

  // Active rail dot and progress; the nav steps aside while scrolling down.
  let last = 0;
  const update = () => {
    const y = scrollY;
    const max = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
    const mark = innerHeight * 0.48;
    let active = 0;
    sections.forEach((section, index) => {
      if (section && section.getBoundingClientRect().top <= mark) active = index;
    });
    railLinks.forEach((link, index) => {
      link.classList.toggle('is-active', index === active);
      if (index === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    if (railFill) railFill.style.transform = `scaleY(${Math.min(y / max, 1)})`;
    if (Math.abs(y - last) > 6) {
      nav.classList.toggle('is-hidden', y > last && y > innerHeight * 0.4);
      last = y;
    }
  };
  addEventListener('scroll', update, { passive: true });
  ScrollTrigger.addEventListener('refresh', update);
  update();
}
