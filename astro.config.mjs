import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import browserslist from 'browserslist';
import { browserslistToTargets } from 'lightningcss';

function openMdxLinksInNewTab() {
  const visit = (node) => {
    if (node?.type === 'element' && node.tagName === 'a' && node.properties?.href) {
      node.properties.target = '_blank';
      node.properties.rel = ['noopener', 'noreferrer'];
    }

    if (Array.isArray(node?.children)) {
      node.children.forEach(visit);
    }
  };

  return (tree) => visit(tree);
}

export default defineConfig({
  site: 'https://jerryjames.me',
  devToolbar: {
    enabled: false
  },
  integrations: [
    mdx({
      rehypePlugins: [openMdxLinksInNewTab]
    }),
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
