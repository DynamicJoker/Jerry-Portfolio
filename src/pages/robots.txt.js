import { siteContent } from '../content.js';

export function GET() {
  const base = siteContent.profile.canonicalUrl;
  // `Sitemap:` is a real, widely-honoured extension. llms.txt has no equivalent
  // directive — llmstxt.org defines discovery at the fixed /llms.txt path — so
  // it goes in as a comment: a signpost for anyone reading this file, not a
  // machine rule. Inventing an `Llms:` line here would just be noise that every
  // standard parser ignores.
  return new Response(`User-agent: *
Allow: /

Sitemap: ${new URL('/sitemap-index.xml', base).href}

# Plain-language summary of this site, for AI/LLM crawlers:
# ${new URL('/llms.txt', base).href}
`);
}
