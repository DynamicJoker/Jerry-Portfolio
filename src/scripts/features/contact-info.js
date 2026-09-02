import { siteContent } from '../../content.js';
import { config } from '../core/config.js';

export function initializeContactInfo() {
  if (!siteContent.contactInfo) return;

  const emailEl = document.getElementById('contact-email');
  if (emailEl && siteContent.contactInfo.email) {
    const revealButton = document.createElement('button');
    revealButton.type = 'button';
    revealButton.className = 'c-contact__reveal-button';
    revealButton.setAttribute(
      'aria-label',
      siteContent.contactInfo.revealTitle,
    );
    revealButton.title = siteContent.contactInfo.revealTitle;

    const iconHTML = config.contactUI.eyeOffSvg;

    // Use dummy characters that are heavily blurred to thwart OCR
    const textSpan = document.createElement('span');
    textSpan.textContent = config.contactUI.dummyPlaceholderText;
    textSpan.style.filter = 'blur(4px)';
    textSpan.style.opacity = '0.7';
    textSpan.style.transition = 'filter 0.3s ease, opacity 0.3s ease';

    revealButton.innerHTML = iconHTML;
    revealButton.appendChild(textSpan);

    revealButton.addEventListener('mouseenter', () => {
      textSpan.style.filter = 'blur(2px)';
      textSpan.style.opacity = '1';
      revealButton.style.color = 'var(--color-primary)';
    });
    revealButton.addEventListener('mouseleave', () => {
      textSpan.style.filter = 'blur(4px)';
      textSpan.style.opacity = '0.7';
      revealButton.style.color = 'inherit';
    });

    revealButton.addEventListener('click', function revealEmail() {
      const emailAddress = `${siteContent.contactInfo.email.user}@${siteContent.contactInfo.email.domain}`;

      const mailLink = document.createElement('a');
      mailLink.href = `mailto:${emailAddress}`;
      mailLink.textContent = emailAddress;
      mailLink.style.color = 'inherit';
      mailLink.style.textDecoration = 'none';

      mailLink.addEventListener(
        'mouseenter',
        () => (mailLink.style.color = 'var(--color-primary)'),
      );
      mailLink.addEventListener(
        'mouseleave',
        () => (mailLink.style.color = 'inherit'),
      );

      emailEl.innerHTML = '';
      emailEl.appendChild(mailLink);
      mailLink.focus();

      mailLink.style.opacity = '0';
      requestAnimationFrame(() => {
        mailLink.style.transition = 'opacity 0.4s ease, color 0.3s ease';
        mailLink.style.opacity = '1';
      });
    });

    emailEl.innerHTML = '';
    emailEl.appendChild(revealButton);
  }

  const linkedinEl = document.getElementById('contact-linkedin');
  if (linkedinEl && siteContent.contactInfo.linkedin) {
    linkedinEl.href = siteContent.contactInfo.linkedin.url;
    linkedinEl.textContent = siteContent.contactInfo.linkedin.label;
  }
}
