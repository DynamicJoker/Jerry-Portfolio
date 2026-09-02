# Codebase hygiene cleanup — design

Date: 2026-09-02
Status: approved, pending implementation plan

## Goal

Remove accumulated drift in the areas the maintainer named: content separation,
hardcoded values, oversized files, superficial comments, and responsive-design
practice. Restore the conventions this repo already documents in `CLAUDE.md`
rather than inventing new ones.

## Non-goals

These were considered and deliberately excluded:

- **Splitting `src/content.js`** (957 lines, 24 keys). It is the documented
  single source of truth; splitting trades one clear rule for a lookup.
- **Splitting `src/styles/critical-home.css`** (1967 lines). It is bound to the
  layer files by the `check:critical` contract; splitting doubles the surface
  that contract has to police.
- **A broad comment purge.** The comment corpus is an asset — the scroll-anchor
  rationale (`main.js:150`), the distiller-loop clock explanation
  (`main.js:579`), and the measured pixel rationales throughout the CSS are
  load-bearing knowledge. Only genuinely redundant or actively wrong comments
  are in scope: twelve label-only CSS comments and eight `<!-- X Section -->`
  banners in `HomeBody.astro`. Stripping the rest would be the regression.
- **Container queries.** Absent today, and correctly so: the home sections are
  used in exactly one context.
- **Splitting `work.css` / `hero.css` / `skills.css`.** Large, but each is one
  coherent component family. Size alone is not drift.

## Findings

Evidence gathered 2026-09-02 against `main` @ `8b454f7`.

### Healthy — no action

- `HomeBody.astro` contains **zero** hardcoded user-visible strings. Every
  label, `aria-label`, `alt` and `placeholder` resolves through `siteContent`.
- All width media queries already sit on `--breakpoint-*` tokens;
  `check:breakpoints` is holding.
- Comment quality is high throughout; the problem is confined to ~12 comments.

### 1. Content separation — three leaks

| Location | Leak |
|---|---|
| `src/pages/blog/[slug].astro:153-154` | Article CTA copy hardcoded in markup — the only such string in the repo |
| `src/components/HomeBody.astro:97-101, 113-122` | `industryOrder` / `assetTypeOrder` content-ordering lists live in a component |
| `src/main.js:1687` | Testimonials column aria-label hardcoded; `ui.testimonials` already exists as its home |

The ordering lists are the notable one: they are fragile, not merely misplaced.
A new industry or asset type added to `work-data.js` that is absent from these
arrays silently sorts to rank 99 with no error.

### 2. Hardcoded values

- **`SAMPLE_PER_TYPE = 3` is declared twice** — `HomeBody.astro:144` and
  `main.js:924` — held together only by a comment that says "must stay in
  sync". Divergence would silently desync the no-JS first paint from the JS
  default. Highest-value single fix in the audit.
- `numColumns = 3` (testimonial columns) hardcoded in `HomeBody.astro`.
- `main.js` has a `config` object, but ~12 tuning values escaped it:
  `main.js:93` (80), `:208` (4000), `:415` (150), `:436` (200), `:459` (3000),
  `:526` (0.3 threshold), `:592`/`:593` (`DISTILLER_RUN_MS` / `REST_MS` as loose
  module consts), `:747` (200), `:790` (200), `:1008` (2600), `:1302` (120).
  The pattern exists; it is just not held.
- Raw sizes where tokens exist: `nav.css:77` (`22px`), `not-found.css:27`
  (`52px`), `forms.css:66` (`16px`), `gantt.css:224` (`1.1rem`),
  `work.css:126` (`1.25rem`), `work.css:215` (`1.1rem`).
- The `--text-*` role-token system is **partly adopted**: `about.css:64`,
  `article.css:46`, `blog.css:62`, `home-blog.css:62`, `services.css:94` and
  `skills.css:206` each hand-roll a `clamp()` instead of using a role token.

### 3. File splitting

- `HomeBody.astro` — 1555 lines, 9 cleanly-bounded `<section>` blocks. Its
  frontmatter does four unrelated jobs: gantt date math, work-archive
  ranking/sorting/sampling, services CTA HTML building, and testimonial column
  splitting.
- `main.js` — 1807 lines, 17 independent `initializeX()` calls in one
  `DOMContentLoaded` block (`:126-148`). A textbook module split.

### 4. Superficial comments — and what they point at

