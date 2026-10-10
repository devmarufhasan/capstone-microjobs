/** Preview-only marketplace records. Replace this module with real Module 2 queries later. */
export type MarketplaceCategory =
  "design" | "development" | "marketing" | "writing" | "video" | "data";

export const categories: {
  id: MarketplaceCategory;
  label: string;
  short: string;
}[] = [
  { id: "design", label: "Graphics & design", short: "Design" },
  { id: "development", label: "Programming & tech", short: "Development" },
  { id: "marketing", label: "Digital marketing", short: "Marketing" },
  { id: "writing", label: "Writing & translation", short: "Writing" },
  { id: "video", label: "Video & animation", short: "Video" },
  { id: "data", label: "Data & research", short: "Data" },
];

export type DemoService = {
  id: string;
  slug: string;
  title: string;
  category: MarketplaceCategory;
  image: string;
  seller: string;
  university: string;
  summary: string;
  priceFromBdt: number;
  deliveryDays: number;
  skills: string[];
  includes: string[];
};

export const demoServices: DemoService[] = [
  {
    id: "sample-service-01",
    slug: "brand-identity-starter",
    title: "I will create a clean visual identity for your idea",
    category: "design",
    image: "/images/marketplace/graphic-design.webp",
    seller: "Nusrat A. · sample",
    university: "Student creator",
    summary:
      "A thoughtful starter identity for a campus club, small shop or new project.",
    priceFromBdt: 1200,
    deliveryDays: 3,
    skills: ["Branding", "Logo concepts", "Social graphics"],
    includes: [
      "Two initial directions",
      "One revision round",
      "Export-ready graphics",
    ],
  },
  {
    id: "sample-service-02",
    slug: "responsive-landing-page",
    title: "I will build a responsive landing page for your project",
    category: "development",
    image: "/images/marketplace/web-development.webp",
    seller: "Rafi M. · sample",
    university: "Student developer",
    summary:
      "A polished single-page website to introduce your product or event.",
    priceFromBdt: 3500,
    deliveryDays: 5,
    skills: ["Web development", "Responsive UI", "Accessibility"],
    includes: ["One responsive page", "Contact section", "Basic handoff notes"],
  },
  {
    id: "sample-service-03",
    slug: "social-post-kit",
    title: "I will design a social media post kit for your campaign",
    category: "marketing",
    image: "/images/marketplace/social-media.webp",
    seller: "Mehjabin S. · sample",
    university: "Student creator",
    summary:
      "A consistent set of visuals for a launch, event or local business.",
    priceFromBdt: 900,
    deliveryDays: 2,
    skills: ["Social media", "Content design", "Campaigns"],
    includes: [
      "Four post designs",
      "Editable source files",
      "One revision round",
    ],
  },
  {
    id: "sample-service-04",
    slug: "clear-blog-article",
    title: "I will write a clear article or blog post for your audience",
    category: "writing",
    image: "/images/marketplace/writing.webp",
    seller: "Afiya R. · sample",
    university: "Student writer",
    summary: "Readable, researched copy with a tone that fits your audience.",
    priceFromBdt: 700,
    deliveryDays: 3,
    skills: ["Writing", "Research", "Editing"],
    includes: ["Up to 800 words", "Basic research", "One edit round"],
  },
  {
    id: "sample-service-05",
    slug: "short-video-edit",
    title: "I will edit a short video for your event or social page",
    category: "video",
    image: "/images/marketplace/video-editing.webp",
    seller: "Tanvir H. · sample",
    university: "Student editor",
    summary:
      "A crisp edit from your footage with pacing, captions and a tidy finish.",
    priceFromBdt: 1500,
    deliveryDays: 4,
    skills: ["Video editing", "Captions", "Short-form"],
    includes: [
      "One video up to 60 seconds",
      "Basic captions",
      "One revision round",
    ],
  },
  {
    id: "sample-service-06",
    slug: "spreadsheet-cleanup",
    title: "I will organize and clean your spreadsheet data",
    category: "data",
    image: "/images/marketplace/data-analysis.webp",
    seller: "Sadia N. · sample",
    university: "Student analyst",
    summary: "Turn messy rows into a clean, useful spreadsheet for your team.",
    priceFromBdt: 800,
    deliveryDays: 2,
    skills: ["Spreadsheets", "Data entry", "Organization"],
    includes: ["Formatting and cleanup", "Duplicate review", "Summary sheet"],
  },
];

