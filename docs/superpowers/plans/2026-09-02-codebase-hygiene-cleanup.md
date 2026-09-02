# Codebase Hygiene Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove content-separation, hardcoded-value, file-size, comment, and responsive drift from the Astro portfolio without changing a single rendered pixel until the two explicitly pixel-risky phases at the end.

**Architecture:** Phases are ordered by CSS/CSP risk rather than by concern. Every change to `.js` and `.astro` is provably zero-change via a byte-for-byte diff of built HTML against a Phase 0 baseline; all CSS work is quarantined into Phases 6–7, where a computed-style A/B replaces the byte-diff and a CSP rehash is mandatory.

**Tech Stack:** Astro 7 (static output), vanilla ES modules, ITCSS + BEMIT-lite CSS, Prettier + ESLint, six build-gated `check:*` scripts, Vercel deploy with a hash-based enforcing CSP.

**Spec:** `docs/superpowers/specs/2026-09-02-codebase-hygiene-cleanup-design.md`

## Global Constraints

Every task's requirements implicitly include these.

- **Never commit or push.** The maintainer commits manually. Every task ends by reporting and stopping, not by running `git commit`.
- **One phase at a time.** After each phase, report what changed and wait for an explicit "checked, committed, go".
- **`npm run dev` is broken on this machine** (spaced path + subst drive). Verify with `npm run build` then `npm run preview`, restarting preview after each build.
- **`npm run build` gates on** `prettier --check .` → `eslint .` → `check:critical` → `check:bemit` → `check:theme` → `check:charts` → `check:breakpoints` → build → `check:seo`. Run `npm run format` and `npm run lint` before building.
- **Any CSS change requires** editing BOTH `src/styles/critical-home.css` and the matching `src/styles/components/*.css` layer file, then `npm run build && node scripts/csp-hashes.mjs` and pasting the printed tokens into `vercel.json`'s `script-src`.
- **No CSS changes before Phase 6.** If a task appears to need one, stop and report rather than proceeding.
- **Class naming is BEMIT-lite**, build-enforced by `check:bemit`. No new bare state classes; `is-*`/`has-*` only.
- **Media queries may only use `--breakpoint-*` values** (or their `.01rem` twins), build-enforced by `check:breakpoints`.
- **`*.md` is in `.prettierignore`** — plan and spec files cannot break the format gate.
- **Astro 7 whitespace trap:** `compressHTML: true` is load-bearing. Wrapping an inline element across lines pads it with whitespace. Never reformat inline markup while moving it.
- **`$SCRATCH` does not persist between tool calls.** Each shell invocation starts fresh, so any command using it must define it in the same call. Prefix with:

  ```bash
  SCRATCH="C:/Users/jerry/AppData/Local/Temp/claude/H--Updated-files-dynamicjoker-github-io/33f48a18-4ff8-4f45-aa59-f19435677a07/scratchpad"
  ```

  Every `node "$SCRATCH/html-diff.mjs" …` step below assumes this line precedes it in the same shell command.
- **The byte-diff gate needs two normalisations** — both discovered while executing Task 1.1, both verified not to weaken it:
  - **Gantt bar geometry is time-dependent.** An experience entry ends in `Present`, so `HomeBody` computes its `endDate` as `new Date()`, feeding `totalDuration` and therefore every bar's percentage. Two builds ~30 min apart differ (`42.53%` → `42.52%`) with no code change at all. Proven by stashing every edit, rebuilding pristine, and diffing: exactly one differing run, one digit. The harness masks these values but compares the bar **count**, so a structural change still fails — verified by deleting a bar, which reported "5 bar(s) in baseline, 4 in new".
  - **The Astro JS bundle filename carries a content hash** that is written into the HTML, so ANY edit to `main.js` changes the markup. The harness normalises the hash but **reports** it, so in a phase that should not touch JS, seeing that note is itself the warning. This does not weaken CSP checking: the bundle loads via `src=` and `csp-hashes.mjs` never hashes it.

  The masking is provably narrow — the built HTML contains no `%` value in any `style` attribute outside a gantt bar, and the regex requires the full `margin-left:N%;width:N%;--anim-delay:` shape. An ordinary markup change still fails the gate (verified).
- **Consequence for Phases 2–3:** a changed JS bundle hash is EXPECTED there and is not a failure. In Phases 4 (Astro-only) and 5, it would be a warning worth investigating.

---

## File Structure

**Created:**

| Path | Responsibility |
|---|---|
| `<scratchpad>/baseline/` | Phase 0 golden copy of `dist/` |
| `<scratchpad>/html-diff.mjs` | Throwaway byte-diff harness (never committed) |
| `src/scripts/core/config.js` | All JS tuning constants, one object |
| `src/scripts/core/dom.js` | `cssLengthToPx`, `getBreakpointPx` |
| `src/scripts/core/scroll.js` | rAF-batched scroll dispatch, `scrollFrameCallbacks` |
| `src/scripts/core/viewport.js` | `watchViewportPresence`, `revealOnEnterViewport` |
| `src/scripts/features/*.js` | One module per feature area (Phase 3) |
| `src/lib/gantt.js` | Period parsing + duration formatting |
| `src/lib/work-archive.js` | Ranking, sorting, sampling of archive rows |
| `src/lib/services.js` | Engagement CTA `verbHtml` construction |
| `src/lib/testimonials.js` | Column distribution |
| `src/components/sections/*.astro` | Nine home section components (Phase 4) |
| `scripts/check-content-coverage.mjs` | New build gate |
| `scripts/check-content-coverage.test.mjs` | Its test |

**Modified:** `src/main.js` (becomes a thin bootstrap), `src/components/HomeBody.astro` (becomes a thin composition), `src/content.js` (gains ordering lists + leaked copy), `src/pages/blog/[slug].astro`, `package.json`, and in Phases 6–7 the CSS layer files plus `critical-home.css` and `vercel.json`.

---

## Phase 0 — Baseline and measurement

No code changes. Establishes the gate every later phase depends on.

### Task 0.1: Build the baseline and the diff harness

**Files:**
- Create: `<scratchpad>/html-diff.mjs`
- Create: `<scratchpad>/baseline/` (copy of `dist/`)

**Interfaces:**
- Produces: `node <scratchpad>/html-diff.mjs <baselineDir> <newDir>` → exit 0 when every `.html` file matches byte-for-byte, exit 1 with a per-file report otherwise. Every later task in Phases 1–5 calls this.

- [ ] **Step 1: Confirm the working tree is clean**

Run: `git status --porcelain`
Expected: empty output. If not, stop and report — the baseline must reflect committed state.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: completes through `check:seo` with no errors.

- [ ] **Step 3: Snapshot `dist/` as the baseline**

```bash
SCRATCH="C:/Users/jerry/AppData/Local/Temp/claude/H--Updated-files-dynamicjoker-github-io/33f48a18-4ff8-4f45-aa59-f19435677a07/scratchpad"
rm -rf "$SCRATCH/baseline"
mkdir -p "$SCRATCH/baseline"
cp -r dist/. "$SCRATCH/baseline/"
find "$SCRATCH/baseline" -name "*.html" | wc -l
```

Expected: a non-zero count. Record it — later phases compare against this number, and a changed file count is itself a regression.

- [ ] **Step 4: Write the diff harness**

Create `<scratchpad>/html-diff.mjs`:

```js
import fs from 'node:fs';
import path from 'node:path';

const [baseDir, newDir] = process.argv.slice(2);
if (!baseDir || !newDir) {
  console.error('usage: node html-diff.mjs <baselineDir> <newDir>');
  process.exit(2);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function htmlMap(root) {
  const map = new Map();
  for (const file of walk(root).filter((f) => f.endsWith('.html'))) {
    map.set(path.relative(root, file).replace(/\\/g, '/'), fs.readFileSync(file));
  }
  return map;
}

const base = htmlMap(baseDir);
const next = htmlMap(newDir);
const problems = [];

for (const [rel, buf] of base) {
  if (!next.has(rel)) problems.push(`MISSING in new: ${rel}`);
  else if (!buf.equals(next.get(rel))) problems.push(`DIFFERS: ${rel}`);
}
for (const rel of next.keys()) {
  if (!base.has(rel)) problems.push(`ADDED in new: ${rel}`);
}

console.log(`baseline: ${base.size} html file(s), new: ${next.size}`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('IDENTICAL — all HTML matches byte-for-byte.');
```

- [ ] **Step 5: Verify the harness reports identity against itself**

Run: `node "$SCRATCH/html-diff.mjs" "$SCRATCH/baseline" dist`
Expected: `IDENTICAL — all HTML matches byte-for-byte.` and exit 0.

- [ ] **Step 6: Verify the harness can actually fail**

