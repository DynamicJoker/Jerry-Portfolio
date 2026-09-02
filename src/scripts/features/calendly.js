import { siteContent } from '../../content.js';
import { config, prefersReducedMotion } from '../core/config.js';

let calendlyScriptPromise = null;

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

export function initializeCalendlyBookingPanel() {
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
