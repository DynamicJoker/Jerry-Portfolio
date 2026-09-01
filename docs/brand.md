# Brand palette & typography reference

Orientation doc for anyone (human or agent) styling this site. The **live
source of truth is `src/styles/settings.css`** (mirrored subset in
`src/styles/critical-home.css`) — if this doc and the tokens ever disagree,
the tokens win; update this doc in the same change.

## Typography

| Role                    | Face                     | Token                   | Notes                                                                                                     |
| ----------------------- | ------------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------- |
| Body (all pages)        | **Krub**                 | `--font-family-base`    | Static weights 400 / 500 / 600, self-hosted via `@fontsource/krub`, preloaded on the home page.            |
| Headings h1–h6, display | **Inter** (variable)     | `--font-family-display` | Single variable file (wght axis) via `@fontsource-variable/inter`. Enables the off-grid weights 460 / 550. |
| Mono accents (kickers)  | **JetBrains Mono** (variable) | `--font-family-mono` | Single variable file (wght axis) via `@fontsource-variable/jetbrains-mono`. Self-hosted + preloaded on the home page, same as the other two. |

Key weights: `--font-weight-medium: 500`, `--font-weight-semibold: 550`
(works because Inter is variable), `--font-weight-bold: 600`,
`--text-hero-weight: 460`.

All three faces are declared as hand-written `@font-face` blocks in
`BaseLayout.astro` (not via the fontsource CSS entrypoints), so the family
names there — `'Krub'`, `'Inter'`, `'JetBrains Mono'` — are what the tokens
must reference. `--font-family-mono` is declared in **both** `settings.css`
and `critical-home.css`: the hero eyebrow uses it above the fold, so the
token has to exist before the deferred stylesheet lands.

Type sizes are **fluid-first**: heading roles are `--text-<role>` tokens
(hero, section-title, kicker, card/panel/timeline titles, article/blog
roles, chart annotations), most defined with `clamp()`. A type-scale
redesign should be a token-value-only edit — never put raw `font-size`
values in component CSS.

Exception — SVG text: the brand wordmark (`nav.css`) and the 404 graphic
(`not-found.css`) use `px` font-sizes on `<text>` elements. Those are **SVG
user units inside a viewBox**, not screen pixels; leave them alone.

## Color palette

Semantic tokens; components must never hardcode colors. Light values live in
`:root`, dark overrides in the two build-enforced dark blocks
(`npm run check:theme`).

| Token                    | Light                  | Dark                      |
| ------------------------ | ---------------------- | ------------------------- |
| `--color-background`     | `#f0eeea`              | `#1a1d29`                 |
| `--color-surface`        | `#ffffff`              | `#1a1d29`                 |
| `--color-surface-raised` | `#ffffff`              | `#232633`                 |
| `--color-text`           | `#1a1a2e`              | `rgba(232, 232, 234, 1)`  |
| `--color-text-secondary` | `#555562`              | `rgba(154, 154, 165, 1)`  |
| `--color-primary`        | `#4a6d84` (slate blue) | `#57b9ff` (signal blue)   |
| `--color-primary-hover`  | `#426074`              | `#90d5ff`                 |
| `--color-accent`         | `#2f6e96`              | `#90d5ff`                 |
| `--color-ember`          | `#f5822b`              | `#d0701c`                 |
| `--color-ember-ink`      | `#c2410c`              | `#f2954f`                 |
| `--color-error`          | `rgba(192, 21, 47, 1)` | `rgba(255, 84, 89, 1)`    |

Status colors (theme-invariant): `--color-success: #22c55e` (availability
dot, with `-glow`/`-ring` alpha derivatives) and the toast backgrounds
`--color-notification-success` / `--color-notification-error` (keep ≥4.5:1
against white text). `--color-on-success: #ffffff` is the foreground on a
success fill — it does **not** flip per theme, because the fill it sits on
doesn't either. `--color-scrim: rgba(8, 9, 13, 0.8)` backs the work lightbox's
`::backdrop`, dark in both themes so the modal always has something to sit
against.

### Ember (statement accent)

The one warm statement colour, played against the signal blues. **Semantics:
now / current / impact** — ember marks what is *live* and the payoff, never
decoration. Two tokens, because ember-as-fill and ember-as-text have different
contrast needs:

- **`--color-ember-ink`** (`#c2410c` light / `#f2954f` dark) — **the ember to
  reach for.** The deeper (light) / brighter (dark) ember, and the only one that
  holds up in both themes (4.47:1 / 7.34:1). It carries text (the hero impact
  word, "moves buyers"), on-fill labels (the button/filter press states, white
  ≥4.5:1 on it), **chart series 2** (`--chart-series-2`), *and* every mark: the
  experience timeline's current ("Present") bars, the About ledger now-node, the
  section kicker tick, and the skills distiller's output.
