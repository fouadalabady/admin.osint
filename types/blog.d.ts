export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  author: User | null;
  authorId: string;
  category?: string;
  tags?: string[];
  seo: SEO;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  status: 'draft' | 'published' | 'archived';
  isPublished: boolean;
}

export interface SEO {
  title: string;
  description: string;
  keywords: string;
  canonical?: string;
  ogImage?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface BlogPostFilters {
  status?: string;
  category?: string;
  tags?: string[];
  searchQuery?: string;
  authorId?: string;
  isPublished?: boolean;
}

export interface BlogPostsResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
}

export interface CategoriesResponse {
  categories: Category[];
  total: number;
}

export interface TagsResponse {
  tags: Tag[];
  total: number;
} 