// Jerry James Portfolio - Interactive JavaScript

// --- ES Module Imports ---
import '@fontsource/geist/400.css';
import '@fontsource/geist/500.css';
import '@fontsource/geist/600.css';
import '@fontsource/geist/700.css';
import { siteContent } from './content.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

const config = {
    loadingScreenDuration: 2000,
    notificationDuration: 5000,
    scrambleAnimation: {
        texts: [
            'Technical Marketing Strategy',
            'B2B & B2C Narratives',
            'Inbound Marketing Campaigns',
            'Content Marketing Wizard'
        ],
        delayBetweenTexts: 2000,
        initialDelay: 2500
    },
    heroVisuals: {
        radius: 300,
        maxStretch: 200,
        points: 45,
        noiseFrequency: 3,
        noiseSpeed: 0.009,
        baseNoise: 0.15,
        mouseFollowSpeed: 0.03,
        velocityIntensity: 0.003,
        colors: {
            target: { h: 195, s: 100, l: 50 }, // The target electric blue for motion
            // The orb will cycle through these colors in order.
            colorStops: [
                { h: 195, s: 100, l: 55 }, // Electric Blue
                { h: 250, s: 90, l: 60 },  // Vibrant Purple
                { h: 330, s: 95, l: 60 },  // Hot Pink / Magenta
                { h: 280, s: 90, l: 60 },  // Deep Violet
            ],
            // How fast it transitions from one color to the next (lower is slower)
            transitionSpeed: 0.001
        }
    },
    navbar: {
        height: 70, // The height of the navbar in pixels
        scrollThreshold: 10 // Scroll threshold to change navbar style
    },
    scroll: { // New property
        spyOffset: 0 // For determining the active navigation link
    },
    testimonials: {
        columns: 3,
        scrollSpeedMin: 80, // seconds
        scrollSpeedMax: 120  // seconds
    },
    logoCarousel: {
        interval: 3000 // milliseconds
    },
    contactForm: {
        fakeSubmissionDelay: 2000 // milliseconds
    },
    experience: {
        ganttChart: {
            animationDelayIncrement: 100, // in milliseconds
            intersectionThreshold: 0.3
        },
        startYear: 2014
    },
    scrollAnimations: {
        intersectionThreshold: 0.1,
        intersectionRootMargin: '0px 0px -50px 0px'
    }
};
let navLinks = [];


// --- Consolidated Scroll Handler for Performance ---
let lastKnownScrollPosition = 0;
let ticking = false;

// 1. Function to read scroll position and call update functions
function handleScroll() {
    lastKnownScrollPosition = window.pageYOffset;

    if (!ticking) {
        window.requestAnimationFrame(() => {
            updateUIOnScroll(lastKnownScrollPosition);
            ticking = false;
        });

        ticking = true;
    }
}

// 2. All visual updates triggered by scroll happen here
function updateUIOnScroll(scrollY) {
    const navbar = document.getElementById('navbar');
    const heroBackground = document.querySelector('.hero-background');

    // Logic from: initializeNavigation()
    if (navbar) {
        navbar.classList.toggle('scrolled', scrollY > config.navbar.scrollThreshold);
    }

    // Logic from: the old throttled listener
    updateActiveNavLink();
    updateNavGlow();

    // Logic from: initializeParallaxEffect()
    if (heroBackground) {
        heroBackground.style.transform = `translateY(${scrollY * -0.5}px)`;
    }
}

// 3. Adding single, efficient event listener
window.addEventListener('scroll', handleScroll, { passive: true });
window.addEventListener('load', () => ScrollTrigger.refresh());

document.addEventListener('DOMContentLoaded', () => {
    initializeLoadingScreen();
    initializeNavigation();
    generateSkills();
    generateServices();
    generateTestimonialColumns();
    initializeInfiniteScroller();
    generatePortfolioItems();
    generateGanttChart();
    initializeScrollAnimations();
    initializePortfolioFilters();
    initializeContactForm();
    updateYearsExperience();
    initializeHeroVisuals();
    initializeScrambleAnimation();
    initializeSmartGlow();
    initializeLogoCarousel();
    initializeExpandableHighlights();
    console.log('Jerry James Portfolio initialized successfully! 🚀');
});


