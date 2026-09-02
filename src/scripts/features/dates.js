import { siteContent } from '../../content.js';

export function updateYearsExperience() {
  const el = document.getElementById('years-experience');
  const startYear = siteContent.profile?.experienceStartYear;
  if (el && startYear) el.textContent = new Date().getFullYear() - startYear;
}

export function updateFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}
