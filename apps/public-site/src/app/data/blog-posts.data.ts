import { BlogPost } from '@org/shared-models';

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'getting-started-with-our-platform',
    title: 'Getting Started with Our Platform',
    excerpt:
      'A quick-start guide to help new users understand the core features and get up and running in minutes.',
    content:
      'Welcome aboard! In this guide we walk through creating your first workspace, inviting teammates, ' +
      'and configuring your account settings. Our platform is designed to be intuitive, but a little guidance ' +
      'never hurts. We cover navigation basics, the dashboard layout, and where to find help when you need it. ' +
      'By the end of this article you should feel comfortable exploring the rest of the product on your own.',
    author: 'Jamie Rivera',
    coverImageUrl: 'https://placehold.co/800x400?text=Getting+Started',
    publishedAt: '2026-01-12',
    tags: ['onboarding', 'guide'],
  },
  {
    id: '2',
    slug: '5-tips-for-better-productivity',
    title: '5 Tips for Better Productivity',
    excerpt:
      'Simple, actionable tips that our most effective customers use every day to get more done.',
    content:
      'Productivity is less about working harder and more about working smarter. Here are five habits our top ' +
      'customers swear by: batching similar tasks together, setting a single daily priority, using templates for ' +
      'repetitive work, automating notifications, and taking short breaks between deep-focus sessions. Small changes ' +
      'compound over time, and these five are a great place to start.',
    author: 'Morgan Lee',
    coverImageUrl: 'https://placehold.co/800x400?text=Productivity',
    publishedAt: '2026-02-03',
    tags: ['productivity', 'tips'],
  },
  {
    id: '3',
    slug: 'behind-the-scenes-our-design-system',
    title: 'Behind the Scenes: Our Design System',
    excerpt:
      'How we built a consistent, scalable design system that powers every product surface.',
    content:
      'Building a design system is an exercise in trade-offs. We wanted consistency without rigidity, and speed ' +
      'without sacrificing polish. This post walks through our component library, our tokens for color and spacing, ' +
      'and the governance process that keeps everything in sync as the product grows. We also share a few lessons ' +
      'learned from early mistakes that cost us real engineering time.',
    author: 'Priya Nandan',
    coverImageUrl: 'https://placehold.co/800x400?text=Design+System',
    publishedAt: '2026-02-20',
    tags: ['design', 'engineering'],
  },
  {
    id: '4',
    slug: 'customer-spotlight-scaling-with-confidence',
    title: 'Customer Spotlight: Scaling with Confidence',
    excerpt:
      'We sat down with one of our longest-standing customers to talk about growth, tooling, and lessons learned.',
    content:
      'Every growing company hits the same wall eventually: the tools that got you to ten people start to creak at ' +
      'a hundred. In this interview, our customer shares how they restructured their workflows, what they automated ' +
      'first, and how they measured the impact of each change. Their biggest takeaway: invest in observability before ' +
      'you think you need it.',
    author: 'Sam Okafor',
    coverImageUrl: 'https://placehold.co/800x400?text=Customer+Spotlight',
    publishedAt: '2026-03-05',
    tags: ['customers', 'growth'],
  },
  {
    id: '5',
    slug: 'security-best-practices-for-teams',
    title: 'Security Best Practices for Teams',
    excerpt:
      'Practical, no-nonsense security guidance for teams of any size.',
    content:
      'Security doesn’t have to be intimidating. This article covers the essentials: strong authentication, least-' +
      'privilege access, regular audits, and a simple incident response plan. We also debunk a few common myths that ' +
      'lead teams to either over-invest in security theater or under-invest in the fundamentals.',
    author: 'Dana Whitfield',
    coverImageUrl: 'https://placehold.co/800x400?text=Security',
    publishedAt: '2026-03-18',
    tags: ['security', 'best-practices'],
  },
  {
    id: '6',
    slug: 'whats-new-this-quarter',
    title: "What's New This Quarter",
    excerpt:
      'A roundup of every feature, fix, and improvement we shipped over the last three months.',
    content:
      'This quarter we focused heavily on performance and polish. Highlights include a faster dashboard, a redesigned ' +
      'notifications center, expanded API rate limits, and dozens of small bug fixes reported by the community. Read on ' +
      'for the full changelog and a look at what is coming next quarter.',
    author: 'Jamie Rivera',
    coverImageUrl: 'https://placehold.co/800x400?text=Whats+New',
    publishedAt: '2026-04-02',
    tags: ['product', 'changelog'],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
