import { siteContent } from '../../content.js';
import { config, prefersReducedMotion } from '../core/config.js';

export function initializeContactForm() {
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
  }, config.announceClearMs);
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
