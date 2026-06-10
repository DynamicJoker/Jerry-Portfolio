// Jerry James Portfolio - Interactive JavaScript

// --- ES Module Imports ---
import { siteContent } from './content.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const config = {
  loadingScreenDuration: 2000,
  loadingScreenFadeOut: 500,
  notificationDuration: 5000,
  breakpoints: {
    md: { cssVar: '--breakpoint-md', fallbackRem: 48 },
    lg: { cssVar: '--breakpoint-lg', fallbackRem: 64 },
  },
  navbar: {
    scrollThreshold: 10, // Scroll threshold to change navbar style
  },
  testimonials: {
    scrollSpeedMin: 80, // seconds
    scrollSpeedMax: 120, // seconds
  },
  logoCarousel: {
    interval: 3000, // milliseconds
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

// --- Consolidated Scroll Handler for Performance ---
let lastKnownScrollPosition = 0;
let ticking = false;

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
  const heroBackground = document.querySelector('.hero-background');

  // Navbar scrolled state
  if (navbar) {
    navbar.classList.toggle(
      'scrolled',
      scrollY > config.navbar.scrollThreshold,
    );
  }

  // Active nav link + underline glow
  updateActiveNavLink();
  updateNavGlow();

  // Hero parallax
  if (heroBackground) {
    heroBackground.style.transform = `translateY(${scrollY * -0.5}px)`;
  }
}

window.addEventListener('scroll', handleScroll, { passive: true });
// Once the click-driven smooth-scroll lands, hand control back to the scroll-spy.
window.addEventListener('scrollend', releaseNavLinkClickLock, {
  passive: true,
});
window.addEventListener('load', () => ScrollTrigger.refresh());

// Recompute scroll-derived UI on resize. The active-nav-link underline is
// positioned with pixel values from getBoundingClientRect() (see updateNavGlow),
// so it must be re-measured when the layout reflows — otherwise it lags/mispositions.
let resizeRaf = 0;
let resizeSettle = 0;
window.addEventListener(
  'resize',
  () => {
    if (!resizeRaf) {
      resizeRaf = window.requestAnimationFrame(() => {
        resizeRaf = 0;
        updateUIOnScroll(window.pageYOffset);
      });
    }
    clearTimeout(resizeSettle);
    resizeSettle = window.setTimeout(() => ScrollTrigger.refresh(), 200);
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
  initializeBrandCollapse();
  initializePortfolioFilters();
  initializeContactForm();
  initializeContactInfo();
  updateYearsExperience();
  updateFooterYear();
  initializeLogoCarousel();
  initializeExpandableHighlights();
  console.log('Jerry James Portfolio initialized.');
});

function initializeContactInfo() {
  if (!siteContent.contactInfo) return;

  const emailEl = document.getElementById('contact-email');
  if (emailEl && siteContent.contactInfo.email) {
    const revealButton = document.createElement('button');
    revealButton.type = 'button';
    revealButton.className = 'contact-reveal-button';
    revealButton.setAttribute('aria-label', 'Reveal email address');
    revealButton.title = 'Reveal email address';

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

// Loading Screen Animation
function initializeLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  setTimeout(() => {
    loadingScreen.style.opacity = '0';
    loadingScreen.style.transition = `opacity ${config.loadingScreenFadeOut}ms ease`;

    setTimeout(() => loadingScreen.remove(), config.loadingScreenFadeOut);
  }, config.loadingScreenDuration);
}

// Navigation functionality
function initializeNavigation() {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');
  navLinks = document.querySelectorAll('.nav-link');
  const navbar = document.getElementById('navbar');
  const controls = [hamburger].filter(Boolean);
  const navMenuQuery = window.matchMedia('(max-width: 64rem)');
  const setNavOpen = (isOpen) => {
    if (!hamburger || !navMenu) return;

    hamburger.classList.toggle('active', isOpen);
    navMenu.classList.toggle('active', isOpen);
    updateNavControls(isOpen, controls);
  };
  const isNavOpen = () => Boolean(navMenu?.classList.contains('active'));
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
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.forEach((navLink) => {
        navLink.classList.remove('active');
        navLink.removeAttribute('aria-current');
      });
      link.classList.add('active');
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
      'scrolled',
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

  // 1. Get all navigable sections
  const sections = Array.from(document.querySelectorAll('section[id]')).filter(
    (section) => {
      return document.querySelector(`.nav-link[href="#${section.id}"]`);
    },
  );

  if (sections.length === 0) return;

  // 2. Check if at the very bottom
  const atBottom =
    window.innerHeight + scrollY >= document.documentElement.scrollHeight - 20;

  if (atBottom) {
    currentSectionId = sections[sections.length - 1].id;
  } else {
    // 3. Find active section based on top-most candidate
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

  // 4. Update nav links
  let activeLink = null;
  navLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === `#${currentSectionId}`;
    link.classList.toggle('active', isActive);
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
    link.classList.contains('active'),
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

function initializeScrollAnimations() {
  document.querySelectorAll('.section').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 85%',
      once: true,
      onEnter: () => section.classList.add('visible'),
    });
  });
}

