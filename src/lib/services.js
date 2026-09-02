// Services are shown verb-led: the CTA label ("Scope a project") is the row's
// headline, and its last word — the engagement model (project / retainer /
// fractional) — takes the ember ink. Built as an HTML string and rendered with
// set:html (as the about bio + gantt do) so the inline <b> keeps exact spacing,
// sidestepping the Astro 7 whitespace trap that padding the emphasis in markup
// would hit. Labels are static site copy, so there is no untrusted input here.

export function buildEngagementRows(services) {
  return services.engagements.map((engagement) => {
    const label = engagement.ctaLabel ?? services.ctaLabel;
    const words = label.trim().split(/\s+/);
    const verbWord = words.pop();
    return { ...engagement, verbHtml: `${words.join(' ')} <b>${verbWord}</b>` };
  });
}
