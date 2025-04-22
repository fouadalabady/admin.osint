export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  status: 'draft' | 'published' | 'archived';
  direction: 'ltr' | 'rtl';
  authorId: string;
  categoryId?: string;
  isFeatured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  };
  tags?: {
    id: string;
    name: string;
  }[];
}

export interface BlogPostInput {
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  status?: 'draft' | 'published' | 'archived';
  direction?: 'ltr' | 'rtl';
  categoryId?: string;
  tagIds?: string[];
  isFeatured?: boolean;
  publishedAt?: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

// Aliases for backward compatibility
export type Category = BlogCategory;
export type Tag = BlogTag;

export interface BlogAuthor {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  published_at?: string;
  author_id: string;
  tags?: Tag[];
  author?: Author;
}

export type PostStatus = 'draft' | 'published';

export interface Author {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
}

export interface PostsListResponse {
  posts: Post[];
  total: number;
}

export interface PostsFilter {
  search?: string;
  status?: PostStatus;
  tag_id?: string;
  author_id?: string;
  page?: number;
  limit?: number;
} 