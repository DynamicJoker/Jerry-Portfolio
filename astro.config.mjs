import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import browserslist from 'browserslist';
import { browserslistToTargets } from 'lightningcss';

export default defineConfig({
  site: 'https://jerryjames.me',
  devToolbar: {
    enabled: false
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/drafts/')
    })
  ],
  vite: {
    css: {
      transformer: 'lightningcss',
      lightningcss: {
        targets: browserslistToTargets(browserslist('>= 0.25%'))
      }
    },
    optimizeDeps: {
      noDiscovery: true,
      include: [],
      exclude: [
        'aria-query',
        'axobject-query',
        'html-escaper',
        'astro/runtime/client/dev-toolbar/entrypoint.js'
      ]
    },
    build: {
      cssMinify: 'lightningcss'
    }
  }
});
