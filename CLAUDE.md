# Jerry James portfolio (Astro static site)

Personal portfolio + blog, deployed on Vercel at https://jerryjames.me.

## Where things live (single sources of truth)

- **All site content and config values** live in `src/content.js` (`siteContent`):
  profile/SEO data, site URL, hero stats + CTAs, section kickers/titles
  (`sections`), about highlights, client logos, skills, services, portfolio
  items (+ category labels for the filter buttons), archive UI strings
  (`archiveUi`, with `{count}`-style placeholders filled by JS), testimonials,
  experience, blog section/index copy + empty states, beta banner copy,
  contact panel/info, Web3Forms config incl. form labels + toast messages,
  Calendly config. Edit content there, not in component markup.
- `astro.config.mjs` derives the site URL from `siteContent.profile.canonicalUrl` —
  don't redefine it. Homepage sitemap `lastmod` is the `homepageLastmod` constant there.
- Blog posts: `src/content/blog/*.mdx` (editable via Pages CMS, `.pages.yml`).
  Blog images go in `public/images/blog/`.
- Section kickers ("01 / About") are auto-numbered with a CSS counter
  (`.c-section__kicker` in `src/styles/components/section.css`) — write only
  the label text in markup.
- Footer markup is `src/components/SiteFooter.astro` only (HomeBody includes it).
- `vercel.json` holds all deploy-time HTTP config: apex/vanity-host redirects,
  `Cache-Control` per asset dir (30d for `/images` + `/logos` + `/brand`, 1yr
  `immutable` for content-hashed `/_astro`), and the security headers in the
  global `/(.*)` block (HSTS, X-Frame-Options, COOP, X-Content-Type-Options,
  Referrer-Policy, Permissions-Policy, and an **enforcing Content-Security-Policy**
  — see the CSP gotcha below). None of these apply under `astro preview`; they
  only take effect once deployed — verify live with `curl -sI https://jerryjames.me/`.

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
  **Brand palette + typography reference: `docs/brand.md`** (fonts, light/dark
  palettes, the brand gradient hexes, and token usage rules) — read it before
  styling work; settings.css stays the live source of truth.
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
- **The enforcing CSP in `vercel.json` is hash-based and can silently break
  scripts on deploy.** A static site can't use nonces, so `script-src` lists a
  SHA-256 hash of each inline script. One of them — the deferred-stylesheet loader
  in `BaseLayout.astro` — embeds the content-hashed CSS filename, so its hash
  changes whenever the CSS changes. After ANY change to an inline script OR to
  CSS, run `npm run build && node scripts/csp-hashes.mjs` and paste the printed
  tokens into the `script-src` list before deploying, or those scripts get
  blocked (blank theme flash, dead Calendly/form). Adding a new third-party origin
  means extending the matching directive; the current allowlist covers Calendly
  (`assets.calendly.com` script + `calendly.com` frame) and Web3Forms
  (`api.web3forms.com`). `style-src` deliberately keeps `'unsafe-inline'` because
  `main.js` sets inline styles (dock/nav-glow) and Calendly injects styles.
  Astro's built-in `security.csp` is deliberately NOT used — it's enforce-only,
  meta-tag based (ignores `frame-ancestors`), and force-hashes `style-src`, which
  would break Calendly + the JS-set styles. HSTS `preload` is intentionally
  omitted (near-irreversible commitment); add `; preload` + submit at
  hstspreload.org only if that's wanted.
  - `script-src` also contains `'unsafe-inline'` **on purpose** — modern browsers
    ignore it whenever hashes are present (it's a graceful fallback for pre-CSP2
    browsers, per Google's strict-CSP guidance). Do NOT remove it thinking it
    weakens the policy; it doesn't.
  - PageSpeed also suggests `'strict-dynamic'` and Trusted Types
    (`require-trusted-types-for 'script'`). Both were evaluated and intentionally
    NOT adopted: `strict-dynamic` ignores host allowlists and would require a
    per-build hash of the bundled `/_astro/*.js` app script (whose hash changes
    every build → whole-site JS breakage risk) for negligible gain on a static,
    endpoint-free origin; Trusted Types would throw inside Calendly's third-party
    `widget.js` and break the booking widget. Don't chase either without dropping
    Calendly / adding build machinery.
