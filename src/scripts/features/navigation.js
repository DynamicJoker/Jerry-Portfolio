import { siteContent } from '../../content.js';
import { config } from '../core/config.js';
import { getBreakpointPx } from '../core/dom.js';
import { registerScrollFrameCallback } from '../core/scroll.js';

let navLinks = [];

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

export function initializeNavigation() {
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
        }, config.nav.resizeSettleMs);
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
        }, config.hero.resizeSettleMs);
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
      navLinkClickFallbackId = window.setTimeout(
        releaseNavLinkClickLock,
        config.nav.linkClickFallbackMs,
      );

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

export function updateActiveNavLink() {
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
    window.innerHeight + scrollY >=
    document.documentElement.scrollHeight - config.scroll.bottomTolerancePx;

  if (atBottom) {
    currentSectionId = sections[sections.length - 1].id;
  } else {
    // A section is active if its top has crossed the upper 30% of the viewport
    const threshold = window.innerHeight * config.scroll.activeSectionThreshold;

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

// Once the click-driven smooth-scroll lands, hand control back to the scroll-spy.
window.addEventListener('scrollend', releaseNavLinkClickLock, {
  passive: true,
});

// The scroll-spy used to be called directly at the top of updateUIOnScroll,
// ahead of the registered callbacks. Registering it at module scope — so
// before any initializer runs at DOMContentLoaded — keeps it first in the
// same order, without scroll.js having to know this module exists.
registerScrollFrameCallback(updateActiveNavLink);
