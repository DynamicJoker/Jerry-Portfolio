import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const requiredArtifacts = [
  'robots.txt',
  'sitemap-index.xml',
  'sitemap-0.xml',
  'rss.xml',
  'llms.txt'
];

const errors = [];

function fail(message) {
  errors.push(message);
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function countMatches(value, pattern) {
  return value.match(pattern)?.length ?? 0;
}

function stripNoscriptBlocks(html) {
  return html.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '');
}

function getJsonLd(html, file) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  return scripts.map((match, index) => {
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      fail(`${file}: JSON-LD script ${index + 1} is invalid JSON (${error.message})`);
      return null;
    }
  }).filter(Boolean);
}

function hasType(jsonLd, type) {
  return jsonLd.some((item) => item['@type'] === type);
}

if (!fs.existsSync(distDir)) {
  fail('dist directory is missing. Run npm.cmd run build first.');
} else {
  for (const artifact of requiredArtifacts) {
    if (!fs.existsSync(path.join(distDir, artifact))) {
      fail(`${artifact} is missing from dist.`);
    }
  }

  const htmlFiles = walk(distDir).filter((file) => file.endsWith('.html'));

  for (const file of htmlFiles) {
    const html = read(file);
    const relative = path.relative(distDir, file).replaceAll(path.sep, '/');
    const jsonLd = getJsonLd(html, relative);

    if (countMatches(html, /<title\b/gi) !== 1) fail(`${relative}: expected exactly one title element.`);
    if (countMatches(html, /<meta\s+name=["']description["']/gi) !== 1) fail(`${relative}: expected exactly one meta description.`);
    if (countMatches(html, /<link\s+rel=["']canonical["']/gi) !== 1) fail(`${relative}: expected exactly one canonical link.`);
    if (countMatches(html, /<h1\b/gi) !== 1) fail(`${relative}: expected exactly one h1.`);
    if (countMatches(html, /<main\b/gi) !== 1) fail(`${relative}: expected exactly one main landmark.`);
    if (!/<meta\s+name=["']robots["']\s+content=["'][^"']*index[^"']*follow[^"']*max-image-preview:large[^"']*["']/i.test(html)) {
      fail(`${relative}: missing expected robots meta policy.`);
    }
    if (!/<link\s+rel=["']alternate["'][^>]+type=["']application\/rss\+xml["'][^>]+href=["']https:\/\/jerryjames\.me\/rss\.xml["']/i.test(html)) {
      fail(`${relative}: missing RSS autodiscovery link.`);
    }
    if (!/<div[^>]+data-beta-banner[^>]+data-nosnippet/i.test(html)) {
      fail(`${relative}: beta banner is not protected with data-nosnippet.`);
    }
    if (!hasType(jsonLd, 'Person')) fail(`${relative}: missing Person JSON-LD.`);

    if (relative === 'index.html') {
      if (!hasType(jsonLd, 'WebSite')) fail(`${relative}: missing WebSite JSON-LD.`);
      if (!hasType(jsonLd, 'ProfilePage')) fail(`${relative}: missing ProfilePage JSON-LD.`);
      if (/\bSiteNav\.[^"'\s<>]+\.css\b/i.test(html)) {
        fail(`${relative}: must not reference a blocking SiteNav CSS chunk.`);
      }

      const htmlWithoutNoscript = stripNoscriptBlocks(html);
      if (/<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*>/i.test(htmlWithoutNoscript)) {
        fail(`${relative}: homepage must not emit blocking stylesheet links outside noscript.`);
      }
      if (!/<noscript>\s*<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["'][^"']*\/_astro\/global\.[^"']+\.css["'])[^>]*>\s*<\/noscript>/i.test(html)) {
        fail(`${relative}: missing expected noscript global stylesheet fallback.`);
      }
    }

    if (relative === 'blog/index.html') {
      if (!hasType(jsonLd, 'BreadcrumbList')) fail(`${relative}: missing BreadcrumbList JSON-LD.`);
    }

    if (relative.startsWith('blog/') && relative !== 'blog/index.html') {
      const article = jsonLd.find((item) => item['@type'] === 'BlogPosting');
      if (!article) {
        fail(`${relative}: missing BlogPosting JSON-LD.`);
      } else {
        if (!article.mainEntityOfPage?.['@id']) fail(`${relative}: BlogPosting missing mainEntityOfPage @id.`);
        if (!article.publisher) fail(`${relative}: BlogPosting missing publisher.`);
        if (!article.image?.url || !article.image?.width || !article.image?.height) {
          fail(`${relative}: BlogPosting image must include url, width, and height.`);
        }
      }
      if (!hasType(jsonLd, 'BreadcrumbList')) fail(`${relative}: missing BreadcrumbList JSON-LD.`);
    }
  }

  const sitemap = fs.existsSync(path.join(distDir, 'sitemap-0.xml')) ? read(path.join(distDir, 'sitemap-0.xml')) : '';
  if (!/<lastmod>\d{4}-\d{2}-\d{2}(?:T[^<]+)?<\/lastmod>/.test(sitemap)) {
    fail('sitemap-0.xml is missing lastmod entries.');
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('SEO checks passed.');
