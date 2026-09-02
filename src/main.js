import { siteContent } from './content.js';

const config = {
  loadingScreenMinVisible: 400, // ms since navigation start
  loadingScreenMaxWait: 1500, // ms; rAF-less fallback so it can't get stuck
  loadingScreenFadeOut: 500,
  // Minimum time the contact button stays in its "Sending…" pulse, so the
  // processing beat is felt even when the network responds near-instantly.
  contactSubmitMinVisible: 1500, // ms
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
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
).matches;
let navLinks = [];
let calendlyScriptPromise = null;
// While a nav link is clicked we lock the active link to it so the scroll-spy
// (updateActiveNavLink) doesn't fight the smooth-scroll and yank the underline
// through every intermediate section. Released on scrollend, with a timeout
// fallback for browsers without scrollend or clicks that don't trigger a scroll.
let navLinkClickLock = false;
let navLinkClickFallbackId = null;

function releaseNavLinkClickLock() {
  navLinkClickLock = false;
  if (navLinkClickFallbackId) {
    clearTimeout(navLinkClickFallbackId);
    navLinkClickFallbackId = null;
  }
}

function cssLengthToPx(value, fallbackRem) {
  const trimmedValue = value.trim();
  const rootFontSize =
    Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
    16;

  if (trimmedValue.endsWith('rem')) {
    return Number.parseFloat(trimmedValue) * rootFontSize;
  }

  if (trimmedValue.endsWith('px')) {
    return Number.parseFloat(trimmedValue);
  }

  return fallbackRem * rootFontSize;
}

function getBreakpointPx(key) {
  const breakpoint = config.breakpoints[key];
  const value = getComputedStyle(document.documentElement).getPropertyValue(
    breakpoint.cssVar,
  );
  return cssLengthToPx(value, breakpoint.fallbackRem);
}

let ticking = false;
// Extra scroll consumers (e.g. the docked section headers) register here so
// they run inside the single rAF-batched scroll handler below, instead of
// each attaching its own raw scroll listener that can fire (and force
// layout) several times per frame.
const scrollFrameCallbacks = [];

function handleScroll() {
  if (!ticking) {
    let didUpdate = false;
    const update = () => {
      if (didUpdate) return;
      didUpdate = true;
      updateUIOnScroll();
      ticking = false;
    };

    window.requestAnimationFrame(update);
    window.setTimeout(update, 80);
    ticking = true;
  }
}

// All visual updates triggered by scroll happen here
function updateUIOnScroll() {
  updateActiveNavLink();
  scrollFrameCallbacks.forEach((callback) => callback());
}

window.addEventListener('scroll', handleScroll, { passive: true });
// Once the click-driven smooth-scroll lands, hand control back to the scroll-spy.
window.addEventListener('scrollend', releaseNavLinkClickLock, {
  passive: true,
});
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

document.addEventListener('DOMContentLoaded', () => {
  initializeLoadingScreen();
  initializeCalendlyBookingPanel();
  initializeNavigation();
  initializeInfiniteScroller();
  initializeTestimonialPauseControl();
  enhanceGanttRows();
  initializeScrollAnimations();
  initializeDistillerLoop();
  initializeDockedSectionHeaders();
  initializeBrandCollapse();
  initializeWorkLightbox();
  initializeFeaturedCarousel();
  initializeWorkArchive();
  initializeContactForm();
  initializeContactInfo();
  initializePointerSpotlight();
  updateYearsExperience();
  updateFooterYear();
  // Last: the passes above (docked-header measuring in particular) are what
  // settle the page's final height, so re-anchor after them.
  initializeHashLanding();
});

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
function initializeHashLanding() {
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
  window.setTimeout(release, 4000);

  settle();
  document.fonts?.ready?.then(settle).catch(() => {});
  window.addEventListener('load', settle, { once: true });
}

