# Neumorphism UI direction — implementation guidelines

Orientation doc for the agent implementing a neumorphic ("soft UI") redesign of
this site. Read [`docs/brand.md`](brand.md) and `CLAUDE.md` first — this doc
_extends_ that system; it does not replace it. The **live source of truth stays
`src/styles/settings.css`** (mirrored subset in `critical-home.css`). Everything
here is expressed in the existing token + BEMIT/ITCSS architecture so the change
is additive, not a rewrite.

---

## 0. Read this before you start: verdict & honest tradeoffs

Neumorphism is a real, coherent aesthetic, and this site's palette happens to
suit it (near-monochrome surfaces already). But pure neumorphism has two
well-documented problems that collide directly with commitments this project has
already made:

1. **Accessibility.** Soft same-color shadows routinely fail WCAG 2.1 **1.4.11
   Non-text Contrast** (interactive boundaries need ≥ 3:1). A "pure" neumorphic
   button is nearly invisible as a control. This site has a live a11y backlog
   and a WCAG-AA posture — shipping pure neumorphism would regress it.
2. **Performance.** The effect is built from **two large-blur `box-shadow`s per
   element**. Box-shadow is paint-bound, not composited, so it's expensive to
   render and _very_ expensive to animate — exactly the CPU-raster cost that the
   recently-added `data-perf="lite"` mode exists to avoid on GPU-less / hardware-
   acceleration-off machines.

**Recommended direction: "neumorphism-lite" (hybrid), not pure.** Keep the soft
extruded/inset surfaces for _non-critical, decorative_ containers (cards, panels,
stat tiles, the hero proof panel). For anything a user must find, read, or
operate — primary buttons, form fields, focus states, nav — keep a real border
and/or a solid accent fill on top of the soft shadow. Every mockup in the
companion artifact follows this hybrid rule. The rest of this doc assumes it.

---

## 1. Core principles of the style

1. **One ground, monochrome surfaces.** Elements are the _same_ color as the
   surface behind them. Depth comes only from light, never from a different fill
   or a hard border. (This is why `--color-surface` must equal the ground — see
   §2.)
2. **A single, consistent light source.** Convention here: **top-left**. Every
   raised element therefore casts a light highlight to its top-left and a dark
   shadow to its bottom-right. Never mix light directions on one screen.
3. **Two shadows, always paired.** Raised = one dark + one light shadow, both
   _outset_. Inset (pressed / recessed / input) = the same pair with the `inset`
   keyword.
4. **Soft and low-contrast.** Large blur, short offset, shadow colors derived
   from the surface (a slightly darker and a slightly lighter tint of the same
   hue) — not black/white at full strength.
5. **Rounded, generous.** The illusion reads best at larger radii and with
   breathing room; cramped, sharp-cornered elements look flat.
6. **Accent used sparingly.** The signal-blue accent is the one place saturation
   appears — primary action, focus, active state. Everything else is the quiet
   monochrome ground.

State encodes meaning: **raised = actionable / at rest**, **inset = pressed,
selected, or an input you type into**. Toggling raised↔inset is the signature
interaction.

---

## 2. Token additions (`settings.css` + `critical-home.css`)

Neumorphism needs the surface to match the ground. Today `--color-surface` is
`#ffffff` on a `#fafaf9` ground (light) and `#1a1d29` on `#0f1117` (dark). Two
options:

- **Preferred:** introduce dedicated `--neu-*` tokens and apply them only on
  components you convert, leaving `--color-surface` alone. Lowest blast radius.
- Alternative: shift `--color-surface` to equal `--color-background`. Simpler
  conceptually but touches every existing component at once — avoid for a phased
  rollout.

Add these (both dark blocks must match — `npm run check:theme`; mirror in
`critical-home.css` for anything used above the fold — `npm run check:critical`):

```css
/* :root (light) */
--neu-bg: #fafaf9; /* ground == surface */
--neu-shadow-dark: #e2e1db; /* ground darkened ~8% (warm) */
--neu-shadow-light: #ffffff; /* ground lightened to white */
--neu-distance: 0.375rem; /* 6px offset */
--neu-blur: 0.875rem; /* 14px */
--neu-distance-sm: 0.25rem; /* 4px — small controls */
--neu-blur-sm: 0.5rem; /* 8px */

/* dark blocks — @media (prefers-color-scheme: dark) AND [data-color-scheme='dark'] */
--neu-bg: #1a1d29; /* mid-dark, NOT #0f1117 — a near-black ground kills the highlight */
--neu-shadow-dark: #0c0e15;
--neu-shadow-light: #262a3b; /* ≈ existing --color-surface-raised */
```

> Dark-mode note: the whole page ground can stay `#0f1117`, but neumorphic
> _surfaces_ must sit on the lighter `#1a1d29` so the top-left highlight is
> visible. On true near-black there is no "lighter" tint to highlight with and
> the effect collapses into a flat blob.

