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

## 4. Component mapping

| Component (current)                        | Neumorphic treatment                                                                                             | Hybrid guardrail                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Primary button (`.c-btn--primary`)         | Soft raised shadow **under a solid accent fill** (`--color-primary`); on `:active` → inset                       | Keep the accent fill — never a same-color primary. Text ≥ 4.5:1 on the fill.         |
| Secondary button (`.c-btn`)                | Raised, monochrome; `:active` → inset                                                                            | Add a 1px `--color-hairline-strong` border for the ≥3:1 boundary.                    |
| Filter pills / segmented (`#portfolio`)    | Raised at rest, **inset when `is-active`** — the ideal use of the two states                                     | Active state also gets accent text/underline, not shadow alone (color-blind users). |
| Form inputs (`.c-contact-form__*`)         | **Inset** (you type "into" a recess)                                                                             | Keep a 1px border + the existing focus ring; inset shadow is not enough contrast.    |
| Cards / panels (services, blog, about)     | Raised container                                                                                                 | Decorative — safe to go fully soft.                                                  |
| Stat tiles (hero proof)                    | Raised tiles on the ground                                                                                       | Decorative — safe.                                                                   |
| Nav bar (`.c-nav`)                         | A raised floating bar **or** stay flat; the docked/scrolled shadow already exists                                | Keep it legible against content scrolling under it; don't lose the current elevation.|
| Toggles / theme switch                     | Track = inset, knob = raised — neumorphism's best-looking control                                                | Provide an on/off text or icon cue, not just position.                               |
| Availability dot / small status            | Leave flat; too small for the effect                                                                             | —                                                                                    |

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
