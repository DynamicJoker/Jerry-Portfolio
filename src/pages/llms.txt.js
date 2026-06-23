import { getCollection } from 'astro:content';
import { siteContent } from '../content.js';

function stripHtml(value = '') {
  return String(value).replace(/<[^>]+>/g, '');
}

export async function GET() {
  const profile = siteContent.profile;
  const skills = siteContent.skills.flatMap((skill) => skill.tags).join(', ');
  const services = siteContent.services.map((service) => `- ${service.title}: ${service.description}`).join('\n');
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
          const link =
            item.access === 'live' && item.url
              ? ` ${item.url}`
              : ' (on request)';
          return `  - ${item.title} (${item.type})${link}`;
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
      const tail =
        linkable && piece.url
          ? ` ${piece.url}`
          : ` (${piece.status === 'internal' ? 'internal' : 'no public link'})`;
      return `- ${piece.title} — ${piece.campaign}, ${piece.year} (${piece.type}, ${piece.industry})${tail}`;
    })
    .join('\n');
  const posts = (await getCollection('blog'))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .map((post) => `- ${post.data.title}: ${post.data.description} ${new URL(`/blog/${post.id}/`, profile.canonicalUrl).href}`)
    .join('\n');

  return new Response(`# ${profile.name}

${profile.jobTitle} for B2B and B2C technology brands.

Primary website: ${profile.canonicalUrl}
LinkedIn: ${profile.sameAs[0]}
RSS: ${new URL('/rss.xml', profile.canonicalUrl).href}

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
