export const siteContent = {
  profile: {
    name: 'Jerry James',
    pageTitle: 'Jerry James - Technical Marketing Specialist',
    jobTitle: 'Technical Marketing Specialist',
    canonicalUrl: 'https://www.jerryjames.me/',
    portraitImage: '/images/jerry-james-portrait.jpg',
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
      status: 'Available Worldwide',
    },
    heroStats: [
      {
        value: '50M+',
        label: 'Views',
      },
      {
        value: '1,000+',
        label: 'Pieces',
      },
      {
        value: '50+',
        label: 'Clients',
      },
    ],
    bookingCta: {
      text: 'Open to freelance & consulting engagements',
      buttonLabel: 'Schedule a Discovery Call',
      url: 'https://calendly.com/jerryjames-cal/discover',
      expandedTitle: 'Choose a time for a discovery call',
      helperText:
        'Pick a slot that works for you. The scheduler stays here so you can keep the portfolio in view.',
      loadingText: 'Loading available times...',
      closeLabel: 'Close scheduler',
      bookedText: 'You are booked. Thanks, I will see you on the call.',
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

  // About section
  about: {
    description:
      'I bridge your engineering and marketing teams – making sure that the cool stuff your engineering is building behind-the-scenes each day translates into marketing that focuses and targets real customer issues with data-driven narratives.',
    highlights: [
      {
        icon: 'pen',
        title: 'Technical Content Creation',
        description:
          'I create compelling white papers, case studies, and documentation that turn complex technical features into clear benefits, while driving lead gen strategies and establishing your brand as a thought leader.',
      },
      {
        icon: 'target',
        title: 'B2B & B2C Marketing Strategy',
        description:
          'From account-based marketing (ABM) for enterprise clients to broad consumer campaigns, I develop and execute cohesive strategies that resonate with the target audience and achieve measurable goals.',
      },
      {
        icon: 'compass',
        title: 'Complex Product Positioning',
        description:
          'I weave narratives around complex tech products to position them within crowded markets by highlighting their unique strengths and targeting real-world customer problems.',
      },
      {
        icon: 'bar-chart',
        title: 'Data-Driven Results',
        description:
          'Every decision is backed by data. I leverage analytics from Google, HubSpot, and other platforms to track KPIs, in addition to sales data to optimize campaign performance, and deliver clear marketing ROI.',
      },
    ],
  },

  // Logo bar ("Experience With")
  clientLogos: [
    { src: '/logos/microsoft.svg', alt: 'Microsoft logo' },
    { src: '/logos/cgdirector.svg', alt: 'CGDirector logo' },
    { src: '/logos/msi.svg', alt: 'MSI logo' },
    { src: '/logos/licensespring.svg', alt: 'LicenseSpring logo' },
  ],

  // Experience data
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

  // Portfolio data
  // Filter buttons and category badges are generated from the `category` keys
  // below; add a display label here when introducing a new category.
  portfolioCategoryLabels: {
    b2b: 'B2B',
    b2c: 'B2C',
    content: 'Content',
  },
  portfolio: [
    {
      category: 'b2b',
      title: 'SaaS Platform Launch Strategy',
      description:
        'Led the technical marketing strategy for a new SaaS platform, resulting in 300% increase in qualified leads and $2M ARR growth.',
      results: [
        '300% increase in qualified leads',
        '$2M ARR growth',
        '45% reduction in CAC',
      ],
      tags: ['B2B', 'SaaS', 'Technical Marketing', 'Lead Generation'],
    },
    {
      category: 'b2c',
      title: 'Consumer Electronics Campaign',
      description:
        'Developed and executed an integrated B2C campaign for consumer electronics brand, achieving 150% ROI.',
      results: [
        '150% ROI',
        '2.5M+ impressions',
        '25% increase in brand awareness',
      ],
      tags: [
        'B2C',
        'Consumer Electronics',
        'Integrated Campaign',
        'Brand Awareness',
      ],
    },
    {
      category: 'content',
      title: 'Technical White Paper Series',
      description:
        'Created a series of technical white papers for a cybersecurity company, generating 1000+ qualified leads.',
      results: [
        '1000+ qualified leads',
        '40% conversion rate',
        'Industry thought leadership',
      ],
      tags: [
        'Technical Writing',
        'White Papers',
        'Cybersecurity',
        'Lead Generation',
      ],
    },
    {
      category: 'b2b',
      title: 'Marketing Automation Implementation',
      description:
        'Implemented comprehensive marketing automation system for manufacturing company, improving lead nurturing by 85%.',
      results: [
        '85% improvement in lead nurturing',
        '60% time savings',
        '35% increase in sales-ready leads',
      ],
      tags: ['Marketing Automation', 'B2B', 'Lead Nurturing', 'Manufacturing'],
    },
  ],

  // Skills data
  skills: [
    {
      category: 'Technical Marketing',
      tags: [
        'Product Positioning',
        'Go-to-Market Strategy',
        'Competitive Analysis',
        'Product Messaging',
        'Core Benefit Analysis',
        'Technical Narrative Development',
        'Market Research',
      ],
    },
    {
      category: 'B2B Marketing',
      tags: [
        'Demand Generation',
        'Account-Based Marketing',
        'Lead Nurturing',
        'Sales Enablement',
        'B2B Content Strategy',
        'Marketing Qualified Leads',
      ],
    },
    {
      category: 'B2C Marketing',
      tags: [
        'Consumer Behavior Analysis',
        'Brand Storytelling',
        'Social Media Marketing',
        'Customer Journey Mapping',
        'Conversion Optimization',
        'Performance Marketing',
      ],
    },
    {
      category: 'Tools & Platforms',
      type: 'pane', // renders as the full-width pane layout in HomeBody's skills grid
      tags: [
        'HubSpot',
        'Salesforce',
        'Google Analytics',
        'Marketo',
        'Pardot',
        'Mailchimp',
        'Hootsuite',
        'Figma',
        'WordPress',
        'Webflow',
      ],
    },
  ],

  // Services data
  services: [
    {
      icon: 'pen',
      title: 'Technical Content Creation',
      description:
        'White papers, case studies, technical documentation, and thought leadership content that simplifies complex topics.',
    },
    {
      icon: 'target',
      title: 'B2B Marketing Strategy',
      description:
        'Comprehensive B2B marketing strategies including demand generation, ABM, and lead nurturing campaigns.',
    },
    {
      icon: 'megaphone',
      title: 'B2C Campaign Development',
      description:
        'Consumer-focused marketing campaigns that drive engagement, awareness, and conversions across digital channels.',
    },
    {
      icon: 'workflow',
      title: 'Marketing Automation',
      description:
        'Implementation and optimization of marketing automation workflows to nurture leads and improve ROI.',
    },
    {
      icon: 'layers',
      title: 'Content Marketing',
      description:
        'Strategic content planning, creation, and distribution across multiple channels to build brand authority.',
    },
    {
      icon: 'trending-up',
      title: 'Performance Analytics',
      description:
        'Data analysis and reporting to measure campaign effectiveness and optimize marketing performance.',
    },
  ],
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

  // Contact form (Web3Forms; the access key is public by design)
  contactForm: {
    endpoint: 'https://api.web3forms.com/submit',
    accessKey: 'c813bf75-f553-4abb-9e16-b19a84e83537',
    subject: 'New Submission from Portfolio',
  },

  // Contact Info
  contactInfo: {
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