// Collapse the brand to the J monogram while the hero name is visible;
// expand to the full logo once the name scrolls under the navbar.
function initializeBrandCollapse() {
  const navbar = document.getElementById('navbar');
  const heroName = document.querySelector('.hero-name');
  if (!navbar || !heroName) return;

  ScrollTrigger.create({
    trigger: heroName,
    start: () => `bottom top+=${navbar.offsetHeight}`,
    onEnter: () => navbar.classList.add('brand-expanded'),
    onLeaveBack: () => navbar.classList.remove('brand-expanded'),
  });
}

function initializePortfolioFilters() {
  const filterContainer = document.querySelector('.portfolio-filters');
  const portfolioItems = document.querySelectorAll('.portfolio-item');

  if (!filterContainer) return;

  const filterButtons = filterContainer.querySelectorAll('.filter-btn');
  filterButtons.forEach((button) => {
    button.setAttribute(
      'aria-pressed',
      String(button.classList.contains('active')),
    );
  });

  filterContainer.addEventListener('click', (event) => {
    // Find the button that was actually clicked, even if the user clicks an inner element
    const clickedButton = event.target.closest('.filter-btn');

    if (!clickedButton) return;

    const filter = clickedButton.dataset.filter;

    filterButtons.forEach((btn) => {
      const isActive = btn === clickedButton;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    portfolioItems.forEach((item) => {
      const isVisible = filter === 'all' || item.dataset.category === filter;
      item.classList.toggle('hidden', !isVisible);
      item.toggleAttribute('hidden', !isVisible);
      item.setAttribute('aria-hidden', String(!isVisible));
      item.inert = !isVisible;
      if (isVisible) {
        item.style.opacity = '1';
        item.style.transform = 'scale(1)';
      } else {
        item.style.opacity = '';
        item.style.transform = '';
      }
    });
  });
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
      showNotification('Please fill in all required fields.', 'error');
      return;
    }

    // Basic email sanity check regex
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.get('email'))) {
      fields.email?.setAttribute('aria-invalid', 'true');
      fields.email?.focus();
      showNotification('Please enter a valid email address.', 'error');
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
        showNotification(
          "Message sent successfully! I'll get back to you soon.",
          'success',
        );
        form.reset();
        Object.values(fields).forEach((field) =>
          field?.removeAttribute('aria-invalid'),
        );
      } else {
        showNotification('Something went wrong. Please try again.', 'error');
        console.error('Web3Forms Error:', data);
      }
    } catch (error) {
      showNotification('Network error. Please try again later.', 'error');
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
  document.querySelectorAll('.notification').forEach((n) => n.remove());

  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.setAttribute('role', type === 'error' ? 'alert' : 'status');
  notification.setAttribute(
    'aria-live',
    type === 'error' ? 'assertive' : 'polite',
  );
  notification.innerHTML = `<div class="notification-content"><span class="notification-message">${message}</span><button class="notification-close" aria-label="Close notification">&times;</button></div>`;

  document.body.appendChild(notification);

  // Use requestAnimationFrame to ensure the transition is applied correctly
  requestAnimationFrame(() => {
    notification.classList.add('visible');
  });

  const close = () => {
    notification.classList.remove('visible');
    // Wait for the animation to finish before removing the element
    notification.addEventListener(
      'transitionend',
      () => notification.remove(),
      { once: true },
    );
  };

  notification
    .querySelector('.notification-close')
    .addEventListener('click', close);
  setTimeout(close, config.notificationDuration);
}

