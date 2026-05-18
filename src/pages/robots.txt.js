import { siteContent } from '../content.js';

export function GET() {
  return new Response(`User-agent: *
Allow: /

Sitemap: ${new URL('/sitemap-index.xml', siteContent.profile.canonicalUrl).href}
`);
}