// Dark-mode pointer spotlight (home only). Light mode keeps a regular pointer,
// so the element is always created but the CSS only paints it under
// [data-color-scheme='dark']. Skipped entirely on touch (no pointer) and where
// motion is unwanted or unaffordable.
function initializePointerSpotlight() {
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

function initializeContactInfo() {
  if (!siteContent.contactInfo) return;

  const emailEl = document.getElementById('contact-email');
  if (emailEl && siteContent.contactInfo.email) {
    const revealButton = document.createElement('button');
    revealButton.type = 'button';
    revealButton.className = 'c-contact__reveal-button';
    revealButton.setAttribute(
      'aria-label',
      siteContent.contactInfo.revealTitle,
    );
    revealButton.title = siteContent.contactInfo.revealTitle;

    const iconHTML = config.contactUI.eyeOffSvg;

    // Use dummy characters that are heavily blurred to thwart OCR
    const textSpan = document.createElement('span');
    textSpan.textContent = config.contactUI.dummyPlaceholderText;
    textSpan.style.filter = 'blur(4px)';
    textSpan.style.opacity = '0.7';
    textSpan.style.transition = 'filter 0.3s ease, opacity 0.3s ease';

    revealButton.innerHTML = iconHTML;
    revealButton.appendChild(textSpan);

    revealButton.addEventListener('mouseenter', () => {
      textSpan.style.filter = 'blur(2px)';
      textSpan.style.opacity = '1';
      revealButton.style.color = 'var(--color-primary)';
    });
    revealButton.addEventListener('mouseleave', () => {
      textSpan.style.filter = 'blur(4px)';
      textSpan.style.opacity = '0.7';
      revealButton.style.color = 'inherit';
    });

    revealButton.addEventListener('click', function revealEmail() {
      const emailAddress = `${siteContent.contactInfo.email.user}@${siteContent.contactInfo.email.domain}`;

      const mailLink = document.createElement('a');
      mailLink.href = `mailto:${emailAddress}`;
      mailLink.textContent = emailAddress;
      mailLink.style.color = 'inherit';
      mailLink.style.textDecoration = 'none';

      mailLink.addEventListener(
        'mouseenter',
        () => (mailLink.style.color = 'var(--color-primary)'),
      );
      mailLink.addEventListener(
        'mouseleave',
        () => (mailLink.style.color = 'inherit'),
      );

      emailEl.innerHTML = '';
      emailEl.appendChild(mailLink);
      mailLink.focus();

      mailLink.style.opacity = '0';
      requestAnimationFrame(() => {
        mailLink.style.transition = 'opacity 0.4s ease, color 0.3s ease';
        mailLink.style.opacity = '1';
      });
    });

    emailEl.innerHTML = '';
    emailEl.appendChild(revealButton);
  }

  const linkedinEl = document.getElementById('contact-linkedin');
  if (linkedinEl && siteContent.contactInfo.linkedin) {
    linkedinEl.href = siteContent.contactInfo.linkedin.url;
    linkedinEl.textContent = siteContent.contactInfo.linkedin.label;
  }
}

function initializeLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (!loadingScreen) return;

  // The page is fully rendered beneath the overlay (static HTML + critical
  // CSS), so hide it on the first frame painted after init instead of a fixed
  // timer. The minimum is measured from navigation start: on slow devices the
  // overlay has already been on screen longer than the minimum by the time we
  // run, so it fades immediately.
  const remaining = Math.max(
    0,
    config.loadingScreenMinVisible - performance.now(),
  );
  let hidden = false;
  const hide = () => {
    if (hidden) return;
    hidden = true;
    loadingScreen.style.opacity = '0';
    loadingScreen.style.transition = `opacity ${config.loadingScreenFadeOut}ms ease`;

    setTimeout(() => loadingScreen.remove(), config.loadingScreenFadeOut);
  };
  requestAnimationFrame(() => setTimeout(hide, remaining));
  // rAF doesn't fire in background tabs (or stalled renderers), so back it
  // up with a plain timer — the overlay must never be able to get stuck.
  setTimeout(hide, config.loadingScreenMaxWait);
}

function initializeNavigation() {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');
  navLinks = document.querySelectorAll('.c-nav__link');
  const navbar = document.getElementById('navbar');
  const controls = [hamburger].filter(Boolean);
  const navMenuQuery = window.matchMedia(
    `(max-width: ${getBreakpointPx('lg')}px)`,
  );
  const setNavOpen = (isOpen) => {
    if (!hamburger || !navMenu) return;

    hamburger.classList.toggle('is-active', isOpen);
    navMenu.classList.toggle('is-active', isOpen);
    updateNavControls(isOpen, controls);
  };
  const isNavOpen = () => Boolean(navMenu?.classList.contains('is-active'));
  const closeNav = ({ restoreFocus = false } = {}) => {
    if (!isNavOpen()) return;

    setNavOpen(false);
    if (restoreFocus) {
      hamburger?.focus();
    }
  };

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      setNavOpen(!isNavOpen());
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isNavOpen()) {
        closeNav({ restoreFocus: true });
      }
    });

    document.addEventListener(
      'pointerdown',
      (event) => {
        if (!isNavOpen()) return;
        if (hamburger.contains(event.target) || navMenu.contains(event.target))
          return;

        closeNav();
      },
      { passive: true },
    );

    navMenuQuery.addEventListener('change', (event) => {
      if (!event.matches) {
        closeNav();
      }
    });
  }

  // Flag the navbar while the viewport is actively resizing so the mobile
  // sheet's open/close transition is suppressed (see `.c-nav.is-resizing` in
  // the nav styles). Without this, dragging across the hamburger breakpoint
  // flashes the menu fading out from its always-visible desktop state.
  if (navbar) {
    let navResizeSettle = 0;
    window.addEventListener(
      'resize',
      () => {
        navbar.classList.add('is-resizing');
        window.clearTimeout(navResizeSettle);
        navResizeSettle = window.setTimeout(() => {
          navbar.classList.remove('is-resizing');
        }, 150);
      },
      { passive: true },
    );
  }

  // Flag the hero while the viewport is actively resizing so its proof surface
  // can ease between the desktop card and the flat mobile band as the layout
  // crosses the two-column breakpoint (see `.c-hero.is-resizing` in hero.css).
  // Held off outside of resize so the change never animates on first paint or
  // a theme toggle.
  const hero = document.getElementById('hero');
  if (hero) {
    let heroResizeSettle = 0;
    window.addEventListener(
      'resize',
      () => {
        hero.classList.add('is-resizing');
        window.clearTimeout(heroResizeSettle);
        heroResizeSettle = window.setTimeout(() => {
          hero.classList.remove('is-resizing');
        }, 200);
      },
      { passive: true },
    );
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.forEach((navLink) => {
        navLink.classList.remove('is-active');
        navLink.removeAttribute('aria-current');
      });
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'location');
      updateCurrentSectionLabel(link);

      // Lock the active link to this one until the smooth-scroll settles so the
      // scroll-spy can't drag the latch through intermediate sections. The
      // real release is the `scrollend` listener; this timeout is only a safety
      // net for browsers without `scrollend`, so it must outlast any smooth
      // scroll (a full-page jump measured ~1.5s) to avoid releasing mid-scroll.
      navLinkClickLock = true;
      if (navLinkClickFallbackId) clearTimeout(navLinkClickFallbackId);
      navLinkClickFallbackId = window.setTimeout(releaseNavLinkClickLock, 3000);

      if (hamburger && navMenu) {
        closeNav();
      }
    });
  });
  if (navbar) {
    updateActiveNavLink();
  }
}

