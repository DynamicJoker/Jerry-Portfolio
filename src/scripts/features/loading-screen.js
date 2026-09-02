import { config } from '../core/config.js';

export function initializeLoadingScreen() {
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