export type DemoOpportunity = {
  id: string;
  slug: string;
  title: string;
  organization: string;
  category: MarketplaceCategory;
  budgetBdt: number;
  timeframe: string;
  format: string;
  summary: string;
  skills: string[];
  image: string;
};

export const demoOpportunities: DemoOpportunity[] = [
  {
    id: "sample-job-01",
    slug: "campus-event-poster",
    title: "Design a poster for a campus event",
    organization: "Campus club · sample",
    category: "design",
    budgetBdt: 1000,
    timeframe: "3 days",
    format: "Remote",
    summary:
      "Create a memorable poster and social version for a student-led event.",
    skills: ["Poster design", "Social media"],
    image: "/images/marketplace/graphic-design.webp",
  },
  {
    id: "sample-job-02",
    slug: "cafe-menu-page",
    title: "Build a simple café menu webpage",
    organization: "Local café · sample",
    category: "development",
    budgetBdt: 3000,
    timeframe: "1 week",
    format: "Remote",
    summary:
      "Make a mobile-friendly page that presents the café menu and opening hours.",
    skills: ["HTML/CSS", "Responsive design"],
    image: "/images/marketplace/web-development.webp",
  },
  {
    id: "sample-job-03",
    slug: "product-data-cleanup",
    title: "Clean up a small product spreadsheet",
    organization: "Local shop · sample",
    category: "data",
    budgetBdt: 850,
    timeframe: "2 days",
    format: "Remote",
    summary:
      "Check duplicate entries and organize a product list into clear columns.",
    skills: ["Spreadsheet", "Attention to detail"],
    image: "/images/marketplace/data-analysis.webp",
  },
  {
    id: "sample-job-04",
    slug: "launch-social-posts",
    title: "Create social posts for a new launch",
    organization: "Startup team · sample",
    category: "marketing",
    budgetBdt: 1400,
    timeframe: "4 days",
    format: "Remote",
    summary:
      "Prepare a few reusable visual posts for an upcoming small-business launch.",
    skills: ["Content design", "Copywriting"],
    image: "/images/marketplace/social-media.webp",
  },
];

export function categoryLabel(id: MarketplaceCategory) {
  return categories.find((category) => category.id === id)?.label ?? id;
}

export type DemoOrder = {
  id: string;
  title: string;
  counterpart: string;
  stage: "in_progress" | "delivered" | "completed";
  serviceSlug: string;
  summary: string;
};

export const demoOrders: DemoOrder[] = [
  {
    id: "sample-order-01",
    title: "Campus event poster",
    counterpart: "Sample campus club",
    stage: "in_progress",
    serviceSlug: "brand-identity-starter",
    summary: "Example workspace showing an active project and its next step.",
  },
  {
    id: "sample-order-02",
    title: "Launch social post kit",
    counterpart: "Sample startup team",
    stage: "delivered",
    serviceSlug: "social-post-kit",
    summary: "Example delivery awaiting a review decision.",
  },
  {
    id: "sample-order-03",
    title: "Product spreadsheet cleanup",
    counterpart: "Sample local shop",
    stage: "completed",
    serviceSlug: "spreadsheet-cleanup",
    summary: "Example completed project shown for interface preview.",
  },
];

export type DemoConversation = {
  id: string;
  name: string;
  role: string;
  subject: string;
  messages: { from: "them" | "you"; text: string }[];
};

export const demoConversations: DemoConversation[] = [
  {
    id: "sample-thread-01",
    name: "Campus club · sample",
    role: "Project partner preview",
    subject: "Event poster",
    messages: [
      {
        from: "them",
        text: "Hi! We are planning a small campus event and need a clear poster.",
      },
      {
        from: "you",
        text: "That sounds exciting. What size and date should the design include?",
      },
      {
        from: "them",
        text: "An Instagram post and a printable version would be ideal.",
      },
    ],
  },
  {
    id: "sample-thread-02",
    name: "Local café · sample",
    role: "Project partner preview",
    subject: "Menu webpage",
    messages: [
      {
        from: "them",
        text: "We would like a simple page for our menu and opening hours.",
      },
      { from: "you", text: "A mobile-friendly page would work well for that." },
    ],
  },
];
