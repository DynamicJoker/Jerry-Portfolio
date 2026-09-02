import { config } from '../core/config.js';

// Re-anchor a #hash load once the layout has actually settled.
//
// The browser's own jump happens against the critical-CSS layout, which is more
// than twice the finished height on this page — and the docked section headers
// pin an inline min-height measured on load and on font settle, so the geometry
// keeps moving for a while after that. Both leave a hash load parked on the
// wrong section. The head's inline script has already made the initial jump
// instant (a smooth one would keep animating over these corrections); this
// re-runs the anchor at each point where the layout can still change.
//
// Any real scroll input cancels the remaining passes — after that the reader is
// driving, and yanking them back to the anchor would be worse than landing
// slightly off.
export function initializeHashLanding() {
  const id = location.hash ? decodeURIComponent(location.hash.slice(1)) : '';
  const target = id ? document.getElementById(id) : null;
  if (!target) return;

  let released = false;
  let observer = null;
  const release = () => {
    released = true;
    observer?.disconnect();
  };
  ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach((type) =>
    window.addEventListener(type, release, { once: true, passive: true }),
  );

  // 'instant', NOT 'auto'. `auto` does not mean "jump" — it means "use the
  // element's computed scroll-behavior", and html carries
  // scroll-behavior: smooth, so `auto` here launches a ~600ms ANIMATION that
  // the next correction (or the layout still settling) interrupts, stranding
  // the page partway down — the exact bug this function exists to fix.
  // scroll-margin-top on the sections keeps the landing clear of the nav island.
  const settle = () => {
    if (released) return;
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
  };

  // Re-anchor whenever the page's height actually changes, rather than at a few
  // guessed moments. Measured on this page, the height goes 34789 → 8389 →
  // 10020 across the first ~200ms: the deferred stylesheet lands, then the
  // docked section headers pin their measured height as an inline min-height
  // (eight of them, ~1600px in total). Every one of those moves the target, and
  // a fixed set of passes always ended a beat before the last change — landing
  // ~1600px short, on Experience instead of Contact.
  let lastHeight = 0;
  if (typeof ResizeObserver === 'function') {
    observer = new ResizeObserver(() => {
      const height = document.documentElement.scrollHeight;
      if (height === lastHeight) return;
      lastHeight = height;
      settle();
    });
    observer.observe(document.body);
  }
  // Bounded: stop chasing once the page has had time to settle, so nothing can
  // re-anchor minutes later if something resizes.
  window.setTimeout(release, config.scroll.hashSettleMaxMs);

  settle();
  document.fonts?.ready?.then(settle).catch(() => {});
  window.addEventListener('load', settle, { once: true });
}