// Loading Screen Animation
function initializeLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        setTimeout(() => loadingScreen.remove(), 500);
    }, config.loadingScreenDuration);
}

// Navigation functionality
function initializeNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.getElementById('navbar');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Immediately update the active link on click
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            link.classList.add('active');
            updateNavGlow();

            // Close the mobile menu if it's open
            if (hamburger && navMenu) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    });
    if (navbar) {
        // Set initial state on load
        navbar.classList.toggle('scrolled', window.pageYOffset > config.navbar.scrollThreshold); // Use config value
        updateActiveNavLink();
        updateNavGlow();
    }
}

function initializeSmartGlow() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    let titleData = [];

    function cacheTitlePositions() {
        titleData = Array.from(document.querySelectorAll('.hero-name, .section-title')).map(title => {
            const rect = title.getBoundingClientRect();
            return { top: rect.top + window.scrollY, centerX: rect.left + rect.width / 2 };
        });
    }

    const activationRange = 500;
    const baseGlow = { size: 50, opacity: 0.4 };
    const peakGlow = { size: 300, opacity: 0.8 };
    const glowColorRgb = '0, 212, 255';

    function updateGlow() {
        const scrollY = window.scrollY;
        const navBottom = scrollY + navbar.offsetHeight;

        let prevTitle = null, nextTitle = null;
        for (const title of titleData) {
            if (title.top < navBottom) prevTitle = title;
            else { nextTitle = title; break; }
        }

        const distToPrev = prevTitle ? navBottom - prevTitle.top : Infinity;
        const distToNext = nextTitle ? nextTitle.top - navBottom : Infinity;
        const activeTitle = distToNext < distToPrev ? nextTitle : prevTitle;
        const closestDist = Math.min(distToPrev, distToNext);

        let intensity = (activeTitle && closestDist < activationRange) ? 1 - (closestDist / activationRange) : 0;
        intensity = Math.max(0, scrollY < 10 ? 0 : intensity);

        const sizeX = baseGlow.size + (peakGlow.size - baseGlow.size) * intensity;
        const opacity = baseGlow.opacity + (peakGlow.opacity - baseGlow.opacity) * intensity;

        if (activeTitle) navbar.style.setProperty('--glow-position-x', `${activeTitle.centerX}px`);
        navbar.style.setProperty('--glow-size', `${sizeX}px 5px`);
        navbar.style.setProperty('--glow-color', `rgba(${glowColorRgb}, ${opacity})`);
        navbar.style.setProperty('--glow-opacity', intensity);
    }

    cacheTitlePositions();
    updateGlow(); // Initial call
    window.addEventListener('resize', cacheTitlePositions);

    // Use ScrollTrigger instead of RAF loop — fires only on scroll
    ScrollTrigger.create({
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: updateGlow,
    });
}

