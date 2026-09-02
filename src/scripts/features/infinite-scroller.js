import { config, prefersReducedMotion } from '../core/config.js';
import { getBreakpointPx } from '../core/dom.js';
import { watchViewportPresence } from '../core/viewport.js';
import { siteContent } from '../../content.js';

export function initializeInfiniteScroller() {
  const scroller = document.getElementById('testimonials-container');
  if (!scroller || scroller.dataset.scrollerEnhanced === 'true') return;

  const inners = Array.from(
    scroller.querySelectorAll('.c-testimonials-scroller__inner'),
  );
  if (inners.length === 0) return;

  // Baseline cards per column, used to keep the pixel speed of the loop
  // steady no matter how many cards a column ends up holding.
  const cardsPerColumn = Math.max(
    1,
    ...inners.map((inner) => inner.childElementCount),
  );

  // Remember each card's build-time column so it can be restored on resize.
  inners.forEach((inner, columnIndex) => {
    Array.from(inner.children).forEach((card) => {
      card.dataset.homeColumn = String(columnIndex);
    });
  });

  const refreshColumn = (inner) => {
    inner
      .querySelectorAll('[data-scroller-clone]')
      .forEach((clone) => clone.remove());
    const cards = Array.from(inner.children);
    // Reduced motion gets a static, user-scrollable column instead of a loop.
    if (cards.length === 0 || prefersReducedMotion) return;

    cards.forEach((card) => {
      const duplicatedItem = card.cloneNode(true);
      duplicatedItem.setAttribute('aria-hidden', 'true');
      duplicatedItem.dataset.scrollerClone = 'true';
      inner.appendChild(duplicatedItem);
    });

    const durationRange =
      config.testimonials.scrollSpeedMax - config.testimonials.scrollSpeedMin;
    const baseDuration =
      Math.floor(Math.random() * durationRange) +
      config.testimonials.scrollSpeedMin;
    const duration = Math.round((baseDuration * cards.length) / cardsPerColumn);
    inner.style.setProperty('--scroll-duration', `${duration}s`);
  };

  // Columns beyond the first are display:none below the md breakpoint, so
  // their cards are merged into the first column there and moved back to
  // their home columns on wider viewports.
  const compactQuery = window.matchMedia(
    `(max-width: ${getBreakpointPx('md')}px)`,
  );
  const distributeCards = () => {
    const isCompact = compactQuery.matches;
    inners.forEach((inner) =>
      inner
        .querySelectorAll('[data-scroller-clone]')
        .forEach((clone) => clone.remove()),
    );
    inners
      .flatMap((inner) => Array.from(inner.children))
      .forEach((card) => {
        const home = isCompact ? 0 : Number(card.dataset.homeColumn) || 0;
        inners[home].appendChild(card);
      });
    inners.forEach(refreshColumn);
  };

  if (inners.length > 1) {
    compactQuery.addEventListener('change', distributeCards);
  }
  distributeCards();

  if (prefersReducedMotion) {
    scroller
      .querySelectorAll('.c-testimonials-scroller__column')
      .forEach((column, index) => {
        column.setAttribute('tabindex', '0');
        column.setAttribute('role', 'region');
        column.setAttribute(
          'aria-label',
          siteContent.ui.testimonials.columnLabel.replace(
            '{index}',
            String(index + 1),
          ),
        );
      });
  }

  // Separate from the user-facing .is-paused toggle so scrolling away and
  // back never overrides a pause the user chose.
  watchViewportPresence(scroller, (isVisible) =>
    scroller.classList.toggle('is-offscreen', !isVisible),
  );

  scroller.dataset.scrollerEnhanced = 'true';
}