function getCurrentSectionText() {
  return (
    document.querySelector('[data-current-section]')?.textContent?.trim() ||
    siteContent.ui.nav.defaultCurrentLabel
  );
}

function updateNavControls(isOpen, controls = []) {
  const currentText = getCurrentSectionText();
  controls.forEach((control) => {
    control.setAttribute('aria-expanded', String(isOpen));
    // Wording comes from content.js, server-rendered onto the control as
    // data-label-open/-close so this and SiteNav's inline script share one
    // source. Falls back to the rendered aria-label if it's missing.
    const template = isOpen
      ? control.dataset.labelClose
      : control.dataset.labelOpen;
    if (template) {
      control.setAttribute(
        'aria-label',
        template.replace('{section}', currentText),
      );
    }
  });
}

function updateCurrentSectionLabel(activeLink) {
  const currentLabel = document.querySelector('[data-current-section]');
  if (!currentLabel || !activeLink) return;

  currentLabel.textContent = activeLink.textContent.trim();
}

function updateActiveNavLink() {
  // While a click-driven smooth-scroll is in flight, the clicked link stays active.
  if (navLinkClickLock) return;

  const scrollY = window.scrollY;
  let currentSectionId = '';

  const sections = Array.from(document.querySelectorAll('section[id]')).filter(
    (section) => {
      return document.querySelector(`.c-nav__link[href="#${section.id}"]`);
    },
  );

  if (sections.length === 0) return;

  const atBottom =
    window.innerHeight + scrollY >= document.documentElement.scrollHeight - 20;

  if (atBottom) {
    currentSectionId = sections[sections.length - 1].id;
  } else {
    // A section is active if its top has crossed the upper 30% of the viewport
    const threshold = window.innerHeight * 0.3;

    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= threshold) {
        currentSectionId = section.id;
      } else {
        // Once we find a section whose top is below the threshold,
        // we stop; the previous section remains the active one.
        break;
      }
    }
  }

  let activeLink = null;
  navLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === `#${currentSectionId}`;
    link.classList.toggle('is-active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'location');
      activeLink = link;
    } else {
      link.removeAttribute('aria-current');
    }
  });

  updateCurrentSectionLabel(activeLink);
}

// Fire once per element when its top edge crosses 85% of the viewport height
// (or immediately if the page loads already scrolled past it, e.g. a deep
// link — matching how a scroll-position check would behave).
function revealOnEnterViewport(elements, onEnter) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting && entry.boundingClientRect.bottom >= 0)
          return;
        observer.unobserve(entry.target);
        onEnter(entry.target);
      });
    },
    { rootMargin: '0px 0px -15% 0px' },
  );
  elements.forEach((element) => observer.observe(element));
}

function initializeScrollAnimations() {
  revealOnEnterViewport(document.querySelectorAll('.c-section'), (section) =>
    section.classList.add('is-visible'),
  );
}

// The skills distiller plays a ~3.3s staggered reveal (CSS, gated on
// .is-running), rests on its finished frame, then replays. The loop is driven
// from here rather than with an `infinite` iteration count because every
// element in that sequence carries its own animation-delay: infinite
// iterations would let each element restart on its own clock, and the stagger
// that makes the graphic legible would drift apart within a couple of cycles.
// Toggling one class keeps a single shared clock and makes the rest beat an
// explicit number. Between runs nothing animates at all — the graphic sits on
// its finished frame — so this is cheaper than the nine perpetual loops the
// old distiller ran.
//
// RUN must stay >= the sequence length in components/skills.css, or the rest
// beat starts while the tail of the sequence is still playing.
const DISTILLER_RUN_MS = 3400;
const DISTILLER_REST_MS = 4000;

function initializeDistillerLoop() {
  const distiller = document.querySelector('.c-distiller');
  if (!distiller || prefersReducedMotion) return;

  let timer = null;
  let onScreen = false;

  const stop = () => {
    clearTimeout(timer);
    timer = null;
    distiller.classList.remove('is-running');
  };

  const play = () => {
    // Lite mode is probed after first paint, so re-check every cycle rather
    // than once at init; CSS already suppresses the animations there, this
    // just stops the timer churning for a graphic that will never move.
    if (document.documentElement.dataset.perf === 'lite') {
      stop();
      return;
    }
    // Removing the class, forcing a reflow, then re-adding it is what
    // restarts the CSS animations. Without the reflow the two class writes
    // coalesce into no change at all and the sequence never replays.
    distiller.classList.remove('is-running');
    void distiller.offsetWidth;
    distiller.classList.add('is-running');
    timer = setTimeout(() => {
      // Dropping the class rests on the finished frame (the static rules).
      distiller.classList.remove('is-running');
      timer = setTimeout(play, DISTILLER_REST_MS);
    }, DISTILLER_RUN_MS);
  };

  watchViewportPresence(distiller, (isVisible) => {
    if (isVisible === onScreen) return;
    onScreen = isVisible;
    if (isVisible) play();
    else stop();
  });
}