Eight `<!-- X Section -->` banners in `HomeBody.astro` (`:165`, `:264`, `:332`,
`:821`, `:861`, `:925`, `:1235`, `:1325`) restate the `id` on the next line.
These disappear as a side effect of Phase 4.

Twelve label-only CSS comments. Three are not merely redundant — they are
**symptoms of misfiled rules**:

- `services.css:171-175` — `/* Testimonials Section */` heading a
  `#testimonials` rule that belongs in `testimonials.css`.
- `common.css:79-90` — `/* Experience Section */` heading
  `#gantt-chart-container` rules that belong in `gantt.css`.
- `booking.css:4` — a stale `/* Contact Section */` banner with no rules
  beneath it.

Relatedly, `#gantt-chart-container` rules are scattered across **three** files
(`common.css:81`, `section.css:341`, `gantt.css`). These are ID selectors, which
`check:bemit` does not police (it validates class names), so they bypassed the
convention gate. Only four ID selectors exist repo-wide, so this is contained.

### 5. Responsive drift

- **Single-breakpoint concentration.** 16 of 22 width queries in the layer files
  are `max-width: 48rem`. `--breakpoint-sm` (40rem) is used twice,
  `--breakpoint-xs` (30rem) once, `--breakpoint-lg` (64rem) three times.
- **Suspected tablet gap, 768–1024px — UNVERIFIED.** `.c-capabilities` is
  `repeat(6, 1fr)` (`skills.css:13`) and collapses straight to `1fr` at 48rem;
  `skills.css:159` and `contact.css:6` are `1fr 1fr` with the same cliff. A
  ~800px viewport therefore holds a six-column grid at full complexity. This
  must be measured in Phase 0 before any fix is designed.
- **Mixed methodology.** Mostly desktop-first (`max-width`) with three
  mobile-first exceptions (`hero.css` `min-width: 48.01rem`, `about.css`
  `min-width: 64rem` twice). The `.01rem` twin convention exists precisely to
  paper over this mixing.
- **Duplicate media blocks.** `skills.css:88` and `:703`; `work.css:428` and
  `:769` — two separate `max-width: 48rem` blocks per file.

## Ordering principle

Phases are ordered by **CSS/CSP risk, not by concern**, exploiting one
asymmetry in this repo:

> Changes to `.js` and `.astro` files need no CSP rehash, no dual-stylesheet
> sync and no `check:critical` — and their built output is byte-diffable
> against a baseline. Changes to `.css` need all three and can move pixels.

Verified: `index.astro:15` uses a bundled `<script>` (not `is:inline`), so the
app bundle ships as an external `/_astro/*.js` with `src=` and is never hashed
by `csp-hashes.mjs`. Only `BaseLayout.astro:112`'s inline loader — which embeds
the content-hashed CSS filename — is CSS-coupled.

Consequence: **all CSS work is quarantined into the final two phases.**
Everything before them is provably zero-change, so stopping the project
halfway stops it at a safe point.

Rejected alternative: working through the maintainer's concerns in the order
stated. It interleaves CSS and non-CSS work, forcing the CSP/dual-sync ceremony
into nearly every phase and destroying the byte-diff gate.

## Phases

Each phase ends with a build, a report, and a stop for manual check and commit.

### Phase 0 — Baseline and measurement (no code changes)

Build; snapshot `dist/` to the scratchpad as the golden reference; write a
throwaway HTML-diff harness. Measure the 768–1024px band in the browser pane at
768 / 834 / 1024 to confirm or refute the tablet gap.

Output: a baseline plus a **verified** responsive findings list. No responsive
fix is designed against an unmeasured suspicion.

### Phase 1 — Content separation and the desync hazard (JS/Astro)

Single-source `SAMPLE_PER_TYPE`; move `industryOrder`, `assetTypeOrder`, the
blog CTA copy, the testimonials column aria template and `numColumns` into
`content.js`.

Gate: `dist/` HTML byte-identical to baseline.

### Phase 2 — `main.js` constant discipline (JS)

Fold the ~12 escaped values into the existing `config` object, **carrying each
value's existing rationale comment with it** — several (`:459`'s 3000ms, which
must outlast a measured ~1.5s smooth scroll) encode measurements that must not
be lost in the move.

Explicitly excluded: converting JS-set inline styles to CSS classes. That would
drag CSS into a clean JS phase.

Gate: `dist/` HTML byte-identical; preview smoke test.

### Phase 3 — Split `main.js` into ES modules (JS)

