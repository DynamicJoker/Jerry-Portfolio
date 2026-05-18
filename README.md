# Beta Work in Progress Repository for Jerry James

## Content updates

Portfolio data still lives in `src/content.js`.

Blog posts live in `src/content/blog/*.mdx` and are editable through Pages CMS using the root `.pages.yml` configuration. Images for blog posts should be uploaded to `public/images/blog/`.

Run `npm run build` before publishing. Astro generates the static site, sitemap, RSS feed, `robots.txt`, and `llms.txt` during the build.