// Report whether an element is in the viewport, so long-lived animations
// (marquees, drifts, carousels) can stop burning GPU/battery while their
// section is scrolled out of view.
function watchViewportPresence(element, onChange) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => onChange(entry.isIntersecting));
  });
  observer.observe(element);
}

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
function initializeDockedSectionHeaders() {
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
  scrollFrameCallbacks.push(update);
  window.addEventListener('load', remeasure);
  document.fonts?.ready.then(remeasure);
  let resizeId = 0;
  window.addEventListener(
    'resize',
    () => {
      window.clearTimeout(resizeId);
      resizeId = window.setTimeout(remeasure, 200);
    },
    { passive: true },
  );
}

// Collapse the brand to the J monogram while the hero name is visible;
// expand to the full logo once the name scrolls under the navbar.
function initializeBrandCollapse() {
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
      resizeId = window.setTimeout(observe, 200);
    },
    { passive: true },
  );
}

function initializeWorkLightbox() {
  const dialog = document.querySelector('[data-lightbox]');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const img = dialog.querySelector('[data-lightbox-img]');
  const titleEl = dialog.querySelector('[data-lightbox-title]');
  const campaignEl = dialog.querySelector('[data-lightbox-campaign]');
  const closeButton = dialog.querySelector('[data-lightbox-close]');

  const openFromTrigger = (trigger) => {
    img.src = trigger.dataset.workScreenshot ?? '';
    img.alt = trigger.dataset.workAlt ?? '';
    titleEl.textContent = trigger.dataset.workTitle ?? '';
    campaignEl.textContent = trigger.dataset.workCampaign ?? '';
    dialog.showModal();
  };

  // Only screengrab cards are <button>s; placeholder tiles share the class but
  // have nothing to enlarge, so skip them.
  document.querySelectorAll('.c-work-card__media').forEach((trigger) => {
    if (trigger.tagName !== 'BUTTON') return;
    trigger.addEventListener('click', () => openFromTrigger(trigger));
  });

  closeButton?.addEventListener('click', () => dialog.close());

  // Backdrop dismiss: the dialog fills the viewport with the figure centered, so
  // a press that both starts and ends on the dialog itself (the area around the
  // figure) closes it. Tracking mousedown guards against the click that opened
  // the dialog also dismissing it. Esc + focus-restore are native to showModal().
  let pressedOnBackdrop = false;
  dialog.addEventListener('mousedown', (event) => {
    pressedOnBackdrop = event.target === dialog;
  });
  dialog.addEventListener('click', (event) => {
    if (pressedOnBackdrop && event.target === dialog) dialog.close();
    pressedOnBackdrop = false;
  });

  // Release the (potentially large) image once the lightbox is dismissed.
  dialog.addEventListener('close', () => {
    img.src = '';
  });
}

