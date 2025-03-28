'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import LexicalEditor from '@/components/blog/LexicalEditor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { useGetBlogPostBySlug, useUpdateBlogPost, updateBlogPostMutation } from '@/lib/graphql/hooks/useBlogPost'
import { BlogPost } from '@/types/blog'

export default function DashboardEditBlogPost() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [saving, setSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const slug = typeof params.slug === 'string' ? params.slug : '';
  
  // Use the GraphQL hook to fetch the post
  const { data, loading, error } = useGetBlogPostBySlug(slug);
  const [updatePost] = useUpdateBlogPost();
  
  useEffect(() => {
    if (data?.blog_postsCollection?.edges?.length > 0) {
      setPost(data.blog_postsCollection.edges[0].node);
      setIsLoading(false);
    }
  }, [data, slug]);

  const handleContentChange = (content: string) => {
    if (post) {
      setPost({
        ...post,
        content
      });
    }
  };

  const handleSave = async () => {
    if (!post) return;

    try {
      setSaving(true);
      
      const result = await updateBlogPostMutation(updatePost, post.id, {
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        seo_description: post.seo_description,
        seo_title: post.seo_title,
        seo_keywords: post.seo_keywords,
        status: post.status as 'draft' | 'published' | 'archived',
        direction: post.direction as 'ltr' | 'rtl',
        is_featured: post.is_featured,
        category_id: post.category_id,
        author_id: post.author_id,
      });
      
      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: 'Success',
        description: 'Post updated successfully'
      });
      
      router.refresh();
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update post'
      });
    } finally {
      setSaving(false);
    }
  }

  const handlePreview = () => {
    window.open(`/blog/${post?.slug}/preview`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        <Button onClick={() => router.push('/dashboard/blog')}>
          Return to Blog Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Blog Post</h1>
        <div className="space-x-4">
          <Button onClick={handlePreview} variant="outline">
            Preview
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={post.title}
                onChange={(e) => setPost({ ...post, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={post.slug}
                onChange={(e) => setPost({ ...post, slug: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={post.excerpt || ''}
                onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="seo_description">SEO Description</Label>
              <Textarea
                id="seo_description"
                value={post.seo_description || ''}
                onChange={(e) => setPost({ ...post, seo_description: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <LexicalEditor
              content={post.content}
              onChange={(content) => {
                if (post) {
                  setPost({
                    ...post,
                    content
                  });
                }
              }}
              minHeight="500px"
              autoFocus={false}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 