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
  const portfolio = siteContent.portfolio
    .map((item) => `- ${item.title}: ${item.description} Results: ${item.results.join('; ')}.`)
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

## Portfolio Examples

${portfolio}

## Blog

${posts || '- No published posts yet.'}
`);
}