// Featured work is a one-at-a-time editorial spread: prev/next (or the arrow
// keys, with focus inside the region) swap the active flagship with an opacity
// dissolve. Every slide is in the DOM; the inactive ones carry [hidden], so
// there is no horizontal rail and nothing touches the page's own scrolling.
function initializeFeaturedCarousel() {
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

function initializeWorkArchive() {
  const root = document.querySelector('[data-archive]');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[data-type-tab]')];
  const chips = [...root.querySelectorAll('[data-industry-filter]')];
  const rows = [...root.querySelectorAll('[data-archive-row]')];
  const statusEl = root.querySelector('[data-archive-status]');
  const emptyEl = root.querySelector('[data-archive-empty]');
  const moreBtn = root.querySelector('[data-archive-more]');
  const listEl = root.querySelector('[data-archive-list]');
  const frameEl = root.querySelector('[data-archive-frame]');
  if (!tabs.length) return;

  const LIMIT = 20; // rows shown for a single selected type before "see more"
  const SAMPLE_PER_TYPE = siteContent.archiveUi.samplePerType; // rows shown per type in the "All" view before "see more"
  // The first tab is "All" (data-type-tab="all"), so both filters default to All.
  let activeType = tabs[0].dataset.typeTab;
  let activeIndustry = 'all';
  let expanded = false;

  const matchesIndustry = (row) =>
    activeIndustry === 'all' || row.dataset.industry === activeIndustry;

  const matchesFilters = (row) =>
    (activeType === 'all' || row.dataset.assetType === activeType) &&
    matchesIndustry(row);

  // The DOM starts in canonical (sorted) order, and `rows` keeps that order for
  // good — every sampling decision below iterates it, so which rows the
  // collapsed view picks never depends on how the DOM is currently arranged.
  // Expanding re-parks the newly revealed rows below the ones already on screen
  // (see the more-button handler); this puts the sorted order back whenever the
  // list collapses or refilters.
  const canonicalOrder = rows.slice();
  let reordered = false;

  // The list is only a scroll frame on wide screens — under 48rem the CSS drops
  // the height cap and it flows in the page (see components/work.css). Reading
  // the computed overflow keeps this in step with that rule instead of
  // duplicating the breakpoint here.
  const isFramed = () => {
    if (!listEl) return false;
    const overflow = getComputedStyle(listEl).overflowY;
    return overflow === 'auto' || overflow === 'scroll';
  };

  const distanceToBottom = () =>
    listEl ? listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight : 0;

  // Toggles the frame's bottom fade. Also the answer to "nothing visibly
  // happened": expanding while parked at the bottom reveals rows off-frame, and
  // the fade appearing is what says the list now continues past its edge.
  const updateScrollAffordance = () => {
    if (!frameEl) return;
    frameEl.classList.toggle(
      'has-more-below',
      isFramed() && distanceToBottom() > 2,
    );
  };

  // Scrolls the frame so `row` sits at its top edge (less the list's own top
  // padding, so the row isn't flush against the lip). Measured from live rects
  // rather than offsetTop, which would be relative to whichever ancestor
  // happens to be positioned.
  const scrollRowToFrameTop = (row) => {
    if (!listEl || !row) return;
    const delta =
      row.getBoundingClientRect().top - listEl.getBoundingClientRect().top;
    listEl.scrollTo({
      top: Math.max(0, listEl.scrollTop + delta - 8),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  // Arrival flash. Capped at roughly one frame's worth of rows: the frame
  // scrolls so the first arrival sits at its top, so these are the ones the
  // reader actually sees land. Marking all ~227 meant that many simultaneous
  // animations, which is what made the flash judder — and the rows past the
  // first screenful would have finished long before anyone scrolled to them.
  const FLASH_ROWS = 12;
  let arrivalTimer = 0;
  const clearArrivals = () => {
    rows.forEach((row) => {
      if (!row.classList.contains('is-new')) return;
      row.classList.remove('is-new');
      row.style.removeProperty('--arrive-i');
    });
  };

  const markArrivals = (arrivals) => {
    clearArrivals();
    window.clearTimeout(arrivalTimer);
    if (!arrivals.length) return;
    arrivals.slice(0, FLASH_ROWS).forEach((row, index) => {
      row.style.setProperty('--arrive-i', String(index));
      row.classList.add('is-new');
    });
    // Drop the class once the animation is spent so a later expand can re-run it.
    arrivalTimer = window.setTimeout(clearArrivals, 2600);
  };

  const restoreOrder = () => {
    if (!reordered || !listEl) return;
    const frag = document.createDocumentFragment();
    canonicalOrder.forEach((row) => frag.appendChild(row));
    listEl.appendChild(frag);
    reordered = false;
  };

  const apply = () => {
    let matched = 0; // rows matching the active type + industry
    let collapsedShown = 0; // how many WOULD show in the capped (collapsed) view
    // In the All view the cap is per type (a few from each); for a single
    // selected type it is a flat LIMIT. Rows are pre-sorted type → industry →
    // newest, so "first N" reads as the newest few of each type.
    const perTypeShown = {};
    rows.forEach((row) => {
      const typeMatch =
        activeType === 'all' || row.dataset.assetType === activeType;
      const isMatch = typeMatch && matchesIndustry(row);
      if (!isMatch) {
        row.toggleAttribute('hidden', true);
        return;
      }
      matched += 1;
      let inCollapsed;
      if (activeType === 'all') {
        const t = row.dataset.assetType;
        const n = perTypeShown[t] || 0;
        inCollapsed = n < SAMPLE_PER_TYPE;
        if (inCollapsed) perTypeShown[t] = n + 1;
      } else {
        inCollapsed = matched <= LIMIT;
      }
      if (inCollapsed) collapsedShown += 1;
      row.toggleAttribute('hidden', !(expanded || inCollapsed));
    });
    // Each tab's count reflects the active industry filter (the All tab counts
    // every type); dim empty tabs.
    tabs.forEach((tab) => {
      const type = tab.dataset.typeTab;
      const count = rows.filter(
        (r) =>
          (type === 'all' || r.dataset.assetType === type) &&
          matchesIndustry(r),
      ).length;
      const countEl = tab.querySelector('[data-tab-count]');
      if (countEl) countEl.textContent = String(count);
      tab.classList.toggle('is-empty', count === 0);
    });
    if (emptyEl) emptyEl.toggleAttribute('hidden', matched !== 0);
    if (statusEl)
      statusEl.textContent = siteContent.archiveUi.countStatus
        .replace('{shown}', String(matched))
        .replace('{total}', String(rows.length));
    if (moreBtn) {
      moreBtn.hidden = matched <= collapsedShown;
      moreBtn.textContent = expanded
        ? siteContent.archiveUi.showFewerLabel
        : siteContent.archiveUi.showAllLabel.replace(
            '{count}',
            String(matched),
          );
    }
    updateScrollAffordance();
  };

  const select = (items, chosen, attr, value) => {
    items.forEach((item) => {
      const on = item === chosen;
      item.classList.toggle('is-active', on);
      item.setAttribute('aria-pressed', String(on));
    });
    if (attr === 'type') activeType = value;
    else activeIndustry = value;
    expanded = false; // collapse back to the capped view on any filter change
    clearArrivals();
    restoreOrder();
    apply();
    // Land at the top of the freshly filtered set inside the scroll frame.
    if (listEl) listEl.scrollTop = 0;
  };

  tabs.forEach((tab) =>
    tab.addEventListener('click', () =>
      select(tabs, tab, 'type', tab.dataset.typeTab),
    ),
  );
  chips.forEach((chip) =>
    chip.addEventListener('click', () =>
      select(chips, chip, 'industry', chip.dataset.industryFilter),
    ),
  );
  if (moreBtn) {
    moreBtn.addEventListener('click', () => {
      if (expanded) {
        // Collapsing keeps the reader where they were rather than snapping to
        // the top. Captured BEFORE restoreOrder(), which briefly empties the
        // list and so zeroes scrollTop. Clamping to the collapsed list's new
        // maximum does both halves of the job: a position that still exists is
        // kept, and one that only existed while expanded lands on the last row
        // of the filter instead of scrolling past the end.
        const previousTop = listEl ? listEl.scrollTop : 0;
        const framed = isFramed();
        expanded = false;
        clearArrivals();
        restoreOrder();
        apply();
        if (listEl && framed) {
          const maxTop = Math.max(0, listEl.scrollHeight - listEl.clientHeight);
          listEl.scrollTop = Math.min(previousTop, maxTop);
          updateScrollAffordance();
        } else {
          // Unframed (mobile): the list flows in the page, so collapsing it
          // shortens the document and would otherwise strand the reader far
          // below the archive.
          if (listEl) listEl.scrollTop = 0;
          root.scrollIntoView({
            block: 'start',
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
          });
        }
        return;
      }
      // Expanding: rows already on screen keep their place and the ones being
      // revealed are parked below them. Without this they insert themselves
      // BETWEEN rows the reader has already scrolled past, so the part of the
      // list behind them reshuffles. The move happens while those rows are
      // still [hidden] (zero height), so nothing shifts visually.
      const arrivals = [];
      if (listEl) {
        const onScreen = new Set(
          rows.filter((row) => !row.hasAttribute('hidden')),
        );
        const frag = document.createDocumentFragment();
        canonicalOrder.forEach((row) => {
          if (!onScreen.has(row) && matchesFilters(row)) {
            arrivals.push(row);
            frag.appendChild(row);
          }
        });
        listEl.appendChild(frag);
        reordered = true;
      }
      expanded = true;
      apply();
      // Announce the arrivals. Appending alone is invisible from the bottom of
      // the frame — the new rows land off-frame and only the scrollbar reacts —
      // so the frame travels to where they start and they light up briefly on
      // the way in. The tint is held through the animation's delay (`backwards`
      // in the CSS), so the rows are already marked when the scroll lands and
      // then fade, rather than flashing at a viewport nobody is looking at.
      markArrivals(arrivals);
      if (arrivals.length && isFramed()) scrollRowToFrameTop(arrivals[0]);
    });
  }

  if (listEl) {
    listEl.addEventListener('scroll', updateScrollAffordance, {
      passive: true,
    });
  }
  window.addEventListener('resize', updateScrollAffordance, { passive: true });

  apply();
}

function initializeContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const fields = {
    name: form.elements.name,
    email: form.elements.email,
    message: form.elements.message,
  };
  const formError = document.getElementById('form-error');
  const formStatus = document.getElementById('form-status');
  const controls = [...form.querySelectorAll('.c-form-control')];
  const submitButton = form.querySelector('button[type="submit"]');
  const labels = siteContent.contactForm.labels;

  // Clear a field's error the moment the visitor starts correcting it.
  Object.values(fields).forEach((field) =>
    field?.addEventListener('input', () => clearFieldError(field)),
  );

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormError(formError);
    Object.values(fields).forEach((field) => clearFieldError(field));

    const formData = new FormData(form);
    const messages = siteContent.contactForm.messages;
    let firstInvalid = null;
    const invalid = new Set();

    Object.entries(fields).forEach(([name, field]) => {
      if (field?.required && !String(formData.get(name) || '').trim()) {
        setFieldError(field, messages.required[name]);
        firstInvalid = firstInvalid || field;
        invalid.add(name);
      }
    });

    // Only validate the email format when it isn't already flagged as empty.
    const emailValue = String(formData.get('email') || '').trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailValue && !emailPattern.test(emailValue)) {
      setFieldError(fields.email, messages.invalidEmail);
      firstInvalid = firstInvalid || fields.email;
      invalid.add('email');
    }

    if (firstInvalid) {
      // Focus reads the first field's own error; the live region gives screen
      // readers the full picture in one go (field labels, in DOM order).
      const affected = Object.keys(fields)
        .filter((name) => invalid.has(name))
        .map((name) => labels[name]);
      announce(formStatus, `${messages.summaryLead} ${affected.join(', ')}`);
      firstInvalid.focus();
      return;
    }

    setContactSubmitting(submitButton);
    const startedAt = performance.now();

    try {
      // The endpoint comes from siteContent.contactForm via the form markup.
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      // Hold the pulse for a beat so the "processing" state is perceptible even
      // on a fast response (skipped for reduced-motion — no pulse to show).
      await holdSubmittingFor(startedAt);

      if (data.success) {
        // Success is confirmed inline: the button morphs to "Sent ✓" and the
        // form greys out until the visitor clicks back in.
        markContactFormSubmitted(form, submitButton, controls);
      } else {
        revertContactSubmit(submitButton);
        setFormError(formError, messages.submitFailed);
        console.error('Web3Forms Error:', data);
      }
    } catch (error) {
      await holdSubmittingFor(startedAt);
      revertContactSubmit(submitButton);
      setFormError(formError, messages.network);
      console.error('Form submission error:', error);
    }
  });
}

