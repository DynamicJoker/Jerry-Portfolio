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
| Mono accents (kickers)  | **Berkeley Mono**        | `--font-family-mono`    | Local-only — not shipped; most visitors get the `ui-monospace` fallback chain. Don't rely on its metrics.  |

Key weights: `--font-weight-medium: 500`, `--font-weight-semibold: 550`
(works because Inter is variable), `--font-weight-bold: 600`,
`--text-hero-weight: 460`.

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
| `--color-background`     | `#fafaf9`              | `#0f1117`                 |
| `--color-surface`        | `#ffffff`              | `#1a1d29`                 |
| `--color-surface-raised` | `#ffffff`              | `#232633`                 |
| `--color-text`           | `#1a1a2e`              | `rgba(232, 232, 234, 1)`  |
| `--color-text-secondary` | `#555562`              | `rgba(154, 154, 165, 1)`  |
| `--color-primary`        | `#517891` (slate blue) | `#57b9ff` (signal blue)   |
| `--color-primary-hover`  | `#426074`              | `#90d5ff`                 |
| `--color-accent`         | `#2f6e96`              | `#90d5ff`                 |
| `--color-error`          | `rgba(192, 21, 47, 1)` | `rgba(255, 84, 89, 1)`    |

Status colors (theme-invariant): `--color-success: #22c55e` (availability
dot, with `-glow`/`-ring` alpha derivatives) and the toast backgrounds
`--color-notification-success` / `--color-notification-error` (keep ≥4.5:1
against white text).

The background pair (`#fafaf9` / `#0f1117`) doubles as the browser
`theme-color`: pre-paint hints come from `profile.themeColors` in
`src/content.js`; after paint the SiteNav controller re-reads the live
token. Keep all three in step.

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
| `#517891` | Slate anchor (gradient end; light-mode primary)      |
| `#07090c` | Icon plate background (`jj-signal-icon.svg` only)    |

The gradient intentionally spans both themes' primaries, which is why the
brand marks work unchanged in light and dark.

## Rules of thumb

- New styles consume tokens (`var(--…)`) — colors, spacing (`--space-*`),
  radii, shadows, z-index (`--z-*`), durations. Raw values in component CSS
  are a code smell unless they're SVG user units or one-off geometry.
- Anything themed needs a value in **both** dark blocks of `settings.css`
  (they must stay token-identical — `check:theme`) and, if used above the
  fold on the home page, mirrored in `critical-home.css` (`check:critical`).
- Media queries can't read tokens: breakpoint literals (`48rem`, `64rem` =
  `--breakpoint-md`/`-lg`) carry keep-in-step comments instead.
