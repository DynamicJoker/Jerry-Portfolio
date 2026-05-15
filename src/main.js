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
    loadingScreenFadeOut: 500,
    notificationDuration: 5000,
    breakpoints: {
        md: 768,
        lg: 1024
    },
    scrambleAnimation: {
        texts: [
            'Technical Marketing Strategy',
            'B2B & B2C Narratives',
            'Inbound Marketing Campaigns',
            'Content Marketing Wizard'
        ],
        duration: 1.1,
        delayBetweenTexts: 1600,
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
        },
        idleArrow: {
            enabled: true,
            delay: 10000,
            morphSpeed: 0.04,
            minWidth: 768,
            verticalOffset: 0.62,
            pulseAmplitude: 18,
            pulseSpeed: 2.4,
            mouseInfluence: 0.12,
            wiggleThreshold: 180,
            wiggleDecay: 0.92
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
    smartGlow: {
        activationRange: 500,
        baseGlow: { size: 50, opacity: 0.4 },
        peakGlow: { size: 300, opacity: 0.8 },
        glowColorRgb: '0, 212, 255'
    },
    contactUI: {
        eyeOffSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`,
        dummyPlaceholderText: '••••••••@••••••••.•••'
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
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    initializeContactInfo();
    updateYearsExperience();
    updateFooterYear();
    initializeHeroVisuals();
    initializeScrambleAnimation();
    initializeSmartGlow();
    initializeLogoCarousel();
    initializeExpandableHighlights();
    console.log('Jerry James Portfolio initialized successfully! 🚀');
});

function initializeContactInfo() {
    if (!siteContent.contactInfo) return;
    
    const emailEl = document.getElementById('contact-email');
    if (emailEl && siteContent.contactInfo.email) {
        // Create an initial placeholder container for the hidden email
        const container = document.createElement('div');
        container.style.display = 'inline-flex';
        container.style.alignItems = 'center';
        container.style.gap = '10px';
        container.style.cursor = 'pointer';
        container.title = "Click to reveal";
        
        // Add an eye-off icon to suggest hidden visibility
        const iconHTML = config.contactUI.eyeOffSvg;
        
        // Use dummy characters that are heavily blurred to thwart OCR
        const textSpan = document.createElement('span');
        textSpan.textContent = config.contactUI.dummyPlaceholderText;
        textSpan.style.filter = 'blur(4px)';
        textSpan.style.opacity = '0.7';
        textSpan.style.transition = 'filter 0.3s ease, opacity 0.3s ease';
        
        container.innerHTML = iconHTML;
        container.appendChild(textSpan);
        
        // Interactive hover effect to hint at reveal
        container.addEventListener('mouseenter', () => {
            textSpan.style.filter = 'blur(2px)';
            textSpan.style.opacity = '1';
            container.style.color = 'var(--color-electric-blue)';
        });
        container.addEventListener('mouseleave', () => {
            textSpan.style.filter = 'blur(4px)';
            textSpan.style.opacity = '0.7';
            container.style.color = 'inherit';
        });
        
        // Reveal the actual email on click
        container.addEventListener('click', function revealEmail() {
            const emailAddress = `${siteContent.contactInfo.email.user}@${siteContent.contactInfo.email.domain}`;
            
            const mailLink = document.createElement('a');
            mailLink.href = `mailto:${emailAddress}`;
            mailLink.textContent = emailAddress;
            mailLink.style.color = 'inherit';
            mailLink.style.textDecoration = 'none';
            
            // Add hover effect to the revealed link
            mailLink.addEventListener('mouseenter', () => mailLink.style.color = 'var(--color-electric-blue)');
            mailLink.addEventListener('mouseleave', () => mailLink.style.color = 'inherit');
            
            emailEl.innerHTML = '';
            emailEl.appendChild(mailLink);
            
            // Smooth fade-in
            mailLink.style.opacity = '0';
            requestAnimationFrame(() => {
                mailLink.style.transition = 'opacity 0.4s ease, color 0.3s ease';
                mailLink.style.opacity = '1';
            });
        });

        emailEl.innerHTML = '';
        emailEl.appendChild(container);
    }
    
    const linkedinEl = document.getElementById('contact-linkedin');
    if (linkedinEl && siteContent.contactInfo.linkedin) {
        linkedinEl.href = siteContent.contactInfo.linkedin.url;
        linkedinEl.textContent = siteContent.contactInfo.linkedin.label;
    }
}


// Loading Screen Animation
function initializeLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = `opacity ${config.loadingScreenFadeOut}ms ease`;
        
        setTimeout(() => loadingScreen.remove(), config.loadingScreenFadeOut);
    }, config.loadingScreenDuration);
}

// Navigation functionality
function initializeNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.getElementById('navbar');

    if (hamburger && navMenu) {
        const setNavOpen = (isOpen) => {
            hamburger.classList.toggle('active', isOpen);
            navMenu.classList.toggle('active', isOpen);
            hamburger.setAttribute('aria-expanded', String(isOpen));
            hamburger.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
        };

        hamburger.addEventListener('click', () => {
            setNavOpen(!navMenu.classList.contains('active'));
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                setNavOpen(false);
                hamburger.focus();
            }
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
                hamburger.setAttribute('aria-expanded', 'false');
                hamburger.setAttribute('aria-label', 'Open navigation menu');
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

    const { activationRange, baseGlow, peakGlow, glowColorRgb } = config.smartGlow;

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
    function getHeroVisualSize() {
        if (window.innerWidth < config.breakpoints.md) {
            return { radius: 200, maxStretch: 120 };
        }
        return {
            radius: config.heroVisuals.radius,
            maxStretch: config.heroVisuals.maxStretch
        };
    }

    // Destructure properties from the config
    const { points, noiseFrequency, noiseSpeed, baseNoise, mouseFollowSpeed, velocityIntensity, colors, idleArrow } = config.heroVisuals;
    let visualSize = getHeroVisualSize();

    let time = 0;
    let colorTime = 0; // Use a separate timer for color transitions
    let rect = heroSection.getBoundingClientRect();
    let centerX = rect.width / 2;
    let centerY = rect.height / 2;

    let mouseX = centerX, mouseY = centerY;
    let lastMouseX = centerX, lastMouseY = centerY;
    let virtualMouseX = centerX, virtualMouseY = centerY;
    let mouseVelocity = 0;
    let idleArrowTimer = null;
    let isIdleArrowActive = false;
    let idleArrowProgress = 0;
    let idleArrowWiggleDistance = 0;

    const lerp = (start, end, amount) => start * (1 - amount) + end * amount;

    function createBlobPath(pts) {
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length; i++) {
            const p1 = pts[i], p2 = pts[(i + 1) % pts.length];
            d += ` Q ${p1.x},${p1.y} ${(p1.x + p2.x) / 2},${(p1.y + p2.y) / 2}`;
        }
        return d + ' Z';
    }

    function pointOnSegment(start, end, progress) {
        return {
            x: lerp(start.x, end.x, progress),
            y: lerp(start.y, end.y, progress)
        };
    }

    function createArrowPoints(pointCount, size) {
        const half = size * 0.45;
        const shaftHalf = size * 0.15;
        const top = -size * 0.55;
        const shoulderY = size * 0.08;
        const tipY = size * 0.58;
        const polygon = [
            { x: -shaftHalf, y: top },
            { x: shaftHalf, y: top },
            { x: shaftHalf, y: shoulderY },
            { x: half, y: shoulderY },
            { x: 0, y: tipY },
            { x: -half, y: shoulderY },
            { x: -shaftHalf, y: shoulderY }
        ];
        const segmentCount = polygon.length;

        return Array.from({ length: pointCount }, (_, i) => {
            const position = (i / pointCount) * segmentCount;
            const segmentIndex = Math.floor(position);
            const segmentProgress = position - segmentIndex;
            const start = polygon[segmentIndex];
            const end = polygon[(segmentIndex + 1) % segmentCount];
            return pointOnSegment(start, end, segmentProgress);
        });
    }

    function canRunIdleArrow() {
        return idleArrow.enabled &&
            !prefersReducedMotion &&
            window.innerWidth >= idleArrow.minWidth;
    }

    function clearIdleArrowTimer() {
        if (idleArrowTimer) {
            clearTimeout(idleArrowTimer);
            idleArrowTimer = null;
        }
    }

    function resetIdleArrow() {
        clearIdleArrowTimer();
        isIdleArrowActive = false;
        idleArrowProgress = 0;
        idleArrowWiggleDistance = 0;
    }

    function dismissIdleArrow() {
        clearIdleArrowTimer();
        isIdleArrowActive = false;
        idleArrowWiggleDistance = 0;
        startIdleArrowTimer();
    }

    function startIdleArrowTimer() {
        clearIdleArrowTimer();
        if (!isHeroVisible || !canRunIdleArrow()) return;

        idleArrowTimer = setTimeout(() => {
            idleArrowTimer = null;
            if (isHeroVisible && canRunIdleArrow()) {
                isIdleArrowActive = true;
            }
        }, idleArrow.delay);
    }

    let isHeroVisible = heroSection.getBoundingClientRect().bottom > 0 &&
        heroSection.getBoundingClientRect().top < window.innerHeight;

    function animate() {
        if (!isHeroVisible) return;

        // Increment both timers
        time += noiseSpeed;
        colorTime += colors.transitionSpeed;
        idleArrowWiggleDistance *= idleArrow.wiggleDecay;

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
        const dynamicMaxStretch = visualSize.maxStretch + mouseVelocity * 0.5;

        const generatedPoints = Array.from({ length: points }, (_, i) => {
            const angle = (i / points) * Math.PI * 2;
            const noiseFactor = 1 + dynamicNoiseAmount * Math.sin(time + angle * noiseFrequency);
            const stretch = pullIntensity * dynamicMaxStretch * (Math.cos(angle - mouseAngle) + 1) / 2;
            const finalRadius = (visualSize.radius + stretch) * noiseFactor;
            return { x: Math.cos(angle) * finalRadius, y: Math.sin(angle) * finalRadius };
        });

        const targetIdleArrowProgress = isIdleArrowActive && canRunIdleArrow() ? 1 : 0;
        idleArrowProgress = lerp(idleArrowProgress, targetIdleArrowProgress, idleArrow.morphSpeed);

        const idleArrowPulse = Math.max(0, Math.sin(time * idleArrow.pulseSpeed)) * idleArrow.pulseAmplitude;
        const idleArrowOffset = {
            x: (virtualMouseX - centerX) * idleArrow.mouseInfluence,
            y: visualSize.radius * idleArrow.verticalOffset +
                (virtualMouseY - centerY) * idleArrow.mouseInfluence +
                idleArrowPulse
        };
        const arrowPoints = idleArrowProgress > 0.001
            ? createArrowPoints(points, visualSize.radius * 1.25).map(point => ({
                x: point.x + idleArrowOffset.x,
                y: point.y + idleArrowOffset.y
            }))
            : null;
        const morphedPoints = arrowPoints
            ? generatedPoints.map((point, index) => ({
                x: lerp(point.x, arrowPoints[index].x, idleArrowProgress),
                y: lerp(point.y, arrowPoints[index].y, idleArrowProgress)
            }))
            : generatedPoints;

        const pathData = createBlobPath(morphedPoints);
        corePath.setAttribute('d', pathData);
        glowPath.setAttribute('d', pathData);
    }

    heroSection.addEventListener('mousemove', e => {
        const currentRect = heroSection.getBoundingClientRect();
        const nextMouseX = e.clientX - currentRect.left;
        const nextMouseY = e.clientY - currentRect.top;
        const movementX = Number.isFinite(e.movementX) ? e.movementX : nextMouseX - mouseX;
        const movementY = Number.isFinite(e.movementY) ? e.movementY : nextMouseY - mouseY;
        const movementDistance = Math.hypot(movementX, movementY);

        if (isIdleArrowActive && idleArrowProgress > 0.5) {
            idleArrowWiggleDistance += movementDistance;
            if (idleArrowWiggleDistance >= idleArrow.wiggleThreshold) {
                dismissIdleArrow();
            }
        }

        mouseX = nextMouseX;
        mouseY = nextMouseY;
    });
    heroSection.addEventListener('mouseleave', () => { mouseX = centerX; mouseY = centerY; });
    window.addEventListener('resize', () => {
        visualSize = getHeroVisualSize();
        rect = heroSection.getBoundingClientRect();
        centerX = rect.width / 2; centerY = rect.height / 2;
        mouseX = virtualMouseX = centerX; mouseY = virtualMouseY = centerY;
        blobGroup.style.transform = `translate(${centerX}px, ${centerY}px)`;
        if (!canRunIdleArrow()) resetIdleArrow();
        else if (!isIdleArrowActive) startIdleArrowTimer();
    });

    blobGroup.style.transform = `translate(${centerX}px, ${centerY}px)`;

    if (prefersReducedMotion) {
        animate();
        return;
    }

    // Use gsap.ticker instead of requestAnimationFrame loop
    gsap.ticker.add(animate);
    startIdleArrowTimer();

    // Use ScrollTrigger instead of IntersectionObserver to pause/resume
    ScrollTrigger.create({
        trigger: heroSection,
        start: 'top bottom',
        end: 'bottom top',
        onEnter: () => {
            isHeroVisible = true;
            startIdleArrowTimer();
        },
        onLeave: () => {
            isHeroVisible = false;
            resetIdleArrow();
        },
        onEnterBack: () => {
            isHeroVisible = true;
            startIdleArrowTimer();
        },
        onLeaveBack: () => {
            isHeroVisible = false;
            resetIdleArrow();
        },
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
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        if (!formData.get('name') || !formData.get('email') || !formData.get('message')) {
            showNotification('Please fill in all required fields.', 'error');
            return;
        }

        // Basic email sanity check regex
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(formData.get('email'))) {
            showNotification('Please enter a valid email address.', 'error');
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
                form.reset();
            } else {
                showNotification('Something went wrong. Please try again.', 'error');
                console.error('Web3Forms Error:', data);
            }
        } catch (error) {
            showNotification('Network error. Please try again later.', 'error');
            console.error('Form submission error:', error);
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });
}

function initializeScrambleAnimation() {
    const typingElement = document.getElementById('typing-text');
    if (!typingElement) return;

    const texts = config.scrambleAnimation.texts;
    if (prefersReducedMotion) {
        typingElement.textContent = texts[0];
        return;
    }

    let textIndex = 0;

    function next() {
        gsap.to(typingElement, {
            duration: config.scrambleAnimation.duration,
            scrambleText: {
                text: texts[textIndex],
                chars: '!<>-_\\/[]{}—=+*^?#________',
                speed: 0.8,
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

function updateFooterYear() {
    const el = document.getElementById('footer-year');
    if (el) el.textContent = new Date().getFullYear();
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
    logos[currentIndex].classList.add('active');
    if (prefersReducedMotion) return;

    setInterval(() => {
        logos.forEach((logo, index) => logo.classList.toggle('active', index === currentIndex));
        currentIndex = (currentIndex + 1) % logos.length;
    }, config.logoCarousel.interval);
}

function initializeExpandableHighlights() {
    const container = document.querySelector('.about-highlights');
    if (!container) return;
    const items = container.querySelectorAll('.highlight-item');

    items.forEach(item => {
        item.setAttribute('role', 'button');
        item.setAttribute('aria-expanded', 'false');
    });

    const setExpanded = (item, isExpanded) => {
        item.classList.toggle('expanded', isExpanded);
        item.setAttribute('aria-expanded', String(isExpanded));
    };

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
            setExpanded(currentlyExpanded, false);
        }

        // Toggle the active state of the interacted item
        setExpanded(highlightItem, !highlightItem.classList.contains('expanded'));
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
            setExpanded(currentlyExpanded, false);
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
        const barArea = clone.querySelector('.gantt-bar-area');
        const closeOtherTooltips = () => {
            container.querySelectorAll('.gantt-bar-area.active').forEach(activeArea => {
                if (activeArea !== barArea) {
                    activeArea.classList.remove('active');
                    activeArea.setAttribute('aria-expanded', 'false');
                }
            });
        };

        barArea.tabIndex = 0;
        barArea.setAttribute('role', 'button');
        barArea.setAttribute('aria-expanded', 'false');
        barArea.setAttribute('aria-label', `Show details for ${job.title} at ${job.company}`);
        barArea.addEventListener('click', () => {
            const isActive = barArea.classList.contains('active');
            closeOtherTooltips();
            barArea.classList.toggle('active', !isActive);
            barArea.setAttribute('aria-expanded', String(!isActive));
        });
        barArea.addEventListener('keydown', (event) => {
            if (!['Enter', ' '].includes(event.key)) return;
            event.preventDefault();
            barArea.click();
        });

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
