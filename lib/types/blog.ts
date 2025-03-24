export interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    publishedAt: string;
    author: {
        id: string;
        name: string;
        email: string;
    };
    status: 'draft' | 'published' | 'archived';
    tags: string[];
    slug: string;
    featuredImage?: string;
} 