A gate that cannot fail is not a gate. Prove it detects a change:

```bash
printf '<!--x-->' >> dist/index.html
node "$SCRATCH/html-diff.mjs" "$SCRATCH/baseline" dist; echo "exit=$?"
```

Expected: `DIFFERS: index.html` and `exit=1`.

- [ ] **Step 7: Restore `dist/` and re-confirm**

```bash
npm run build
node "$SCRATCH/html-diff.mjs" "$SCRATCH/baseline" dist
```

Expected: `IDENTICAL` again. This also proves the build is deterministic — if it is NOT identical here, stop and report, because every later gate in this plan is invalid.

### Task 0.2: Measure the 768–1024px band

**Files:** none modified.

**Interfaces:**
- Produces: a confirmed/refuted findings list consumed by Phase 7. Phase 7 fixes nothing this task did not confirm.

- [ ] **Step 1: Serve the built site**

Run: `npm run preview`
Then open the preview with the browser pane's `preview_start` at the served URL.

- [ ] **Step 2: Capture the three widths**

For each of 768, 834 and 1024 CSS px: call `resize_window` with that width (height 1000), reload, and screenshot the `#skills`, `#contact` and `#about` regions.

- [ ] **Step 3: Measure the suspect grids rather than eyeballing them**

Run via `javascript_tool`:

```js
['.c-capabilities', '.c-contact__content'].map((sel) => {
  const el = document.querySelector(sel);
  if (!el) return { sel, missing: true };
  const cs = getComputedStyle(el);
  return {
    sel,
    width: el.getBoundingClientRect().width,
    columns: cs.gridTemplateColumns,
    overflowing: el.scrollWidth > el.clientWidth + 1,
  };
});
```

Record `columns` and `overflowing` at each of the three widths.

- [ ] **Step 4: Check for horizontal overflow page-wide**

```js
[...document.querySelectorAll('*')]
  .filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
  .slice(0, 20)
  .map((el) => el.className || el.tagName);
```

Expected: empty array. Any entry is a confirmed responsive defect.

- [ ] **Step 5: Write the findings to the scratchpad**

Create `<scratchpad>/phase0-responsive-findings.md` listing, per width, the measured column template, any overflow, and a CONFIRMED or REFUTED verdict for the suspected tablet gap.

- [ ] **Step 6: Report and stop**

Present the screenshots and the findings list. Phase 7's scope is now fixed to whatever is marked CONFIRMED. Wait for the go-ahead.

---

## Phase 1 — Content separation and the desync hazard

All changes are `.js`/`.astro`. Gate: byte-identical HTML.

### Task 1.1: Single-source `SAMPLE_PER_TYPE`

The highest-value fix in the audit: the constant is currently declared twice and held together only by a comment.

**Files:**
- Modify: `src/content.js` (add to `archiveUi`)
- Modify: `src/components/HomeBody.astro:144`
- Modify: `src/main.js:924`

**Interfaces:**
- Produces: `siteContent.archiveUi.samplePerType` (number, currently `3`) — read by both `HomeBody.astro` and `main.js`.

- [ ] **Step 1: Add the constant to `content.js`**

In `src/content.js`, inside `archiveUi`, after the `countInitial` line, add:

```js
    // Rows shown per asset type in the default "All" view before "see more".
    // Read by BOTH HomeBody.astro (server-rendered first paint + no-JS
    // fallback) and main.js (initializeWorkArchive). Single-sourced here
    // because the two silently disagreed when it was declared in both.
    samplePerType: 3,
```

- [ ] **Step 2: Consume it in `HomeBody.astro`**

Replace lines 141-144 (the comment block plus `const SAMPLE_PER_TYPE = 3;`) with:

```js
// Default view is All types · All industries, showing the first few of each
// type; "see more" (JS) then reveals everything. Precompute that sample so the
// first paint and the no-JS fallback match the JS default.
const SAMPLE_PER_TYPE = archiveUi.samplePerType;
```

Note the "must stay in sync with main.js" warning is deliberately dropped — it is no longer true.

- [ ] **Step 3: Consume it in `main.js`**

Replace line 924 with:

```js
  const SAMPLE_PER_TYPE = siteContent.archiveUi.samplePerType; // rows per type in the "All" view before "see more"
```

- [ ] **Step 4: Verify no third declaration survives**

Run: `grep -rn "SAMPLE_PER_TYPE\s*=\s*[0-9]" src/`
Expected: no matches. Only the `content.js` literal and two reads should exist.

- [ ] **Step 5: Format, lint, build**

Run: `npm run format && npm run lint && npm run build`
Expected: all gates pass.

- [ ] **Step 6: Gate — byte-identical HTML**

Run: `node "$SCRATCH/html-diff.mjs" "$SCRATCH/baseline" dist`
Expected: `IDENTICAL`. A difference here means the sampled row set changed — investigate before proceeding.

### Task 1.2: Move the archive ordering lists into `content.js`

These are content-ordering config living in a component, and they fail silently: an industry or asset type absent from them sorts to rank 99 with no error.

**Files:**
- Modify: `src/content.js` (add to `archiveUi`)
- Modify: `src/components/HomeBody.astro:95-101, 113-122`

**Interfaces:**
- Produces: `siteContent.archiveUi.industryOrder` (string[]) and `siteContent.archiveUi.assetTypeOrder` (string[]). Phase 5's `check:content-coverage` validates both against `work-data.js`.

- [ ] **Step 1: Add both lists to `content.js`**

Inside `archiveUi`, after `samplePerType`, add:

```js
    // Display order for the archive's two filter rails and its row sort.
    // Values MUST match the `industry` / `assetType` strings in work-data.js
    // exactly — anything missing here sorts last. `check:content-coverage`
    // enforces that, so an unlisted value fails the build instead of
    // silently sinking to the bottom of the archive.
    industryOrder: [
      'PC Hardware',
      'Cybersecurity',
      'Cloud',
      'Software / SaaS',
    ],
    assetTypeOrder: [
      'Product Launch',
      'Case studies & Customer stories',
      'Reviews',
      'Guides & Explainers',
      'Landing pages & Web copy',
      'Blogs & Articles',
      'Press & PR',
      'Other',
    ],
```

- [ ] **Step 2: Consume them in `HomeBody.astro`**

Replace `const industryOrder = [ ... ];` (lines 95-101) with:

```js
const industryOrder = archiveUi.industryOrder;
```

Replace `const assetTypeOrder = [ ... ];` (lines 113-122) with:

```js
const assetTypeOrder = archiveUi.assetTypeOrder;
```

`archiveUi` is already defined at line 92 (`const archiveUi = siteContent.archiveUi;`) — confirm it is declared ABOVE both uses. If it is not, move that line up rather than adding a second alias.

- [ ] **Step 3: Verify no array literals remain in the component**

Run: `grep -n "PC Hardware\|Product Launch" src/components/HomeBody.astro`
Expected: no matches.

- [ ] **Step 4: Format, lint, build**

Run: `npm run format && npm run lint && npm run build`

- [ ] **Step 5: Gate — byte-identical HTML**

Run: `node "$SCRATCH/html-diff.mjs" "$SCRATCH/baseline" dist`
Expected: `IDENTICAL`. Order is load-bearing here — any difference means a list was transcribed wrong.

### Task 1.3: Move the remaining leaked copy into `content.js`

**Files:**
- Modify: `src/content.js`
- Modify: `src/pages/blog/[slug].astro:152-155`
- Modify: `src/main.js:1687`
- Modify: `src/components/HomeBody.astro:157`

**Interfaces:**
- Produces: `siteContent.articleCta.text`, `siteContent.articleCta.ctaLabel`, `siteContent.articleCta.href`, `siteContent.ui.testimonials.columnLabel`, `siteContent.testimonialColumns`.

- [ ] **Step 1: Add the article CTA to `content.js`**

After the `blogEmpty` block, add:

```js
  // Footer CTA on individual blog posts (src/pages/blog/[slug].astro).
  articleCta: {
    text: 'Need technical content that makes complex products easier to buy?',
    ctaLabel: 'Start a conversation',
    href: '/#contact',
  },
```

- [ ] **Step 2: Add the testimonials column label**

Inside `ui.testimonials`, after `reducedMotion`, add:

```js
      // Per-column region name, applied by main.js only under reduced motion,
      // when the columns become focusable regions. `{index}` is 1-based.
      columnLabel: 'Testimonials list {index}',
```

- [ ] **Step 3: Add the testimonial column count**

After the `testimonials` array's closing bracket, add:

```js
  // Number of masonry columns the testimonials are dealt across (HomeBody).
  testimonialColumns: 3,
```

- [ ] **Step 4: Consume the CTA in `[slug].astro`**

