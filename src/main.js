// Home-page bootstrap. This file only wires features together: every behaviour
// lives in its own module under scripts/features, over the shared cores in
// scripts/core (config, dom, scroll, viewport).
//
// Only the home page loads this (src/pages/index.astro). SiteNav.astro carries
// a small inline copy of the nav toggle logic for the blog and 404 pages —
// keep them in sync when changing nav behaviour.
import { initializeLoadingScreen } from './scripts/features/loading-screen.js';
import { initializeCalendlyBookingPanel } from './scripts/features/calendly.js';
import { initializeNavigation } from './scripts/features/navigation.js';
import { initializeInfiniteScroller } from './scripts/features/infinite-scroller.js';
import { initializeTestimonialPauseControl } from './scripts/features/testimonials.js';
import { enhanceGanttRows } from './scripts/features/gantt.js';
import { initializeScrollAnimations } from './scripts/features/scroll-animations.js';
import { initializeDistillerLoop } from './scripts/features/distiller.js';
import { initializeDockedSectionHeaders } from './scripts/features/docked-headers.js';
import { initializeBrandCollapse } from './scripts/features/brand-collapse.js';
import { initializeWorkLightbox } from './scripts/features/work-lightbox.js';
import { initializeFeaturedCarousel } from './scripts/features/featured-carousel.js';
import { initializeWorkArchive } from './scripts/features/work-archive.js';
import { initializeContactForm } from './scripts/features/contact-form.js';
import { initializeContactInfo } from './scripts/features/contact-info.js';
import { initializePointerSpotlight } from './scripts/features/pointer-spotlight.js';
import {
  updateYearsExperience,
  updateFooterYear,
} from './scripts/features/dates.js';
import { initializeHashLanding } from './scripts/features/hash-landing.js';

// Call order is load-bearing — see the note above initializeHashLanding.
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
