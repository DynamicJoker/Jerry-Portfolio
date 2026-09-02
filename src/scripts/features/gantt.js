import { getBreakpointPx } from '../core/dom.js';
import { revealOnEnterViewport } from '../core/viewport.js';

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

export function enhanceGanttRows() {
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