Ensure the frontmatter imports `siteContent`, then replace the `<footer class="c-article__cta">` block with:

```astro
      <footer class="c-article__cta">
        <p>{siteContent.articleCta.text}</p>
        <a href={siteContent.articleCta.href} class="c-btn c-btn--primary"
          >{siteContent.articleCta.ctaLabel}</a
        >
      </footer>
```

Keep the `>` placement exactly as shown — Prettier produced the original hanging bracket, and moving it changes the rendered whitespace.

- [ ] **Step 5: Consume the column label in `main.js`**

Replace line 1687 with:

```js
        column.setAttribute(
          'aria-label',
          siteContent.ui.testimonials.columnLabel.replace(
            '{index}',
            String(index + 1),
          ),
        );
```

- [ ] **Step 6: Consume the column count in `HomeBody.astro`**

Replace `const numColumns = 3;` with:

```js
const numColumns = siteContent.testimonialColumns;
```

- [ ] **Step 7: Format, lint, build**

Run: `npm run format && npm run lint && npm run build`

- [ ] **Step 8: Gate — byte-identical HTML**

Run: `node "$SCRATCH/html-diff.mjs" "$SCRATCH/baseline" dist`
Expected: `IDENTICAL`. This gate covers the `[slug].astro` whitespace risk directly.

- [ ] **Step 9: Verify the reduced-motion label at runtime**

The `columnLabel` path only executes under reduced motion, so the byte-diff cannot cover it. Run `npm run preview`, then in the browser pane emulate reduced motion and check:

```js
[...document.querySelectorAll('.c-testimonials-scroller__column')]
  .map((c) => c.getAttribute('aria-label'));
```

Expected: `["Testimonials list 1", "Testimonials list 2", "Testimonials list 3"]` — no literal `{index}`.

- [ ] **Step 10: Report and stop for commit**

Phase 1 complete. Report the four leaks closed and the desync hazard eliminated. Wait for "checked, committed, go".

---

## Phase 2 — `main.js` constant discipline

Pure JS. No structural change — values move into the existing `config` object, carrying their rationale comments.

### Task 2.1: Fold the escaped constants into `config`

**Files:**
- Modify: `src/main.js` (the `config` object at `:3-28`, plus the twelve call sites)

**Interfaces:**
- Produces: new `config` keys — `config.scroll.hashSettleDelayMs`, `config.scroll.hashSettleMaxMs`, `config.scroll.activeSectionThreshold`, `config.nav.resizeSettleMs`, `config.nav.linkClickFallbackMs`, `config.hero.resizeSettleMs`, `config.distiller.runMs`, `config.distiller.restMs`, `config.dockedHeaders.remeasureDebounceMs`, `config.brandCollapse.remeasureDebounceMs`, `config.workArchive.arrivalClearMs`, `config.workArchive.limit`, `config.contactUI.announceClearMs`.

- [ ] **Step 1: Extend the `config` object**

Add these blocks inside `config`, preserving each value's existing rationale verbatim:

```js
  scroll: {
    // Delay before the post-click scroll-spy handover re-runs (main.js:93).
    hashSettleDelayMs: 80,
    // Bounded: stop chasing a #hash landing once the page has had time to
    // settle, so nothing can re-anchor minutes later if something resizes.
    hashSettleMaxMs: 4000,
    // A section is active once its top crosses the upper 30% of the viewport.
    activeSectionThreshold: 0.3,
  },
  nav: {
    // How long after the last resize event the navbar's is-resizing flag is
    // held, suppressing the mobile sheet's open/close transition.
    resizeSettleMs: 150,
    // Safety net for browsers without `scrollend`. MUST outlast any smooth
    // scroll (a full-page jump measured ~1.5s) or it releases mid-scroll and
    // the scroll-spy drags the latch through intermediate sections.
    linkClickFallbackMs: 3000,
  },
  hero: {
    // Held after resize so the proof surface can ease between the desktop
    // card and the flat mobile band as the layout crosses the breakpoint.
    resizeSettleMs: 200,
  },
  distiller: {
    // MUST stay >= the sequence length in components/skills.css, or the rest
    // beat starts while the tail of the sequence is still playing.
    runMs: 3400,
    restMs: 4000,
  },
  dockedHeaders: {
    remeasureDebounceMs: 200,
  },
  brandCollapse: {
    remeasureDebounceMs: 200,
  },
  workArchive: {
    // Rows shown for a single selected type before "see more".
    limit: 20,
    // How long an arriving row keeps its arrival-ping class.
    arrivalClearMs: 2600,
  },
```

And inside the existing `contactUI` block:

```js
    // Live-region clear delay; the region must be emptied before the next
    // message or screen readers may not re-announce an identical string.
    announceClearMs: 120,
```

- [ ] **Step 2: Replace each call site**

Apply these substitutions in `src/main.js`:

| Line | Was | Becomes |
|---|---|---|
| 93 | `window.setTimeout(update, 80);` | `window.setTimeout(update, config.scroll.hashSettleDelayMs);` |
| 208 | `window.setTimeout(release, 4000);` | `window.setTimeout(release, config.scroll.hashSettleMaxMs);` |
| 415 | `}, 150);` | `}, config.nav.resizeSettleMs);` |
| 436 | `}, 200);` | `}, config.hero.resizeSettleMs);` |
| 459 | `releaseNavLinkClickLock, 3000` | `releaseNavLinkClickLock, config.nav.linkClickFallbackMs` |
| 526 | `window.innerHeight * 0.3` | `window.innerHeight * config.scroll.activeSectionThreshold` |
| 747 | `window.setTimeout(remeasure, 200)` | `window.setTimeout(remeasure, config.dockedHeaders.remeasureDebounceMs)` |
| 790 | `window.setTimeout(observe, 200)` | `window.setTimeout(observe, config.brandCollapse.remeasureDebounceMs)` |
| 1008 | `window.setTimeout(clearArrivals, 2600)` | `window.setTimeout(clearArrivals, config.workArchive.arrivalClearMs)` |
| 1302 | `}, 120);` | `}, config.contactUI.announceClearMs);` |

Delete the now-duplicated inline comments at lines 459 and 526 — their text moved into `config` in Step 1. Do NOT delete the surrounding explanatory comments that describe the mechanism rather than the number.

- [ ] **Step 3: Replace the loose module constants**

Delete lines 592-593 (`const DISTILLER_RUN_MS = 3400;` / `const DISTILLER_REST_MS = 4000;`) along with the two-line comment fragment that documents the RUN constraint (it moved into `config`). Then replace the two uses inside `initializeDistillerLoop` with `config.distiller.runMs` and `config.distiller.restMs`.

Run: `grep -n "DISTILLER_RUN_MS\|DISTILLER_REST_MS" src/main.js`
Expected: no matches.

- [ ] **Step 4: Replace the archive `LIMIT`**

At line 923, delete `const LIMIT = 20;` and replace both uses of `LIMIT` with `config.workArchive.limit`.

- [ ] **Step 5: Verify no stray timing literals remain**

Run: `grep -n "setTimeout([a-zA-Z]*, [0-9]" src/main.js`
Expected: no matches — every timeout should now reference `config`.

- [ ] **Step 6: Format, lint, build**

Run: `npm run format && npm run lint && npm run build`

- [ ] **Step 7: Gate — byte-identical HTML**

Run: `node "$SCRATCH/html-diff.mjs" "$SCRATCH/baseline" dist`
Expected: `IDENTICAL`.

- [ ] **Step 8: Behaviour smoke test**

The byte-diff cannot see runtime timing. Run `npm run preview` and confirm in the browser pane: the loading screen clears; the nav underline tracks on scroll and does not jitter after clicking a nav link; the skills distiller animates then rests then replays; the archive "see more" expands. Report anything that behaves differently.

- [ ] **Step 9: Report and stop for commit**

---

## Phase 3 — Split `main.js` into ES modules

1807 lines → a thin bootstrap over focused modules. Bundled and loaded via `src=`, so CSP-neutral — but Task 3.6 proves that rather than assuming it.

**Approach for every task in this phase:** move code verbatim. Do not rewrite, rename, or "improve" a function while relocating it. Any behaviour change here is invisible to the byte-diff gate, so verbatim movement is the discipline that keeps this safe.

### Task 3.1: Extract the shared cores

**Files:**
- Create: `src/scripts/core/config.js`, `src/scripts/core/dom.js`, `src/scripts/core/scroll.js`, `src/scripts/core/viewport.js`
- Modify: `src/main.js`