- **`--color-ember`** (`#f5822b` light / `#d0701c` dark) — the raw vivid brand
  hue. Only ~2.23:1 on the light ground, which fails the **3:1 bar for
  meaningful non-text graphics** (WCAG 1.4.11), not just the text bar. It used
  to own the marks listed above on the reasoning that "decorative marks don't
  need contrast" — but in light mode they washed out while reading loud in dark,
  so the same mark looked like two different colours depending on the theme
  (swept and fixed 2026-09-02). **Currently unused.** Don't reach for it without
  measuring it against whatever it lands on.

`--color-ember-rgb` (`245, 130, 43` / `208, 112, 28`) backs the alphas in
`--ember-shine` — the fading ember border shine layered on hover (a tight ring
+ a soft glow; F2 "balanced"). All the colour tokens mirror into
`critical-home.css` (the hero impact word is above the fold) and live in both
dark blocks (`check:theme`); `--ember-shine` is a theme-independent recipe, so
like the `--neu-shadow-*` recipes it lives only in `settings.css` `:root`.

**Ember vs clay:** ember is the *statement / data* accent; clay
(`--tint-editorial`, below) is the *editorial / writing* wash. They never
overlap — clay is never a statement or a data-series colour, and ember never
washes a surface.

### Editorial tint

The one accent outside the signal blues. `--tint-editorial-rgb: 201, 138, 91`
(clay) is the second hue in the blog surfaces' wash, played against
`--color-primary` as the corner glow on `.c-blog-shell` / `.c-article-shell`.
It is warm on purpose — the ramp below is all blues, so a fourth blue reads as
the primary slightly off rather than as a pair, while the ground (`#f0eeea`) is
warm and gives it something to sit with.

Split into an rgb triplet (like `--color-primary-rgb`) plus a composed
`--tint-editorial-shell` (`0.08` light / `0.12` dark), so the hue is declared
once rather than repeated across all three theme blocks. The dark alpha is
higher because a tint over a dark ground reads weaker per unit alpha.

Replaced a violet (`#8f5cff`) that was never in this document. Clay at these
alphas composites to within 0.2 of the violet's visual weight in light, so the
swap changed hue, not intensity. The home page's blog band was a second
consumer on paper, but its rule lost to `.c-section:nth-child(2n)` and never
rendered; it has been removed rather than promoted — see
`components/home-blog.css`.

The background pair (`#f0eeea` / `#1a1d29`) doubles as the browser
`theme-color`: pre-paint hints come from `profile.themeColors` in
`src/content.js`; after paint the SiteNav controller re-reads the live
token. Keep all three in step.

Both backgrounds are deliberately **mid-tone, not near-white / near-black**:
they double as the neumorphic ground (`--neu-bg` equals `--color-background`
in each theme), and a raised surface only reads as an extrusion when it
shares the page color and has headroom for both tints — a white highlight
above and a darker tint below. Retuning either background means retuning
that theme's `--neu-shadow-dark` / `--neu-shadow-light` with it.

## Brand gradient ("signal blues")

The logo, favicon, and 404 graphic use a fixed gradient ramp, hardcoded in
the SVGs because standalone SVG files can't read CSS variables (see
CLAUDE.md). Same hexes in `BrandLogo.astro`, `public/brand/*`, and
`src/pages/404.astro`:

| Hex       | Role                                                 |
| --------- | ---------------------------------------------------- |
| `#D6EFFF` | Ice highlight (gradient start)                       |
| `#90D5FF` | Light signal blue (also dark-mode accent)            |
| `#57B9FF` | Signal blue (gradient core; dark-mode primary)       |
| `#517891` | Slate anchor (gradient end)                          |
| `#07090c` | Icon plate background (`jj-signal-icon.svg` only)    |

The gradient spans both themes' blues, which is why the brand marks work
unchanged in light and dark. Note the slate anchor is no longer identical to
the light-mode `--color-primary` (`#4a6d84`): the token was darkened a step so
it clears AA as text on the mid-tone ground, while the gradient keeps the
original `#517891` — the marks sit on their own plate, not on body text, so
they were never the constraint. Don't "resync" the two.

## Rules of thumb

- New styles consume tokens (`var(--…)`) — colors, spacing (`--space-*`),
  radii, shadows, z-index (`--z-*`), durations. Raw values in component CSS
  are a code smell unless they're SVG user units or one-off geometry.
- Anything themed needs a value in **both** dark blocks of `settings.css`
  (they must stay token-identical — `check:theme`) and, if used above the
  fold on the home page, mirrored in `critical-home.css` (`check:critical`).
- Media queries can't read tokens: breakpoint literals (`48rem`, `64rem` =
  `--breakpoint-md`/`-lg`) carry keep-in-step comments instead.