function buildCalendlyUrl(cta) {
  const url = new URL(cta.url, window.location.href);
  const theme = cta.theme || {};
  const params = {
    background_color: theme.backgroundColor,
    text_color: theme.textColor,
    primary_color: theme.primaryColor,
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
  const panel = booking.querySelector('.calendly-panel');
  const loading = booking.querySelector('[data-calendly-loading]');
  const container = booking.querySelector('[data-calendly-container]');
  const bookedMessage = booking.querySelector('[data-calendly-booked]');
  if (!trigger || !panel || !loading || !container || !bookedMessage) return;

  let isOpen = false;
  let hasInitializedCalendly = false;
  let iframeObserver = null;
  const openLabel =
    cta.buttonLabel ||
    trigger.getAttribute('aria-label') ||
    'Schedule a Discovery Call';
  const closeLabel = cta.closeLabel || 'Close scheduler';

  const updateTriggerState = (open) => {
    trigger.setAttribute('aria-expanded', String(open));
    trigger.setAttribute('aria-label', open ? closeLabel : openLabel);
    trigger.classList.toggle('is-close-state', open);
  };

  const setLoaded = (loaded) => {
    panel.classList.toggle('is-loaded', loaded);
    loading.hidden = loaded;
  };

  const clearCalendlyEmbed = () => {
    if (iframeObserver) {
      iframeObserver.disconnect();
      iframeObserver = null;
    }
    container.innerHTML = '';
    setLoaded(false);
    hasInitializedCalendly = false;
  };

  const initializeCalendly = async () => {
    if (hasInitializedCalendly) return;
    hasInitializedCalendly = true;
    setLoaded(false);

    iframeObserver = new MutationObserver(() => {
      if (container.querySelector('iframe')) {
        setLoaded(true);
        iframeObserver.disconnect();
        iframeObserver = null;
      }
    });
    iframeObserver.observe(container, { childList: true, subtree: true });

    try {
      const Calendly = await loadCalendlyScript();
      Calendly.initInlineWidget({
        url: buildCalendlyUrl(cta),
        parentElement: container,
      });
    } catch (error) {
      hasInitializedCalendly = false;
      if (iframeObserver) {
        iframeObserver.disconnect();
        iframeObserver = null;
      }
      loading.hidden = false;
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
    if (event.data.event === 'calendly.event_scheduled') {
      bookedMessage.hidden = false;
      panel.classList.add('is-booked');
    }
  });

  booking.dataset.calendlyEnhanced = 'true';
}

function initializeInfiniteScroller() {
  document
    .querySelectorAll('.testimonials-scroller-column')
    .forEach((scroller) => {
      const scrollerInner = scroller.querySelector(
        '.testimonials-scroller-inner',
      );
      if (!scrollerInner) return;
      if (scrollerInner.dataset.scrollerEnhanced === 'true') return;

      const scrollerContent = Array.from(scrollerInner.children);
      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        duplicatedItem.setAttribute('aria-hidden', true);
        scrollerInner.appendChild(duplicatedItem);
      });
      const durationRange =
        config.testimonials.scrollSpeedMax - config.testimonials.scrollSpeedMin;
      const randomDuration =
        Math.floor(Math.random() * durationRange) +
        config.testimonials.scrollSpeedMin;
      scrollerInner.style.setProperty(
        '--scroll-duration',
        `${randomDuration}s`,
      );
      scrollerInner.dataset.scrollerEnhanced = 'true';
    });
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
  const logos = document.querySelectorAll('.logo-bar .logo-item');
  if (logos.length === 0) return;
  let currentIndex = 0;
  logos[currentIndex].classList.add('active');
  if (prefersReducedMotion) return;

  setInterval(() => {
    logos.forEach((logo, index) =>
      logo.classList.toggle('active', index === currentIndex),
    );
    currentIndex = (currentIndex + 1) % logos.length;
  }, config.logoCarousel.interval);
}

function initializeExpandableHighlights() {
  const container = document.querySelector('.about-highlights');
  if (!container) return;
  const items = container.querySelectorAll('.highlight-item');

  items.forEach((item) => {
    item.setAttribute('role', 'button');
    item.setAttribute('aria-expanded', 'false');
  });

  const setExpanded = (item, isExpanded) => {
    item.classList.toggle('expanded', isExpanded);
    item.setAttribute('aria-expanded', String(isExpanded));
  };

  const handleInteraction = (event) => {
    const highlightItem = event.target.closest('.highlight-item');
    if (!highlightItem) return;

    // Ensure only Enter or Space keys trigger the action
    if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) {
      return;
    }

    event.preventDefault();

    const currentlyExpanded = container.querySelector('.expanded');

    // Close any other item that might already be open
    if (currentlyExpanded && currentlyExpanded !== highlightItem) {
      setExpanded(currentlyExpanded, false);
    }

    setExpanded(highlightItem, !highlightItem.classList.contains('expanded'));
  };

  container.addEventListener('click', handleInteraction);
  container.addEventListener('keydown', handleInteraction);

  // Add a listener to the document to handle clicks outside the component
  document.addEventListener('click', (event) => {
    // Ignore clicks within the component itself; the container's listener handles those.
    if (container.contains(event.target)) {
      return;
    }

    const currentlyExpanded = container.querySelector('.expanded');
    if (currentlyExpanded) {
      setExpanded(currentlyExpanded, false);
    }
  });
}

function setGanttAreaExpanded(barArea, isExpanded) {
  barArea.classList.toggle('active', isExpanded);
  barArea.setAttribute('aria-expanded', String(isExpanded));
}

function closeGanttDetails(container, exceptArea = null) {
  container.querySelectorAll('.gantt-bar-area.active').forEach((activeArea) => {
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
    container.dataset.ganttOutsideListener = 'true';
  }

  const rows = Array.from(container.querySelectorAll('.gantt-row'));
  rows.forEach((row) => {
    const barArea = row.querySelector('.gantt-bar-area');
    if (!barArea) return;

    if (barArea.dataset.ganttEnhanced === 'true') return;

    barArea.addEventListener('click', () => {
      const isActive = barArea.classList.contains('active');
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
  ScrollTrigger.create({
    trigger: container,
    start: 'top 85%',
    once: true,
    onEnter: () => container.classList.add('visible'),
  });
}
