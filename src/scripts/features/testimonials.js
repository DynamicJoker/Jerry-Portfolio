import { siteContent } from '../../content.js';
import { prefersReducedMotion } from '../core/config.js';

export function initializeTestimonialPauseControl() {
  const scroller = document.getElementById('testimonials-container');
  const control = document.querySelector('[data-testimonials-pause]');
  if (!scroller || !control) return;

  const setPaused = (isPaused) => {
    scroller.classList.toggle('is-paused', isPaused);
    control.setAttribute('aria-pressed', String(isPaused));
    control.setAttribute(
      'aria-label',
      isPaused
        ? siteContent.ui.testimonials.resume
        : siteContent.ui.testimonials.pause,
    );
  };

  setPaused(prefersReducedMotion);

  if (prefersReducedMotion) {
    control.disabled = true;
    control.setAttribute(
      'aria-label',
      siteContent.ui.testimonials.reducedMotion,
    );
    return;
  }

  control.addEventListener('click', () => {
    setPaused(!scroller.classList.contains('is-paused'));
  });
}
