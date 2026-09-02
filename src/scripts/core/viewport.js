// IntersectionObserver helpers shared by the reveal animations and the
// long-lived motion loops.

// Fire once per element when its top edge crosses 85% of the viewport height
// (or immediately if the page loads already scrolled past it, e.g. a deep
// link — matching how a scroll-position check would behave).
export function revealOnEnterViewport(elements, onEnter) {
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

// Report whether an element is in the viewport, so long-lived animations
// (marquees, drifts, carousels) can stop burning GPU/battery while their
// section is scrolled out of view.
export function watchViewportPresence(element, onChange) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => onChange(entry.isIntersecting));
  });
  observer.observe(element);
}
