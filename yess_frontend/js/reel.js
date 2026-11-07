import { DUR, EASE } from './motion/tokens.js';

const { gsap, Draggable } = window;

// Highlights carousel: drag with inertia, snap to a slide, arrows, keyboard, swipe and click.
// One index drives everything. Slides take their look from their distance to the centre.
export function initReel(reel, { reduced }) {
  const track = reel.querySelector('.reel__track');
  const slides = gsap.utils.toArray('.slide', reel);
  const current = document.querySelector('#reel-current');
  const progress = document.querySelector('#reel-progress');
  const status = document.querySelector('#reel-status');

  let stops = [];      // track x that centres each slide
  let boxes = [];      // each slide's left and width in track space
  let index = 0;
  let target = 0;      // where the arrows are heading, so quick presses add up
  let reelWidth = 0;
  let step = 1;

  function render() {
    const x = gsap.getProperty(track, 'x');
    const range = stops[0] - stops[stops.length - 1] || 1;
    progress.style.transform = `scaleX(${gsap.utils.clamp(0, 1, (stops[0] - x) / range)})`;

    slides.forEach((slide, i) => {
      const center = boxes[i].left + boxes[i].width / 2 + x;
      if (center < -boxes[i].width || center > reelWidth + boxes[i].width) return;
      const offset = (center - reelWidth / 2) / step;
      const distance = Math.min(Math.abs(offset), 1);
      const image = slide.querySelector('img');
      const small = slide.classList.contains('slide--mat');

      slide.style.setProperty('--shade', (distance * 0.66).toFixed(3));
      slide.style.setProperty('--bite', `${(distance * 7).toFixed(2)}%`);
      // Large photos start zoomed and slide against the drag. Small originals only ever
      // scale down from native size, so they are never upscaled.
      image.style.transform = small
        ? `scale(${(1 - distance * 0.06).toFixed(4)})`
        : `translate3d(${(-offset * 5).toFixed(2)}%,0,0) scale(${(1 + distance * 0.16).toFixed(4)})`;
    });

    const nearest = stops.reduce((best, stop, i) => (Math.abs(stop - x) < Math.abs(stops[best] - x) ? i : best), 0);
    if (nearest !== index) {
      index = nearest;
      current.textContent = String(index + 1).padStart(2, '0');
      loadAround(index);
    }
  }

  // Photos start lazy, then load just ahead of the active slide so none pops in on arrival.
  function loadAround(center) {
    slides.slice(Math.max(center - 2, 0), center + 3).forEach((slide) => {
      slide.querySelector('img').loading = 'eager';
    });
  }

  function measure() {
    reelWidth = reel.clientWidth;
    boxes = slides.map((slide) => ({ left: slide.offsetLeft, width: slide.offsetWidth }));
    stops = boxes.map((box) => reelWidth / 2 - (box.left + box.width / 2));
    step = (boxes[1]?.left ?? boxes[0].width) - boxes[0].left;
  }

  function announce() {
    status.textContent = `Photo ${index + 1} of ${slides.length}`;
  }

  const clampIndex = gsap.utils.clamp(0, slides.length - 1);

  function goTo(destination) {
    const next = clampIndex(destination);
    target = next;
    gsap.killTweensOf(track);
    if (reduced) {
      gsap.set(track, { x: stops[next] });
      render();
      drag.update();
      announce();
      return;
    }
    gsap.to(track, {
      x: stops[next],
      duration: DUR.d4,
      ease: EASE.inOut,
      onUpdate: render,
      onComplete() {
        drag.update();
        announce();
      },
    });
  }

  measure();
  gsap.set(track, { x: stops[0] });

  const nearestStop = (value) => stops.reduce((best, stop) => (Math.abs(stop - value) < Math.abs(best - value) ? stop : best), stops[0]);

  const [drag] = Draggable.create(track, {
    type: 'x',
    trigger: reel,
    inertia: !reduced,
    bounds: { minX: stops[stops.length - 1], maxX: stops[0] },
    edgeResistance: 0.85,
    dragResistance: 0.05,
    allowNativeTouchScrolling: true,
    allowContextMenu: true,
    cursor: 'grab',
    activeCursor: 'grabbing',
    minimumMovement: 4,
    snap: { x: nearestStop },
    maxDuration: DUR.d4,
    minDuration: DUR.d2,
    overshootTolerance: 0,
    onPress() { gsap.killTweensOf(track); },
    onDragStart() { target = index; },
    onDrag: render,
    onThrowUpdate: render,
    onThrowComplete() {
      target = index;
      announce();
    },
    onDragEnd() {
      if (reduced) {
        goTo(stops.indexOf(nearestStop(this.x)));
      }
    },
    onClick(event) {
      const slide = event.target instanceof Element ? event.target.closest('.slide') : null;
      if (slide) goTo(slides.indexOf(slide));
    },
  });

  render();

  document.querySelector('#reel-prev').addEventListener('click', () => goTo(target - 1));
  document.querySelector('#reel-next').addEventListener('click', () => goTo(target + 1));

  // Arrow keys work whenever the reel is mostly on screen, unless someone is typing.
  let inView = false;
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; }, { threshold: 0.5 }).observe(reel);

  const approaching = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    loadAround(index);
    approaching.disconnect();
  }, { rootMargin: '100% 0px' });
  approaching.observe(reel);
  addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (event.target instanceof Element && event.target.closest('input, textarea')) return;
    if (!inView && !reel.contains(document.activeElement)) return;
    event.preventDefault();
    goTo(target + (event.key === 'ArrowRight' ? 1 : -1));
  });

  let resizeTimer = 0;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const keep = index;
      measure();
      gsap.set(track, { x: stops[keep] });
      drag.applyBounds({ minX: stops[stops.length - 1], maxX: stops[0] });
      drag.update();
      render();
    }, 120);
  }).observe(reel);
}
