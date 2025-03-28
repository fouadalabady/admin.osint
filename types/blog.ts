export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  status: 'draft' | 'published' | 'archived';
  direction: 'ltr' | 'rtl';
  author_id: string;
  category_id?: string;
  is_featured: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogPostInput {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  status: 'draft' | 'published' | 'archived';
  direction: 'ltr' | 'rtl';
  author_id: string;
  category_id?: string;
  is_featured: boolean;
  published_at?: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

// Aliases for backward compatibility
export type Category = BlogCategory;
export type Tag = BlogTag;

export interface BlogAuthor {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
} 