import { gzipSync } from 'node:zlib';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteContent } from '../src/content.js';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const checkOnly = process.argv.includes('--check');

const profile = siteContent.profile;
const generatedNotice = 'This block is generated from src/content.js. Do not edit by hand.';

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function stripHtml(value = '') {
    return String(value).replace(/<[^>]+>/g, '');
}

function indent(text, spaces) {
    const pad = ' '.repeat(spaces);
    return text.split('\n').map(line => line ? `${pad}${line}` : line).join('\n');
}

function generatedRegion(name, html) {
    return [
        `<!-- STATIC:${name}:start - ${generatedNotice} -->`,
        html,
        `<!-- STATIC:${name}:end -->`
    ].join('\n');
}

function replaceGeneratedRegion(html, name, replacement) {
    const regionPattern = new RegExp(`^[ \\t]*<!-- STATIC:${name}:start[\\s\\S]*?^[ \\t]*<!-- STATIC:${name}:end -->`, 'm');
    if (regionPattern.test(html)) {
        return html.replace(regionPattern, replacement);
    }
    return null;
}

function replaceContainerInner(html, id, name, renderedInner) {
    const replacement = indent(generatedRegion(name, renderedInner), 16);
    const generated = replaceGeneratedRegion(html, name, replacement);
    if (generated) return generated;

    const pattern = new RegExp(`(<div[^>]+id="${id}"[^>]*>\\r?\\n)([\\s\\S]*?)(\\r?\\n\\s{12}</div>\\r?\\n\\s{8}</div>\\r?\\n\\s{4}</section>)`);
    if (!pattern.test(html)) {
        throw new Error(`Could not find #${id} container in index.html`);
    }
    return html.replace(pattern, `$1${replacement}$3`);
}

function renderJsonLd() {
    const data = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: profile.name,
        url: profile.canonicalUrl,
        jobTitle: profile.jobTitle,
        address: {
            '@type': 'PostalAddress',
            addressLocality: profile.location.city,
            addressCountry: profile.location.country
        },
        sameAs: profile.sameAs,
        knowsAbout: siteContent.skills.flatMap(skill => skill.tags),
        description: profile.aiSummary
    };

    return [
        '<script type="application/ld+json">',
        indent(JSON.stringify(data, null, 4), 4),
        '</script>'
    ].join('\n');
}

function renderSkills() {
    return siteContent.skills.map(category => {
        const tagHtml = category.tags
            .map(tag => `<span class="skill-tag">${escapeHtml(tag)}</span>`)
            .join('\n');
        const tagContainer = category.type === 'pane'
            ? `<div class="skill-pane-container">\n${indent(`<div class="skill-tags">\n${indent(tagHtml, 4)}\n</div>`, 4)}\n</div>`
            : `<div class="skill-tags">\n${indent(`<div>\n${indent(tagHtml, 4)}\n</div>`, 4)}\n</div>`;

        return [
            '<div class="skill-category card-base">',
            indent(`<h3 class="skill-category-title">${escapeHtml(category.category)}</h3>`, 4),
            indent(tagContainer, 4),
            '</div>'
        ].join('\n');
    }).join('\n');
}

function renderServices() {
    return siteContent.services.map((service, index) => [
        '<div class="service-card card-base">',
        indent(`<div class="service-icon" aria-hidden="true">${escapeHtml(service.icon)}</div>`, 4),
        indent(`<h3 class="service-title">${escapeHtml(service.title)}</h3>`, 4),
        indent(`<p class="service-description">${escapeHtml(service.description)}</p>`, 4),
        '</div>'
    ].join('\n')).join('\n');
}

function validateContent() {
    const missingServiceIcons = siteContent.services
        .map((service, index) => ({ service, index }))
        .filter(({ service }) => !service.icon || !String(service.icon).trim());

    if (missingServiceIcons.length > 0) {
        const labels = missingServiceIcons
            .map(({ service, index }) => service.title || `service #${index + 1}`)
            .join(', ');
        throw new Error(`Missing service icon in src/content.js for: ${labels}`);
    }
}

function testimonialColumns() {
    const columns = Array.from({ length: 3 }, () => []);
    siteContent.testimonials.forEach((testimonial, index) => {
        columns[index % columns.length].push(testimonial);
    });
    return columns;
}

