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
  (`.section-kicker` in `style.css`) — write only the label text in markup.
- Footer markup is `src/components/SiteFooter.astro` only (HomeBody includes it).

## CSS rules (important)

- The home page's above-the-fold CSS is **duplicated** in
  `src/styles/critical-home.css` (inlined) AND root `style.css` (deferred full
  stylesheet). Any change to styles that exist in both files must be made in
  **both**, or the page will flash/shift when the full stylesheet loads.
- `<style>` blocks in `.astro` pages are silently dropped from the build —
  put all CSS in root `style.css` (imported via `src/styles/global.css`).
- Design tokens (colors, spacing, fonts, breakpoints) are CSS variables at the
  top of `style.css`; use them instead of raw values. Brand SVGs
  (`BrandLogo.astro`, 404 graphic, `public/brand/*`) intentionally hardcode the
  brand gradient hexes because standalone SVG files can't use CSS variables.

## Workflows

- `npm run dev` is broken on this machine (spaced path + subst drive). Verify
  changes with `npm run build` then `npm run preview` (restart preview after
  each build).
- `npm run build` runs `prettier --check` first — format with `npm run format`
  before building. A pre-commit hook enforces formatting.
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
