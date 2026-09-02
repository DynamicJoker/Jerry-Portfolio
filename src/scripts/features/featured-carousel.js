import { siteContent } from '../../content.js';
import { prefersReducedMotion } from '../core/config.js';

// Featured work is a one-at-a-time editorial spread: prev/next (or the arrow
// keys, with focus inside the region) swap the active flagship with an opacity
// dissolve. Every slide is in the DOM; the inactive ones carry [hidden], so
// there is no horizontal rail and nothing touches the page's own scrolling.
export function initializeFeaturedCarousel() {
  const root = document.querySelector('[data-featured]');
  if (!root) return;
  const slides = [...root.querySelectorAll('[data-featured-slide]')];
  const status = root.querySelector('[data-featured-status]');
  const counter = root.querySelector('[data-featured-current]');
  const prevBtn = root.querySelector('[data-featured-prev]');
  const nextBtn = root.querySelector('[data-featured-next]');
  if (slides.length <= 1 || !prevBtn || !nextBtn) return;

  let index = 0;

  // Lazy images on hidden slides only fetch once shown, which would flash on
  // swap — so warm a slide's screengrab just before it can become active.
  const warm = (i) => {
    const img =
      slides[(i + slides.length) % slides.length]?.querySelector('img');
    if (img && img.loading === 'lazy') img.loading = 'eager';
  };

  // Wrap around so Next past the last lands on the first, and Prev before the
  // first lands on the last.
  const show = (i) => {
    const n = (i + slides.length) % slides.length;
    if (n === index) return;
    const incoming = slides[n];
    slides[index].hidden = true;
    slides[index].classList.remove('is-entering');
    incoming.hidden = false;
    if (!prefersReducedMotion) {
      // Reflow between remove and add so the dissolve replays on every swap —
      // the browser only restarts an animation when it sees the class change.
      incoming.classList.remove('is-entering');
      void incoming.offsetWidth;
      incoming.classList.add('is-entering');
    }
    index = n;
    if (counter) counter.textContent = String(index + 1).padStart(2, '0');
    if (status) {
      status.textContent = siteContent.ui.work.slideStatus
        .replace('{index}', String(index + 1))
        .replace('{total}', String(slides.length));
    }
    warm(index + 1);
    warm(index - 1);
  };

  prevBtn.addEventListener('click', () => show(index - 1));
  nextBtn.addEventListener('click', () => show(index + 1));

  // Arrow keys step through while focus is anywhere inside the region, which is
  // the documented carousel pattern. Ignore them when a link has focus so tab
  // order still behaves.
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    show(e.key === 'ArrowLeft' ? index - 1 : index + 1);
  });

  // Warm the two slides either side of the opening one so the first swap in
  // each direction has its screengrab ready.
  warm(1);
  warm(-1);
}