function updateActiveNavLink() {
    const scrollY = window.scrollY;
    let currentSectionId = '';

    // 1. Get all navigable sections
    const sections = Array.from(document.querySelectorAll('section[id]')).filter(section => {
        // Check if there is a nav link pointing to this section ID
        return document.querySelector(`.nav-link[href="#${section.id}"]`);
    });

    if (sections.length === 0) return;

    // 2. Check if at the very bottom
    const atBottom = (window.innerHeight + scrollY) >= document.documentElement.scrollHeight - 20;

    if (atBottom) {
        currentSectionId = sections[sections.length - 1].id;
    } else {
        // 3. Find active section based on top-most candidate
        // A section is active if its top has crossed the upper 30% of the viewport
        const threshold = window.innerHeight * 0.3;
        
        for (const section of sections) {
            const rect = section.getBoundingClientRect();
            if (rect.top <= threshold) {
                currentSectionId = section.id;
            } else {
                // Once we find a section whose top is below the threshold,
                // we stop; the previous section remains the active one.
                break;
            }
        }
    }

    // 4. Update nav links
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${currentSectionId}`);
    });
}

function updateNavGlow() {
    const navMenu = document.getElementById('nav-menu');
    const activeLink = Array.from(navLinks).find(link => link.classList.contains('active'));
    if (activeLink && navMenu) {
        navMenu.style.setProperty('--glow-left', `${activeLink.offsetLeft}px`);
        navMenu.style.setProperty('--glow-width', `${activeLink.offsetWidth}px`);
        navMenu.style.setProperty('--glow-opacity', '1');
    } else if (navMenu) {
        // Hide the glow if no link is active
        navMenu.style.setProperty('--glow-opacity', '0');
    }
}

function initializeScrollAnimations() {
    document.querySelectorAll('.section').forEach(section => {
        ScrollTrigger.create({
            trigger: section,
            start: 'top 85%',
            once: true,
            onEnter: () => section.classList.add('visible'),
        });
    });
}

// --- REBUILT: initializeHeroVisuals for the new "Vibrant Core Orb" ---
function initializeHeroVisuals() {
    const corePath = document.getElementById('hero-blob-path');
    const glowPath = document.getElementById('hero-blob-glow-path');
    const blobGroup = document.getElementById('blob-group');
    const gradientStop = document.getElementById('gradient-stop-1');
    const heroSection = document.getElementById('hero');
    const neonCircle = document.querySelector('.neon-circle');

    if (!corePath || !glowPath || !blobGroup || !heroSection || !gradientStop || !neonCircle) return;
    // Adjust config for smaller screens
    if (window.innerWidth < 768) {
        config.heroVisuals.radius = 200; // Original was 300
        config.heroVisuals.maxStretch = 120; // Original was 200
    }

    // Destructure properties from the config
    const { radius, maxStretch, points, noiseFrequency, noiseSpeed, baseNoise, mouseFollowSpeed, velocityIntensity, colors } = config.heroVisuals;

    let time = 0;
    let colorTime = 0; // Use a separate timer for color transitions
    let rect = heroSection.getBoundingClientRect();
    let centerX = rect.width / 2;
    let centerY = rect.height / 2;

    let mouseX = centerX, mouseY = centerY;
    let lastMouseX = centerX, lastMouseY = centerY;
    let virtualMouseX = centerX, virtualMouseY = centerY;
    let mouseVelocity = 0;

    const lerp = (start, end, amount) => start * (1 - amount) + end * amount;

    function createBlobPath(pts) {
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length; i++) {
            const p1 = pts[i], p2 = pts[(i + 1) % pts.length];
            d += ` Q ${p1.x},${p1.y} ${(p1.x + p2.x) / 2},${(p1.y + p2.y) / 2}`;
        }
        return d + ' Z';
    }

    let isHeroVisible = true;

    function animate() {
        if (!isHeroVisible) return;

        // Increment both timers
        time += noiseSpeed;
        colorTime += colors.transitionSpeed;

        const dx = mouseX - lastMouseX;
        const dy = mouseY - lastMouseY;
        const currentVelocity = Math.min(Math.hypot(dx, dy), 100);
        mouseVelocity = lerp(mouseVelocity, currentVelocity, 0.1);
        lastMouseX = mouseX;
        lastMouseY = mouseY;

        virtualMouseX = lerp(virtualMouseX, mouseX, mouseFollowSpeed);
        virtualMouseY = lerp(virtualMouseY, mouseY, mouseFollowSpeed);

        // --- COLOR CYCLING LOGIC ---
        const { target, colorStops } = colors;

        const colorIndex = Math.floor(colorTime) % colorStops.length;
        const nextColorIndex = (colorIndex + 1) % colorStops.length;
        const currentColor = colorStops[colorIndex];
        const nextColor = colorStops[nextColorIndex];

        const progress = colorTime % 1;

        const idleHue = lerp(currentColor.h, nextColor.h, progress);
        const idleSaturation = lerp(currentColor.s, nextColor.s, progress);
        const idleLightness = lerp(currentColor.l, nextColor.l, progress);

        const velocityFactor = Math.min(mouseVelocity / 60, 1);
        const finalHue = lerp(idleHue, target.h, velocityFactor);
        const finalSaturation = lerp(idleSaturation, target.s, velocityFactor);
        const finalLightness = lerp(idleLightness, target.l, velocityFactor);

        const currentBlobColor = `hsl(${finalHue}, ${finalSaturation}%, ${finalLightness}%)`;

        gradientStop.setAttribute('stop-color', currentBlobColor);
        neonCircle.style.stroke = currentBlobColor;

        const mouseAngle = Math.atan2(virtualMouseY - centerY, virtualMouseX - centerX);
        const pullIntensity = Math.min(Math.hypot(virtualMouseX - centerX, virtualMouseY - centerY) / (rect.width / 3), 1);
        const dynamicNoiseAmount = baseNoise + mouseVelocity * velocityIntensity;
        const dynamicMaxStretch = maxStretch + mouseVelocity * 0.5;

        const generatedPoints = Array.from({ length: points }, (_, i) => {
            const angle = (i / points) * Math.PI * 2;
            const noiseFactor = 1 + dynamicNoiseAmount * Math.sin(time + angle * noiseFrequency);
            const stretch = pullIntensity * dynamicMaxStretch * (Math.cos(angle - mouseAngle) + 1) / 2;
            const finalRadius = (radius + stretch) * noiseFactor;
            return { x: Math.cos(angle) * finalRadius, y: Math.sin(angle) * finalRadius };
        });

        const pathData = createBlobPath(generatedPoints);
        corePath.setAttribute('d', pathData);
        glowPath.setAttribute('d', pathData);
    }

    heroSection.addEventListener('mousemove', e => {
        const currentRect = heroSection.getBoundingClientRect();
        mouseX = e.clientX - currentRect.left;
        mouseY = e.clientY - currentRect.top;
    });
    heroSection.addEventListener('mouseleave', () => { mouseX = centerX; mouseY = centerY; });
    window.addEventListener('resize', () => {
        rect = heroSection.getBoundingClientRect();
        centerX = rect.width / 2; centerY = rect.height / 2;
        mouseX = virtualMouseX = centerX; mouseY = virtualMouseY = centerY;
        blobGroup.style.transform = `translate(${centerX}px, ${centerY}px)`;
    });

    blobGroup.style.transform = `translate(${centerX}px, ${centerY}px)`;

    // Use gsap.ticker instead of requestAnimationFrame loop
    gsap.ticker.add(animate);

    // Use ScrollTrigger instead of IntersectionObserver to pause/resume
    ScrollTrigger.create({
        trigger: heroSection,
        start: 'top bottom',
        end: 'bottom top',
        onEnter: () => { isHeroVisible = true; },
        onLeave: () => { isHeroVisible = false; },
        onEnterBack: () => { isHeroVisible = true; },
        onLeaveBack: () => { isHeroVisible = false; },
    });
}

function initializePortfolioFilters() {
    const filterContainer = document.querySelector('.portfolio-filters');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    // Safety check in case the container doesn't exist
    if (!filterContainer) return;

    // Add a single click listener to the parent container
    filterContainer.addEventListener('click', (event) => {
        // Find the button that was actually clicked, even if the user clicks an inner element
        const clickedButton = event.target.closest('.filter-btn');

        // If the click was not on a button, do nothing
        if (!clickedButton) return;

        // Get all filter buttons to manage the 'active' class
        const filterButtons = filterContainer.querySelectorAll('.filter-btn');
        const filter = clickedButton.dataset.filter;

        // Update the active state
        filterButtons.forEach(btn => btn.classList.remove('active'));
        clickedButton.classList.add('active');

        // Apply the filter logic to each portfolio item
        portfolioItems.forEach(item => {
            const isVisible = filter === 'all' || item.dataset.category === filter;
            item.classList.toggle('hidden', !isVisible);
            item.style.opacity = isVisible ? '1' : '0';
            item.style.transform = isVisible ? 'scale(1)' : 'scale(0.8)';
        });
    });
}

function initializeContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        if (!formData.get('name') || !formData.get('email') || !formData.get('message')) {
            showNotification('Please fill in all required fields.', 'error');
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;

        setTimeout(() => {
            showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
            form.reset();
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }, config.contactForm.fakeSubmissionDelay);
    });
}

function initializeScrambleAnimation() {
    const typingElement = document.getElementById('typing-text');
    if (!typingElement) return;

    const texts = config.scrambleAnimation.texts;
    let textIndex = 0;

    function next() {
        gsap.to(typingElement, {
            duration: 1.5,
            scrambleText: {
                text: texts[textIndex],
                chars: '!<>-_\\/[]{}—=+*^?#________',
                speed: 0.5,
            },
            onComplete: () => {
                textIndex = (textIndex + 1) % texts.length;
                setTimeout(next, config.scrambleAnimation.delayBetweenTexts);
            },
        });
    }
    setTimeout(next, config.scrambleAnimation.initialDelay);
}

function updateYearsExperience() {
    const el = document.getElementById('years-experience');
    if (el) el.textContent = new Date().getFullYear() - config.experience.startYear;
}

function showNotification(message, type = 'info') {
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `<div class="notification-content"><span class="notification-message">${message}</span><button class="notification-close" aria-label="Close">&times;</button></div>`;

    document.body.appendChild(notification);

    // Use requestAnimationFrame to ensure the transition is applied correctly
    requestAnimationFrame(() => {
        notification.classList.add('visible');
    });

    const close = () => {
        notification.classList.remove('visible');
        // Wait for the animation to finish before removing the element
        notification.addEventListener('transitionend', () => notification.remove(), { once: true });
    };

    notification.querySelector('.notification-close').addEventListener('click', close);
    setTimeout(close, config.notificationDuration);
}



document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('nav-menu').classList.contains('active')) {
        document.getElementById('hamburger').classList.remove('active');
        document.getElementById('nav-menu').classList.remove('active');
    }
});

function generateSkills() {
    const gridContainer = document.getElementById('skills-grid');
    const template = document.getElementById('skill-category-template');
    if (!gridContainer || !template) return;

    // Clear any existing content to prevent duplication
    gridContainer.innerHTML = '';

    siteContent.skills.forEach(category => {
        const clone = template.content.cloneNode(true);
        const categoryCard = clone.querySelector('.skill-category');
        clone.querySelector('.skill-category-title').textContent = category.category;

        // Create the necessary divs that will contain the tags
        const outerWrapper = document.createElement('div');
        const innerTagHolder = document.createElement('div');

        // Apply the correct CSS classes based on the category type
        if (category.type === 'pane') {
            // Recreate the structure for the scrollable pane:
            // <div class="skill-pane-container"> <div class="skill-tags"> ... </div> </div>
            outerWrapper.className = 'skill-pane-container';
            innerTagHolder.className = 'skill-tags';
        } else {
            // Recreate the structure for a standard list:
            // <div class="skill-tags"> <div class=""> ... </div> </div>
            outerWrapper.className = 'skill-tags';
            // The inner div for standard skills intentionally has no class
        }

        // Create and append all the skill tags into the inner holder
        category.tags.forEach(tagText => {
            const tagElement = document.createElement('span');
            tagElement.className = 'skill-tag';
            tagElement.textContent = tagText;
            innerTagHolder.appendChild(tagElement);
        });

        // Assemble the final structure and append it to the card
        outerWrapper.appendChild(innerTagHolder);
        categoryCard.appendChild(outerWrapper);

        gridContainer.appendChild(clone);
    });
}

function generateServices() {
    const container = document.getElementById('services-grid');
    const template = document.getElementById('service-card-template');
    if (!container || !template) return;

    siteContent.services.forEach(service => {
        const clone = template.content.cloneNode(true);
        clone.querySelector('.service-icon').textContent = service.icon;
        clone.querySelector('.service-title').textContent = service.title;
        clone.querySelector('.service-description').textContent = service.description;
        container.appendChild(clone);
    });
}

function generateTestimonialColumns() {
    const container = document.getElementById('testimonials-container');
    const template = document.getElementById('testimonial-card-template');
    if (!container || !template) return;

    const numColumns = config.testimonials.columns;
    const columnsData = Array.from({ length: numColumns }, () => []);
    siteContent.testimonials.forEach((testimonial, index) => {
        columnsData[index % numColumns].push(testimonial);
    });

    columnsData.forEach(testimonials => {
        const columnEl = document.createElement('div');
        columnEl.className = 'testimonials-scroller-column';

        const innerEl = document.createElement('div');
        innerEl.className = 'testimonials-scroller-inner';

        testimonials.forEach(testimonial => {
            const clone = template.content.cloneNode(true);
            const image = clone.querySelector('.testimonial-image');
            image.src = testimonial.image;
            image.alt = testimonial.name;

            clone.querySelector('.testimonial-author').textContent = testimonial.name;
            clone.querySelector('.testimonial-title').textContent = `${testimonial.title}, ${testimonial.company}`;
            clone.querySelector('.testimonial-quote').textContent = `"${testimonial.quote}"`;
            innerEl.appendChild(clone);
        });
        columnEl.appendChild(innerEl);
        container.appendChild(columnEl);
    });
}

function initializeInfiniteScroller() {
    document.querySelectorAll(".testimonials-scroller-column").forEach(scroller => {
        const scrollerInner = scroller.querySelector(".testimonials-scroller-inner");
        const scrollerContent = Array.from(scrollerInner.children);
        scrollerContent.forEach(item => {
            const duplicatedItem = item.cloneNode(true);
            duplicatedItem.setAttribute("aria-hidden", true);
            scrollerInner.appendChild(duplicatedItem);
        });
        const durationRange = config.testimonials.scrollSpeedMax - config.testimonials.scrollSpeedMin;
        const randomDuration = Math.floor(Math.random() * durationRange) + config.testimonials.scrollSpeedMin;
        scrollerInner.style.setProperty('--scroll-duration', `${randomDuration}s`);
    });
}

function generatePortfolioItems() {
    const container = document.getElementById('portfolio-grid');
    const template = document.getElementById('portfolio-item-template');
    if (!container || !template) return;

    siteContent.portfolio.forEach(item => {
        const clone = template.content.cloneNode(true);
        clone.querySelector('.portfolio-item').dataset.category = item.category;
        clone.querySelector('.portfolio-title').textContent = item.title;
        clone.querySelector('.portfolio-category').textContent = item.category.toUpperCase();
        clone.querySelector('.portfolio-description').textContent = item.description;

        const resultsContainer = clone.querySelector('.portfolio-results');
        item.results.forEach(resultText => {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'result-item';
            resultDiv.textContent = resultText;
            resultsContainer.appendChild(resultDiv);
        });

        const tagsContainer = clone.querySelector('.portfolio-tags');
        item.tags.forEach(tagText => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'tag';
            tagSpan.textContent = tagText;
            tagsContainer.appendChild(tagSpan);
        });
        container.appendChild(clone);
    });
}

function initializeLogoCarousel() {
    const logos = document.querySelectorAll('.logo-bar .logo-item');
    if (logos.length === 0) return;
    let currentIndex = 0;
    setInterval(() => {
        logos.forEach((logo, index) => logo.classList.toggle('active', index === currentIndex));
        currentIndex = (currentIndex + 1) % logos.length;
    }, config.logoCarousel.interval);
}

function initializeExpandableHighlights() {
    const container = document.querySelector('.about-highlights');
    if (!container) return;

    const handleInteraction = (event) => {
        // Find the parent highlight-item that was clicked or activated by key
        const highlightItem = event.target.closest('.highlight-item');

        // Exit if the interaction was not on a highlight item
        if (!highlightItem) return;

        // Ensure only Enter or Space keys trigger the action
        if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) {
            return;
        }

        event.preventDefault();

        const currentlyExpanded = container.querySelector('.expanded');

        // Close any other item that might already be open
        if (currentlyExpanded && currentlyExpanded !== highlightItem) {
            currentlyExpanded.classList.remove('expanded');
        }

        // Toggle the active state of the interacted item
        highlightItem.classList.toggle('expanded');
    };

    // Attach a single listener to the parent container for all clicks and key events
    container.addEventListener('click', handleInteraction);
    container.addEventListener('keydown', handleInteraction);

    // Add a listener to the document to handle clicks outside the component
    document.addEventListener('click', (event) => {
        // Ignore clicks within the component itself; the container's listener handles those.
        if (container.contains(event.target)) {
            return;
        }

        // If the click was outside, find and close any expanded item.
        const currentlyExpanded = container.querySelector('.expanded');
        if (currentlyExpanded) {
            currentlyExpanded.classList.remove('expanded');
        }
    });
}

function generateGanttChart() {
    const container = document.getElementById('gantt-chart-container');
    const template = document.getElementById('gantt-row-template');
    if (!container) return;

    const jobs = siteContent.experience.map(job => {
        const [startStr, endStr] = job.period.split(' - ');
        const [startMonth, startYear] = startStr.split('/');
        const startDate = new Date(`${startYear}-${startMonth}-01`);
        let endDate = (endStr.toLowerCase() === 'present') ? new Date() : new Date(`${endStr.split('/')[1]}-${endStr.split('/')[0]}-01`);
        return { ...job, startDate, endDate };
    }).sort((a, b) => a.sortOrder - b.sortOrder);

    const firstDate = new Date(Math.min(...jobs.map(j => j.startDate)));
    const lastDate = new Date(Math.max(...jobs.map(j => j.endDate)));
    const totalDuration = lastDate.getTime() - firstDate.getTime();

    // Generate Timeline Axis (HTML string is fine here as it's not complex)
    let timelineHTML = '<div class="gantt-timeline">';
    const startYear = firstDate.getFullYear();
    const endYear = lastDate.getFullYear();
    for (let year = startYear; year <= endYear; year++) {
        timelineHTML += `<span>${year}</span>`;
    }
    timelineHTML += '</div>';
    container.innerHTML = timelineHTML;

    // Use a document fragment for efficient row appending
    const fragment = document.createDocumentFragment();

    jobs.forEach((job, index) => {
        const clone = template.content.cloneNode(true);
        const offset = (job.startDate.getTime() - firstDate.getTime()) / totalDuration * 100;
        const width = (job.endDate.getTime() - job.startDate.getTime()) / totalDuration * 100;

        clone.querySelector('.gantt-label h3').textContent = job.title;
        clone.querySelector('.gantt-label p').textContent = job.company;
        clone.querySelector('.tooltip-period').textContent = job.period;

        const bar = clone.querySelector('.gantt-bar');
        bar.style.marginLeft = `${offset}%`;
        bar.style.width = `${width}%`;
        bar.style.animationDelay = `${index * config.experience.ganttChart.animationDelayIncrement}ms`;
        if (job.period.toLowerCase().includes('present')) {
            bar.classList.add('present');
        }

        const achievementsList = clone.querySelector('.tooltip-achievements');
        job.achievements.forEach(a => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="achievement-icon">${a.icon}</span><span>${a.text}</span>`;
            achievementsList.appendChild(li);
        });

        fragment.appendChild(clone);
    });

    container.appendChild(fragment);

    // Add scroll-triggered animation via ScrollTrigger
    ScrollTrigger.create({
        trigger: container,
        start: 'top 85%',
        once: true,
        onEnter: () => container.classList.add('visible'),
    });
}
