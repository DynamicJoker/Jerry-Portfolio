import { config } from '../core/config.js';

// Collapse the brand to the J monogram while the hero name is visible;
// expand to the full logo once the name scrolls under the navbar.
export function initializeBrandCollapse() {
  const navbar = document.getElementById('navbar');
  const heroName = document.querySelector('.c-hero__name');
  if (!navbar || !heroName) return;

  // Expanded once the hero name's bottom edge scrolls up past the navbar.
  // The rootMargin trims the navbar's height off the top of the viewport so
  // the observer fires exactly at that crossing (in both directions); the
  // entry's own rect then tells us which side of the line we're on.
  let observer = null;
  const observe = () => {
    observer?.disconnect();
    const navbarHeight = navbar.offsetHeight;
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          navbar.classList.toggle(
            'is-brand-expanded',
            entry.boundingClientRect.bottom <= navbarHeight,
          );
        });
      },
      { rootMargin: `-${navbarHeight}px 0px 0px 0px` },
    );
    observer.observe(heroName);
  };

  observe();
  // The navbar's height (the dock line) can change across breakpoints, so
  // rebuild the observer with fresh geometry once a resize settles.
  let resizeId = 0;
  window.addEventListener(
    'resize',
    () => {
      window.clearTimeout(resizeId);
      resizeId = window.setTimeout(
        observe,
        config.brandCollapse.remeasureDebounceMs,
      );
    },
    { passive: true },
  );
}