// Field-level inline errors: flag the control and fill its adjacent message
// slot (id="<field-id>-error", linked via aria-describedby in the markup).
function setFieldError(field, message) {
  if (!field) return;
  field.setAttribute('aria-invalid', 'true');
  const errorEl = document.getElementById(`${field.id}-error`);
  if (errorEl) errorEl.textContent = message;
}

function clearFieldError(field) {
  if (!field) return;
  field.removeAttribute('aria-invalid');
  const errorEl = document.getElementById(`${field.id}-error`);
  if (errorEl) errorEl.textContent = '';
}

// Form-level summary error (submit/network failures) shown above the button.
function setFormError(el, message) {
  if (el) el.textContent = message;
}

function clearFormError(el) {
  if (el) el.textContent = '';
}

// Announce a message in a live region. Clears first, then sets after a short
// real-time gap so an identical repeated message (e.g. resubmitting without
// fixing anything) still registers as a change and is re-announced. A timer
// (not rAF) is used so it fires reliably even in a backgrounded/throttled tab.
function announce(region, message) {
  if (!region) return;
  region.textContent = '';
  setTimeout(() => {
    region.textContent = message;
  }, 120);
}

// Wait out the remainder of the minimum in-flight window so the pulse is
// visible for a full beat. No-op under reduced motion (there is no pulse).
function holdSubmittingFor(startedAt) {
  if (prefersReducedMotion) return Promise.resolve();
  const remaining =
    config.contactSubmitMinVisible - (performance.now() - startedAt);
  if (remaining <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, remaining));
}