**Interfaces:**
- Produces:
  - `config.js` → `export const config` (the full object from Phase 2), `export const prefersReducedMotion` (boolean)
  - `dom.js` → `export function cssLengthToPx(value, fallbackRem): number`, `export function getBreakpointPx(key): number`
  - `scroll.js` → `export const scrollFrameCallbacks: Array<() => void>`, `export function handleScroll(): void`, `export function updateUIOnScroll(): void`, `export function registerScrollFrameCallback(fn): void`
  - `viewport.js` → `export function watchViewportPresence(element, onChange): void`, `export function revealOnEnterViewport(elements, onEnter): void`

- [ ] **Step 1: Create `config.js`**

Move the entire `config` object (`main.js:3-28` as amended in Phase 2) and the `prefersReducedMotion` const (`:30-32`), exporting both. `config.js` imports nothing.

- [ ] **Step 2: Create `dom.js`**

Move `cssLengthToPx` (`:50-66`) and `getBreakpointPx` (`:67-74`) verbatim, with their comments. `dom.js` imports `config` from `./config.js`.

- [ ] **Step 3: Create `scroll.js`**

Move `ticking`, `scrollFrameCallbacks` (`:75-81`), `handleScroll` (`:82-97`) and `updateUIOnScroll` (`:99-111`) verbatim, plus the block comment above `scrollFrameCallbacks` explaining why consumers register here rather than attaching their own listeners. Add `registerScrollFrameCallback` as the write path so consumers do not mutate the exported array directly:

```js
export function registerScrollFrameCallback(fn) {
  scrollFrameCallbacks.push(fn);
}
```

- [ ] **Step 4: Create `viewport.js`**

Move `watchViewportPresence` (`:640-662`) and `revealOnEnterViewport` (`:558-572`) verbatim with their comments.

- [ ] **Step 5: Wire `main.js` to import from the cores**

Delete the moved code from `main.js` and add the imports at the top. `main.js` keeps everything else for now.

- [ ] **Step 6: Format, lint, build**

Run: `npm run format && npm run lint && npm run build`
Expected: ESLint passes — `eslint.config.mjs` already applies browser globals to `src/`, and these files are under `src/`.

- [ ] **Step 7: Gate — byte-identical HTML**

Run: `node "$SCRATCH/html-diff.mjs" "$SCRATCH/baseline" dist`
Expected: `IDENTICAL`.

- [ ] **Step 8: Smoke test**

`npm run preview`; confirm scrolling, the nav underline, and section reveals still work.

### Task 3.2: Extract navigation and page-landing features

**Files:**
- Create: `src/scripts/features/navigation.js`, `src/scripts/features/hash-landing.js`, `src/scripts/features/loading-screen.js`, `src/scripts/features/brand-collapse.js`
- Modify: `src/main.js`

**Interfaces:**
- Produces: `export function initializeNavigation(): void` (also owns `getCurrentSectionText`, `updateNavControls`, `updateCurrentSectionLabel`, `updateActiveNavLink`, the nav-link click lock and `releaseNavLinkClickLock`); `export function initializeHashLanding(): void`; `export function initializeLoadingScreen(): void`; `export function initializeBrandCollapse(): void`.

- [ ] **Step 1: Create `navigation.js`**

Move `releaseNavLinkClickLock` (`:42-49`), the `navLinks` / `navLinkClickLock` / `navLinkClickFallbackId` module state (`:33-40`) with its explanatory comment, `initializeNavigation` (`:346-470`), `getCurrentSectionText` (`:471-477`), `updateNavControls` (`:478-496`), `updateCurrentSectionLabel` (`:497-503`) and `updateActiveNavLink` (`:504-557`). Import `config`, `siteContent`, and `getBreakpointPx`.

Note: `updateUIOnScroll` in `scroll.js` calls `updateActiveNavLink`. To avoid a circular import, `navigation.js` registers it: at the end of `initializeNavigation`, call `registerScrollFrameCallback(updateActiveNavLink)` and remove the direct call from `scroll.js`. Verify the scroll-spy still updates before moving on — this is the one place in Phase 3 where the wiring genuinely changes shape.

- [ ] **Step 2: Create `hash-landing.js`**

Move `initializeHashLanding` (`:163-218`) with its long rationale comment block (`:150-162`) intact — it documents the `'instant'` vs `'auto'` trap and the measured height sequence, and is the most expensive knowledge in the file to rediscover.

- [ ] **Step 3: Create `loading-screen.js`**

Move `initializeLoadingScreen` (`:318-345`) with its comments.

- [ ] **Step 4: Create `brand-collapse.js`**

Move `initializeBrandCollapse` (`:755-795`).

- [ ] **Step 5: Update `main.js` imports and delete the moved code**

- [ ] **Step 6: Format, lint, build, gate**

Run: `npm run format && npm run lint && npm run build && node "$SCRATCH/html-diff.mjs" "$SCRATCH/baseline" dist`
Expected: all pass, `IDENTICAL`.

- [ ] **Step 7: Smoke test the moved features specifically**

`npm run preview`. Confirm: the loading overlay clears; the hamburger opens/closes and announces the current section; the nav underline tracks scroll; clicking a nav link scrolls and the underline does not jitter; a direct `/#contact` load lands on Contact, not short of it; the brand mark collapses on scroll.

### Task 3.3: Extract the work features

**Files:**
- Create: `src/scripts/features/work-lightbox.js`, `src/scripts/features/featured-carousel.js`, `src/scripts/features/work-archive.js`
- Modify: `src/main.js`

**Interfaces:**
- Produces: `export function initializeWorkLightbox(): void`; `export function initializeFeaturedCarousel(): void`; `export function initializeWorkArchive(): void`.

- [ ] **Step 1: Create `work-lightbox.js`** — move `initializeWorkLightbox` (`:796-844`).

- [ ] **Step 2: Create `featured-carousel.js`** — move `initializeFeaturedCarousel` (`:845-909`). Imports `siteContent` for the `slideStatus` template.

- [ ] **Step 3: Create `work-archive.js`** — move `initializeWorkArchive` (`:910-1176`), the largest single initializer. Imports `config` (for `workArchive.limit` and `arrivalClearMs`) and `siteContent` (for `archiveUi.samplePerType` and the count templates).

- [ ] **Step 4: Update `main.js`, format, lint, build, gate**

Run: `npm run format && npm run lint && npm run build && node "$SCRATCH/html-diff.mjs" "$SCRATCH/baseline" dist`

- [ ] **Step 5: Smoke test**

`npm run preview`. Confirm: the featured carousel advances and announces slide position; clicking a work excerpt opens the lightbox and Escape closes it; archive type tabs and industry chips filter; "show all" expands and "show fewer" collapses; the row count status updates.

### Task 3.4: Extract the contact features

**Files:**
- Create: `src/scripts/features/contact-form.js`, `src/scripts/features/contact-info.js`, `src/scripts/features/calendly.js`
- Modify: `src/main.js`

**Interfaces:**
- Produces: `export function initializeContactForm(): void`; `export function initializeContactInfo(): void`; `export function initializeCalendlyBookingPanel(): void`.

- [ ] **Step 1: Create `contact-form.js`**

Move `initializeContactForm` (`:1177-1269`) plus its helpers: `setFieldError`, `clearFieldError`, `setFormError`, `clearFormError`, `announce`, `holdSubmittingFor`, `setContactSubmitting`, `revertContactSubmit`, `markContactFormSubmitted`, `resetContactForm` (`:1270-1361`).

- [ ] **Step 2: Create `contact-info.js`**

Move `initializeContactInfo` (`:241-317`), including the email-reveal logic and the OCR-thwarting dummy placeholder comment.

- [ ] **Step 3: Create `calendly.js`**

Move `buildCalendlyUrl` (`:1373-1400`), `loadCalendlyScript` (`:1401-1435`) and `initializeCalendlyBookingPanel` (`:1436-1606`), including the `calendlyScriptPromise` module state (`:34`).

- [ ] **Step 4: Update `main.js`, format, lint, build, gate**

- [ ] **Step 5: Smoke test**

`npm run preview`. Confirm: the email reveal button swaps in the real address; the booking panel expands and the Calendly widget loads (check the browser console for CSP violations — there should be none, since no CSP directive changed); submitting the contact form with an empty required field shows an inline error.

### Task 3.5: Extract the motion and decoration features

**Files:**
- Create: `src/scripts/features/pointer-spotlight.js`, `src/scripts/features/scroll-animations.js`, `src/scripts/features/distiller.js`, `src/scripts/features/docked-headers.js`, `src/scripts/features/infinite-scroller.js`, `src/scripts/features/testimonials.js`, `src/scripts/features/gantt.js`, `src/scripts/features/dates.js`
- Modify: `src/main.js`

**Interfaces:**
- Produces: `initializePointerSpotlight()`, `initializeScrollAnimations()`, `initializeDistillerLoop()`, `initializeDockedSectionHeaders()`, `initializeInfiniteScroller()`, `initializeTestimonialPauseControl()`, `enhanceGanttRows()`, `updateYearsExperience()`, `updateFooterYear()` — all `(): void`.

