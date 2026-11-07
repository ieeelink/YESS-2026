import { CONFIG } from './config.js';

// Host copy comes from CONFIG.HOST. The text in the markup only shows if scripts fail to load.
export function initHost(section) {
  const { KICKER, TITLE, NAME, NOTE, PHOTO_ALT, LINK } = CONFIG.HOST;

  section.querySelector('.kicker').textContent = KICKER;
  section.querySelector('.host__title').textContent = TITLE;
  section.querySelector('.host__name').textContent = NAME;
  section.querySelector('.host__note').textContent = NOTE;
  section.querySelector('.host__view img').alt = PHOTO_ALT;

  if (LINK) {
    const link = document.createElement('a');
    link.className = 'link link--lg host__link';
    link.href = LINK.href;
    link.rel = 'noopener';
    link.target = '_blank';
    link.textContent = LINK.label;
    link.dataset.rise = '';
    section.querySelector('.host__info').append(link);
  }
}
