const PIXELS_PER_SECOND = 34;

// Clones the logo set until one "half" outruns the screen, then doubles it, so translating by
// exactly one half loops with no gap. Clones are hidden from assistive tech and keyboards.
export function initMarquee(marquee, { reduced }) {
  if (reduced) return;

  const track = marquee.querySelector('.marquee__track');
  const original = track.querySelector('.marquee__set');

  const cloneSet = () => {
    const clone = original.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('a').forEach((link) => { link.tabIndex = -1; });
    clone.querySelectorAll('img').forEach((image) => { image.alt = ''; });
    return clone;
  };

  const build = () => {
    track.querySelectorAll('.marquee__set[aria-hidden]').forEach((set) => set.remove());
    const setWidth = original.getBoundingClientRect().width;
    if (!setWidth) return;

    const perHalf = Math.max(1, Math.ceil(innerWidth / setWidth));
    for (let i = 1; i < perHalf * 2; i++) track.append(cloneSet());

    const shift = setWidth * perHalf;
    marquee.style.setProperty('--marquee-shift', `${shift}px`);
    marquee.style.setProperty('--marquee-duration', `${shift / PIXELS_PER_SECOND}s`);
  };

  build();
  let width = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === width) return;
    width = innerWidth;
    build();
  }, { passive: true });
}
