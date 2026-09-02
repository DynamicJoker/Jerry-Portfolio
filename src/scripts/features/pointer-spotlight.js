import { prefersReducedMotion } from '../core/config.js';

// Dark-mode pointer spotlight (home only). Light mode keeps a regular pointer,
// so the element is always created but the CSS only paints it under
// [data-color-scheme='dark']. Skipped entirely on touch (no pointer) and where
// motion is unwanted or unaffordable.
export function initializePointerSpotlight() {
  if (
    prefersReducedMotion ||
    document.documentElement.dataset.perf === 'lite' ||
    window.matchMedia('(hover: none)').matches
  ) {
    return;
  }
  const spotlight = document.createElement('div');
  spotlight.className = 'c-pointer-glow';
  spotlight.setAttribute('aria-hidden', 'true');
  document.body.appendChild(spotlight);
  window.addEventListener(
    'pointermove',
    (event) => {
      spotlight.style.setProperty('--spot-x', `${event.clientX}px`);
      spotlight.style.setProperty('--spot-y', `${event.clientY}px`);
    },
    { passive: true },
  );
}