// Button enters its in-flight state: label swap + the pulse (is-submitting).
function setContactSubmitting(button) {
  button.classList.remove('is-sent');
  button.classList.add('is-submitting');
  button.disabled = true;
  button.textContent = siteContent.contactForm.sendingLabel;
}

// Roll the button back to its resting state (used on error and on re-engage).
function revertContactSubmit(button) {
  button.classList.remove('is-submitting', 'is-sent');
  button.disabled = false;
  button.textContent = siteContent.contactForm.submitLabel;
}

// Success visual: button becomes "Sent ✓", the form is cleared and deactivated
// (dimmed + fields disabled). A single pointerdown anywhere in the form wakes it
// back up so the visitor can send another message.
function markContactFormSubmitted(form, button, controls) {
  button.classList.remove('is-submitting');
  button.classList.add('is-sent');
  button.disabled = true;
  button.innerHTML = `${config.contactUI.checkSvg}<span class="c-contact-form__sent-label">${siteContent.contactForm.sentLabel}</span>`;

  form.classList.add('is-submitted');
  form.reset();
  controls.forEach((control) => {
    control.disabled = true;
    control.removeAttribute('aria-invalid');
  });

  form.addEventListener(
    'pointerdown',
    () => resetContactForm(form, button, controls),
    { once: true },
  );
}

function resetContactForm(form, button, controls) {
  form.classList.remove('is-submitted');
  controls.forEach((control) => {
    control.disabled = false;
  });
  revertContactSubmit(button);
  controls[0]?.focus();
}

function updateYearsExperience() {
  const el = document.getElementById('years-experience');
  const startYear = siteContent.profile?.experienceStartYear;
  if (el && startYear) el.textContent = new Date().getFullYear() - startYear;
}

function updateFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

function buildCalendlyUrl(cta) {
  const url = new URL(cta.url, window.location.href);
  const theme = cta.theme || {};
  const scheme =
    document.documentElement.dataset.colorScheme === 'light' ? 'light' : 'dark';
  const schemeColors = theme[scheme] || {};
  const params = {
    background_color: schemeColors.backgroundColor,
    text_color: schemeColors.textColor,
    primary_color: schemeColors.primaryColor,
  };

  Object.entries(params).forEach(([key, value]) => {
    if (value && !url.searchParams.has(key)) {
      url.searchParams.set(key, value);
    }
  });

  if (
    theme.hideEventTypeDetails &&
    !url.searchParams.has('hide_event_type_details')
  ) {
    url.searchParams.set('hide_event_type_details', '1');
  }

  return url.toString();
}

function loadCalendlyScript() {
  if (window.Calendly?.initInlineWidget) {
    return Promise.resolve(window.Calendly);
  }

  if (calendlyScriptPromise) {
    return calendlyScriptPromise;
  }

  calendlyScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[data-calendly-widget]',
    );
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.Calendly), {
        once: true,
      });
      existingScript.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    script.dataset.calendlyWidget = 'true';
    script.addEventListener('load', () => resolve(window.Calendly), {
      once: true,
    });
    script.addEventListener('error', reject, { once: true });
    document.head.appendChild(script);
  });

  return calendlyScriptPromise;
}