Radii: bump converted components toward `--radius-lg` (12px) or add a
`--radius-xl: 1rem`/`1.25rem`; soft UI needs the larger corners.

---

## 3. The recipes (shadow utilities)

Define two reusable declarations. Prefer applying them via the existing
component classes rather than utility soup; shown here as the raw values.

```css
/* Raised (convex, at rest / actionable) */
box-shadow:
  var(--neu-distance) var(--neu-distance) var(--neu-blur) var(--neu-shadow-dark),
  calc(var(--neu-distance) * -1) calc(var(--neu-distance) * -1) var(--neu-blur)
    var(--neu-shadow-light);

/* Inset (concave, pressed / selected / input) */
box-shadow:
  inset var(--neu-distance) var(--neu-distance) var(--neu-blur)
    var(--neu-shadow-dark),
  inset calc(var(--neu-distance) * -1) calc(var(--neu-distance) * -1)
    var(--neu-blur) var(--neu-shadow-light);
```

**Do not animate `box-shadow` between these** (paint-bound → jank). To animate a
press, either (a) swap the class and let it be instantaneous, or (b) cross-fade
two stacked pseudo-elements (`::before` raised, `::after` inset) via `opacity`,
which _is_ compositable. Pair any hover lift with `transform: translateY(-1px)`,
never a shadow-size transition on many elements at once.

---

## 4. Coverage — every page and component

This is the full surface area. Treatment legend:

- **Raised** — soft convex container (decorative; safe to go fully soft).
- **Inset** — recessed well / input / selected state.
- **Hybrid control** — soft shadow **plus** a border and/or accent fill and a
  real focus ring (anything a user operates; see §5).
- **Flat** — no neumorphism (too small, or type-only).
- **N/A — third-party** — can't touch the internals; style only the wrapper.
- **N/A — SVG/animated** — its own visual language; `box-shadow` doesn't apply
  to inner SVG shapes. Optionally frame it in a raised card.

### 4.1 Routes

| Route                     | File(s)               | Notes                                                                    |
| ------------------------- | --------------------- | ------------------------------------------------------------------------ |
| Home `/`                  | `pages/index.astro` + `HomeBody.astro` | The bulk of the work — see §4.3.                       |
| Blog index `/blog`        | `pages/blog/index.astro`, `blog.css`   | Hero + post cards — see §4.4.                          |
| Blog post `/blog/[slug]`  | `pages/blog/[slug].astro`, `article.css` | Prose + hand-authored MDX charts — see §4.4.         |
| 404                       | `pages/404.astro`, `not-found.css`     | SVG graphic stays; only actions/container change — §4.4.|
| `llms.txt` `robots.txt` `rss.xml` | `pages/*.js`  | No UI. **N/A.**                                                          |

### 4.2 Global chrome (every page)

| Component            | File                 | Treatment            | Notes / guardrail                                                                                             |
| -------------------- | -------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------ |
| Nav bar `.c-nav`     | `nav.css`            | Hybrid raised / flat | Raised floating bar **or** flat; keep the existing scrolled elevation. **Above the fold → mirror in `critical-home.css`.** |
| Mobile nav sheet     | `nav.css`            | Raised panel         | The slide-out sheet as a raised surface; keep `--shadow-sheet` legible over content.                          |
| Active nav marker    | `nav.css`            | Flat + accent        | Keep the accent underline/marker; don't rely on an inset alone for "current page".                            |
| Beta banner `.c-beta-banner` | `beta-banner.css` | Raised strip     | Subtle raised top strip (it already carries a shadow); expand/collapse control = small raised→inset. **Above the fold → mirror in critical.** Drop the `backdrop-filter` blur → flat fill (perf, §6). |
| Footer `.c-footer`   | `footer.css`         | Flat / inset well    | Keep flat, or sit the footer in one large inset "trough" to close the page. Links stay flat with hover.       |
| Loading screen `.c-loading-screen` | `loading-screen.css` | **Flat** | Leave the pulse dots flat — neumorphic shadows at first paint add cost at the worst moment. Already lite-gated. |
| Section kickers/headers `.c-section*` | `section.css` | **Flat** | Type + CSS-counter only; no surface. The `01 / About` counters and reveal animation stay as-is.               |

### 4.3 Home sections (`HomeBody.astro`)

