/**
 * ALL SITE CONTENT.
 *
 * Everything the visitor reads lives in this file. Swap the values, keep the
 * shapes, and the whole site changes. Sections never hardcode copy.
 *
 * ⚠️  DEMO CONTENT NOTICE
 * The person, studio, projects, awards, clients and testimonials below are
 * fictional placeholder data carried over from the reference design. They exist
 * to show the layout working, not to make claims. Replace all of it with your
 * own before this goes anywhere public — invented credentials and fake client
 * logos are the first thing a reviewer checks.
 */

export const site = {
  name: "Elena Voss",
  role: "Creative Web Designer",
  wordmark: "Elena Voss",
  email: "hello@elenavoss.design",
  phone: "+1 (415) 309-8274",
  location: "Lisbon, PT",
  /**
   * Hero headline. One string, NOT three pre-broken lines.
   *
   * It breaks into "Visualise / Your Mind / in Motion" purely from being
   * `w-[45%]` at `7.5vw`, and those three different-length lines are what
   * produce the stepped left edge. Hard-coding the breaks instead would pin the
   * text at whatever width it was authored for and collapse the shape the moment
   * the viewport — or the fluid clamp — moves.
   */
  heroHeadline: "Visualise Your Mind in Motion",
  /**
   * Right-hand meta notes, top to bottom. Each entry renders one line per
   * element, so "Creative / Web Designer" keeps its break while
   * "Award winning Designs" wraps naturally inside the narrow column.
   */
  heroMeta: [{ lines: ["Award winning Designs"] }, { lines: ["Creative", "Web Designer"] }],
  ctaLabel: "Get in Touch",
  /** Multiplier applied to the hero/portfolio marquee track. */
  scrollLength: 2,
} as const;

/* ------------------------------------------------------------------------ */

export type Project = {
  id: string;
  title: string;
  /** Rendered as "Tag  •  Tag" — two spaces either side of the bullet. */
  tags: string[];
  image: string;
};

export const projects: Project[] = [
  { id: "aure", title: "Auré Studio", tags: ["Photography", "Art Direction"], image: "/work/work-01.webp" },
  { id: "veloce", title: "Veloce", tags: ["Automotive", "Brand Experience"], image: "/work/work-02.webp" },
  { id: "grain", title: "Grain Studio", tags: ["Fashion", "Creative Direction"], image: "/work/work-03.webp" },
  { id: "aether", title: "Aether", tags: ["Architecture", "Digital Identity"], image: "/work/work-04.webp" },
];

/* ------------------------------------------------------------------------ */

export const workHeading = "Award Winning Work";

/**
 * WORK WITH ME — heading, sub-line and the three feature cards, copied
 * verbatim from the reference module (icons are lucide, stroke #E8620F).
 */
export type WorkIcon = "rocket" | "sparkles" | "zap";

export const workWithMe = {
  heading: "Why Work With Me?",
  sub: "Fast-track your Digital Projects",
  cards: [
    {
      icon: "rocket",
      title: "Rapid Project Delivery",
      body: "Launch custom website projects into the real world in as little as 48 hours.",
    },
    {
      icon: "sparkles",
      title: "Precision & Aesthetics",
      body: "Meticulous design craftsmanship that offers complete control over layouts, typography, and every interactive detail.",
    },
    {
      icon: "zap",
      title: "Future-Proofed Designs",
      body: "Stay ahead of shifting trends with an approach that seamlessly integrates with the latest innovations in interactive design and user experience craft.",
    },
  ] as ReadonlyArray<{ icon: WorkIcon; title: string; body: string }>,
};

/* ------------------------------------------------------------------------ */

export type Service = { title: string; items: string[] };

export const services: Service[] = [
  { title: "Brand Identity", items: ["Visual Systems", "User Experience", "Motion Design", "Design Strategy"] },
  { title: "Web Development", items: ["React", "Webflow Sites", "Shopify", "Custom Builds"] },
  { title: "UI/UX Design", items: ["Wireframing", "Prototyping", "User Research", "Design Systems"] },
  { title: "Motion & Animation", items: ["GSAP Animations", "Micro-interactions", "Scroll Effects", "Video Editing"] },
  { title: "Brand Strategy", items: ["Market Research", "Positioning", "Naming", "Brand Guidelines"] },
];

/** Newline = the reference's <br/> in "Design That Speaks / to Your Audience". */
export const servicesHeading = "Design That Speaks\nto Your Audience";

export const servicesStatement =
  "My practice is focused on solving real-world digital challenges with thoughtful design thinking. Whether you need to refine brand identity, streamline user experience, or create memorable interactive moments, my approach provides creativity, clarity, and consistency for clients across industries.";

/* ------------------------------------------------------------------------ */

export type Award = {
  /** The award itself, e.g. "Site of the Day". */
  title: string;
  /** Attribution line beneath it, e.g. "2026 - AWWARDS". */
  meta: string;
};

export const awardsHeading = "Awards and Industry Recognition";

/**
 * No `imgSrc` field: the preview plate is pulled from the project list by
 * index, so adding a fifth award needs no new asset.
 */