function initializeCalendlyBookingPanel() {
  const booking = document.querySelector('[data-calendly-booking]');
  const cta = siteContent.profile?.bookingCta;
  if (!booking || !cta?.url || booking.dataset.calendlyEnhanced === 'true')
    return;

  const trigger = booking.querySelector('[data-calendly-open]');
  const panel = booking.querySelector('.c-calendly-panel');
  const loading = booking.querySelector('[data-calendly-loading]');
  const container = booking.querySelector('[data-calendly-container]');
  const bookedMessage = booking.querySelector('[data-calendly-booked]');
  if (!trigger || !panel || !loading || !container || !bookedMessage) return;

  let isOpen = false;
  let hasInitializedCalendly = false;
  let readyFallbackId = null;
  const openLabel =
    cta.buttonLabel ||
    trigger.getAttribute('aria-label') ||
    'Schedule a discovery call';
  const closeLabel = cta.closeLabel || 'Close scheduler';
  // Events Calendly posts once the inline widget has actually painted a
  // calendar (as opposed to the iframe element merely existing, which can
  // still be showing Calendly's own blank/spinner state for a beat on a slow
  // connection — exactly the "stuck with their default" moment our own
  // themed loading indicator is meant to cover).
  const CALENDLY_READY_EVENTS = new Set([
    'calendly.event_type_viewed',
    'calendly.profile_page_viewed',
  ]);

  const updateTriggerState = (open) => {
    trigger.setAttribute('aria-expanded', String(open));
    trigger.setAttribute('aria-label', open ? closeLabel : openLabel);
    trigger.classList.toggle('is-close-state', open);
  };

  const setLoaded = (loaded) => {
    window.clearTimeout(readyFallbackId);
    readyFallbackId = null;
    panel.classList.toggle('is-loaded', loaded);
    loading.setAttribute('aria-hidden', String(loaded));
  };

  const clearCalendlyEmbed = () => {
    container.innerHTML = '';
    setLoaded(false);
    hasInitializedCalendly = false;
  };

  const initializeCalendly = async () => {
    if (hasInitializedCalendly) return;
    hasInitializedCalendly = true;
    setLoaded(false);
    readyFallbackId = window.setTimeout(
      () => setLoaded(true),
      config.calendly.readyTimeoutMs,
    );

    try {
      const Calendly = await loadCalendlyScript();
      Calendly.initInlineWidget({
        url: buildCalendlyUrl(cta),
        parentElement: container,
      });
    } catch (error) {
      hasInitializedCalendly = false;
      setLoaded(false);
      console.error('Calendly failed to load:', error);
    }
  };

  const openPanel = () => {
    if (isOpen) return;
    isOpen = true;
    panel.hidden = false;
    updateTriggerState(true);
    requestAnimationFrame(() => {
      panel.classList.add('is-open');
      booking.classList.add('is-expanded');
    });
    initializeCalendly();
  };

  const closePanel = () => {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove('is-open');
    booking.classList.remove('is-expanded');
    updateTriggerState(false);

    const finishClose = () => {
      if (isOpen) return;
      panel.hidden = true;
      bookedMessage.hidden = true;
      panel.classList.remove('is-booked');
      clearCalendlyEmbed();
      trigger.focus();
    };

    if (prefersReducedMotion) {
      finishClose();
      return;
    }

    panel.addEventListener('transitionend', finishClose, { once: true });
  };

  // The trigger is an <a> (no-JS fallback opens Calendly in a new tab); once
  // enhanced it behaves as a disclosure button, so expose button semantics
  // and the Space key alongside the link's native Enter activation.
  trigger.setAttribute('role', 'button');
  trigger.addEventListener('keydown', (event) => {
    if (event.key !== ' ') return;
    event.preventDefault();
    trigger.click();
  });

  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    if (isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  });

  // The whole bar is the hit area: a click anywhere on it acts on the trigger.
  // The trigger itself stays the real control — it keeps focus, the accessible
  // name and the keyboard handling above — so this only widens the target and
  // costs nothing when JS is absent. Clicks that land on the trigger (or any
  // other interactive element in the bar) are left alone so they aren't
  // handled twice.
  const bar = booking.querySelector('.c-booking-cta__bar');
  if (bar) {
    bar.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) return;
      trigger.click();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) {
      closePanel();
    }
  });

  window.addEventListener('message', (event) => {
    if (event.origin !== 'https://calendly.com') return;
    if (!event.data?.event?.startsWith?.('calendly.')) return;
    if (CALENDLY_READY_EVENTS.has(event.data.event)) {
      setLoaded(true);
    }
    if (event.data.event === 'calendly.event_scheduled') {
      bookedMessage.hidden = false;
      panel.classList.add('is-booked');
    }
  });

  // Re-embed with the matching Calendly theme if the user switches color
  // scheme while the scheduler is open (closed panels re-theme on open).
  window.addEventListener('colorschemechange', () => {
    if (isOpen && hasInitializedCalendly) {
      clearCalendlyEmbed();
      initializeCalendly();
    }
  });

  booking.dataset.calendlyEnhanced = 'true';
}

function initializeInfiniteScroller() {
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

function initializeTestimonialPauseControl() {
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

function setGanttAreaExpanded(barArea, isExpanded) {
  barArea.classList.toggle('is-active', isExpanded);
  barArea.setAttribute('aria-expanded', String(isExpanded));
}

function closeGanttDetails(container, exceptArea = null) {
  container
    .querySelectorAll('.c-gantt__bar-area.is-active')
    .forEach((activeArea) => {
      if (activeArea !== exceptArea) {
        setGanttAreaExpanded(activeArea, false);
      }
    });
}

function isCompactGanttCardView() {
  return window.matchMedia(`(max-width: ${getBreakpointPx('md')}px)`).matches;
}

function enhanceGanttRows() {
  const container = document.getElementById('gantt-chart-container');
  if (!container) return;

  if (container.dataset.ganttOutsideListener !== 'true') {
    document.addEventListener('click', (event) => {
      if (container.contains(event.target)) return;
      closeGanttDetails(container);
    });
    // WCAG 1.4.13: Escape dismisses hover/focus tooltips; they may reappear
    // once the pointer moves again.
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      closeGanttDetails(container);
      container.classList.add('has-tooltips-suppressed');
      if (container.contains(document.activeElement)) {
        document.activeElement.blur();
      }
    });
    container.addEventListener('pointermove', () => {
      container.classList.remove('has-tooltips-suppressed');
    });
    container.dataset.ganttOutsideListener = 'true';
  }

  const rows = Array.from(container.querySelectorAll('.c-gantt__row'));
  rows.forEach((row) => {
    const barArea = row.querySelector('.c-gantt__bar-area');
    if (!barArea) return;

    if (barArea.dataset.ganttEnhanced === 'true') return;

    barArea.addEventListener('click', () => {
      const isActive = barArea.classList.contains('is-active');
      closeGanttDetails(container, barArea);
      setGanttAreaExpanded(barArea, !isActive);
    });
    row.addEventListener('click', (event) => {
      if (!isCompactGanttCardView() || barArea.contains(event.target)) return;
      barArea.click();
    });
    barArea.addEventListener('keydown', (event) => {
      if (!['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      barArea.click();
    });
    barArea.dataset.ganttEnhanced = 'true';
  });

  revealGanttChartOnScroll(container);
}

function revealGanttChartOnScroll(container) {
  revealOnEnterViewport([container], () =>
    container.classList.add('is-visible'),
  );
}