The 17 initializers become feature modules over shared `config` / `dom`
(`cssLengthToPx`, `getBreakpointPx`) / `scroll` (rAF batching,
`scrollFrameCallbacks`) / `viewport` (`watchViewportPresence`,
`revealOnEnterViewport`) cores. `main.js` becomes a thin bootstrap invoking
them in the same order.

The bundle filename hash changes. Expected CSP-neutral per the ordering
principle; the phase **re-runs `csp-hashes.mjs` and confirms the token set is
unchanged** rather than assuming it.

Gate: `dist/` HTML byte-identical; per-feature preview smoke test.

### Phase 4 — Split `HomeBody.astro` into section components (Astro)

Nine section components, plus the four frontmatter jobs extracted into pure,
independently testable modules (`gantt`, `work-archive`, `services`,
`testimonials`). The eight banner comments die as a side effect.

This is the phase where the byte-diff gate earns its keep: Astro 7's JSX
whitespace handling is exactly what component boundaries perturb silently, and
it is why `compressHTML: true` is load-bearing.

Gate: `dist/` HTML byte-identical to baseline — non-negotiable here.

### Phase 5 — Guardrails (new scripts)

Add `check:content-coverage`: assert every `industry` and `assetType` present in
`work-data.js` appears in the `content.js` ordering lists and has an entry in
`assetTypeLabels`. This closes the rank-99 silent-failure class found above.

Wire into `npm run build` alongside the existing `check:*` gates, with a test
following the `check-bemit.test.mjs` precedent.

Gate: the new check fails on a deliberately introduced violation and passes
clean.

### Phase 6 — CSS token discipline, misfiled rules, comments (first pixel risk)

- Raw `22px` / `52px` / `16px` / `1.1rem` / `1.25rem` onto tokens.
- The six hand-rolled `clamp()`s onto `--text-*` role tokens.
- Relocate `#testimonials` to `testimonials.css` and consolidate the
  `#gantt-chart-container` rules into `gantt.css`; prefer class selectors where
  the markup allows it without a BEMIT rename.
- Delete the twelve label-only comments, which are redundant once the rules sit
  in the right file.

Full ceremony: dual-stylesheet sync, `check:critical`, `check:bemit`, CSP rehash
via `npm run build && node scripts/csp-hashes.mjs`.

Gate: computed-style A/B per the BEMIT-refactor technique. Token substitutions
that are not exactly equivalent are reported for a decision, not silently
accepted.

### Phase 7 — Responsive fixes (confirmed gaps only)

Merge the duplicate `48rem` blocks in `skills.css` and `work.css`. Fix only what
Phase 0 confirmed. If the tablet gap is real, add the intermediate step on
`--breakpoint-lg`, which is already in the token scale — no new token needed.

Full CSS ceremony as Phase 6, plus before/after screenshots at the measured
widths presented before the phase is considered done.

## Verification strategy

Three gates, strongest first:

1. **HTML byte-diff** (Phases 1–5). `dist/*.html` must be byte-identical to the
   Phase 0 baseline. Proves zero user-visible change outright.
2. **Computed-style A/B** (Phases 6–7). Reuses the documented BEMIT-refactor
   technique: load each page in an offscreen iframe, swap old and new CSS text
   through one injected `<style>` with animations frozen, and diff
   `getComputedStyle` property-by-property. Cross-session computed-style hashes
   are not comparable; iterate properties.
3. **Preview smoke test** (Phases 2–3, where behaviour rather than markup
   changes). `npm run build` then `npm run preview` — `npm run dev` is broken on
   this machine.

## Risks

| Risk | Mitigation |
|---|---|
| Astro 7 whitespace trap on component split (Phase 4) | HTML byte-diff gate catches it deterministically |
| CSP hash drift on any CSS change | Phases 6–7 checklist ends with `csp-hashes.mjs`; Phase 3 confirms no drift rather than assuming |
| Dual-stylesheet divergence | `check:critical` is build-gated; both files edited together |
| Token substitution not visually equivalent (`52px` has no exact token) | Reported for a decision, never silently rounded |
| Losing measured rationale when moving constants | Comments move with their values; Phase 2 reviews each |
| Regression slipping through a batched change | One phase at a time, stop for manual check and commit |

## Cadence

One phase at a time. After each: run the build, report what changed, and wait
for an explicit "checked, committed, go". No automatic commits or pushes — the
maintainer commits manually.