- [ ] **Step 1: Create the modules, moving verbatim**

| Module | Moves |
|---|---|
| `pointer-spotlight.js` | `initializePointerSpotlight` (`:219-240`) |
| `scroll-animations.js` | `initializeScrollAnimations` (`:573-591`) |
| `distiller.js` | `initializeDistillerLoop` (`:595-639`) with its full rationale comment |
| `docked-headers.js` | `initializeDockedSectionHeaders` (`:663-754`) with its live-geometry comment |
| `infinite-scroller.js` | `initializeInfiniteScroller` (`:1607-1699`) |
| `testimonials.js` | `initializeTestimonialPauseControl` (`:1700-1731`) |
| `gantt.js` | `setGanttAreaExpanded`, `closeGanttDetails`, `isCompactGanttCardView`, `enhanceGanttRows`, `revealGanttChartOnScroll` (`:1732-end`) |
| `dates.js` | `updateYearsExperience` (`:1362-1367`), `updateFooterYear` (`:1368-1372`) |

The docked-headers comment about reading *live* per-scroll rects rather than cached offsets must survive the move — it documents a fixed bug that a future refactor could reintroduce.

- [ ] **Step 2: Update `main.js`, format, lint, build, gate**

- [ ] **Step 3: Smoke test**

`npm run preview`. Confirm: section headers dock into compact tabs on scroll and the content below does not jump; the logo bar scrolls; testimonials scroll and the pause control works; Gantt rows expand on click and Escape dismisses; the hero years-of-experience figure and footer year are populated.

### Task 3.6: Reduce `main.js` to a bootstrap and confirm CSP neutrality

**Files:**
- Modify: `src/main.js`
- Verify: `vercel.json` (read only — expect no change needed)

**Interfaces:**
- Produces: `src/main.js` as an import list plus the `DOMContentLoaded` handler and the resize listener, nothing else.

- [ ] **Step 1: Confirm `main.js` holds no remaining logic**

Run: `grep -c "^function " src/main.js`
Expected: `0`. Everything should now live in a module.

Run: `wc -l src/main.js`
Expected: well under 100 lines. Record the number for the report.

- [ ] **Step 2: Verify the initializer order is unchanged**

The `DOMContentLoaded` body must still call the same 17 initializers in the same order as `main.js:126-148`, with `initializeHashLanding()` last and its "Last: the passes above… settle the page's final height" comment intact.

Run: `git diff src/main.js` and read the handler body against the original ordering. Order is load-bearing — the hash-landing comment says why.

- [ ] **Step 3: Build and gate**

Run: `npm run format && npm run lint && npm run build && node "$SCRATCH/html-diff.mjs" "$SCRATCH/baseline" dist`
Expected: `IDENTICAL`.

- [ ] **Step 4: Confirm the CSP token set is unchanged**

Run: `node scripts/csp-hashes.mjs`

Compare the printed `script-src` tokens against the ones currently in `vercel.json`. Expected: **identical set** — the app bundle is external (`src=`) and never hashed, and no CSS changed, so `BaseLayout`'s stylesheet-loader hash is stable too.

If any token differs, STOP and report. That would mean an inline script changed, which this phase should not have touched.

- [ ] **Step 5: Full-page smoke test**

`npm run preview`. Walk the whole page once: load, scroll top to bottom, open the mobile nav at a narrow width, filter the archive, open the booking panel. Report anything that differs from Phase 2's behaviour.

- [ ] **Step 6: Report and stop for commit**

Report the before/after line count for `main.js` and the module inventory.

---

## Phase 4 — Split `HomeBody.astro` into section components

1555 lines → nine section components over four pure derivation modules. The byte-diff gate is non-negotiable here: Astro 7's JSX-style whitespace handling is exactly what component boundaries perturb silently.

### Task 4.1: Extract the frontmatter derivations into pure modules

**Files:**
- Create: `src/lib/gantt.js`, `src/lib/work-archive.js`, `src/lib/services.js`, `src/lib/testimonials.js`
- Modify: `src/components/HomeBody.astro:8-161`

**Interfaces:**
- Produces:
  - `gantt.js` → `export function buildGanttModel(experience): { jobs, firstDate, lastDate, totalDuration, ganttYears }`, `export function getGanttDurationText(startDate, endDate): string`
  - `work-archive.js` → `export function buildArchiveModel(workArchive, archiveUi): { archiveIndustries, assetTypes, archiveRows, archiveInitialShow, archiveHasLink }`
  - `services.js` → `export function buildEngagementRows(services): Array<{...engagement, verbHtml: string}>`
  - `testimonials.js` → `export function buildTestimonialColumns(testimonials, columnCount): Array<Array<testimonial>>`

- [ ] **Step 1: Create `src/lib/gantt.js`**

Move the period-parsing block (`HomeBody.astro:11-32`) into `buildGanttModel(experience)` and `getGanttDurationText` (`:34-53`) verbatim. Keep the `'MM/YYYY - MM/YYYY'` format comment — the parser depends on that exact shape.

- [ ] **Step 2: Create `src/lib/work-archive.js`**

Move `industryRank`, `archiveIndustries`, `assetRank`, `assetTypes`, `archiveRows`, the `SAMPLE_PER_TYPE` sampling loop and `archiveHasLink` (`:102-155`) into `buildArchiveModel`. Read the ordering lists and `samplePerType` from the passed-in `archiveUi` rather than importing `content.js` directly — that keeps the module pure and testable.

- [ ] **Step 3: Create `src/lib/services.js`**

Move the `engagementRows` mapping (`:87-95`) into `buildEngagementRows`. Keep the comment explaining why `verbHtml` is built as a string and rendered with `set:html` — it documents the Astro 7 whitespace trap and is the reason this code exists at all.

- [ ] **Step 4: Create `src/lib/testimonials.js`**

Move the column distribution (`:157-161`) into `buildTestimonialColumns(testimonials, columnCount)`.

- [ ] **Step 5: Rewire `HomeBody.astro`'s frontmatter to call the four builders**

Destructure the returned models so the markup below continues to reference the same variable names. Do not touch any markup in this step.

- [ ] **Step 6: Format, lint, build, gate**

Run: `npm run format && npm run lint && npm run build && node "$SCRATCH/html-diff.mjs" "$SCRATCH/baseline" dist`
Expected: `IDENTICAL`. Sort order and the sampled row set are both covered by this gate.

### Task 4.2: Extract Hero, About and Logo Bar

**Files:**
- Create: `src/components/sections/HeroSection.astro`, `AboutSection.astro`, `LogoBarSection.astro`
- Modify: `src/components/HomeBody.astro`

**Interfaces:**
- Produces: three components, each taking no props and importing `siteContent` itself. (Props-free keeps the call site trivial; these sections are singletons on one page.)

- [ ] **Step 1: Move the Hero markup**

Cut `HomeBody.astro:166-262` (the `<section id="hero">` block, NOT the `<!-- Hero Section -->` comment above it — that comment is deleted, not moved) into `HeroSection.astro`, with the frontmatter it needs (`profile`, `ui`).

Preserve indentation-sensitive inline markup exactly. Do not let the editor reflow any line that contains an inline `<b>`, `<span>` or `<em>` adjacent to text.

- [ ] **Step 2: Move the About markup** — `:265-312` into `AboutSection.astro`.

- [ ] **Step 3: Move the Logo Bar markup** — `:315-330` into `LogoBarSection.astro`.

- [ ] **Step 4: Replace the three blocks in `HomeBody.astro` with component tags**

```astro
  <HeroSection />
  <AboutSection />
  <LogoBarSection />
```

- [ ] **Step 5: Format, lint, build, gate**

Run: `npm run format && npm run lint && npm run build && node "$SCRATCH/html-diff.mjs" "$SCRATCH/baseline" dist`
Expected: `IDENTICAL`.

**If this reports `DIFFERS: index.html`**, the cause is almost certainly whitespace. Diff the two files directly to see it:

```bash
node -e "const a=require('fs').readFileSync(process.argv[1],'utf8'),b=require('fs').readFileSync(process.argv[2],'utf8');for(let i=0;i<Math.max(a.length,b.length);i++){if(a[i]!==b[i]){console.log('first diff at',i);console.log('base:',JSON.stringify(a.slice(i-80,i+80)));console.log('new :',JSON.stringify(b.slice(i-80,i+80)));break;}}" "$SCRATCH/baseline/index.html" dist/index.html
```

Fix the whitespace at the reported offset; do not accept the difference.

### Task 4.3: Extract Skills and Services

**Files:**
- Create: `src/components/sections/SkillsSection.astro`, `ServicesSection.astro`
- Modify: `src/components/HomeBody.astro`