function renderTestimonials() {
    return testimonialColumns().map(column => [
        '<div class="testimonials-scroller-column">',
        indent('<div class="testimonials-scroller-inner">', 4),
        indent(column.map(testimonial => [
            '<div class="testimonial-card">',
            indent('<div class="testimonial-header">', 4),
            indent(`<img class="testimonial-image" src="${escapeHtml(testimonial.image)}" alt="${escapeHtml(testimonial.name)}" loading="lazy" width="50" height="50">`, 8),
            indent('<div class="testimonial-author-info">', 8),
            indent(`<p class="testimonial-author">${escapeHtml(testimonial.name)}</p>`, 12),
            indent(`<p class="testimonial-title">${escapeHtml(testimonial.title)}, ${escapeHtml(testimonial.company)}</p>`, 12),
            indent('</div>', 8),
            indent('</div>', 4),
            indent(`<p class="testimonial-quote">&ldquo;${escapeHtml(testimonial.quote)}&rdquo;</p>`, 4),
            '</div>'
        ].join('\n')).join('\n'), 8),
        indent('</div>', 4),
        '</div>'
    ].join('\n')).join('\n');
}

function renderPortfolio() {
    return siteContent.portfolio.map(item => [
        `<div class="portfolio-item" data-category="${escapeHtml(item.category)}">`,
        indent('<div class="portfolio-card card-base">', 4),
        indent('<div class="portfolio-header">', 8),
        indent(`<h3 class="portfolio-title">${escapeHtml(item.title)}</h3>`, 12),
        indent(`<span class="portfolio-category">${escapeHtml(item.category.toUpperCase())}</span>`, 12),
        indent('</div>', 8),
        indent(`<p class="portfolio-description">${escapeHtml(item.description)}</p>`, 8),
        indent('<div class="portfolio-results">', 8),
        indent(item.results.map(result => `<div class="result-item">${escapeHtml(result)}</div>`).join('\n'), 12),
        indent('</div>', 8),
        indent('<div class="portfolio-tags">', 8),
        indent(item.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('\n'), 12),
        indent('</div>', 8),
        indent('</div>', 4),
        '</div>'
    ].join('\n')).join('\n');
}

function parsePeriod(period) {
    const [startStr, endStr] = period.split(' - ');
    const [startMonth, startYear] = startStr.split('/').map(Number);
    const startDate = new Date(Date.UTC(startYear, startMonth - 1, 1));
    const endDate = endStr.toLowerCase() === 'present'
        ? new Date(`${profile.sitemap.lastmod}T00:00:00Z`)
        : new Date(Date.UTC(Number(endStr.split('/')[1]), Number(endStr.split('/')[0]) - 1, 1));
    return { startDate, endDate };
}