| Section                       | File               | Treatment            | Notes / guardrail                                                                                                     |
| ----------------------------- | ------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Hero `.c-hero`                | `hero.css`         | Flat ground + float  | Flat soft ground; gradient name kept; proof panel floats (raised or inset). Aurora decision in §7. **Mirror in critical.** |
| Hero proof stat tiles         | `hero.css`         | Raised               | Decorative — safe. **Above the fold → mirror in critical.**                                                          |
| Availability dot `.c-availability-dot` | `common.css` | **Flat**          | Too small for the effect; keep the glow/pulse (lite-gated).                                                          |
| Logo bar `.c-logo-bar`        | `logo-bar.css`     | Inset well **or** flat | House the mono `currentColor` logos in one recessed trough, **or** leave flat. Don't bury low-contrast logos in shadow. |
| About / pipeline `.c-pipeline`| `about.css`        | Raised nodes + flat  | Node dots/cards raised; connector line + animated "current" flow kept (decorative, already lite-gated).              |
| Skills — capability cards `.c-capability` | `skills.css` | Raised / hybrid | Cards raised; collapsible ones (`--collapsible`) go **inset when expanded**; the chip/CTA controls are hybrid.       |
| Skills — distiller `.c-distiller` | `skills.css`   | **N/A — SVG/animated** | An animated SVG (9 loops); box-shadow can't sculpt its inner shapes. Leave its language; optionally frame in a raised card. Already lite-gated. |
| Work — featured spread        | `work.css`         | Raised panel         | The one-at-a-time editorial feature = a large raised showcase panel.                                                 |
| Work — archive filters `.c-archive__filter` | `work.css` | Hybrid pills   | Raised → **inset when active**, plus accent text (same rule as the portfolio filters in the mockup).                 |
| Work — archive item cards     | `work.css`         | Raised               | ~251-item grid — keep the shadow **small/soft** and **flatten under lite** (this is a many-element grid, §6).        |
| Work — count/empty/pagination | `work.css`         | Flat                 | Type + simple controls; pagination buttons are hybrid if present.                                                    |
| Services `.c-service*`        | `services.css`     | Raised rows          | The 3 engagement rows as raised panels; any tags/CTAs hybrid.                                                        |
| Testimonials `.c-testimonial` | `testimonials.css` | Raised cards        | **Highest perf risk:** many raised cards inside an infinite marquee → soft/small shadow only + **must flatten under lite** (§6). Pause control = raised→inset. |
| Experience gantt `.c-gantt`   | `gantt.css`        | Inset track + bars   | Timeline track inset; bars raised or accent-filled; tooltip = raised card + border (drop the `backdrop-filter` blur, §6). |
| Home blog teasers `.c-home-blog` / home-blog cards | `home-blog.css` | Raised    | Standard raised cards.                                                                                               |
| Contact form `.c-contact-form__*` | `contact.css` | Inset inputs        | Inputs inset + border + focus ring; submit = primary (accent fill); keep the success/pulse feedback states.         |
| Booking — CTA bar `.c-booking-cta` | `booking.css` | Hybrid raised→inset | The "book a call" control bar.                                                                                       |
| Booking — Calendly panel `.c-calendly-panel` | `booking.css`, `section.css` | **N/A — third-party** | Style only the surrounding panel (raised frame / inset well) + loading dots. **Cannot** neumorph inside the iframe; the dark-mode invert filter stays. |

### 4.4 Blog & 404

| Component                         | File           | Treatment            | Notes / guardrail                                                                                              |
| --------------------------------- | -------------- | -------------------- | ------------------------------------------------------------------------------------------------------------ |
| Blog index hero + post cards      | `blog.css`     | Raised cards         | Post cards raised; hero flat + type.                                                                          |
| Article shell `.c-article-shell`  | `blog.css`, `beta-banner.css` | Flat        | The reading column stays flat — prose is not a neumorphic surface.                                            |
| Article prose (p / h / li)        | `article.css`  | **Flat**             | Body text on the flat ground. Do **not** put shadows behind paragraphs.                                       |
| Blockquotes / callouts            | `article.css`  | Inset well           | A recessed quote reads well and is safe (non-interactive).                                                    |
| Code blocks                       | `article.css`  | Inset well           | Recessed code panel; keep syntax contrast.                                                                    |
| Cover image `.c-article__cover`   | `article.css`  | Raised frame         | Soft raised frame around the image.                                                                           |
| MDX charts `.c-article-chart*`, `.c-stacked-bar*` | `article.css` | Raised card + inset bars | Container raised; bar tracks inset, fills flat/accent. **Content-coupled:** these classes are hand-written in published `.mdx` — restyle via CSS only, **do not rename** (would require editing posts, per CLAUDE.md). |
| Back link / CTA `.c-article__back`, `.c-article__cta` | `article.css` | Hybrid buttons | Same button rules as §4.2.                                                                                    |
| 404 graphic                       | `not-found.css`| **N/A — SVG**        | Hardcoded-gradient SVG stays; its `nf-*` loops are already lite-gated.                                         |
| 404 actions `.c-not-found__actions` | `not-found.css` | Hybrid buttons     | Same button rules.                                                                                            |

### 4.5 Special cases to plan around