**Interfaces:**
- Produces: two props-free components. `SkillsSection` owns the `thesisSegments` mapping (`HomeBody.astro:73-80`); `ServicesSection` calls `buildEngagementRows` from `src/lib/services.js`.

- [ ] **Step 1: Move the Skills markup and its `thesisSegments` derivation**

Cut `:333-819` (the largest section, 486 lines) into `SkillsSection.astro`, moving the `thesisSegments` mapping into its frontmatter. Keep the comment explaining why `emberClass` is precomputed rather than computed inline — it documents the same Astro 7 whitespace trap.

- [ ] **Step 2: Move the Services markup** — `:822-859` into `ServicesSection.astro`, with the `buildEngagementRows` call.

- [ ] **Step 3: Replace both blocks with `<SkillsSection />` and `<ServicesSection />`**

- [ ] **Step 4: Format, lint, build, gate**

Run: `npm run format && npm run lint && npm run build && node "$SCRATCH/html-diff.mjs" "$SCRATCH/baseline" dist`
Expected: `IDENTICAL`. If it differs, use the offset-diff command from Task 4.2 Step 5.

### Task 4.4: Extract Testimonials and Portfolio

**Files:**
- Create: `src/components/sections/TestimonialsSection.astro`, `PortfolioSection.astro`
- Modify: `src/components/HomeBody.astro`

**Interfaces:**
- Produces: two props-free components. `TestimonialsSection` calls `buildTestimonialColumns`; `PortfolioSection` calls `buildArchiveModel` and owns the lightbox markup at `:1217-1233`.

- [ ] **Step 1: Move the Testimonials markup** — `:862-923` into `TestimonialsSection.astro`, with the `buildTestimonialColumns` call.

- [ ] **Step 2: Move the Portfolio markup** — `:926-1215` plus the lightbox block at `:1217-1233` into `PortfolioSection.astro`, with the `buildArchiveModel` call and the `interviewTag` alias.

Keep the `interviewTag` alias and its comment: it exists so the chip's markup fits on one line at its indent depth, and dropping it reintroduces padded whitespace inside the chip.

- [ ] **Step 3: Replace both blocks with component tags**

- [ ] **Step 4: Format, lint, build, gate**

Run: `npm run format && npm run lint && npm run build && node "$SCRATCH/html-diff.mjs" "$SCRATCH/baseline" dist`
Expected: `IDENTICAL`.

### Task 4.5: Extract Experience and Contact

**Files:**
- Create: `src/components/sections/ExperienceSection.astro`, `ContactSection.astro`
- Modify: `src/components/HomeBody.astro`

**Interfaces:**
- Produces: two props-free components. `ExperienceSection` calls `buildGanttModel` and `getGanttDurationText`; `ContactSection` owns the booking CTA, the contact panel and the Web3Forms form.

- [ ] **Step 1: Move the Experience markup** — `:1236-1321` into `ExperienceSection.astro`, with the gantt model calls.

- [ ] **Step 2: Move the Contact markup** — `:1326-1552` into `ContactSection.astro`.

Preserve both substantive comments in this block verbatim: the honeypot explanation (`:1531`) and the screen-reader error-summary note (`:1541`). Preserve the decoy email address exactly — `main.js`'s `initializeContactInfo` swaps it at runtime, and changing it breaks the reveal.

- [ ] **Step 3: Replace both blocks with component tags**

- [ ] **Step 4: Format, lint, build, gate**

Run: `npm run format && npm run lint && npm run build && node "$SCRATCH/html-diff.mjs" "$SCRATCH/baseline" dist`
Expected: `IDENTICAL`.

### Task 4.6: Confirm `HomeBody.astro` is a thin composition

**Files:**
- Modify: `src/components/HomeBody.astro`

- [ ] **Step 1: Confirm the file is now imports plus nine tags plus the footer**

Run: `wc -l src/components/HomeBody.astro`
Expected: under 40 lines. Record the number.

Run: `grep -c "<!-- .* Section -->" src/components/HomeBody.astro`
Expected: `0` — all eight banner comments are gone.

- [ ] **Step 2: Confirm no derivation logic remains in the frontmatter**

Run: `grep -n "sort(\|map(\|filter(\|new Set(" src/components/HomeBody.astro`
Expected: no matches. All four derivations live in `src/lib/`.

- [ ] **Step 3: Final build and gate**

Run: `npm run format && npm run lint && npm run build && node "$SCRATCH/html-diff.mjs" "$SCRATCH/baseline" dist`
Expected: `IDENTICAL`.

- [ ] **Step 4: Confirm CSP tokens still unchanged**

Run: `node scripts/csp-hashes.mjs`
Expected: same token set as `vercel.json`. No CSS changed, so `BaseLayout`'s loader hash must be stable.

- [ ] **Step 5: Full-page smoke test and report**

`npm run preview`; walk the whole page. Report the before/after line counts for `HomeBody.astro` and the component inventory. Stop for commit.

---

## Phase 5 — Guardrails

The only phase where classic TDD applies, because it produces a new script with real logic. Follows the `check-bemit.test.mjs` precedent.

### Task 5.1: Add `check:content-coverage`

**Files:**
- Create: `scripts/check-content-coverage.mjs`
- Create: `scripts/check-content-coverage.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `export function findCoverageGaps(workArchive, archiveUi, assetTypeLabels): string[]` — returns a human-readable problem per gap, empty when clean. The CLI wrapper exits 1 if the array is non-empty.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-content-coverage.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { findCoverageGaps } from './check-content-coverage.mjs';

const archiveUi = {
  industryOrder: ['Cloud'],
  assetTypeOrder: ['Reviews'],
};
const labels = { Reviews: 'Reviews' };

test('clean data produces no gaps', () => {
  const rows = [{ industry: 'Cloud', assetType: 'Reviews' }];
  assert.deepEqual(findCoverageGaps(rows, archiveUi, labels), []);
});

test('an unlisted industry is reported', () => {
  const rows = [{ industry: 'Fintech', assetType: 'Reviews' }];
  const gaps = findCoverageGaps(rows, archiveUi, labels);
  assert.equal(gaps.length, 1);
  assert.match(gaps[0], /Fintech/);
  assert.match(gaps[0], /industryOrder/);
});

test('an unlisted asset type is reported', () => {
  const rows = [{ industry: 'Cloud', assetType: 'Webinars' }];
  const gaps = findCoverageGaps(rows, archiveUi, labels);
  assert.ok(gaps.some((g) => /Webinars/.test(g) && /assetTypeOrder/.test(g)));
});

test('an asset type with no display label is reported', () => {
  const rows = [{ industry: 'Cloud', assetType: 'Reviews' }];
  const gaps = findCoverageGaps(rows, { ...archiveUi }, {});
  assert.ok(gaps.some((g) => /Reviews/.test(g) && /assetTypeLabels/.test(g)));
});

test('each missing value is reported once, not once per row', () => {
  const rows = [
    { industry: 'Fintech', assetType: 'Reviews' },
    { industry: 'Fintech', assetType: 'Reviews' },
  ];
  assert.equal(findCoverageGaps(rows, archiveUi, labels).length, 1);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/check-content-coverage.test.mjs`
Expected: FAIL — cannot resolve `./check-content-coverage.mjs`.

- [ ] **Step 3: Write the implementation**

Create `scripts/check-content-coverage.mjs`:

```js
// Asserts that every `industry` and `assetType` present in work-data.js is
// listed in content.js's archiveUi ordering arrays, and that every asset type
// has a display label.
//
// Why this exists: the archive's rank helpers return 99 for anything they
// don't recognise, so an unlisted value silently sinks to the bottom of the
// archive with no error anywhere. This turns that into a build failure.

export function findCoverageGaps(workArchive, archiveUi, assetTypeLabels) {
  const gaps = [];
  const industries = new Set(workArchive.map((row) => row.industry));
  const assetTypes = new Set(workArchive.map((row) => row.assetType));

  for (const industry of industries) {
    if (!archiveUi.industryOrder.includes(industry)) {
      gaps.push(
        `industry "${industry}" is used in work-data.js but missing from archiveUi.industryOrder in content.js`,
      );
    }
  }
  for (const assetType of assetTypes) {
    if (!archiveUi.assetTypeOrder.includes(assetType)) {
      gaps.push(
        `assetType "${assetType}" is used in work-data.js but missing from archiveUi.assetTypeOrder in content.js`,
      );
    }
    if (!Object.prototype.hasOwnProperty.call(assetTypeLabels, assetType)) {
      gaps.push(
        `assetType "${assetType}" is used in work-data.js but has no entry in assetTypeLabels in content.js`,
      );
    }
  }
  return gaps;
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const { siteContent } = await import('../src/content.js');
  const gaps = findCoverageGaps(
    siteContent.workArchive,
    siteContent.archiveUi,
    siteContent.assetTypeLabels,
  );
  if (gaps.length) {
    console.error(`check:content-coverage found ${gaps.length} problem(s):\n`);
    for (const gap of gaps) console.error('  ' + gap);
    process.exit(1);
  }
  console.log('check:content-coverage passed.');
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/check-content-coverage.test.mjs`
Expected: all 5 tests PASS.

