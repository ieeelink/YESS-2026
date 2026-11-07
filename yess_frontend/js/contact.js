import { CONFIG } from './config.js';

export function initSocials() {
  const row = document.querySelector('#socials');
  if (!CONFIG.SOCIAL.length) return;
  row.replaceChildren(...CONFIG.SOCIAL.map(({ href, label, short }) => {
    const link = document.createElement('a');
    link.className = 'link';
    link.href = href;
    link.rel = 'noopener';
    link.target = '_blank';
    link.textContent = short;
    link.setAttribute('aria-label', label);
    return link;
  }));
  row.hidden = false;
}

// TODO(team): wire this up by setting CONFIG.CONTACT_ENDPOINT or CONFIG.CONTACT_EMAIL in config.js.
export function initContact() {
  const form = document.querySelector('#contact-form');
  const status = document.querySelector('#contact-status');
  const field = form.elements.email;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!field.checkValidity()) {
      status.textContent = 'Please enter a valid email address.';
      field.focus();
      return;
    }

    if (CONFIG.CONTACT_ENDPOINT) {
      status.textContent = 'Sending…';
      try {
        const response = await fetch(CONFIG.CONTACT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: field.value }),
        });
        if (!response.ok) throw new Error(String(response.status));
        status.textContent = 'Thanks. We will be in touch.';
        form.reset();
      } catch {
        status.textContent = 'That did not send. Please try again.';
      }
    } else if (CONFIG.CONTACT_EMAIL) {
      const body = encodeURIComponent(`My email: ${field.value}\n\nMy question:\n`);
      location.href = `mailto:${CONFIG.CONTACT_EMAIL}?subject=${encodeURIComponent('IEEE YESS 2026 question')}&body=${body}`;
    } else {
      status.textContent = 'Contact details will be announced soon.';
    }
  });
}