export const awards: Award[] = [
  { title: "Honorable Mention", meta: "2026 - AWWARDS" },
  { title: "Site of the Day", meta: "2026 - AWWARDS" },
  { title: "The Webby Awards", meta: "2026 - OFFICIAL SELECTION" },
  { title: "FWA", meta: "2026 - FWA OF THE DAY" },
];

/* ------------------------------------------------------------------------ */

export const clientsHeading = "Trusted by Founders and Creatives, Built for Ambitious Brands.";

/**
 * Client wordmarks, as images (the reference ships real brand logos).
 *
 * ⚠️ These assert client relationships that do not exist. They are here because
 * the layout needs six marks of roughly equal optical weight. Replace them with
 * your own clients — or delete the section entirely if you have none yet. A
 * "Trusted by" strip over logos you never worked for is the fastest way to look
 * fabricated.
 */
export type Client = { name: string; image: string };

export const clients: Client[] = [
  { name: "Google", image: "/clients/client-1.webp" },
  { name: "Adobe", image: "/clients/client-2.webp" },
  { name: "JPMorgan Chase", image: "/clients/client-3.webp" },
  { name: "Pinterest", image: "/clients/client-4.webp" },
  { name: "IBM", image: "/clients/client-5.webp" },
  { name: "Intel", image: "/clients/client-6.webp" },
];

/* ------------------------------------------------------------------------ */

export const testimonialsHeading = "Don't Take It from Us, Take It from Our Clients";

export type Testimonial = { name: string; role: string; quote: string; avatar: string };

export const testimonials: Testimonial[] = [
  {
    name: "Maria Jones",
    role: "Head of Marketing, Adobe",
    quote:
      "Working with Elena completely transformed our brand's digital presence. Our conversions jumped by 87%. Her thoughtful design approach and seamless communication made the collaboration effortless. Elena doesn't just design websites, she gives your entire brand a confident new voice.",
    avatar: "/avatars/avatar-01.webp",
  },
  {
    name: "Marcus Reed",
    role: "Founder, Northline Studio",
    quote:
      "Elena has an incredible eye for detail. She took a rough brand brief and turned it into a site that finally feels like us. Every scroll, every hover - it all just clicks, and our team barely had to explain what we wanted twice.",
    avatar: "/avatars/avatar-05.webp",
  },
  {
    name: "Priya Nair",
    role: "VP Growth, Fielder",
    quote:
      "We came in with a tight deadline and a messy set of assets. Elena organized everything, proposed a direction we hadn't considered, and shipped a site that outperformed every launch benchmark we set for the quarter.",
    avatar: "/avatars/avatar-03.webp",
  },
  {
    name: "Daniel Ortiz",
    role: "Creative Director, Wolfframe",
    quote:
      "The best part of working with Elena wasn't even the final product - it was how clearly she communicated trade-offs along the way. We always knew why a decision was made, and the result speaks for itself.",
    avatar: "/avatars/avatar-04.webp",
  },
  {
    name: "Hannah Kim",
    role: "CEO, Loop & Co",
    quote:
      "Our old site felt like a brochure. What Elena built feels like a product. Session time is up, bounce rate is down, and for the first time our design and our positioning actually agree with each other.",
    avatar: "/avatars/avatar-02.webp",
  },
];

/* ------------------------------------------------------------------------ */

export const faqs = [
  {
    q: "Who is Elena Voss and what kind of projects do you take?",
    a: "I am an independent digital designer who helps businesses create, launch, and optimize digital experiences seamlessly. I specialize in responsive web design, modern UX principles, and conversion-driven visual strategies while ensuring accessibility, performance, and refined aesthetics.",
  },
  {
    q: "How quickly can you deliver a complete website for my business?",
    a: "Most projects launch in as little as 48 hours for smaller sites, with larger multi-page builds typically wrapping within two to three weeks depending on scope, content readiness, and how many revision rounds are needed.",
  },
  {
    q: "Do you work with existing design systems and content management platforms?",
    a: "Yes - I regularly work inside established design systems and popular CMS platforms alike, adapting to whatever your team already has in place rather than forcing a rebuild from scratch.",
  },
  {
    q: "What design standards do you follow consistently?",
    a: "Every project follows WCAG accessibility guidelines, semantic markup, and performance budgets from day one, alongside a consistent typographic and spacing system so the final product feels cohesive across every screen.",
  },
  {
    q: "How do you stay current with emerging design trends and innovations each year?",
    a: "I dedicate time each month to hands-on experimentation with new interaction patterns, tooling, and frameworks, plus regular study of award-winning work, so the craft behind every project keeps pace with where the web is heading.",
  },
];

/* ------------------------------------------------------------------------ */

export type Social = { label: string; href: string; icon: string };

/** SVG marks shipped with the reference template. */
export const socials: Social[] = [
  { label: "LinkedIn", href: "https://linkedin.com", icon: "/social/linkedin.svg" },
  { label: "Instagram", href: "https://instagram.com", icon: "/social/instagram.svg" },
  { label: "Twitter", href: "https://x.com", icon: "/social/twitter.svg" },
  { label: "Facebook", href: "https://facebook.com", icon: "/social/facebook.svg" },
];