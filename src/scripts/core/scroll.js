import { config } from './config.js';

let ticking = false;
// Extra scroll consumers (e.g. the docked section headers) register here so
// they run inside the single rAF-batched scroll handler below, instead of
// each attaching its own raw scroll listener that can fire (and force
// layout) several times per frame.
const scrollFrameCallbacks = [];

export function registerScrollFrameCallback(callback) {
  scrollFrameCallbacks.push(callback);
}

export function handleScroll() {
  if (!ticking) {
    let didUpdate = false;
    const update = () => {
      if (didUpdate) return;
      didUpdate = true;
      updateUIOnScroll();
      ticking = false;
    };

    window.requestAnimationFrame(update);
    window.setTimeout(update, config.scroll.frameFallbackMs);
    ticking = true;
  }
}

// All visual updates triggered by scroll happen here. Consumers register via
// registerScrollFrameCallback in the order they should run; the scroll-spy
// registers first (main.js, at module scope) so it keeps running before the
// docked headers, exactly as it did when it was called directly here.
export function updateUIOnScroll() {
  scrollFrameCallbacks.forEach((callback) => callback());
}

window.addEventListener('scroll', handleScroll, { passive: true });
// Recompute scroll-derived UI on resize: a reflow moves the section offsets the
// scroll-spy compares against, and the docked headers (registered in
// scrollFrameCallbacks) read live geometry every frame.
let resizeRaf = 0;
window.addEventListener(
  'resize',
  () => {
    if (!resizeRaf) {
      resizeRaf = window.requestAnimationFrame(() => {
        resizeRaf = 0;
        updateUIOnScroll();
      });
    }
  },
  { passive: true },
);
