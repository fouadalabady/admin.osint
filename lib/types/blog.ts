export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    featuredImage: string | null;
    authorId: string;
    categoryId: string | null;
    status: 'draft' | 'published' | 'archived';
    isFeatured: boolean;
    viewCount: number;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string | null;
    author?: BlogAuthor;
    category?: BlogCategory;
    tags?: BlogTag[];
    comments?: BlogComment[];
}

export interface BlogAuthor {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}

export interface BlogCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface BlogTag {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
}

export interface BlogComment {
    id: string;
    postId: string;
    authorName: string | null;
    authorEmail: string | null;
    userId: string | null;
    content: string;
    isApproved: boolean;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
    user?: BlogAuthor;
    replies?: BlogComment[];
}

export interface BlogMedia {
    id: string;
    fileName: string;
    filePath: string;
    fileType: string | null;
    fileSize: number | null;
    width: number | null;
    height: number | null;
    altText: string | null;
    caption: string | null;
    authorId: string;
    createdAt: string;
    updatedAt: string;
}

export type BlogPostStatus = 'draft' | 'published' | 'archived';

export interface BlogPostForm {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featuredImage: string | null;
    categoryId: string | null;
    status: BlogPostStatus;
    isFeatured: boolean;
    publishedAt: string | null;
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
    tagIds: string[];
} 