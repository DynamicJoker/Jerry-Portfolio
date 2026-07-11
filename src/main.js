import { siteContent } from './content.js';

const config = {
  loadingScreenMinVisible: 400, // ms since navigation start
  loadingScreenMaxWait: 1500, // ms; rAF-less fallback so it can't get stuck
  loadingScreenFadeOut: 500,
  notificationDuration: 5000,
  breakpoints: {
    md: { cssVar: '--breakpoint-md', fallbackRem: 48 },
    lg: { cssVar: '--breakpoint-lg', fallbackRem: 64 },
  },
  navbar: {
    scrollThreshold: 10, // px
  },
  testimonials: {
    scrollSpeedMin: 80, // seconds
    scrollSpeedMax: 120, // seconds
  },
  logoCarousel: {
    interval: 3000, // milliseconds
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

let lastKnownScrollPosition = 0;
let ticking = false;
// Extra scroll consumers (e.g. the docked section headers) register here so
// they run inside the single rAF-batched scroll handler below, instead of
// each attaching its own raw scroll listener that can fire (and force
// layout) several times per frame.
const scrollFrameCallbacks = [];

function handleScroll() {
  lastKnownScrollPosition = window.pageYOffset;

  if (!ticking) {
    let didUpdate = false;
    const update = () => {
      if (didUpdate) return;
      didUpdate = true;
      updateUIOnScroll(lastKnownScrollPosition);
      ticking = false;
    };

    window.requestAnimationFrame(update);
    window.setTimeout(update, 80);
    ticking = true;
  }
}

// All visual updates triggered by scroll happen here
function updateUIOnScroll(scrollY) {
  const navbar = document.getElementById('navbar');

  if (navbar) {
    navbar.classList.toggle(
      'is-scrolled',
      scrollY > config.navbar.scrollThreshold,
    );
  }

  updateActiveNavLink();
  updateNavGlow();
  scrollFrameCallbacks.forEach((callback) => callback());
}

window.addEventListener('scroll', handleScroll, { passive: true });
// Once the click-driven smooth-scroll lands, hand control back to the scroll-spy.
window.addEventListener('scrollend', releaseNavLinkClickLock, {
  passive: true,
});
// Recompute scroll-derived UI on resize. The active-nav-link underline is
// positioned with pixel values from getBoundingClientRect() (see updateNavGlow),
// so it must be re-measured when the layout reflows — otherwise it lags/mispositions.
let resizeRaf = 0;
window.addEventListener(
  'resize',
  () => {
    if (!resizeRaf) {
      resizeRaf = window.requestAnimationFrame(() => {
        resizeRaf = 0;
        updateUIOnScroll(window.pageYOffset);
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
  initializeHeroAuroraPause();
  initializeDockedSectionHeaders();
  initializeBrandCollapse();
  initializeWorkLightbox();
  initializeFeaturedCarousel();
  initializeWorkArchive();
  initializeContactForm();
  initializeContactInfo();
  updateYearsExperience();
  updateFooterYear();
  initializeLogoCarousel();
  initializePipeline();
});

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
      revealButton.style.color = 'var(--color-electric-blue)';
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
        () => (mailLink.style.color = 'var(--color-electric-blue)'),
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

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.forEach((navLink) => {
        navLink.classList.remove('is-active');
        navLink.removeAttribute('aria-current');
      });
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'location');
      updateCurrentSectionLabel(link);
      updateNavGlow();

      // Lock the active link to this one until the smooth-scroll settles so the
      // scroll-spy can't drag the underline through intermediate sections. The
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
    navbar.classList.toggle(
      'is-scrolled',
      window.pageYOffset > config.navbar.scrollThreshold,
    );
    updateActiveNavLink();
    updateNavGlow();
  }
}

function getCurrentSectionText() {
  return (
    document.querySelector('[data-current-section]')?.textContent?.trim() ||
    'Home'
  );
}

function updateNavControls(isOpen, controls = []) {
  const currentText = getCurrentSectionText();
  controls.forEach((control) => {
    control.setAttribute('aria-expanded', String(isOpen));
    control.setAttribute(
      'aria-label',
      `${isOpen ? 'Close' : 'Open'} navigation menu, currently ${currentText}`,
    );
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

function updateNavGlow() {
  const navMenu = document.getElementById('nav-menu');
  const activeLink = Array.from(navLinks).find((link) =>
    link.classList.contains('is-active'),
  );
  if (activeLink && navMenu) {
    const menuRect = navMenu.getBoundingClientRect();
    const activeRect = activeLink.getBoundingClientRect();
    navMenu.style.setProperty(
      '--glow-left',
      `${activeRect.left - menuRect.left}px`,
    );
    navMenu.style.setProperty('--glow-width', `${activeRect.width}px`);
    navMenu.style.setProperty('--glow-opacity', '1');
  } else if (navMenu) {
    navMenu.style.setProperty('--glow-opacity', '0');
  }
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

// Report whether an element is in the viewport, so long-lived animations
// (marquees, drifts, carousels) can stop burning GPU/battery while their
// section is scrolled out of view.
function watchViewportPresence(element, onChange) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => onChange(entry.isIntersecting));
  });
  observer.observe(element);
}

// The hero aurora blobs drift on an infinite loop; pause them (CSS acts on
// .is-offscreen) once the hero scrolls out of view.
function initializeHeroAuroraPause() {
  const aurora = document.querySelector('.c-hero__aurora');
  if (!aurora || prefersReducedMotion) return;
  watchViewportPresence(aurora, (isVisible) =>
    aurora.classList.toggle('is-offscreen', !isVisible),
  );
}

// Docked section headings: each .c-section__header is position:sticky (CSS). As
// a header nears the dock line we scrub --dock-progress (CSS scales the title
// toward its compact size); once it reaches the line .is-docked swaps in the
// slim bar layout. The header's natural height is pinned as an inline
// min-height so the swap never reflows the content below — see "Docked section
// headings" in src/styles/components/section.css.
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

  // Reserve each header's natural height as a min-height so the compact swap
  // never reflows the content below, and measure the compact/full title ratio
  // (--dock-scale-end) the scrub scales toward. Re-run whenever layout can
  // change (load, fonts settling, resize).
  const measureHeaders = () => {
    headers.forEach((header) => {
      const title = header.querySelector('.c-section__title');
      const wasDocked = header.classList.contains('is-docked');
      header.classList.remove('is-docked');
      header.style.removeProperty('min-height');
      const naturalHeight = header.offsetHeight;
      let scaleEnd = 0.45;
      if (title) {
        const fullSize = Number.parseFloat(getComputedStyle(title).fontSize);
        header.classList.add('is-docked');
        const compactSize = Number.parseFloat(getComputedStyle(title).fontSize);
        header.classList.remove('is-docked');
        if (fullSize > 0 && compactSize > 0) {
          scaleEnd = compactSize / fullSize;
        }
      }
      header.style.minHeight = `${naturalHeight}px`;
      header.style.setProperty('--dock-scale-end', scaleEnd.toFixed(4));
      if (wasDocked) header.classList.add('is-docked');
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
    const rects = headers.map((header) => header.getBoundingClientRect());
    headers.forEach((header, index) => {
      const { top, bottom } = rects[index];
      header.classList.toggle('is-docked', top <= dockY + 1 && bottom > dockY);
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

// Featured work is a horizontal scroll-snap filmstrip: the user swipes, drags,
// arrows, or taps a dot to move between flagship spotlights. No auto-rotation —
// nothing moves unless the user drives it.
function initializeFeaturedCarousel() {
  const root = document.querySelector('[data-featured]');
  if (!root) return;
  const viewport = root.querySelector('[data-featured-slides]');
  const slides = [...root.querySelectorAll('[data-featured-slide]')];
  const dots = [...root.querySelectorAll('[data-featured-dot]')];
  const status = root.querySelector('[data-featured-status]');
  const prevBtn = root.querySelector('[data-featured-prev]');
  const nextBtn = root.querySelector('[data-featured-next]');
  if (!viewport || slides.length <= 1) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior = reduce ? 'auto' : 'smooth';
  let index = 0;

  // Reflect the active slide on the dots + sr-only status, without scrolling.
  const setActive = (i) => {
    index = Math.max(0, Math.min(i, slides.length - 1));
    dots.forEach((dot, n) => {
      const on = n === index;
      dot.classList.toggle('is-active', on);
      dot.setAttribute('aria-current', on ? 'true' : 'false');
    });
    if (status) status.textContent = `Slide ${index + 1} of ${slides.length}`;
  };

  // Wrap around so Next past the last lands on the first, and Prev before the
  // first lands on the last.
  const scrollToSlide = (i) => {
    const n = (i + slides.length) % slides.length;
    const target = slides[n];
    if (target) viewport.scrollTo({ left: target.offsetLeft, behavior });
  };

  const maxScroll = () =>
    Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const clampScroll = (v) => Math.max(0, Math.min(v, maxScroll()));

  // The slide whose centre is nearest a given scroll position. `nearestIndex`
  // reads the live position; the glide passes its target so it snaps toward where
  // the wheel is heading, not where it currently is.
  const nearestIndexTo = (left) => {
    const center = left + viewport.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    slides.forEach((slide, n) => {
      const dist = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = n;
      }
    });
    return best;
  };
  const nearestIndex = () => nearestIndexTo(viewport.scrollLeft);

  // Derive the active dot from the real scroll position (not an observer that
  // can latch the wrong slide before the deferred stylesheet lays the strip out).
  // Lock to the first/last at the extremes so rounding never lands off-by-one.
  const syncActive = () => {
    const max = viewport.scrollWidth - viewport.clientWidth;
    if (max <= 0 || viewport.scrollLeft <= 1) return setActive(0);
    if (viewport.scrollLeft >= max - 1) return setActive(slides.length - 1);
    return setActive(nearestIndex());
  };

  let scrollRaf = 0;
  viewport.addEventListener(
    'scroll',
    () => {
      if (scrollRaf) return;
      scrollRaf = window.requestAnimationFrame(() => {
        scrollRaf = 0;
        syncActive();
      });
    },
    { passive: true },
  );
  // The strip is laid out by the deferred stylesheet, so recompute once it lands
  // and on any later reflow.
  window.addEventListener('load', syncActive);
  window.addEventListener('resize', syncActive, { passive: true });

  // Buttons/dots cancel any in-flight glide, then ease to their target.
  const goTo = (i) => {
    stopGlide();
    scrollToSlide(i);
  };
  prevBtn.addEventListener('click', () => goTo(index - 1));
  nextBtn.addEventListener('click', () => goTo(index + 1));
  dots.forEach((dot, n) => dot.addEventListener('click', () => goTo(n)));

  // Mouse drag-to-scroll. Touch already scrolls natively, so we ignore it here.
  let dragging = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    stopGlide(); // a grab cancels any in-flight wheel glide
    dragging = true;
    moved = false;
    startX = e.clientX;
    startScroll = viewport.scrollLeft;
    viewport.setPointerCapture(e.pointerId);
    // is-grabbing styles the cursor + suppresses selection; is-free drops snap so
    // the drag isn't fought, then we snap to the nearest slide on release.
    root.classList.add('is-grabbing', 'is-free');
  });
  viewport.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    viewport.scrollLeft = startScroll - dx;
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    root.classList.remove('is-grabbing', 'is-free');
    if (moved) scrollToSlide(nearestIndex());
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  // Stop the browser's native image/element drag, which otherwise hijacks the
  // pointer mid-drag and makes the scroll stutter.
  viewport.addEventListener('dragstart', (e) => e.preventDefault());

  // Swallow the click that fires at the end of a drag so a dragged card doesn't
  // open its lightbox or follow a link.
  viewport.addEventListener(
    'click',
    (e) => {
      if (!moved) return;
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    },
    true,
  );

  // Wheel = momentum glide with intent detection. The wheel always feeds a
  // `glideTarget` that a rAF loop eases scrollLeft toward (fluid follow +
  // deceleration, snap suspended via is-free). When the wheel goes idle we
  // classify the whole gesture: a brief, modest one — a deliberate wheel
  // "click" — steps to exactly the next/previous card; anything longer or
  // bigger (a fast spin or trackpad swipe) settles on whichever card momentum
  // reached. Under reduced-motion EASE is 1 (instant). A single physical notch
  // is one gesture even though Chrome bursts it into several events, because we
  // group by the idle gap, not per event.
  const EASE = reduce ? 1 : 0.18;
  const SETTLE_EPS = 0.5; // px: close enough to stop the loop
  const SETTLE_MS = 90; // wheel-idle before we classify + settle
  const NEW_GESTURE_GAP = 140; // idle gap (ms) that starts a fresh gesture
  const CLICK_MAX_MS = 220; // a "click" gesture is brief…
  const CLICK_MAX_EVENTS = 12; // …with few events…
  const CLICK_MIN_DELTA = 16; // …and a real but…
  const CLICK_MAX_DELTA = 200; // …modest total delta.
  let glideTarget = viewport.scrollLeft;
  let glideRaf = 0;
  let glideIdle = 0;
  let settling = false;
  // Per-gesture accumulators used to tell a single click from a continuous scroll.
  let gestureStart = 0;
  let gestureDelta = 0;
  let gestureEvents = 0;
  let gestureFromIndex = 0;
  let lastWheelTime = 0;

  const stopGlide = () => {
    if (glideRaf) window.cancelAnimationFrame(glideRaf);
    glideRaf = 0;
    window.clearTimeout(glideIdle);
    settling = false;
    lastWheelTime = 0; // next wheel starts a clean gesture
    root.classList.remove('is-free');
  };

  const glideTick = () => {
    const current = viewport.scrollLeft;
    const diff = glideTarget - current;
    if (Math.abs(diff) <= SETTLE_EPS) {
      viewport.scrollLeft = glideTarget;
      glideRaf = 0;
      // Only release snap once we've actually settled onto a card.
      if (settling) {
        settling = false;
        root.classList.remove('is-free');
      }
      return;
    }
    viewport.scrollLeft = current + diff * EASE;
    glideRaf = window.requestAnimationFrame(glideTick);
  };
  const requestGlide = () => {
    if (!glideRaf) glideRaf = window.requestAnimationFrame(glideTick);
  };

  // Decide where the just-finished wheel gesture should land, then ease there.
  const settleGesture = () => {
    const dir = Math.sign(gestureDelta) || 1;
    const absDelta = Math.abs(gestureDelta);
    const duration = lastWheelTime - gestureStart;
    const isClick =
      duration <= CLICK_MAX_MS &&
      gestureEvents <= CLICK_MAX_EVENTS &&
      absDelta >= CLICK_MIN_DELTA &&
      absDelta <= CLICK_MAX_DELTA;
    // A click moves exactly one card from where the gesture began; a longer
    // scroll keeps wherever momentum carried it.
    const targetIndex = isClick
      ? Math.max(0, Math.min(gestureFromIndex + dir, slides.length - 1))
      : nearestIndexTo(glideTarget);
    settling = true;
    glideTarget = clampScroll(slides[targetIndex].offsetLeft);
    requestGlide();
  };

  // Only hijack a vertical wheel when the strip can still move that way — at
  // either end we let it fall through so the page keeps scrolling past.
  viewport.addEventListener(
    'wheel',
    (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // native horizontal handles it
      const max = maxScroll();
      if (max <= 0) return;
      const goingLeft = e.deltaY < 0;
      if (
        (goingLeft && glideTarget <= 0) ||
        (!goingLeft && glideTarget >= max)
      ) {
        return;
      }
      e.preventDefault();
      const now = performance.now();
      // A gap since the last wheel event begins a fresh gesture — record where
      // we started so a click can step exactly one card from here.
      if (now - lastWheelTime > NEW_GESTURE_GAP) {
        gestureStart = now;
        gestureDelta = 0;
        gestureEvents = 0;
        gestureFromIndex = nearestIndex();
        if (!glideRaf) glideTarget = viewport.scrollLeft;
      }
      lastWheelTime = now;
      gestureEvents += 1;
      root.classList.add('is-free');
      settling = false;
      // Some mice report deltas in lines, not pixels — scale those up to feel right.
      const step = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      gestureDelta += step;
      glideTarget = clampScroll(glideTarget + step);
      requestGlide();
      window.clearTimeout(glideIdle);
      glideIdle = window.setTimeout(settleGesture, SETTLE_MS);
    },
    { passive: false },
  );

  if (status) status.setAttribute('aria-live', 'polite');
  syncActive();
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
  if (!tabs.length) return;

  const LIMIT = 20; // rows shown per filter before "Show all" reveals the rest
  let activeType = tabs[0].dataset.typeTab;
  let activeIndustry = 'all';
  let expanded = false;

  const matchesIndustry = (row) =>
    activeIndustry === 'all' || row.dataset.industry === activeIndustry;

  const apply = () => {
    let matched = 0;
    rows.forEach((row) => {
      const isMatch =
        row.dataset.assetType === activeType && matchesIndustry(row);
      if (isMatch) matched += 1;
      // Within a matching set, collapse rows past LIMIT until expanded.
      const show = isMatch && (expanded || matched <= LIMIT);
      row.toggleAttribute('hidden', !show);
    });
    // Each tab's count reflects the active industry filter; dim empty tabs.
    tabs.forEach((tab) => {
      const count = rows.filter(
        (r) =>
          r.dataset.assetType === tab.dataset.typeTab && matchesIndustry(r),
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
      moreBtn.hidden = matched <= LIMIT;
      moreBtn.textContent = expanded
        ? siteContent.archiveUi.showFewerLabel
        : siteContent.archiveUi.showAllLabel.replace(
            '{count}',
            String(matched),
          );
    }
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
    apply();
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
      expanded = !expanded;
      apply();
      // Collapsing from a long list: bring the archive back into view so the
      // user isn't stranded far down the page.
      if (!expanded) {
        root.scrollIntoView({
          block: 'start',
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
      }
    });
  }

  apply();
}

function initializeContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const fields = {
      name: form.elements.name,
      email: form.elements.email,
      message: form.elements.message,
    };

    Object.values(fields).forEach((field) =>
      field?.removeAttribute('aria-invalid'),
    );

    const missingFields = Object.entries(fields).filter(
      ([name, field]) =>
        !String(formData.get(name) || '').trim() && field?.required,
    );
    if (missingFields.length > 0) {
      missingFields.forEach(([, field]) =>
        field.setAttribute('aria-invalid', 'true'),
      );
      missingFields[0][1].focus();
      showNotification(siteContent.contactForm.messages.missingFields, 'error');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.get('email'))) {
      fields.email?.setAttribute('aria-invalid', 'true');
      fields.email?.focus();
      showNotification(siteContent.contactForm.messages.invalidEmail, 'error');
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;

    try {
      // The endpoint comes from siteContent.contactForm via the form markup.
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        showNotification(siteContent.contactForm.messages.success, 'success');
        form.reset();
        Object.values(fields).forEach((field) =>
          field?.removeAttribute('aria-invalid'),
        );
      } else {
        showNotification(
          siteContent.contactForm.messages.submitFailed,
          'error',
        );
        console.error('Web3Forms Error:', data);
      }
    } catch (error) {
      showNotification(siteContent.contactForm.messages.network, 'error');
      console.error('Form submission error:', error);
    } finally {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  });
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

function showNotification(message, type = 'info') {
  document.querySelectorAll('.c-notification').forEach((n) => n.remove());

  const notification = document.createElement('div');
  notification.className = `c-notification c-notification--${type}`;
  notification.setAttribute('role', type === 'error' ? 'alert' : 'status');
  notification.setAttribute(
    'aria-live',
    type === 'error' ? 'assertive' : 'polite',
  );
  notification.innerHTML = `<div class="c-notification__content"><span class="c-notification__message">${message}</span><button class="c-notification__close" aria-label="Close notification">&times;</button></div>`;

  document.body.appendChild(notification);

  // Use requestAnimationFrame to ensure the transition is applied correctly
  requestAnimationFrame(() => {
    notification.classList.add('is-visible');
  });

  const close = () => {
    notification.classList.remove('is-visible');
    notification.addEventListener(
      'transitionend',
      () => notification.remove(),
      { once: true },
    );
  };

  notification
    .querySelector('.c-notification__close')
    .addEventListener('click', close);
  setTimeout(close, config.notificationDuration);
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
    'Schedule a Discovery Call';
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
        column.setAttribute('aria-label', `Testimonials list ${index + 1}`);
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
      isPaused ? 'Resume testimonial animation' : 'Pause testimonial animation',
    );
  };

  setPaused(prefersReducedMotion);

  if (prefersReducedMotion) {
    control.disabled = true;
    control.setAttribute(
      'aria-label',
      'Testimonials paused because reduced motion is enabled',
    );
    return;
  }

  control.addEventListener('click', () => {
    setPaused(!scroller.classList.contains('is-paused'));
  });
}

function initializeLogoCarousel() {
  const logos = document.querySelectorAll('.c-logo-bar__bar .c-logo-bar__item');
  if (logos.length === 0) return;
  let currentIndex = 0;
  logos[currentIndex].classList.add('is-active');
  if (prefersReducedMotion) return;

  const advance = () => {
    logos.forEach((logo, index) =>
      logo.classList.toggle('is-active', index === currentIndex),
    );
    currentIndex = (currentIndex + 1) % logos.length;
  };

  // Only rotate while the bar is actually on screen.
  let intervalId = null;
  watchViewportPresence(
    logos[0].closest('.c-logo-bar') ?? logos[0],
    (isVisible) => {
      if (isVisible && intervalId === null) {
        intervalId = setInterval(advance, config.logoCarousel.interval);
      } else if (!isVisible && intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
  );
}

// Signal Pipeline (the About section): the capability nodes are an ARIA
// tablist, each controlling a detail panel below. Selecting a node (click or
// arrow/Home/End keys) activates its panel; roving tabindex keeps a single tab
// stop, per the WAI-ARIA tabs pattern.
function initializePipeline() {
  const root = document.querySelector('[data-pipeline]');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[data-pipeline-node]')];
  const panels = [...root.querySelectorAll('[data-pipeline-panel]')];
  if (!tabs.length || tabs.length !== panels.length) return;

  const activate = (index, { focus = true } = {}) => {
    const i = (index + tabs.length) % tabs.length;
    tabs.forEach((tab, n) => {
      const on = n === i;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
    });
    panels.forEach((panel, n) => {
      panel.hidden = n !== i;
    });
    if (focus) tabs[i].focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activate(i, { focus: false }));
    tab.addEventListener('keydown', (event) => {
      let next;
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          next = i + 1;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          next = i - 1;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = tabs.length - 1;
          break;
        default:
          return;
      }
      event.preventDefault();
      activate(next);
    });
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
