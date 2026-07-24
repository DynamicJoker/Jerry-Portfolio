import { getCollection } from 'astro:content';
import { siteContent, skillKeywords } from '../content.js';

function stripHtml(value = '') {
  return String(value).replace(/<[^>]+>/g, '');
}

export async function GET() {
  const profile = siteContent.profile;
  const skills = skillKeywords.join(', ');
  const services = siteContent.services.engagements
    .map((engagement) => `- ${engagement.name} (${engagement.meta}): ${engagement.description}`)
    .join('\n');
  const experience = siteContent.experience
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((job) => {
      const responsibilities = job.responsibilities.join(' ');
      const achievements = job.achievements.map((achievement) => stripHtml(achievement.text)).join(' ');
      return `- ${job.company}, ${job.title}, ${job.period}: ${responsibilities} ${achievements}`;
    })
    .join('\n');
  const featuredWork = siteContent.featuredCampaigns
    .map((campaign) => {
      const items = campaign.items
        .map((item) => {
          // Markdown links required by the llms.txt spec / Lighthouse audit;
          // gated pieces have no public URL, so render them as plain text.
          const label = `${item.title} (${item.type})`;
          const line =
            item.access === 'live' && item.url
              ? `[${label}](${item.url})`
              : `${label} — on request`;
          return `  - ${line}`;
        })
        .join('\n');
      return `- ${campaign.name} [${campaign.industry}, ${campaign.year}]: ${campaign.blurb}\n${items}`;
    })
    .join('\n');
  const workArchive = siteContent.workArchive
    .map((piece) => {
      const linkable =
        piece.status === 'live' ||
        piece.status === 'press' ||
        piece.status === 'archived';
      const label = `${piece.title} — ${piece.campaign}, ${piece.year} (${piece.type}, ${piece.industry})`;
      return linkable && piece.url
        ? `- [${label}](${piece.url})`
        : `- ${label} (${piece.status === 'internal' ? 'internal' : 'no public link'})`;
    })
    .join('\n');
  const posts = (await getCollection('blog'))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .map((post) => `- [${post.data.title}](${new URL(`/blog/${post.id}/`, profile.canonicalUrl).href}): ${post.data.description}`)
    .join('\n');

  return new Response(`# ${profile.name}

> ${profile.jobTitle} for B2B and B2C technology brands.

- [Primary website](${profile.canonicalUrl})
- [LinkedIn](${profile.sameAs[0]})
- [RSS feed](${new URL('/rss.xml', profile.canonicalUrl).href})

## Summary

${profile.aiSummary}

## Services

${services}

## Skills And Platforms

${skills}.

## Experience

${experience}

## Featured Work

${featuredWork}

## Full Body of Work

${workArchive}

## Blog

${posts || '- No published posts yet.'}
`);
}
