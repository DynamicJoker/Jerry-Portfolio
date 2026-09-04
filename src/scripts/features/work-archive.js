import { siteContent } from '../../content.js';
import { config, prefersReducedMotion } from '../core/config.js';
import { getBreakpointPx } from '../core/dom.js';

export function initializeWorkArchive() {
  const root = document.querySelector('[data-archive]');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[data-type-tab]')];
  const chips = [...root.querySelectorAll('[data-industry-filter]')];
  const rows = [...root.querySelectorAll('[data-archive-row]')];
  // Two of these: the head's (desktop) and the rail's (phones). Only one is
  // ever displayed, so only one ever announces — but both must carry the count,
  // because which one is visible depends purely on the breakpoint.
  const statusEls = [...root.querySelectorAll('[data-archive-status]')];
  const emptyEl = root.querySelector('[data-archive-empty]');
  const moreBtn = root.querySelector('[data-archive-more]');
  const listEl = root.querySelector('[data-archive-list]');
  const frameEl = root.querySelector('[data-archive-frame]');
  const gaugeEl = root.querySelector('[data-archive-gauge]');
  const gaugeCountEl = root.querySelector('[data-archive-gauge-count]');
  const resetBtn = root.querySelector('[data-archive-reset]');
  if (!tabs.length) return;

  const SAMPLE_PER_TYPE = siteContent.archiveUi.samplePerType; // rows shown per type in the "All" view before "see more"
  // The first tab is "All" (data-type-tab="all"), so both filters default to All.
  let activeType = tabs[0].dataset.typeTab;
  let activeIndustry = 'all';
  let expanded = false;

  const matchesIndustry = (row) =>
    activeIndustry === 'all' || row.dataset.industry === activeIndustry;

  const matchesFilters = (row) =>
    (activeType === 'all' || row.dataset.assetType === activeType) &&
    matchesIndustry(row);

  // The DOM starts in canonical (sorted) order, and `rows` keeps that order for
  // good — every sampling decision below iterates it, so which rows the
  // collapsed view picks never depends on how the DOM is currently arranged.
  // Expanding re-parks the newly revealed rows below the ones already on screen
  // (see the more-button handler); this puts the sorted order back whenever the
  // list collapses or refilters.
  const canonicalOrder = rows.slice();
  let reordered = false;

  // The list is only a scroll frame on wide screens — under 48rem the CSS drops
  // the height cap and it flows in the page (see components/work.css). Reading
  // the computed overflow keeps this in step with that rule instead of
  // duplicating the breakpoint here.
  const isFramed = () => {
    if (!listEl) return false;
    const overflow = getComputedStyle(listEl).overflowY;
    return overflow === 'auto' || overflow === 'scroll';
  };

  // Phones only. Deliberately NOT the computed-style probe isFramed uses: the
  // archive's CSS is in the deferred stylesheet, so at DOMContentLoaded the
  // rail is still an unstyled `display: block` div — the probe read "compact"
  // on desktop and expanded all 251 rows. getBreakpointPx reads the
  // --breakpoint-md token and falls back to 48rem, so it is right either way.
  // (isFramed keeps its probe: since the mobile frame landed both sizes are
  // framed, and its only consumers are cosmetic.)
  const isCompact = () => window.innerWidth <= getBreakpointPx('md');

  const distanceToBottom = () =>
    listEl ? listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight : 0;

  // Toggles the frame's bottom fade. Also the answer to "nothing visibly
  // happened": expanding while parked at the bottom reveals rows off-frame, and
  // the fade appearing is what says the list now continues past its edge.
  const updateScrollAffordance = () => {
    if (!frameEl) return;
    frameEl.classList.toggle(
      'has-more-below',
      isFramed() && distanceToBottom() > 2,
    );
  };

  // Scrolls the frame so `row` sits at its top edge (less the list's own top
  // padding, so the row isn't flush against the lip). Measured from live rects
  // rather than offsetTop, which would be relative to whichever ancestor
  // happens to be positioned.
  const scrollRowToFrameTop = (row) => {
    if (!listEl || !row) return;
    const delta =
      row.getBoundingClientRect().top - listEl.getBoundingClientRect().top;
    listEl.scrollTo({
      top: Math.max(0, listEl.scrollTop + delta - 8),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  // Scrolls the PAGE so the frame's top sits just beneath the pinned controls.
  // scrollRowToFrameTop aligns a row to the frame's own top edge — but when the
  // reader has scrolled the page down into the archive, that edge is behind the
  // sticky controls, so the row we just jumped to lands hidden under the
  // filters. This lifts the frame out from under them; paired with the in-frame
  // jump, the target row becomes the first thing visible below the controls.
  // The two scrolls are independent containers, so they animate together
  // without fighting. Centering the frame instead would push its top back up
  // behind the controls (it is taller than the space beneath them), which is
  // exactly the occlusion we are removing.
  const revealFrameBelowControls = () => {
    if (!frameEl) return;
    const controls = root.querySelector('.c-archive__controls');
    const stickyTop = controls
      ? Number.parseFloat(getComputedStyle(controls).top) || 0
      : 0;
    const controlsHeight = controls
      ? controls.getBoundingClientRect().height
      : 0;
    const frameTopAbsolute =
      window.scrollY + frameEl.getBoundingClientRect().top;
    window.scrollTo({
      top: Math.max(0, frameTopAbsolute - stickyTop - controlsHeight),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  // Arrival flash. Capped at roughly one frame's worth of rows: the frame
  // scrolls so the first arrival sits at its top, so these are the ones the
  // reader actually sees land. Marking all ~227 meant that many simultaneous
  // animations, which is what made the flash judder — and the rows past the
  // first screenful would have finished long before anyone scrolled to them.
  let arrivalTimer = 0;
  const clearArrivals = () => {
    rows.forEach((row) => {
      if (!row.classList.contains('is-new')) return;
      row.classList.remove('is-new');
      row.style.removeProperty('--arrive-i');
    });
  };

  const markArrivals = (arrivals) => {
    clearArrivals();
    window.clearTimeout(arrivalTimer);
    if (!arrivals.length) return;
    arrivals.slice(0, config.workArchive.flashRows).forEach((row, index) => {
      row.style.setProperty('--arrive-i', String(index));
      row.classList.add('is-new');
    });
    // Drop the class once the animation is spent so a later expand can re-run it.
    arrivalTimer = window.setTimeout(
      clearArrivals,
      config.workArchive.arrivalClearMs,
    );
  };

  // Row tops in the list's own scroll coordinates, cached once per apply.
  // Measured from live rects rather than offsetTop for the same reason
  // scrollRowToFrameTop does: offsetTop is relative to whichever ancestor
  // happens to be positioned. Rows are not a uniform height — titles wrap — so
  // these have to be read, not assumed.
  let rowTops = [];
  const measureRows = () => {
    if (!listEl || !isCompact()) {
      rowTops = [];
      return;
    }
    const base = listEl.getBoundingClientRect().top - listEl.scrollTop;
    rowTops = rows
      .filter((row) => !row.hidden)
      .map((row) => row.getBoundingClientRect().top - base);
  };

  const isDirty = () =>
    activeType !== tabs[0].dataset.typeTab ||
    activeIndustry !== 'all' ||
    (!!listEl && listEl.scrollTop > 0);

  // How far the reader has actually travelled: the last row to reach the
  // frame's bottom edge, binary-searched so this stays cheap at 251 rows on
  // every scroll frame. Derived from scrollTop each time — never incremented —
  // so scrolling back up empties it exactly as it filled.
  // Count of rows whose cached top sits strictly above `edge`. rowTops is
  // ascending, so this is a binary search — cheap enough to run twice on every
  // scroll frame at 251 rows.
  const rowsAbove = (edge) => {
    let lo = 0;
    let hi = rowTops.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (rowTops[mid] < edge) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };

  const updateGauge = () => {
    if (!gaugeEl || !listEl) return;
    if (resetBtn) resetBtn.hidden = !isDirty();
    const matched = rowTops.length;

    // The NUMBER is the RANGE of items in the frame: the row touching the top
    // edge through the last row to reach the bottom edge, of the matched count.
    // A list-pager reading — "47–53 of 251" — that says where you are and
    // updates as you scroll. It reads correctly at both ends: "1–6" at the top,
    // "…–251 of 251" at the bottom. Collapses to a single number when one item
    // spans the whole frame, and for the empty state.
    const top = listEl.scrollTop;
    const first = matched ? Math.max(1, rowsAbove(top)) : 0;
    const last = matched
      ? Math.max(first, rowsAbove(top + listEl.clientHeight))
      : 0;
    if (gaugeCountEl) {
      const ui = siteContent.archiveUi;
      gaugeCountEl.textContent =
        first === last
          ? ui.gaugeStatus
              .replace('{shown}', String(first))
              .replace('{total}', String(matched))
          : ui.gaugeRange
              .replace('{first}', String(first))
              .replace('{last}', String(last))
              .replace('{total}', String(matched));
    }

    // The BAR is true scroll position — empty at the top, full at the bottom —
    // derived from scrollTop each frame, never incremented, so it empties as
    // truthfully as it fills. Hidden (not just zero-width) at the very top so
    // its raised shadow doesn't sit in the well as a smudge.
    const maxScroll = listEl.scrollHeight - listEl.clientHeight;
    const fraction = maxScroll > 0 ? Math.min(1, top / maxScroll) : 0;
    gaugeEl.style.setProperty(
      '--archive-progress',
      `${(fraction * 100).toFixed(2)}%`,
    );
    gaugeEl.style.setProperty(
      '--archive-progress-shown',
      fraction > 0 ? '1' : '0',
    );
  };

  const restoreOrder = () => {
    if (!reordered || !listEl) return;
    const frag = document.createDocumentFragment();
    canonicalOrder.forEach((row) => frag.appendChild(row));
    listEl.appendChild(frag);
    reordered = false;
  };

  const apply = () => {
    let matched = 0; // rows matching the active type + industry
    let collapsedShown = 0; // how many WOULD show in the capped (collapsed) view
    // In the All view the cap is per type (a few from each); for a single
    // selected type it is a flat limit. Rows are pre-sorted type → industry →
    // newest, so "first N" reads as the newest few of each type.
    const perTypeShown = {};
    // Phones have no expand/collapse: the frame is a fixed window, so showing
    // everything costs no page height and there is nothing for a "see more" to
    // reveal. Desktop keeps the capped view and its button.
    const compact = isCompact();
    const showAll = expanded || compact;
    rows.forEach((row) => {
      const typeMatch =
        activeType === 'all' || row.dataset.assetType === activeType;
      const isMatch = typeMatch && matchesIndustry(row);
      if (!isMatch) {
        row.toggleAttribute('hidden', true);
        return;
      }
      matched += 1;
      let inCollapsed;
      if (activeType === 'all') {
        const t = row.dataset.assetType;
        const n = perTypeShown[t] || 0;
        inCollapsed = n < SAMPLE_PER_TYPE;
        if (inCollapsed) perTypeShown[t] = n + 1;
      } else {
        inCollapsed = matched <= config.workArchive.limit;
      }
      if (inCollapsed) collapsedShown += 1;
      row.toggleAttribute('hidden', !(showAll || inCollapsed));
    });
    // Each tab's count reflects the active industry filter (the All tab counts
    // every type); dim empty tabs.
    tabs.forEach((tab) => {
      const type = tab.dataset.typeTab;
      const count = rows.filter(
        (r) =>
          (type === 'all' || r.dataset.assetType === type) &&
          matchesIndustry(r),
      ).length;
      const countEl = tab.querySelector('[data-tab-count]');
      if (countEl) countEl.textContent = String(count);
      tab.classList.toggle('is-empty', count === 0);
    });
    if (emptyEl) emptyEl.toggleAttribute('hidden', matched !== 0);
    const countText = siteContent.archiveUi.countStatus
      .replace('{shown}', String(matched))
      .replace('{total}', String(rows.length));
    statusEls.forEach((el) => {
      el.textContent = countText;
    });
    if (moreBtn) {
      moreBtn.hidden = compact || matched <= collapsedShown;
      moreBtn.textContent = expanded
        ? siteContent.archiveUi.showFewerLabel
        : siteContent.archiveUi.showAllLabel.replace(
            '{count}',
            String(matched),
          );
    }
    updateScrollAffordance();
    measureRows();
    updateGauge();
  };

  const mark = (items, chosen) => {
    items.forEach((item) => {
      const on = item === chosen;
      item.classList.toggle('is-active', on);
      item.setAttribute('aria-pressed', String(on));
    });
  };

  const select = (items, chosen, attr, value) => {
    mark(items, chosen);
    if (attr === 'type') activeType = value;
    else activeIndustry = value;
    expanded = false; // collapse back to the capped view on any filter change
    clearArrivals();
    restoreOrder();
    // Land at the top of the freshly filtered set BEFORE apply() runs, because
    // apply() measures the gauge — measuring first and resetting after left the
    // fill bar inheriting the pre-filter scroll position (filter while scrolled
    // deep, and the bar showed full over the new short list).
    if (listEl) listEl.scrollTop = 0;
    apply();
  };

  // Phone-only filter disclosure. The markup ships the panel open and this
  // button hidden, so with no JS the filters stay visible exactly as they are
  // today; taking over means reversing both. Removing `is-open` is a no-op on
  // desktop — only the mobile block reads it — so this needs no breakpoint test.
  const filtersBtn = root.querySelector('[data-archive-filters]');
  const panelEl = root.querySelector('[data-archive-panel]');
  if (filtersBtn && panelEl) {
    const setPanel = (open) => {
      panelEl.classList.toggle('is-open', open);
      filtersBtn.setAttribute('aria-expanded', String(open));
    };
    filtersBtn.hidden = false;
    setPanel(false);
    filtersBtn.addEventListener('click', () =>
      setPanel(!panelEl.classList.contains('is-open')),
    );
  }

  // Reset: both axes back to All, list back to the top, panel closed. It
  // replaces "show fewer" on phones, where there is no collapsed state left to
  // return to — everything matched is already shown, so the only thing worth
  // undoing is the filtering and the travel.
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      mark(tabs, tabs[0]);
      mark(chips, chips[0]);
      activeType = tabs[0].dataset.typeTab;
      activeIndustry = 'all';
      expanded = false;
      clearArrivals();
      restoreOrder();
      apply();
      if (listEl) listEl.scrollTop = 0;
      updateGauge();
      statusEls.forEach((el) => {
        el.textContent = siteContent.archiveUi.resetAnnouncement.replace(
          '{total}',
          String(rows.length),
        );
      });
    });
  }

  tabs.forEach((tab) =>
    tab.addEventListener('click', () =>
      select(tabs, tab, 'type', tab.dataset.typeTab),
    ),
  );
  chips.forEach((chip) =>
    chip.addEventListener('click', () =>
      select(chips, chip, 'industry', chip.dataset.industryFilter),
    ),
  );
  if (moreBtn) {
    moreBtn.addEventListener('click', () => {
      if (expanded) {
        // Collapsing keeps the reader where they were rather than snapping to
        // the top. Captured BEFORE restoreOrder(), which briefly empties the
        // list and so zeroes scrollTop. Clamping to the collapsed list's new
        // maximum does both halves of the job: a position that still exists is
        // kept, and one that only existed while expanded lands on the last row
        // of the filter instead of scrolling past the end.
        const previousTop = listEl ? listEl.scrollTop : 0;
        const framed = isFramed();
        expanded = false;
        clearArrivals();
        restoreOrder();
        apply();
        if (listEl && framed) {
          const maxTop = Math.max(0, listEl.scrollHeight - listEl.clientHeight);
          listEl.scrollTop = Math.min(previousTop, maxTop);
          updateScrollAffordance();
        } else {
          // Unframed (mobile): the list flows in the page, so collapsing it
          // shortens the document and would otherwise strand the reader far
          // below the archive.
          if (listEl) listEl.scrollTop = 0;
          root.scrollIntoView({
            block: 'start',
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
          });
        }
        return;
      }
      // Expanding: rows already on screen keep their place and the ones being
      // revealed are parked below them. Without this they insert themselves
      // BETWEEN rows the reader has already scrolled past, so the part of the
      // list behind them reshuffles. The move happens while those rows are
      // still [hidden] (zero height), so nothing shifts visually.
      const arrivals = [];
      if (listEl) {
        const onScreen = new Set(
          rows.filter((row) => !row.hasAttribute('hidden')),
        );
        const frag = document.createDocumentFragment();
        canonicalOrder.forEach((row) => {
          if (!onScreen.has(row) && matchesFilters(row)) {
            arrivals.push(row);
            frag.appendChild(row);
          }
        });
        listEl.appendChild(frag);
        reordered = true;
      }
      expanded = true;
      apply();
      // Announce the arrivals. Appending alone is invisible from the bottom of
      // the frame — the new rows land off-frame and only the scrollbar reacts —
      // so the frame travels to where they start and they light up briefly on
      // the way in. The tint is held through the animation's delay (`backwards`
      // in the CSS), so the rows are already marked when the scroll lands and
      // then fade, rather than flashing at a viewport nobody is looking at.
      markArrivals(arrivals);
      if (arrivals.length && isFramed()) {
        scrollRowToFrameTop(arrivals[0]);
        revealFrameBelowControls();
      }
    });
  }

  if (listEl) {
    // One rAF-batched fill-bar update per scroll frame (updateGauge only moves
    // the bar here — the number is filter-driven). The affordance stays
    // unbatched — it was already cheap and already correct.
    let gaugeTick = false;
    listEl.addEventListener(
      'scroll',
      () => {
        updateScrollAffordance();
        if (gaugeTick) return;
        gaugeTick = true;
        requestAnimationFrame(() => {
          updateGauge();
          gaugeTick = false;
        });
      },
      { passive: true },
    );
  }

  // Crossing 48rem flips whether every matched row is shown, so the rows have
  // to be re-applied — but only on the crossing, never on every resize event:
  // apply() walks all 251 rows and measureRows() reads 251 rects. Within a
  // size, a debounced re-measure is enough, because row heights change with
  // width as titles rewrap.
  let wasCompact = isCompact();
  let measureTimer = 0;
  window.addEventListener(
    'resize',
    () => {
      updateScrollAffordance();
      const compact = isCompact();
      if (compact !== wasCompact) {
        wasCompact = compact;
        apply();
        return;
      }
      window.clearTimeout(measureTimer);
      measureTimer = window.setTimeout(() => {
        measureRows();
        updateGauge();
      }, config.workArchive.remeasureMs);
    },
    { passive: true },
  );

  apply();
}
