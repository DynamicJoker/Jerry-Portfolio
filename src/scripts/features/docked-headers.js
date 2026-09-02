import { config, prefersReducedMotion } from '../core/config.js';
import { cssLengthToPx } from '../core/dom.js';
import { registerScrollFrameCallback } from '../core/scroll.js';

// Docked section headings: each .c-section__header is position:sticky (CSS). As
// a header nears the dock line we scrub --dock-progress (CSS fades the full
// heading out); once it reaches the line .is-docked swaps in the compact
// centred tab, which animates in from behind the navbar island. The header's
// natural height is pinned as an inline min-height so the swap never reflows
// the content below — see "Docked section headings" in
// src/styles/components/section.css.
//
// Both the docked state and the scrub are derived from each header's *live*
// position relative to the dock line on every scroll — never from cached scroll
// offsets. The previous version used two ScrollTriggers per header whose
// start/end were measured once per refresh; any layout shift afterwards (font
// swap, lazy media, reveal animations, or a refresh fired while scrolled
// mid-page) left those offsets stale, so .is-docked was dropped while the header
// was still pinned and the bar vanished under a shrunken, floating title. Live
// geometry can't fall out of sync.
export function initializeDockedSectionHeaders() {
  const headers = [
    ...document.querySelectorAll('section.c-section .c-section__header'),
  ];
  if (!headers.length) return;

  // Reserve each header's natural height as a min-height so the swap to the
  // compact tab never reflows the content below. Re-run whenever layout can
  // change (load, fonts settling, resize). Nothing else is measured: the tab
  // is a cross-fade, not a morph, so there is no scale ratio to derive — see
  // "Docked section headings" in src/styles/components/section.css.
  // Each header's body sibling — the block the tab starts covering once the
  // section scrolls under it. Resolved once: the section shape is static.
  const bodies = headers.map((header) => header.nextElementSibling);

  const measureHeaders = () => {
    headers.forEach((header) => {
      const wasDocked = header.classList.contains('is-docked');
      const wasCompact = header.classList.contains('is-docked-compact');
      header.classList.remove('is-docked', 'is-docked-compact');
      header.style.removeProperty('min-height');
      header.style.minHeight = `${header.offsetHeight}px`;
      if (wasDocked) header.classList.add('is-docked');
      if (wasCompact) header.classList.add('is-docked-compact');
    });
  };

  // A header is docked while it sits pinned at the dock line or is sliding up
  // through it (its top has reached the line, its bottom hasn't passed above
  // it). --dock-progress fills in over the approach: 0 a scrub-range below the
  // line, 1 once the header reaches it. dockY and the scrub range are shared by
  // every header, so they're read once; the per-scroll cost is then one
  // getBoundingClientRect per header (reads batched ahead of writes).
  const update = () => {
    const rootStyles = getComputedStyle(headers[0]);
    const dockY = Number.parseFloat(rootStyles.top) || 0;
    const scrubRange =
      cssLengthToPx(rootStyles.getPropertyValue('--dock-scrub-range'), 7.5) ||
      1;
    const tabHeight =
      cssLengthToPx(rootStyles.getPropertyValue('--dock-bar-height'), 2.25) ||
      0;
    // Reads stay batched ahead of the writes below: both rect passes run to
    // completion before the first classList mutation.
    const rects = headers.map((header) => header.getBoundingClientRect());
    const bodyTops = bodies.map((body) =>
      body ? body.getBoundingClientRect().top : Number.POSITIVE_INFINITY,
    );
    headers.forEach((header, index) => {
      const { top, bottom } = rects[index];
      const isDocked = top <= dockY + 1 && bottom > dockY;
      header.classList.toggle('is-docked', isDocked);
      // Second stage: once the section body has climbed under the tab, the
      // full-title tab would be sitting on copy, so collapse to the counter
      // chip (CSS parks it in the inline-end gutter).
      header.classList.toggle(
        'is-docked-compact',
        isDocked && bodyTops[index] <= dockY + tabHeight,
      );
      if (!prefersReducedMotion) {
        const progress = Math.min(
          1,
          Math.max(0, (dockY + scrubRange - top) / scrubRange),
        );
        header.style.setProperty('--dock-progress', progress.toFixed(4));
      }
    });
  };

  const remeasure = () => {
    measureHeaders();
    update();
  };

  measureHeaders();
  update();
  registerScrollFrameCallback(update);
  window.addEventListener('load', remeasure);
  document.fonts?.ready.then(remeasure);
  let resizeId = 0;
  window.addEventListener(
    'resize',
    () => {
      window.clearTimeout(resizeId);
      resizeId = window.setTimeout(
        remeasure,
        config.dockedHeaders.remeasureDebounceMs,
      );
    },
    { passive: true },
  );
}
