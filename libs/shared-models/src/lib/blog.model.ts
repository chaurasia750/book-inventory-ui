export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  coverImageUrl?: string;
  publishedAt: string;
  tags: string[];
}
