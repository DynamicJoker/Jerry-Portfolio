import { config, prefersReducedMotion } from '../core/config.js';
import { watchViewportPresence } from '../core/viewport.js';

// The skills distiller plays a ~3.3s staggered reveal (CSS, gated on
// .is-running), rests on its finished frame, then replays. The loop is driven
// from here rather than with an `infinite` iteration count because every
// element in that sequence carries its own animation-delay: infinite
// iterations would let each element restart on its own clock, and the stagger
// that makes the graphic legible would drift apart within a couple of cycles.
// Toggling one class keeps a single shared clock and makes the rest beat an
// explicit number. Between runs nothing animates at all — the graphic sits on
// its finished frame — so this is cheaper than the nine perpetual loops the
// old distiller ran.
export function initializeDistillerLoop() {
  const distiller = document.querySelector('.c-distiller');
  if (!distiller || prefersReducedMotion) return;

  let timer = null;
  let onScreen = false;

  const stop = () => {
    clearTimeout(timer);
    timer = null;
    distiller.classList.remove('is-running');
  };

  const play = () => {
    // Lite mode is probed after first paint, so re-check every cycle rather
    // than once at init; CSS already suppresses the animations there, this
    // just stops the timer churning for a graphic that will never move.
    if (document.documentElement.dataset.perf === 'lite') {
      stop();
      return;
    }
    // Removing the class, forcing a reflow, then re-adding it is what
    // restarts the CSS animations. Without the reflow the two class writes
    // coalesce into no change at all and the sequence never replays.
    distiller.classList.remove('is-running');
    void distiller.offsetWidth;
    distiller.classList.add('is-running');
    timer = setTimeout(() => {
      // Dropping the class rests on the finished frame (the static rules).
      distiller.classList.remove('is-running');
      timer = setTimeout(play, config.distiller.restMs);
    }, config.distiller.runMs);
  };

  watchViewportPresence(distiller, (isVisible) => {
    if (isVisible === onScreen) return;
    onScreen = isVisible;
    if (isVisible) play();
    else stop();
  });
}
