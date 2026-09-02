// Tuning constants for the home-page behaviours, in one place. Every value
// carries the rationale that justifies it — several encode measurements, so
// changing one without reading its comment is how the timings drift.
export const config = {
  loadingScreenMinVisible: 400, // ms since navigation start
  loadingScreenMaxWait: 1500, // ms; rAF-less fallback so it can't get stuck
  loadingScreenFadeOut: 500,
  // Minimum time the contact button stays in its "Sending…" pulse, so the
  // processing beat is felt even when the network responds near-instantly.
  contactSubmitMinVisible: 1500, // ms
  // Live-region clear delay. The region is emptied and refilled after a real
  // time gap so an identical repeated message (e.g. resubmitting without
  // fixing anything) still registers as a change and is re-announced.
  announceClearMs: 120,
  scroll: {
    // Backstop for the rAF-driven scroll update: rAF does not fire in
    // background or stalled renderers, so a plain timer runs the same update.
    frameFallbackMs: 80,
    // Bounded: stop chasing a #hash landing once the page has had time to
    // settle, so nothing can re-anchor minutes later if something resizes.
    hashSettleMaxMs: 4000,
    // A section is active once its top has crossed the upper 30% of the
    // viewport.
    activeSectionThreshold: 0.3,
    // Slack when testing whether the page is scrolled to the very bottom, so
    // the last section latches despite sub-pixel/rounding differences.
    bottomTolerancePx: 20,
  },
  nav: {
    // How long after the last resize event the navbar keeps `.is-resizing`,
    // which suppresses the mobile sheet's open/close transition.
    resizeSettleMs: 150,
    // Safety net for browsers without `scrollend`. MUST outlast any smooth
    // scroll (a full-page jump measured ~1.5s) or it releases mid-scroll and
    // the scroll-spy drags the active latch through intermediate sections.
    linkClickFallbackMs: 3000,
  },
  hero: {
    // How long after the last resize event the hero keeps `.is-resizing`, so
    // its proof surface can ease between the desktop card and the flat mobile
    // band as the layout crosses the two-column breakpoint.
    resizeSettleMs: 200,
  },
  distiller: {
    // RUN must stay >= the sequence length in components/skills.css, or the
    // rest beat starts while the tail of the sequence is still playing.
    runMs: 3400,
    restMs: 4000,
  },
  dockedHeaders: {
    // Debounce before re-measuring docked header geometry after a resize.
    remeasureDebounceMs: 200,
  },
  brandCollapse: {
    // Debounce before rebuilding the observer with fresh geometry after a
    // resize.
    remeasureDebounceMs: 200,
  },
  workArchive: {
    // Rows shown for a single selected type before "see more".
    limit: 20,
    // Cap on how many newly-arrived rows play the arrival ping at once.
    flashRows: 12,
    // Drop the arrival class once the animation is spent, so a later expand
    // can re-run it.
    arrivalClearMs: 2600,
  },
  breakpoints: {
    md: { cssVar: '--breakpoint-md', fallbackRem: 48 },
    lg: { cssVar: '--breakpoint-lg', fallbackRem: 64 },
  },
  testimonials: {
    scrollSpeedMin: 80, // seconds
    scrollSpeedMax: 120, // seconds
  },
  calendly: {
    // Safety net: if Calendly never posts a "ready" message (blocked, or the
    // event name changes upstream), reveal the widget anyway rather than
    // leaving our loading state stuck forever.
    readyTimeoutMs: 6000,
  },
  contactUI: {
    eyeOffSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`,
    dummyPlaceholderText: '••••••••@••••••••.•••',
    checkSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" class="c-contact-form__check"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  },
};
export const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
).matches;