- [ ] **Step 5: Run the check against real data**

Run: `node scripts/check-content-coverage.mjs`
Expected: `check:content-coverage passed.` If it reports gaps, that is a REAL pre-existing bug — report it rather than weakening the check.

- [ ] **Step 6: Prove the check fails on a real violation**

Temporarily add `'Fintech'` as the `industry` of the first row in `src/work-data.js`, run `node scripts/check-content-coverage.mjs`, confirm it exits 1 naming `Fintech`, then revert the edit with `git checkout src/work-data.js` and re-run to confirm it passes again.

- [ ] **Step 7: Wire it into `package.json`**

Add to `scripts`:

```json
    "check:content-coverage": "node scripts/check-content-coverage.mjs",
```

And insert it into the `build` chain after `check:breakpoints` and before `run-astro.mjs build`:

```
... && node scripts/check-breakpoints.mjs && node scripts/check-content-coverage.mjs && node scripts/run-astro.mjs build && ...
```

- [ ] **Step 8: Full build and gate**

Run: `npm run format && npm run lint && npm run build && node "$SCRATCH/html-diff.mjs" "$SCRATCH/baseline" dist`
Expected: the new gate runs and passes; `IDENTICAL`.

- [ ] **Step 9: Confirm the test suite picks it up**

Run: `npm test`
Expected: both `check-bemit.test.mjs` and `check-content-coverage.test.mjs` run and pass.

- [ ] **Step 10: Update `CLAUDE.md`**

Add `check:content-coverage` to the Workflows section's list of build-gated checks, describing what it asserts. The existing list names each check and what it protects — match that style.

- [ ] **Step 11: Report and stop for commit**

---

## Phase 6 — CSS token discipline, misfiled rules, comments

**First phase that can move pixels.** Full ceremony applies: dual-stylesheet edits, `check:critical`, and a CSP rehash at the end.

The byte-diff gate no longer applies (CSS filename hashes change by design). The gate is the computed-style A/B from the BEMIT refactor.

### Task 6.1: Relocate the misfiled rules

These are ID selectors that bypassed `check:bemit` (which validates class names only), leaving one element's rules spread across three files.

**Files:**
- Modify: `src/styles/components/services.css:171-175`, `src/styles/components/common.css:79-90`, `src/styles/components/gantt.css`, `src/styles/components/testimonials.css`, `src/styles/components/section.css:341`, `src/styles/components/booking.css:4`
- Modify: `src/styles/critical-home.css` (only if any moved rule is duplicated there)

- [ ] **Step 1: Check whether the moved rules exist in `critical-home.css`**

Run: `grep -n "#testimonials\|#gantt-chart-container" src/styles/critical-home.css`

If there are matches, every edit below must be mirrored there. Record the answer before editing anything.

- [ ] **Step 2: Move `#testimonials` from `services.css` to `testimonials.css`**

Cut the `/* Testimonials Section */` comment and the `#testimonials { position: relative; }` rule from `services.css:171-175`. Add the rule to `testimonials.css` without the redundant banner comment — the filename says it.

- [ ] **Step 3: Move `#gantt-chart-container` from `common.css` to `gantt.css`**

Cut `common.css:79-90` (the `/* Experience Section */` banner plus the `#gantt-chart-container` and `.is-visible` rules) and append to `gantt.css`. Keep the `/* Initially hidden for scroll animation */` comment ONLY if the opacity rule is not self-evident — it restates `opacity: 0`, so delete it.

- [ ] **Step 4: Leave `section.css:341` alone for now**

That `#gantt-chart-container` reference sits inside a media query in a different component's file. Moving it risks a cascade-order change, since `section.css` and `gantt.css` load at different points in `global.css`. Check whether the rule's specificity and position matter; if in any doubt, leave it and note it in the report. **Cascade order is not worth a visual regression for tidiness.**

- [ ] **Step 5: Delete the stale `booking.css:4` banner**

`/* Contact Section */` heads no rules. Delete the line.

- [ ] **Step 6: Verify the moves preserved cascade order**

Run: `npm run build`

Then compare the emitted bundle's rule order:

```bash
node -e "const fs=require('fs');const f=fs.readdirSync('dist/_astro').find(n=>n.endsWith('.css'));const css=fs.readFileSync('dist/_astro/'+f,'utf8');for(const sel of ['#testimonials','#gantt-chart-container'])console.log(sel, css.indexOf(sel));"
```

Record the offsets. A rule that moved EARLIER in the bundle can now be overridden by something that previously lost to it.

- [ ] **Step 7: Run all the CSS gates**

Run: `npm run check:critical && npm run check:bemit && npm run check:theme && npm run check:charts && npm run check:breakpoints`
Expected: all pass.

### Task 6.2: Put raw values onto tokens

**Files:**
- Modify: `src/styles/components/nav.css:77`, `not-found.css:27`, `forms.css:66`, `gantt.css:224`, `work.css:126`, `work.css:215`
- Modify: `src/styles/critical-home.css` for any of the above duplicated there

- [ ] **Step 1: Resolve each raw value against the token scale**

For each of the six, compute the token whose value is exactly equal. `--font-size-*` tokens are in `settings.css:` the `--font-size-xs … --font-size-4xl` scale.

Build the mapping table BEFORE editing:

```bash
grep -n "font-size-\|--text-" src/styles/settings.css | head -40
```

- [ ] **Step 2: Substitute only exact matches**

Replace a raw value with a token **only where the computed result is identical**. `52px` in `not-found.css` may have no exact token — if so, DO NOT round it to the nearest one. Leave it, and list it in the report as needing either a new token or a design decision. Silently changing a size is exactly the regression this phase must avoid.

- [ ] **Step 3: Mirror every change in `critical-home.css`**

Run: `grep -n "22px\|52px\|1.25rem" src/styles/critical-home.css` and update any duplicated rule.

- [ ] **Step 4: Build and run the CSS gates**

Run: `npm run build`
Expected: `check:critical` passes — it is what catches a missed mirror.

### Task 6.3: Migrate the hand-rolled `clamp()`s onto `--text-*` role tokens

**Files:**
- Modify: `src/styles/components/about.css:64`, `article.css:46`, `blog.css:62`, `home-blog.css:62`, `services.css:94`, `skills.css:206`
- Modify: `src/styles/settings.css` (only if a new role token is genuinely needed)
- Modify: `src/styles/critical-home.css` for any duplicated rule

- [ ] **Step 1: List each existing clamp and the role token that matches it**

For each of the six, record: the current `clamp()` expression, and whether an existing `--text-*` token has an identical expression.

- [ ] **Step 2: Substitute exact matches only**

Where a role token's value is character-identical to the hand-rolled clamp, substitute it. Where it is close but not identical, DO NOT substitute — list it in the report as a design decision about whether those two roles should share a size. Judgment about which sizes should be unified belongs to the maintainer, not to this refactor.

- [ ] **Step 3: Mirror in `critical-home.css`, build, and run the gates**

Run: `npm run build`
Expected: `check:critical` and `check:theme` pass.

### Task 6.4: Delete the remaining label-only comments

**Files:**
- Modify: `src/styles/components/blog.css:5`, `common.css:85`, `footer.css:4`, `gantt.css:152`, `gantt.css:238`, `loading-screen.css:7`, `nav.css:5`, `section.css:5`, `skills.css:199`

- [ ] **Step 1: Delete only comments that restate their own filename or the line below**

Delete: `/* Blog */` in `blog.css`, `/* Footer */` in `footer.css`, `/* Loading Screen */` in `loading-screen.css`, `/* Navigation */` in `nav.css`, `/* Sections */` in `section.css`.

- [ ] **Step 2: Judge the remaining four individually**

`/* Position above the bar */` (`gantt.css:152`), `/* Responsive adjustments for Gantt Chart */` (`gantt.css:238`), `/* Feature cell */` (`skills.css:199`), `/* Initially hidden for scroll animation */` (`common.css:85`, if it survived Task 6.1).

Keep any that names something the CSS below does not make obvious. `/* Feature cell */` labelling a block of rules is a navigational aid in a 756-line file — keep it. Delete only true restatements. **When in doubt, keep the comment** — the cost of a redundant comment is far lower than the cost of deleting a load-bearing one.

