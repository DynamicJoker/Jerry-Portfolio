import { siteContent } from '../../content.js';
import { config, prefersReducedMotion } from '../core/config.js';

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
      row.toggleAttribute('hidden', !(expanded || inCollapsed));
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
      moreBtn.hidden = matched <= collapsedShown;
      moreBtn.textContent = expanded
        ? siteContent.archiveUi.showFewerLabel
        : siteContent.archiveUi.showAllLabel.replace(
            '{count}',
            String(matched),
          );
    }
    updateScrollAffordance();
  };

  const select = (items, chosen, attr, value) => {
    items.forEach((item) => {
      const on = item === chosen;
      item.classList.toggle('is-active', on);
      item.setAttribute('aria-pressed', String(on));
    });
    if (attr === 'type') activeType = value;
    else activeIndustry = value;
    expanded = false; // collapse back to the capped view on any filter change
    clearArrivals();
    restoreOrder();
    apply();
    // Land at the top of the freshly filtered set inside the scroll frame.
    if (listEl) listEl.scrollTop = 0;
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
      if (arrivals.length && isFramed()) scrollRowToFrameTop(arrivals[0]);
    });
  }

  if (listEl) {
    listEl.addEventListener('scroll', updateScrollAffordance, {
      passive: true,
    });
  }
  window.addEventListener('resize', updateScrollAffordance, { passive: true });

  apply();
}
