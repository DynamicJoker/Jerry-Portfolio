# Jerry James portfolio (Astro static site)

Personal portfolio + blog, deployed on Vercel at https://www.jerryjames.me.

## Where things live (single sources of truth)

- **All site content and config values** live in `src/content.js` (`siteContent`):
  profile/SEO data, site URL, hero stats, about highlights, client logos,
  skills, services, portfolio items (+ category labels for the filter buttons),
  testimonials, experience, contact info, Web3Forms config, Calendly config.
  Edit content there, not in component markup.
- `astro.config.mjs` derives the site URL from `siteContent.profile.canonicalUrl` —
  don't redefine it. Homepage sitemap `lastmod` is the `homepageLastmod` constant there.
- Blog posts: `src/content/blog/*.mdx` (editable via Pages CMS, `.pages.yml`).
  Blog images go in `public/images/blog/`.
- Section kickers ("01 / About") are auto-numbered with a CSS counter
  (`.c-section__kicker` in `src/styles/components/section.css`) — write only
  the label text in markup.
- Footer markup is `src/components/SiteFooter.astro` only (HomeBody includes it).

## CSS rules (important)

- Class naming is **BEMIT-lite**: `c-block__element--modifier` for components,
  `o-*` for layout objects (`o-container`), `u-*` for utilities
  (`u-hidden`, `u-sr-only`), `is-*`/`has-*` for all JS-toggled states.
  No bare state classes (`active`, `expanded`, etc.) — fold new states into
  `is-*`/`has-*`. JS behavior hooks prefer `data-*` attributes over classes.
  This convention is **build-enforced** by `npm run check:bemit`
  (`scripts/check-bemit.mjs`): it validates class names in CSS selectors, Astro
  `class`/`class:list`, and JS `classList`/`className` against the grammar, so a
  non-conforming class fails the build. Genuine third-party exceptions go in
  that script's `ALLOWLIST` constant (with a comment).
- The stylesheet is split into ITCSS layers under `src/styles/`, assembled by
  `src/styles/global.css` in cascade order: `settings.css` (design tokens +
  dark-mode token overrides) → `generic.css` (reset + element styles) →
  `objects.css` → `components/*.css` (one file per component family) →
  `utilities.css` (last so utilities win). **Do not reorder the imports** in
  `global.css`; new component files are appended before `utilities.css`.
- The home page's above-the-fold CSS is **duplicated** in
  `src/styles/critical-home.css` (inlined) AND the layer files (deferred full
  stylesheet). Any change to styles that exist in both places must be made in
  **both**, or the page will flash/shift when the full stylesheet loads.
- `<style>` blocks in `.astro` pages are silently dropped from the build —
  put all CSS in the `src/styles/` layer files.
- Design tokens (colors, spacing, fonts, breakpoints) are CSS variables in
  `src/styles/settings.css`; use them instead of raw values. Brand SVGs
  (`BrandLogo.astro`, 404 graphic, `public/brand/*`) intentionally hardcode the
  brand gradient hexes because standalone SVG files can't use CSS variables.
- The MDX chart classes (`c-article-chart*`, `c-stacked-bar*`) are written by
  hand in blog post bodies — renaming them means editing published
  `src/content/blog/*.mdx` too.

## Workflows

- `npm run dev` is broken on this machine (spaced path + subst drive). Verify
  changes with `npm run build` then `npm run preview` (restart preview after
  each build).
- `npm run build` gates on `prettier --check`, `eslint .`, then the
  `check:critical`, `check:bemit`, and `check:theme` scripts before building —
  format with `npm run format` and lint with `npm run lint` first. The
  pre-commit hook enforces format + lint only; the `check:*` gates run on
  build/CI (run them standalone with `npm run check:bemit` / `check:critical` /
  `check:theme`). `check:theme` (`scripts/check-theme-sync.mjs`) asserts the two
  dark-theme blocks in `settings.css` — the `@media (prefers-color-scheme: dark)`
  no-JS fallback and the `[data-color-scheme='dark']` block — stay token-for-token
  identical. ESLint flat config is `eslint.config.mjs` (browser globals for
  `src/`, node globals for build-time code).
- Do NOT commit or push automatically; the user commits manually.

## Gotchas

- The contact email in HomeBody markup is a decoy (`jerry@placeholder.com`);
  `src/main.js` swaps in a reveal button using `siteContent.contactInfo.email`
  (split user/domain for scrape resistance).
- The contact form posts to Web3Forms; endpoint/key/subject come from
  `siteContent.contactForm` (the access key is public by design).
- `src/main.js` only runs on the home page; `SiteNav.astro` carries a small
  inline copy of the nav toggle logic for blog/404 pages — keep them in sync
  when changing nav behavior.
- Experience entries use `period: 'MM/YYYY - MM/YYYY'` (or `- Present`); the
  Gantt chart in HomeBody parses that exact format.