function formatDuration(startDate, endDate) {
    const totalMonths = Math.max(
        1,
        (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
        endDate.getUTCMonth() - startDate.getUTCMonth()
    );
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const parts = [];

    if (years > 0) {
        parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`);
    }

    if (months > 0 || parts.length === 0) {
        parts.push(`${months} ${months === 1 ? 'mo' : 'mos'}`);
    }

    return parts.join(' ');
}

function renderExperience() {
    const jobs = siteContent.experience
        .map(job => ({ ...job, ...parsePeriod(job.period) }))
        .sort((a, b) => a.sortOrder - b.sortOrder);
    const firstDate = new Date(Math.min(...jobs.map(job => job.startDate.getTime())));
    const lastDate = new Date(Math.max(...jobs.map(job => job.endDate.getTime())));
    const totalDuration = lastDate.getTime() - firstDate.getTime();
    const years = [];

    for (let year = firstDate.getUTCFullYear(); year <= lastDate.getUTCFullYear(); year += 1) {
        years.push(`<span>${year}</span>`);
    }

    const timeline = `<div class="gantt-timeline">\n${indent(years.join('\n'), 4)}\n</div>`;
    const rows = jobs.map((job, index) => {
        const offset = ((job.startDate.getTime() - firstDate.getTime()) / totalDuration * 100).toFixed(2);
        const width = ((job.endDate.getTime() - job.startDate.getTime()) / totalDuration * 100).toFixed(2);
        const presentClass = job.period.toLowerCase().includes('present') ? ' present' : '';
        const details = [
            ...job.responsibilities,
            ...job.achievements.map(achievement => stripHtml(achievement.text))
        ];

        return [
            '<div class="gantt-row">',
            indent('<div class="gantt-label">', 4),
            indent(`<h3>${escapeHtml(job.title)}</h3>`, 8),
            indent(`<p>${escapeHtml(job.company)}</p>`, 8),
            indent('<div class="gantt-meta">', 8),
            indent(`<span class="gantt-period">${escapeHtml(job.period)}</span>`, 12),
            indent(`<span class="gantt-duration">${escapeHtml(formatDuration(job.startDate, job.endDate))}</span>`, 12),
            indent('</div>', 8),
            indent('</div>', 4),
            indent(`<div class="gantt-bar-area" tabindex="0" role="button" aria-expanded="false" aria-label="Show details for ${escapeHtml(job.title)} at ${escapeHtml(job.company)}">`, 4),
            indent(`<div class="gantt-bar${presentClass}" style="margin-left: ${offset}%; width: ${width}%; animation-delay: ${index * 100}ms;"></div>`, 8),
            indent('<div class="gantt-tooltip">', 8),
            indent(`<div class="tooltip-period">${escapeHtml(job.period)}</div>`, 12),
            indent('<ul class="tooltip-achievements">', 12),
            indent(details.map(detail => `<li><span>${escapeHtml(detail)}</span></li>`).join('\n'), 16),
            indent('</ul>', 12),
            indent('</div>', 8),
            indent('</div>', 4),
            '</div>'
        ].join('\n');
    }).join('\n');

    return `${timeline}\n${rows}`;
}

function renderLlmsTxt() {
    const skills = siteContent.skills.flatMap(skill => skill.tags).join(', ');
    const services = siteContent.services.map(service => `- ${service.title}: ${service.description}`).join('\n');
    const experience = siteContent.experience
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(job => {
            const responsibilities = job.responsibilities.join(' ');
            const achievements = job.achievements.map(achievement => stripHtml(achievement.text)).join(' ');
            return `- ${job.company}, ${job.title}, ${job.period}: ${responsibilities} ${achievements}`;
        })
        .join('\n');
    const portfolio = siteContent.portfolio
        .map(item => `- ${item.title}: ${item.description} Results: ${item.results.join('; ')}.`)
        .join('\n');

    return `# ${profile.name}

${profile.jobTitle} for B2B and B2C technology brands.

Primary website: ${profile.canonicalUrl}
LinkedIn: ${profile.sameAs[0]}

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
`;
}

function renderRobotsTxt() {
    return `User-agent: *
Allow: /

Sitemap: ${profile.canonicalUrl}sitemap.xml
`;
}

function renderSitemapXml() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${profile.canonicalUrl}</loc>
    <lastmod>${profile.sitemap.lastmod}</lastmod>
    <changefreq>${profile.sitemap.changefreq}</changefreq>
    <priority>${profile.sitemap.priority}</priority>
  </url>
</urlset>
`;
}

function updateHead(html) {
    let next = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(profile.pageTitle)}</title>`);
    const description = `<meta name="description"\n        content="${escapeHtml(profile.description)}">`;
    next = next.replace(/<meta name="description"\s+content="[\s\S]*?">/, description);
    next = next.replace(/<link rel="canonical" href="[\s\S]*?">/, `<link rel="canonical" href="${escapeHtml(profile.canonicalUrl)}">`);

    const jsonRegion = generatedRegion('jsonld', renderJsonLd());
    const generated = replaceGeneratedRegion(next, 'jsonld', indent(jsonRegion, 4));
    if (generated) return generated;

    return next.replace(/    <script type="application\/ld\+json">[\s\S]*?    <\/script>/, indent(jsonRegion, 4));
}

async function plannedWrites() {
    validateContent();

    let indexHtml = await readFile(path.join(rootDir, 'index.html'), 'utf8');
    indexHtml = updateHead(indexHtml);
    indexHtml = replaceContainerInner(indexHtml, 'skills-grid', 'skills', renderSkills());
    indexHtml = replaceContainerInner(indexHtml, 'services-grid', 'services', renderServices());
    indexHtml = replaceContainerInner(indexHtml, 'testimonials-container', 'testimonials', renderTestimonials());
    indexHtml = replaceContainerInner(indexHtml, 'portfolio-grid', 'portfolio', renderPortfolio());
    indexHtml = replaceContainerInner(indexHtml, 'gantt-chart-container', 'experience', renderExperience());

    const llms = renderLlmsTxt();
    const robots = renderRobotsTxt();
    const sitemap = renderSitemapXml();

    return new Map([
        ['index.html', indexHtml],
        ['llms.txt', llms],
        ['robots.txt', robots],
        ['sitemap.xml', sitemap],
        [path.join('public', 'llms.txt'), llms],
        [path.join('public', 'robots.txt'), robots],
        [path.join('public', 'sitemap.xml'), sitemap]
    ]);
}

async function main() {
    const writes = await plannedWrites();
    const drifted = [];

    for (const [relativePath, content] of writes) {
        const absolutePath = path.join(rootDir, relativePath);
        let existing = null;
        try {
            existing = await readFile(absolutePath, 'utf8');
        } catch {
            existing = null;
        }

        if (existing !== content) {
            drifted.push(relativePath);
            if (!checkOnly) {
                await mkdir(path.dirname(absolutePath), { recursive: true });
                await writeFile(absolutePath, content);
            }
        }
    }

    const gzipBytes = gzipSync(writes.get('index.html')).length;
    const rawBytes = Buffer.byteLength(writes.get('index.html'));

    if (checkOnly && drifted.length > 0) {
        console.error(`Static content drift detected in: ${drifted.join(', ')}`);
        process.exitCode = 1;
        return;
    }

    const verb = checkOnly ? 'checked' : 'generated';
    console.log(`Static content ${verb}. index.html ${rawBytes} bytes raw, ${gzipBytes} bytes gzip.`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
