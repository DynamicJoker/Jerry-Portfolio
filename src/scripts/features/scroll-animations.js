import { revealOnEnterViewport } from '../core/viewport.js';

export function initializeScrollAnimations() {
  revealOnEnterViewport(document.querySelectorAll('.c-section'), (section) =>
    section.classList.add('is-visible'),
  );
}
