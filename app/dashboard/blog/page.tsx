'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { BlogPost } from '@/lib/types/blog';

export default function BlogPage() {
    const [blogPosts] = useState<BlogPost[]>([]);

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Blog Posts</h1>
                <Link href="/dashboard/blog/new">
                    <Button>New Post</Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {blogPosts.map((post) => (
                    <Card key={post.id}>
                        <CardContent className="p-4">
                            <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                            <p className="text-gray-600 mb-4">{post.excerpt}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">
                                    {new Date(post.publishedAt).toLocaleDateString()}
                                </span>
                                <Link href={`/dashboard/blog/${post.id}`}>
                                    <Button variant="outline" size="sm">
                                        Edit
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {blogPosts.length === 0 && (
                    <div className="col-span-full text-center py-8">
                        <p className="text-gray-500">No blog posts yet.</p>
                        <Link href="/dashboard/blog/new">
                            <Button className="mt-4">Create Your First Post</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
} 