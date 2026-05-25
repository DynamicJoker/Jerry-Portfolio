import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import browserslist from 'browserslist';
import { browserslistToTargets } from 'lightningcss';
import fs from 'node:fs';
import path from 'node:path';

const siteUrl = 'https://www.jerryjames.me';

function getBlogSitemapMetadata() {
  const blogDir = path.resolve('./src/content/blog');
  if (!fs.existsSync(blogDir)) return new Map();

  return new Map(
    fs.readdirSync(blogDir)
      .filter((file) => /\.(md|mdx)$/.test(file))
      .map((file) => {
        const source = fs.readFileSync(path.join(blogDir, file), 'utf8');
        const slug = file.replace(/\.(md|mdx)$/, '');
        const updatedDate = source.match(/^updatedDate:\s*(.+)$/m)?.[1]?.trim();
        const pubDate = source.match(/^pubDate:\s*(.+)$/m)?.[1]?.trim();
        return [`/blog/${slug}/`, updatedDate ?? pubDate];
      })
      .filter(([, lastmod]) => Boolean(lastmod))
  );
}

const blogSitemapMetadata = getBlogSitemapMetadata();
const blogIndexLastmod = [...blogSitemapMetadata.values()].sort().at(-1) ?? '2026-05-17';

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
  site: siteUrl,
  devToolbar: {
    enabled: false
  },
  integrations: [
    mdx({
      rehypePlugins: [openMdxLinksInNewTab]
    }),
    sitemap({
      filter: (page) => !page.includes('/drafts/'),
      serialize: (item) => {
        const pathname = new URL(item.url).pathname;
        const lastmod = pathname === '/'
          ? '2026-05-17'
          : pathname === '/blog/'
            ? blogIndexLastmod
            : blogSitemapMetadata.get(pathname);

        return {
          ...item,
          lastmod,
          changefreq: pathname.startsWith('/blog/') && pathname !== '/blog/' ? 'monthly' : 'weekly',
          priority: pathname === '/' ? 1 : pathname === '/blog/' ? 0.8 : 0.7
        };
      }
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
