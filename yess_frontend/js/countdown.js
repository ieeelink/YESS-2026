import { CONFIG } from './config.js';

const UNITS = ['Days', 'Hours', 'Minutes', 'Seconds'];

// Null date: the markup's "Date to be announced" stays. A set date replaces it with a live count.
export function initCountdown(container) {
  if (!CONFIG.LAUNCH_DATE) return;

  container.innerHTML = `<div class="count" role="timer" aria-label="Time until the summit">${UNITS.map((unit) => `
    <div class="count__unit"><span class="count__num" data-unit="${unit}">00</span><span class="count__label">${unit}</span></div>`).join('')}</div>`;

  const numbers = Object.fromEntries(UNITS.map((unit) => [unit, container.querySelector(`[data-unit="${unit}"]`)]));

  const tick = () => {
    const seconds = Math.floor(Math.max(0, new Date(CONFIG.LAUNCH_DATE) - Date.now()) / 1000);
    const values = {
      Days: Math.floor(seconds / 86400),
      Hours: Math.floor((seconds % 86400) / 3600),
      Minutes: Math.floor((seconds % 3600) / 60),
      Seconds: seconds % 60,
    };
    for (const unit of UNITS) {
      const text = String(values[unit]).padStart(2, '0');
      if (numbers[unit].textContent !== text) numbers[unit].textContent = text;
    }
  };
  tick();
  setInterval(tick, 1000);
}