- [ ] **Step 3: Confirm comment removal did not change the built CSS**

Run: `npm run build`

Comments are stripped by the production CSS minifier, so the emitted bundle should be byte-identical to Task 6.3's output:

```bash
node -e "const fs=require('fs');const f=fs.readdirSync('dist/_astro').filter(n=>n.endsWith('.css'));console.log(f.map(n=>[n,fs.statSync('dist/_astro/'+n).size]));"
```

If the filename hash is unchanged from Task 6.3, this task was provably cosmetic.

### Task 6.5: Verify Phase 6 visually and rehash the CSP

**Files:**
- Modify: `vercel.json` (`script-src` tokens)

- [ ] **Step 1: Copy the baseline CSS bundle into the new build**

```bash
SCRATCH="C:/Users/jerry/AppData/Local/Temp/claude/H--Updated-files-dynamicjoker-github-io/33f48a18-4ff8-4f45-aa59-f19435677a07/scratchpad"
cp "$SCRATCH"/baseline/_astro/*.css dist/_astro/
ls dist/_astro/*.css
```

Expected: two or more `.css` files — the old bundle and the new one. Note both filenames; the next step needs them.

- [ ] **Step 2: Run the computed-style A/B**

`npm run preview`, then run this in the browser pane via `javascript_tool`, substituting the two filenames from Step 1:

```js
const OLD = '/_astro/<baseline>.css';
const NEW = '/_astro/<current>.css';

async function text(url) {
  return (await fetch(url)).text();
}

async function snapshot(cssText) {
  // One injected <style>, all linked sheets disabled, motion frozen — so the
  // only variable between the two passes is the stylesheet under test.
  document.querySelectorAll('link[rel="stylesheet"]').forEach((l) => {
    l.disabled = true;
  });
  let tag = document.getElementById('ab-test-style');
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'ab-test-style';
    document.head.appendChild(tag);
  }
  tag.textContent =
    cssText + '\n*,*::before,*::after{animation:none!important;transition:none!important}';
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  // cssText on a computed style is empty in Chrome — enumerate properties.
  return [...document.querySelectorAll('body *')].map((el) => {
    const cs = getComputedStyle(el);
    const out = {};
    for (let i = 0; i < cs.length; i++) out[cs[i]] = cs.getPropertyValue(cs[i]);
    return out;
  });
}

const oldCss = await text(OLD);
const newCss = await text(NEW);
const a = await snapshot(oldCss);
const b = await snapshot(newCss);

const diffs = [];
for (let i = 0; i < Math.min(a.length, b.length); i++) {
  for (const prop of Object.keys(a[i])) {
    if (a[i][prop] !== b[i][prop]) {
      diffs.push({ index: i, prop, old: a[i][prop], new: b[i][prop] });
    }
  }
}
({ elements: a.length, lengthMatch: a.length === b.length, diffCount: diffs.length, sample: diffs.slice(0, 40) });
```

Expected: `diffCount: 0` and `lengthMatch: true`.

Both snapshots run in ONE page session — cross-session computed-style comparisons produce 100% false mismatches from environmental noise, so never compare a value captured in a different session.

- [ ] **Step 3: Repeat for a blog post and the 404 page**

Re-run Step 2 on `/blog/the-tiny-audience-that-moves-markets/` and a URL that 404s. Those pages use `article.css`, `blog.css` and `not-found.css`, which Tasks 6.2 and 6.3 touched and which the home page does not exercise.

- [ ] **Step 4: Triage every reported difference**

Expected: zero differences, unless Task 6.2 or 6.3 deliberately left an inexact substitution out. Any difference not explained by a recorded decision is a regression — fix it.

Then rebuild to clear the copied baseline bundle out of `dist/`:

Run: `npm run build`
Expected: one `.css` file in `dist/_astro/` again.

- [ ] **Step 5: Screenshot the three Phase 0 widths**

`npm run preview`, then capture 768 / 834 / 1024 and compare against the Phase 0 screenshots.

- [ ] **Step 6: Rehash the CSP**

Run: `npm run build && node scripts/csp-hashes.mjs`

Paste the printed tokens into `vercel.json`'s `script-src` list. The stylesheet-loader hash WILL have changed — CSS changed, and that inline script embeds the content-hashed CSS filename. This is expected here, unlike in Phases 3 and 4.

- [ ] **Step 7: Verify the CSP is correct before it ships**

Run `npm run preview` and check the browser console for CSP violations on the home page, a blog post, and the 404 page. A blocked stylesheet loader shows as a theme flash; a blocked Calendly script shows as a dead booking panel.

Note: `vercel.json` headers do NOT apply under `astro preview` — this checks that the page works, not that the header is served. The header itself can only be verified after deploy with `curl -sI https://jerryjames.me/`.

- [ ] **Step 8: Report and stop for commit**

Report every token substitution made, every one deliberately NOT made and why, and the CSP diff. Wait for "checked, committed, go".

---

## Phase 7 — Responsive fixes

Scope is whatever Phase 0 marked CONFIRMED. Nothing else.

**Deliberately NOT in scope: the mixed desktop-first / mobile-first methodology.**
The spec records it as a finding, and no task here addresses it. Unifying the
three `min-width` exceptions (`hero.css`, `about.css` twice) onto the dominant
`max-width` convention would mean inverting and re-testing every rule in those
blocks — high pixel risk, across the hero and About sections specifically, for
zero user-visible benefit. The `.01rem` twin convention already prevents the
gap-and-overlap bugs that mixing normally causes, and `check:breakpoints`
enforces it. Revisit only if a future change makes those blocks harder to reason
about; do not fold it into this cleanup.

### Task 7.1: Merge the duplicate media blocks

**Files:**
- Modify: `src/styles/components/skills.css:88, :703`, `src/styles/components/work.css:428, :769`

- [ ] **Step 1: Check whether merging is safe in each file**

Two `@media (max-width: 48rem)` blocks in one file are only mergeable if no rule between them would change outcome when the later block's rules move earlier. Read what sits between `skills.css:88` and `:703`, and between `work.css:428` and `:769`.

If any selector appears in BOTH blocks, merging changes the cascade. In that case, leave them separate and note why in the report — two blocks are a cosmetic wart; a cascade change is a real bug.

- [ ] **Step 2: Merge only where Step 1 proved it safe**

- [ ] **Step 3: Mirror in `critical-home.css` and build**

Run: `npm run build && npm run check:breakpoints`

### Task 7.2: Fix the confirmed responsive gaps

**Files:** determined by Phase 0's findings; expected `src/styles/components/skills.css`, `contact.css`, and their `critical-home.css` mirrors.

- [ ] **Step 1: Re-read `<scratchpad>/phase0-responsive-findings.md`**

Implement fixes ONLY for entries marked CONFIRMED. If Phase 0 refuted the tablet gap, this task is limited to Task 7.1 and this step closes the phase.

- [ ] **Step 2: Add the intermediate step on an existing token**

If the tablet gap is confirmed, add a `@media (max-width: 64rem)` step that reduces `.c-capabilities` from `repeat(6, 1fr)` to an intermediate column count before the 48rem collapse to `1fr`.

`--breakpoint-lg: 64rem` is already in the token scale, so `check:breakpoints` accepts it with no token addition. Do NOT introduce a new breakpoint token for this.

- [ ] **Step 3: Mirror every change in `critical-home.css`**

- [ ] **Step 4: Build and run all gates**

Run: `npm run format && npm run lint && npm run build`
Expected: `check:critical`, `check:breakpoints` and the rest pass.

- [ ] **Step 5: Re-measure at the Phase 0 widths**

`npm run preview`, then re-run the Task 0.2 Step 3 and Step 4 measurement snippets at 768 / 834 / 1024. Expected: the confirmed defect is gone and no new horizontal overflow appears.

- [ ] **Step 6: Confirm nothing regressed outside the fixed band**

Re-measure at 375, 1280 and 1920 and compare against the Phase 0 screenshots. A tablet fix must not disturb mobile or desktop.

- [ ] **Step 7: Rehash the CSP**

Run: `npm run build && node scripts/csp-hashes.mjs`, then paste the tokens into `vercel.json`. CSS changed again, so the stylesheet-loader hash changed again.

- [ ] **Step 8: Present before/after screenshots and stop for commit**

Show the Phase 0 and post-fix screenshots side by side at each measured width. Wait for "checked, committed, go".

---

## Completion

After Phase 7 is committed:

- [ ] Delete the scratchpad baseline and harness — they are throwaway and must never be committed.
- [ ] Confirm `git status --porcelain` is clean.
- [ ] Report the final tally: lines moved out of `main.js` and `HomeBody.astro`, values single-sourced, comments removed, new build gate added, and responsive defects fixed versus refuted.
