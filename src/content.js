import { workArchive } from './work-data.js';

export const siteContent = {
  profile: {
    name: 'Jerry James',
    pageTitle: 'Jerry James - Technical Marketing Specialist',
    jobTitle: 'Technical Marketing Specialist',
    canonicalUrl: 'https://jerryjames.me/',
    // Pre-paint <meta name="theme-color"> hints (BaseLayout). Must match the
    // --color-background token values in settings.css / critical-home.css;
    // after first paint the SiteNav theme controller re-reads the live token.
    themeColors: {
      light: '#f0eeea',
      dark: '#1a1d29',
    },
    portraitImage: '/images/jerry-james-portrait.webp',
    portraitAlt: 'Portrait of Jerry James',
    socialImage: '/images/seo/jerry-james-og.png',
    socialImageAlt: 'Jerry James technical marketing portfolio preview',
    socialImageWidth: 1200,
    socialImageHeight: 630,
    description:
      'Jerry James is a technical marketing specialist for B2B and B2C technology brands, focused on content marketing, demand generation, product positioning, marketing automation, and technical communication.',
    aiSummary:
      'Jerry James creates technical content strategy, demand generation programs, product positioning, technical documentation, marketing automation, and performance reporting for technology companies. He works across PC hardware, B2B and B2C networking, cybersecurity, cloud computing, SaaS, consumer electronics, and manufacturing.',
    location: {
      city: 'Bangalore',
      country: 'IN',
    },
    sameAs: ['https://linkedin.com/in/jerry-james-tech/'],
    experienceStartYear: 2014,
    availability: {
      status: 'Remote, worldwide',
    },
    // Hero headline: two statement words rendered inline. `accent` ("deep
    // tech") gets the brand blue; `accentEmber` ("moves buyers") gets the ember
    // ink — the tech → impact story. `pre`/`mid`/`post` are the plain
    // connective text (keep their leading/trailing spaces — they carry the word
    // spacing). Keep each part short — it wraps on small screens.
    heroHeadline: {
      pre: 'I turn ',
      accent: 'deep tech',
      mid: ' into marketing that ',
      accentEmber: 'moves buyers',
      post: '.',
    },
    heroLede:
      'Technical marketing for PC hardware, cybersecurity, cloud, and SaaS — translating what engineering builds into demand gen, positioning, and content that converts.',
    heroFocus: 'B2B + B2C tech',
    // The proof card renders whatever is in here — the metrics grid sizes
    // itself to the count, so entries can be added or dropped without touching
    // CSS. heroProofContext fills the width the card holds to stay aligned with
    // the portrait above it; it restates heroLede's domains rather than making
    // a separate claim.
    heroProofContext: ['PC hardware', 'cybersecurity', 'cloud', 'SaaS'],
    heroStats: [
      {
        value: '50M+',
        label: 'Views',
      },
      {
        value: '1,000+',
        label: 'Pieces',
      },
    ],
    // Hero buttons, in order. `variant` maps to the c-btn--<variant> class.
    heroCtas: [
      { label: 'View portfolio', href: '#portfolio', variant: 'primary' },
      {
        label: 'Schedule a discovery call',
        href: '#schedule',
        variant: 'ember',
      },
    ],
    bookingCta: {
      text: 'Open to freelance & consulting engagements',
      buttonLabel: 'Schedule a discovery call',
      url: 'https://calendly.com/jerryjames-cal/discover',
      expandedTitle: 'Choose a time for a discovery call',
      helperText:
        'Pick a slot that works for you. Everything happens right here — no redirects, no leaving the page.',
      loadingText: 'Loading available times…',
      closeLabel: 'Close scheduler',
      bookedText: "You're in. Invite's on its way — see you then.",
      // Calendly only honors these color params on plans with custom theming
      // (custom_theme_allowed); until then the embed always renders its white
      // default and dark mode is handled by --calendly-embed-filter (an
      // invert filter in settings.css). If the plan is ever upgraded, remove
      // that filter so these dark values apply directly.
      theme: {
        dark: {
          backgroundColor: '0F1117',
          textColor: 'E8E8EA',
          primaryColor: '57B9FF',
        },
        light: {
          backgroundColor: 'FFFFFF',
          textColor: '1A1A2E',
          primaryColor: '517891',
        },
        hideEventTypeDetails: true,
      },
    },
  },

  // Home page section chrome — kicker label + title per section, in page
  // order. Kicker numbering ("01 /") is a CSS counter; write label text only.
  sections: {
    // Title and about.lede are a single sentence split across the section
    // header and the prose column ("I Didn't Plan This…" / "…But it's all
    // connected."), so the ellipses are load-bearing — edit them together.
    about: { kicker: 'About', title: "I Didn't Plan This…" },
    skills: { kicker: 'Expertise', title: 'Fluent in Both' },
    services: {
      kicker: 'Services',
      title: "You Build It. I'll Bring the Party",
    },
    testimonials: {
      kicker: 'Testimonials',
      title: "I Didn't Even Have to Bribe Them",
    },
    portfolio: {
      kicker: 'Selected Work',
      title: 'Spoiler Alert: It Went Well',
    },
    experience: { kicker: 'Experience', title: "I've Been Around" },
    blog: { kicker: 'Writing', title: 'Field Notes From the Content Lab' },
    contact: { kicker: 'Contact', title: "Let's Work Together" },
  },

  // Site-wide beta banner (BetaBanner.astro; shown on every page).
  betaBanner: {
    stripLabel: 'Beta',
    eyebrow: 'Beta site',
    message: 'still under construction — mind the scaffolding.',
  },

  about: {
    // Mono `// tag` label (same lowercase snake_case pattern as
    // skills.feature.tag). Prose sits in the left column of the About split,
    // the ledger in the right. `lede` is the display-weight thesis; `bio` is
    // the supporting copy (may contain <b>, rendered with set:html). It stays
    // clear of the hero metrics and the ledger tiles — it adds the connective
    // voice neither of those carries (who I am + what I do for businesses).
    tag: 'whoami',
    // Completes the section title — see the note on sections.about above.
    lede: "…But it's all connected.",
    bio: [
      "I'm a technical marketer who came up through the code, the community, and the editor's desk. So I can sit with your <b>engineers</b>, actually follow what they're shipping, and still leave with a narrative your <b>buyers</b> notice and resonate with.",
      "That's the job I do for tech companies now — turning deep, hard-to-explain products into positioning, content, and demand gen. Honest enough for engineering to sign off on, sharp enough to move the market.",
    ],
    // Career ledger, rendered as an ascending staircase (the "About" graphic).
    // Order is oldest -> newest for reading/DOM order; CSS `column-reverse`
    // puts "now" at the top of the climb, and main.js's section .is-visible
    // toggle drives the bottom-to-top extrude-in reveal. `current: true` marks
    // the present-day apex (gets the pulsing brand node). The last note is the
    // "what I do for businesses" payoff the section builds toward. Deliberately
    // carries no metric column — the hero directly above already showcases the
    // 50M+/1,000+ figures, so repeating them here would read as an echo.
    ledger: [
      {
        year: '2012',
        role: 'Community manager',
        note: 'Ran a gaming community and learned how an audience actually thinks.',
      },
      {
        year: '2014',
        role: 'Web developer',
        note: "Shipped Node APIs — got under the hood of the tech I'd later sell.",
      },
      {
        year: '2019',
        role: 'Technical editor and Features writer',
        note: 'Led hardware editorial and features — explaining tech with deep-dives.',
      },
      {
        year: 'Now',
        role: 'Technical marketer',
        note: 'Turning what engineers build into demand for deep-tech brands.',
        current: true,
      },
    ],
  },

  logoBar: { label: 'Experience with' },
  // `name` selects the inlined mark in LogoMark.astro; `alt` is its accessible name.
  clientLogos: [
    { name: 'microsoft', alt: 'Microsoft logo' },
    { name: 'cgdirector', alt: 'CGDirector logo' },
    { name: 'msi', alt: 'MSI logo' },
    { name: 'licensespring', alt: 'LicenseSpring logo' },
  ],

  experience: [
    {
      id: 'consulting',
      period: '10/2015 - Present',
      sortOrder: 1,
      title: 'Technical Marketing Specialist',
      company: 'Jerry James (Consulting)',
      location: 'Bangalore, India',
      responsibilities: [
        'Founded a consulting firm for clients in the tech niche.',
        'Specialized in PC Hardware, B2B/B2C Networking, Cybersecurity, and Cloud Computing.',
      ],
      achievements: [
        {
          icon: 'award',
          text: 'Created over <b>1,000+</b> compelling content pieces.',
        },
      ],
    },
    {
      id: 'msi',
      period: '05/2018 - Present',
      sortOrder: 3,
      title: 'Freelance Technical Marketing Consultant',
      company: "MSI (Micro-Star Int'l)",
      location: 'Remote, Taiwan',
      responsibilities: [
        'Translate technical specs into effective marketing narrative.',
        'Strategize content marketing for new product launches.',
        'Develop distinct brand voices for new product lines and sub-brands.',
      ],
      achievements: [
        {
          icon: 'globe',
          text: 'Managed content for <b>50+</b> landing pages with <b>50M+</b> views.',
        },
        {
          icon: 'feather',
          text: 'Authored <b>100+</b> and edited <b>400+</b> content pieces.',
        },
      ],
    },
    {
      id: 'cgdirector',
      period: '07/2019 - 06/2025',
      sortOrder: 2,
      title: 'Head of PC Hardware | Technical Editor',
      company: 'CGDirector',
      location: 'Remote, Germany',
      responsibilities: [
        'Oversaw the hardware section, including content strategy and quality control.',
        'Managed and edited work from a team of writers to ensure quality standards.',
        'Simplified technology for a general audience.',
      ],
      achievements: [
        {
          icon: 'file-text',
          text: 'Edited and published over <b>200+</b> technical articles.',
        },
      ],
    },
    {
      id: 'webdev',
      period: '07/2014 - 08/2015',
      sortOrder: 4,
      title: 'Freelance Web Developer',
      company: 'Self-Employed',
      location: 'Remote, Worldwide',
      responsibilities: [
        'Provided freelance web development, focusing on design changes, maintenance, and bug fixing.',
      ],
      achievements: [
        {
          icon: 'code',
          text: 'Handled creation and updates of <b>REST APIs</b> using Node.js.',
        },
      ],
    },
    {
      id: 'dota2',
      period: '10/2012 - 10/2015',
      sortOrder: 5,
      title: 'Administrator and Community Manager',
      company: 'Dota2Traders',
      location: 'Remote, US',
      responsibilities: [
        'Managed website and community administration for a forum.',
        'Collaborated with influencers and Esports players for publicity campaigns.',
      ],
      achievements: [
        {
          icon: 'users',
          text: 'Grew and managed a community forum of over <b>10,000+</b> members.',
        },
      ],
    },
  ],

  // Featured work showcase (renders in the #portfolio section). Two tiers:
  // `featuredCampaigns` are hand-picked flagships shown as rich spotlight blocks
  // (screengrab + story + key deliverables); `workArchive` (generated in
  // work-data.js from the campaign map) is the full body of work, browsed via
  // asset-type tabs + an industry filter. Each archive piece's `status` maps to
  // a badge + link affordance via `workStatusMeta`; deliverable/item type badges
  // and CTA verbs come from `workTypeMeta`. Flagship screengrabs live in
  // public/images/work/ (~1200px, 16:10).
  workTypeMeta: {
    article: { label: 'Article', icon: 'file-text', verb: 'Read article' },
    blog: { label: 'Blog', icon: 'file-text', verb: 'Read' },
    video: { label: 'Video', icon: 'play', verb: 'Watch' },
    whitepaper: {
      label: 'Whitepaper',
      icon: 'file-text',
      verb: 'View whitepaper',
    },
    press: { label: 'Press', icon: 'news', verb: 'Read release' },
    landing: {
      label: 'Landing page',
      icon: 'external-link',
      verb: 'View campaign',
    },
    'case-study': {
      label: 'Case study',
      icon: 'file-text',
      verb: 'Read case study',
    },
    review: { label: 'Review', icon: 'file-text', verb: 'Read review' },
    guide: { label: 'Guide', icon: 'file-text', verb: 'Read guide' },
  },
  // status -> badge label + icon + tone. live/press/archived render the title as
  // an outbound link; internal/none are credited without a link.
  workStatusMeta: {
    live: { label: 'Live', icon: 'external-link', tone: 'live' },
    press: { label: 'Press', icon: 'news', tone: 'live' },
    archived: { label: 'Archived', icon: 'archive', tone: 'archived' },
    internal: { label: 'Internal', icon: 'lock', tone: 'muted' },
    none: { label: 'No public link', icon: 'ban', tone: 'muted' },
  },
  // Display labels for the archive's asset-type sections. The internal keys in
  // work-data.js stay stable; edit only the values to restyle the section names.
  assetTypeLabels: {
    'Product Launch': 'Product Launches',
    'Case studies & Customer stories': 'Case Studies',
    Reviews: 'Reviews',
    'Guides & Explainers': 'Guides & Explainers',
    'Landing pages & Web copy': 'Landing Pages & Web Copy',
    'Blogs & Articles': 'Blogs & Articles',
    'Press & PR': 'Press & PR',
    Other: 'Everything Else',
  },
  // Archive chrome (headings, count status, controls). `{count}`, `{shown}`
  // and `{total}` are placeholders filled in by HomeBody / main.js.
  archiveUi: {
    heading: 'Full body of work',
    emptyMessage: 'Nothing to see here. Yet.',
    showFewerLabel: 'Show fewer',
    showAllLabel: 'Show all {count}',
    countStatus: '{shown} of {total} pieces',
    countInitial: '{total} pieces',
    // Visible rail labels for the two filter rows. The groups already carry
    // the longer ui.work.filterBy* strings as their accessible names, so these
    // are aria-hidden — they exist so a sighted user can tell the two rows
    // apart, which nothing on screen previously said.
    typeFilterLabel: 'Type',
    industryFilterLabel: 'Industry',
  },
  featuredCampaigns: [
    {
      name: 'MSI × NVIDIA DGX Station — AI Supercomputing',
      industry: 'PC Hardware',
      year: '2026',
      blurb:
        'Launch positioning for the MSI NVIDIA DGX Station — framing data-center-grade Grace Blackwell AI compute in a desktop form factor as a clear story for enterprise and research buyers, across a campaign landing and Computex press.',
      screenshot: '/images/work/MSI-NVIDIA_DGX.webp',
      screenshotAlt: 'MSI NVIDIA DGX Station AI supercomputing launch visual',
      items: [
        {
          type: 'landing',
          title: 'NVIDIA DGX Station campaign landing',
          access: 'live',
          url: 'https://www.msi.com/Landing/NVIDIA-DGX-STATION',
        },
        {
          type: 'press',
          title: 'Liquid-cooled AI infrastructure at Computex 2026',
          access: 'live',
          url: 'https://www.msi.com/news/detail/MSI-Showcases-Liquid-Cooled-AI-Infrastructure--NVIDIA-MGX--NVIDIA-DGX-Station-and-DC-MHS-Platforms-at-COMPUTEX-2026-148789',
        },
      ],
    },
    {
      name: 'EVA × MSI — Evangelion Gaming PC',
      industry: 'PC Hardware',
      year: '2022',
      blurb:
        'Go-to-market for the MSI × Evangelion collaboration — building a limited-edition build narrative true to the fanbase, across launch press and a campaign landing.',
      screenshot: '/images/work/eva.webp',
      screenshotAlt: 'EVA × MSI Evangelion gaming PC campaign visual',
      items: [
        {
          type: 'press',
          title: 'Partnership launch press release',
          access: 'live',
          url: 'https://www.techpowerup.com/294817/msi-launches-evangelion-e-project-themed-components',
        },
        {
          type: 'landing',
          title: 'Evangelion campaign landing',
          access: 'live',
          url: 'https://www.msi.com/Landing/evangelion-gaming-pc-components',
        },
      ],
    },
    {
      name: 'DigiME — AI Virtual Avatar Launch',
      industry: 'PC Hardware',
      year: '2025',
      blurb:
        'Launch storytelling for MSI’s DigiME AI VTuber avatar — positioning an on-device AI feature as a creator-friendly headline across press, landing, and blog.',
      screenshot: '/images/work/digime.webp',
      screenshotAlt: 'DigiME AI virtual avatar launch campaign visual',
      items: [
        {
          type: 'landing',
          title: 'DigiME campaign landing',
          access: 'live',
          url: 'https://www.msi.com/Landing/digime-ai-virtual-avatar',
        },
      ],
    },
    {
      name: 'MPG OLED 322URDX36 — QD-OLED Gaming Monitor',
      industry: 'PC Hardware',
      year: '2026',
      blurb:
        'Launch narrative for MSI’s flagship 4K 360Hz QD-OLED monitor — turning panel tech (Penta Tandem, Dark Armor) into a clear gamer-and-creator value story.',
      screenshot: '/images/work/oled-banner.webp',
      screenshotAlt: 'MPG OLED 322URDX36 QD-OLED gaming monitor launch visual',
      items: [
        {
          type: 'blog',
          title: 'Computex 2026 — QD-OLED monitor round-up',
          access: 'live',
          url: 'https://www.msi.com/blog/msi-computex-2026-ai-gaming-desktops-qd-oled-monitors-and-pro-max-series',
        },
      ],
    },
    {
      name: 'Egen — Cloud Cost Optimization',
      industry: 'Cloud',
      year: '2020',
      blurb:
        'A cloud / DevOps demand-gen program for Egen — a FinOps whitepaper and supporting webinars, blogs, and enterprise cloud case studies.',
      screenshot: '/images/work/egen.webp',
      screenshotAlt: 'Cover of the “10 Ways to Reduce Cloud Costs” whitepaper',
      items: [
        {
          type: 'whitepaper',
          title: '10 Ways to Reduce Cloud Costs White Paper (PDF)',
          access: 'live',
          url: 'http://web.archive.org/web/20240623080931/https://insights.egen.solutions/hubfs/white-papers/10%20Ways%20to%20Reduce%20Cloud%20Costs.pdf',
        },
        {
          type: 'case-study',
          title: 'Caterpillar — predictive maintenance',
          access: 'live',
          url: 'https://egen.ai/customer-stories/caterpillar-building-predictive-maintenance-models/',
        },
        {
          type: 'blog',
          title: 'How to Reduce AWS Costs',
          access: 'live',
          url: 'http://web.archive.org/web/20230925065210/https://egen.solutions/articles/how-to-reduce-aws-costs-strategies-and-best-practices/',
        },
      ],
    },
    {
      name: 'CGDirector — Hardware Reviews & Explainers',
      industry: 'PC Hardware',
      year: '2024',
      blurb:
        'Independent technical journalism for CGDirector — in-depth GPU/CPU reviews and evergreen explainers that built buyer trust and organic search authority.',
      screenshot: '/images/work/cgdirector.webp',
      screenshotAlt: 'CGDirector hardware reviews and explainers visual',
      items: [
        {
          type: 'review',
          title: 'RTX 4080 SUPER review',
          access: 'live',
          url: 'https://www.cgdirector.com/nvidia-rtx-4080-super-review/',
        },
        {
          type: 'review',
          title: 'AMD Threadripper 3990X review',
          access: 'live',
          url: 'https://www.cgdirector.com/amd-threadripper-3990x-review/',
        },
        {
          type: 'guide',
          title: 'Motherboard buying guide',
          access: 'live',
          url: 'https://www.cgdirector.com/motherboard-buying-guide-for-workstations/',
        },
      ],
    },
    {
      name: 'RedLegg — Cybersecurity Content',
      industry: 'Cybersecurity',
      year: '2019',
      blurb:
        'Top-of-funnel security education for RedLegg — explanatory guides on vulnerability management and threat intelligence aimed at enterprise security buyers.',
      screenshot: '/images/work/redlegg.webp',
      screenshotAlt: 'RedLegg cybersecurity content visual',
      items: [
        {
          type: 'guide',
          title: 'Vulnerability Management — complete guide',
          access: 'live',
          url: 'https://www.redlegg.com/solutions/advisory-services/vulnerability-management-pretty-much-everything-you-need-to-know',
        },
        {
          type: 'article',
          title: 'Major data breaches',
          access: 'live',
          url: 'https://www.redlegg.com/blog/major-data-breaches',
        },
      ],
    },
    {
      name: 'LicenseSpring — Product & Launch Content',
      industry: 'Software / SaaS',
      year: '2020',
      blurb:
        'Product marketing for LicenseSpring’s licensing platform — launch announcements, integration news, and conversion-focused website copy for a developer audience.',
      screenshot: '/images/work/licensespring.webp',
      screenshotAlt: 'LicenseSpring product and launch content visual',
      items: [
        {
          type: 'press',
          title: 'New platform, license models & SDKs',
          access: 'live',
          url: 'https://licensespring.com/blog/news/announcement-new-platform-new-license-models-new-sdk',
        },
        {
          type: 'press',
          title: 'FastSpring integration',
          access: 'live',
          url: 'https://licensespring.com/blog/news/licensespring-integrated-with-fastspring',
        },
        {
          type: 'landing',
          title: 'Pricing page copy',
          access: 'live',
          url: 'https://licensespring.com/pricing',
        },
      ],
    },
    {
      name: 'MSI Reward Program — Loyalty Campaign',
      industry: 'PC Hardware',
      year: '2023',
      blurb:
        'Relaunch messaging for the MSI Reward Program — turning a loyalty revamp into a clear member-value story across press and a program landing.',
      screenshot: '/images/work/rewards.webp',
      screenshotAlt: 'MSI Reward Program loyalty campaign visual',
      items: [
        {
          type: 'press',
          title: 'Reward Program launch press release',
          access: 'live',
          url: 'https://www.msi.com/news/detail/MSI-Reward-Program-Launches---Seeking-MSI-Allies-143578',
        },
        {
          type: 'landing',
          title: 'Meet the new Reward Program',
          access: 'live',
          url: 'https://www.msi.com/Landing/meet-the-new-msi-reward-program',
        },
      ],
    },
  ],
  // Full body of work — ~250 pieces, generated in work-data.js from the map.
  workArchive,

  // Skills & Expertise — rendered as a bento in HomeBody: a feature cell (the
  // thesis, the "distiller" graphic, and a CTA) sits beside the
  // tool stack on the top row, with the three discipline cards as a triad
  // below. The disciplines are a set and must read as one — don't restore a
  // layout that splits them, and don't give the tool stack a numeric index
  // (it's a materials list, not a fourth discipline).
  // `feature.thesis` is a segment list so the emphasised words can be
  // coloured. `slug` values are the mono `// category` labels. Keyword
  // consumers (llms.txt, knowsAbout schema) flatten disciplines[].skills +
  // tools.items — see skillKeywords below.
  skills: {
    feature: {
      tag: 'what_i_do',
      // Same tech → impact pairing as the hero headline: the engineering half
      // takes the brand blue, the market (impact) half takes ember.
      thesis: [
        { text: 'I turn what ' },
        { text: 'engineering', emphasis: true },
        { text: ' builds into what the ' },
        { text: 'market', emphasis: true, accent: 'ember' },
        { text: ' buys.' },
      ],
      distiller: { inputLabel: 'Code & specs', outputLabel: 'Campaigns' },
      cta: { label: 'See the work', href: '#portfolio' },
    },
    disciplines: [
      {
        slug: 'technical_marketing',
        name: 'Technical Marketing',
        note: 'whitepapers · guides',
        skills: [
          'Product Positioning',
          'Go-to-Market Strategy',
          'Competitive Analysis',
          'Product Messaging',
          'Technical Narratives',
          'Market Research',
        ],
      },
      {
        slug: 'b2b_marketing',
        name: 'B2B Marketing',
        note: 'case studies · landing pages',
        skills: [
          'Demand Generation',
          'Account-Based Marketing',
          'Lead Nurturing',
          'Sales Enablement',
          'B2B Content Strategy',
          'Marketing Qualified Leads',
        ],
      },
      {
        slug: 'b2c_marketing',
        name: 'B2C Marketing',
        note: 'blogs · launches · reviews',
        skills: [
          'Consumer Behavior',
          'Brand Storytelling',
          'Social Media Marketing',
          'Customer Journey Mapping',
          'Conversion Optimization',
          'Performance Marketing',
        ],
      },
    ],
    tools: {
      slug: 'tools_&_platforms',
      name: 'The Stack',
      items: [
        'HubSpot',
        'Salesforce',
        'Google Analytics',
        'Marketo',
        'Mailchimp',
        'Hootsuite',
        'Figma',
        'WordPress',
        'Webflow',
      ],
    },
  },

  // Services data — engagement models ("how do you work with me"), rendered
  // as ledger rows in HomeBody. ctaHref targets the booking bar in #contact.
  services: {
    tag: 'how_to_engage',
    lede: 'Three ways to plug me into your team — pick the shape that fits the problem.',
    // Fallback label; each engagement can override it with `ctaLabel` so three
    // parallel rows don't repeat one string down the section. All three still
    // land on the same booking anchor — the wording names the conversation,
    // not a different destination.
    ctaLabel: 'Schedule a discovery call',
    ctaHref: '#schedule',
    engagements: [
      {
        slug: 'project',
        name: 'Project Engagements',
        description:
          'A scoped, fixed deliverable — whitepaper packages, case-study series, launch content, a full site copy overhaul. Defined gap, defined deadline.',
        meta: 'scoped · fixed-deliverable',
        ctaLabel: 'Scope a project',
      },
      {
        slug: 'retainer',
        name: 'Content & Strategy Retainer',
        description:
          'An ongoing monthly engine — content pipeline, editorial calendar, demand-gen support, and an analytics feedback loop that compounds.',
        meta: 'monthly · ongoing',
        ctaLabel: 'Start a retainer',
      },
      {
        slug: 'fractional',
        name: 'Fractional Product Marketing',
        description:
          'Embedded part-time — positioning, go-to-market planning, sales enablement, and translating between your engineers and your market.',
        meta: 'embedded · part-time',
        ctaLabel: 'Talk fractional',
      },
    ],
  },
  // Home page blog section (HomeBlogSection.astro). Cards come from the blog
  // collection; this is the surrounding editorial copy.
  blogSection: {
    feature: {
      image: '/images/blog/blog-cover.svg',
      imageAlt:
        'Abstract illustration of tangled technical lines passing through a lens and emerging as clean, ordered content with a rising trend line',
      kicker: 'Blog',
      heading: 'Notes from inside the spec sheet.',
      text: 'Notes on turning complex technology into clearer positioning, sharper content systems, and pages that help buyers understand what matters.',
      ctaLabel: 'View all posts',
    },
    readMoreLabel: 'Read article',
  },

  // Blog index (/blog/) hero copy.
  blogIndex: {
    kicker: 'Field Notes',
    title: 'Technical marketing, without the fog machine',
    intro:
      'Practical notes on content systems, product storytelling, and turning dense technical ideas into work that earns attention.',
  },

  // No-posts empty states. Shared title; each surface has its own body copy.
  blogEmpty: {
    title: 'Nothing published yet.',
    homeText: 'Still in the lab. Check back.',
    indexText:
      'Nothing here yet. Turns out writing about writing takes a while.',
  },

  testimonials: [
    {
      name: 'Alex Glawion',
      title: 'CEO and Founder',
      company: 'CG Director',
      quote:
        "Jerry is an exceptional technical writer, editor, and content marketer. He's been instrumental in our traffic growth from a few thousands to over 2M a month within 18 months!",
    },
    {
      name: 'Edmon Moren',
      title: 'CEO',
      company: 'LicenseSpring',
      quote:
        'Working with Jerry was a game-changer. His strategic insights and execution on our B2B campaigns were instrumental in us exceeding our quarterly targets.',
    },
    {
      name: 'Sam Wilson',
      title: 'Product Manager',
      company: 'Gadget Masters',
      quote:
        'The B2C campaign Jerry developed was a resounding success. He has a deep understanding of the consumer mindset and how to engage them effectively.',
    },
    {
      name: 'Emily White',
      title: 'Head of Content',
      company: 'Redlegg',
      quote:
        'The series of white papers Jerry created for us not only generated a significant number of qualified leads but also positioned us as thought leaders in the cybersecurity space.',
    },
    {
      name: 'Michael Brown',
      title: 'Founder',
      company: 'SaaSify',
      quote:
        "Jerry's expertise in technical marketing was crucial for our SaaS platform launch. He is a true professional and a pleasure to work with.",
    },
    {
      name: 'Sarah Green',
      title: 'CMO',
      company: 'Data Dynamics',
      quote:
        'We saw an 85% improvement in our lead nurturing process after Jerry implemented and optimized our marketing automation workflows. Highly recommended.',
    },
    {
      name: 'David Lee',
      title: 'Brand Manager',
      company: 'Quantum Electronics',
      quote:
        "The integrated B2C campaign for our new product line achieved a 150% ROI, far exceeding our expectations. Jerry's data-driven approach was key.",
    },
    {
      name: 'Laura Chen',
      title: 'VP of Engineering',
      company: 'CloudNet',
      quote:
        "Jerry's ability to create clear and concise API documentation was a huge asset to our development team and our partners.",
    },
    {
      name: 'Chris Taylor',
      title: 'Operations Manager',
      company: 'Global Manufacturing',
      quote:
        'The marketing automation system Jerry put in place saved us countless hours and significantly increased our sales-ready leads.',
    },
  ],

  // Contact section intro panel (left of the form).
  contactPanel: {
    title: 'Now the Easy Part',
    text: "Tell me what you're launching and who has to understand it. I'll tell you straight whether I'm the right fit — and if I'm not, who is.",
  },

  // Contact form (Web3Forms; the access key is public by design)
  contactForm: {
    endpoint: 'https://api.web3forms.com/submit',
    accessKey: 'c813bf75-f553-4abb-9e16-b19a84e83537',
    subject: 'New Submission from Portfolio',
    // Each label renders twice: as the field's sr-only <label> and as its
    // visible in-well placeholder (the deep-well fields have no visible
    // label chrome).
    labels: {
      name: 'Name',
      email: 'Email',
      company: 'Company (optional)',
      message: 'Message',
    },
    submitLabel: 'Send Message',
    // In-flight + success labels for the submit button (main.js swaps these on
    // the button itself; success confirmation lives on the button, not a toast).
    sendingLabel: 'Sending…',
    sentLabel: 'Sent',
    // Error copy shown inline (main.js). `required` is keyed by field name and
    // renders under the field; `submitFailed`/`network` render as a summary
    // above the button. Success is confirmed by the button morph, not copy.
    messages: {
      required: {
        name: 'Please enter your name.',
        email: 'Please enter your email address.',
        message: 'Please enter a message.',
      },
      invalidEmail: 'Please enter a valid email address.',
      submitFailed:
        "That didn't send. Try again, or reach me on LinkedIn — link's in the panel.",
      network: 'Network error. Please check your connection and try again.',
      // Announced once to screen readers on a failed submit (main.js), followed
      // by the list of affected field labels. Not shown visually.
      summaryLead: 'Please correct the following before sending:',
    },
  },

  // Accessible names and control labels — the wording screen readers announce
  // and the text on chrome that isn't body copy. Kept here for the same reason
  // as everything else in this file: so the site's language lives in one place
  // rather than being scattered through markup. `{index}`/`{total}` are
  // placeholders filled by JS, same convention as archiveUi.
  ui: {
    skipLink: 'Skip to content',
    nav: {
      // <nav> landmark name; distinguishes this from any future nav landmark.
      landmark: 'Primary',
      // `{name}` is filled from profile.name so the brand link's accessible
      // name can't drift from the site owner's name.
      brandHome: '{name} home',
      themeToggle: 'Dark theme',
      // Nav links in render order. `id` MUST match the home page's section
      // element id — the scroll-spy (main.js updateActiveNavLink) compares
      // `#<id>` against the section in view, and the hamburger's announced
      // name is built from the matching link's label. `anchor` overrides the
      // in-page target when it differs from the id; `standalonePath` makes the
      // link leave the page entirely when we're not on the home page.
      links: [
        { id: 'home', label: 'Home', anchor: 'hero' },
        { id: 'about', label: 'About' },
        { id: 'skills', label: 'Skills' },
        { id: 'services', label: 'Services' },
        { id: 'testimonials', label: 'Testimonials' },
        { id: 'portfolio', label: 'Portfolio' },
        { id: 'experience', label: 'Experience' },
        { id: 'blog', label: 'Blog', standalonePath: '/blog/' },
        { id: 'contact', label: 'Contact' },
      ],
      // Used when `current` matches no link (e.g. the 404 page).
      defaultCurrentLabel: 'Home',
      // The hamburger's accessible name, which changes as you scroll. Built in
      // THREE places — server-rendered in SiteNav, then re-set by main.js on
      // the home page and by SiteNav's own inline script everywhere else.
      // Those two scripts can't import this file (one is `is:inline`), so both
      // read these templates off the button's data-* attributes instead of
      // carrying their own copy. `{section}` is the current section's label.
      toggleLabelOpen: 'Open navigation menu, currently {section}',
      toggleLabelClose: 'Close navigation menu, currently {section}',
    },
    hero: {
      // scrollToNext stays the anchor's accessible name; scrollLabel is the
      // visible mono micro-label. Keeping both is deliberate — the fuller
      // string reads better out of context for a screen reader, and it
      // contains the visible word, which is what WCAG 2.5.3 asks for.
      scrollToNext: 'Scroll to next section',
      scrollLabel: 'scroll',
    },
    work: {
      featuredRegion: 'Featured work',
      previousItem: 'Previous featured item',
      nextItem: 'Next featured item',
      // Announced to screen readers on each carousel advance (main.js).
      slideStatus: 'Slide {index} of {total}',
      filterByType: 'Filter work by type',
      filterByIndustry: 'Filter work by industry',
      // Badge on archive rows whose piece is an interview.
      interviewTag: 'Interview',
      lightboxRegion: 'Work excerpt',
      lightboxClose: 'Close excerpt',
    },
    testimonials: {
      pause: 'Pause testimonials',
      resume: 'Resume testimonials',
      // Replaces the pause/resume name when the control is disabled because
      // the OS asked for reduced motion (main.js). Not shown visually.
      reducedMotion: 'Testimonials paused because reduced motion is enabled',
    },
    footer: {
      rights: 'All rights reserved.',
      backToTop: 'Back to Top',
      // Secondary links. Email is deliberately absent — it only ever reaches
      // the page through the reveal button in the contact panel, which is what
      // keeps it out of scrapers (see contactInfo). RSS is absent too: the feed
      // is still built and still advertised in the head for feed readers, but a
      // visible link only ever showed a visitor raw XML.
      blog: 'Blog',
      linkedin: 'LinkedIn',
    },
  },

  // 404 page (src/pages/404.astro).
  notFound: {
    metaDescription:
      'This page was announced but never shipped. Head back to the homepage or browse the blog.',
    graphicAlt:
      'A monogram-style ring containing the number 404, its orbital signal line breaking apart on one side',
    kicker: 'Error 404 · Signal lost',
    title: 'You found the vaporware.',
    intro:
      'This page was announced by your URL bar, but it never shipped. Could be a typo, could be a link that outlived its redirect. Everything below, though, is in production.',
    actions: [
      { label: 'Back to production', href: '/', variant: 'primary' },
      { label: 'Browse the field notes', href: '/blog/', variant: 'outline' },
    ],
  },

  contactInfo: {
    revealTitle: 'Reveal email address',
    email: {
      user: 'contact',
      domain: 'jerryjames.me',
    },
    linkedin: {
      url: 'https://linkedin.com/in/jerry-james-tech/',
      label: 'Reach out via LinkedIn',
    },
  },
};

// Flattened skill/tool keywords for SEO surfaces (llms.txt, knowsAbout schema).
// Single source so the skills bento shape stays decoupled from those consumers.
export const skillKeywords = [
  ...siteContent.skills.disciplines.flatMap((discipline) => discipline.skills),
  ...siteContent.skills.tools.items,
];