- **Third-party (wrapper only):** Calendly iframe.
- **SVG / hand-drawn (own language):** skills distiller, 404 graphic, brand
  logo/wordmark — `box-shadow` doesn't sculpt inner SVG shapes.
- **Perf-critical (small/soft shadow + must flatten under `data-perf='lite'`):**
  testimonials marquee, work archive grid, pipeline flow, gantt (§6).
- **Above-the-fold (mirror in `critical-home.css`):** nav, beta banner, hero,
  first stat tiles.
- **Content-coupled (restyle only, never rename):** the MDX chart classes.

---

## 5. Accessibility requirements (non-negotiable)

- **Non-text contrast (1.4.11):** every interactive control needs a ≥ 3:1
  boundary against the ground. Soft shadow alone does **not** qualify — add a
  border or an accent fill. Verify with the design a11y skill / contrast tooling.
- **Focus:** keep the existing visible focus ring
  (`box-shadow: 0 0 0 5px rgba(var(--color-primary-rgb), 0.18)` / solid
  `outline`). An inset shadow is _not_ a focus indicator. Focus must be
  distinguishable from the resting and pressed states.
- **State never by shadow alone:** selected/pressed/active must also change
  color, weight, icon, or text — depth is invisible to low-vision and
  color-blind users.
- **Text contrast is unaffected** and must stay AA: text sits on the solid
  surface, so `--color-text` on `--neu-bg` is still ~14:1 (light) — good. Don't
  drop text onto the shadowed edges.
- **`forced-colors` / Windows High Contrast:** shadows are dropped by the OS.
  Provide a `@media (forced-colors: active)` fallback with real borders so
  controls don't vanish.
- **`prefers-contrast: more`:** strengthen borders / switch to flat bordered UI.
- **`prefers-reduced-motion`:** no press/lift animation (already handled
  globally — keep it).

---

## 6. Performance (ties into the existing `data-perf` system)

Two soft shadows on every card/button multiplies paint work, and the effect is
worst on the machines the `data-perf="lite"` probe already targets.

- **Flatten under lite mode.** In `src/styles/components/perf.css`, add
  `[data-perf='lite']` overrides that replace the dual `box-shadow` with a
  single subtle shadow or a 1px border, and drop any shadow/opacity transitions.
  This is the same pattern already used for the aurora/blur/marquee fallbacks.
- **Never transition `box-shadow`** on scroll/hover across many elements (§3).
- **Watch stacking on scroll:** a page full of large-blur shadows repaints on
  every scroll frame if any of them sits in a layer that invalidates. Test the
  home page scroll on a throttled CPU before shipping.

No new inline scripts are required, so the **CSP hash list is unaffected** unless
you change an inline script or the CSS filename indirectly — but remember the
standing rule: after CSS changes, `npm run build && node scripts/csp-hashes.mjs`
and paste tokens into `vercel.json` before deploy (the deferred-stylesheet loader
hash embeds the CSS filename).

---

## 7. Interactions with existing systems

- **Theme system:** neu tokens live in all three theme places (light `:root`,
  `@media (prefers-color-scheme: dark)`, `[data-color-scheme='dark']`) and must
  stay token-identical across the two dark blocks (`check:theme`).
- **Dual stylesheet:** any neu rule used above the fold (hero proof panel, nav,
  first stat tiles) must be duplicated in `critical-home.css` _and_ the layer
  file (`check:critical`).
- **Hero aurora / gradient:** neumorphism wants a single flat ground; the drifting
  gradient aurora fights the fixed light source. Decide one: either (a) keep the
  aurora but let the neumorphic proof panel float above it as the one soft object
  (recommended — preserves brand character), or (b) retire the aurora on the hero
  for a flat neu ground. Don't do both half-way.
- **BEMIT/ITCSS:** new classes follow `c-block__element--modifier`; new component
  file (e.g. `components/neu.css` or per-component) imported in `global.css`
  before `utilities.css`. `is-*`/`has-*` for JS state (pressed/active).

---

## 8. Suggested rollout (phased, low-risk)

1. **Foundations:** add `--neu-*` tokens (both themes + critical mirror) and the
   two shadow recipes. Ship nothing visual yet.
2. **Decorative first:** convert cards, panels, stat tiles, hero proof panel —
   the safe, high-impact surfaces. Validate look in both themes.
3. **Controls with guardrails:** buttons and filter pills, _with_ borders/fills
   and preserved focus. Run the a11y skill / contrast audit here.
4. **Inputs:** contact form to inset, keeping borders + focus ring.
5. **`data-perf='lite']` flatten pass** + throttled-CPU scroll test.
6. **Nav / theme toggle** last (highest visibility, most regression risk).

Gate each phase on `npm run build` (prettier, eslint, `check:critical`,
`check:bemit`, `check:theme`) before moving on.
