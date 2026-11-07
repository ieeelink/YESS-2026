import { DUR, EASE, STAGGER } from './tokens.js';

const { gsap, SplitText } = window;
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

// A signal dot that follows with weight. It opens into a ring over links and shows
// a drag state over the reel. The native cursor stays, so nothing depends on this.
export function initCursor() {
  if (!finePointer()) return;

  const dot = document.createElement('div');
  dot.className = 'cursor';
  dot.setAttribute('aria-hidden', 'true');
  document.body.append(dot);

  const x = gsap.quickTo(dot, 'x', { duration: DUR.d3, ease: EASE.out });
  const y = gsap.quickTo(dot, 'y', { duration: DUR.d3, ease: EASE.out });

  addEventListener('pointermove', (event) => {
    if (!dot.classList.contains('is-on')) {
      gsap.set(dot, { x: event.clientX, y: event.clientY });
      dot.classList.add('is-on');
    }
    x(event.clientX);
    y(event.clientY);
    const target = event.target instanceof Element ? event.target : null;
    const drag = !!target?.closest('[data-cursor="drag"]');
    dot.classList.toggle('is-drag', drag);
    dot.classList.toggle('is-link', !drag && !!target?.closest('a, button, input, label'));
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', () => dot.classList.remove('is-on'));
}

// Buttons: label letters roll through their mask on hover, and the button leans toward the pointer.
export function initButtons() {
  if (!finePointer()) return;

  gsap.utils.toArray('.btn').forEach((button) => {
    const split = SplitText.create(button.querySelector('.btn__label > span'), { type: 'chars' });
    let rolling = false;
    button.addEventListener('pointerenter', () => {
      if (rolling) return;
      rolling = true;
      gsap.timeline({ onComplete: () => { rolling = false; } })
        .to(split.chars, { yPercent: -130, duration: DUR.d2, ease: EASE.inOut, stagger: STAGGER.char })
        .set(split.chars, { yPercent: 130 })
        .to(split.chars, { yPercent: 0, duration: DUR.d2, ease: EASE.out, stagger: STAGGER.char });
    });

    const x = gsap.quickTo(button, 'x', { duration: DUR.d3, ease: EASE.out });
    const y = gsap.quickTo(button, 'y', { duration: DUR.d3, ease: EASE.out });
    button.addEventListener('pointermove', (event) => {
      const box = button.getBoundingClientRect();
      x(((event.clientX - box.left) / box.width - 0.5) * 12);
      y(((event.clientY - box.top) / box.height - 0.5) * 12);
    }, { passive: true });
    button.addEventListener('pointerleave', () => { x(0); y(0); });
  });
}
