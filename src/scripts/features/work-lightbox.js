export function initializeWorkLightbox() {
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
