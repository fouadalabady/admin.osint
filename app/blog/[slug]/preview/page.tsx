'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import LexicalContentRenderer from '@/components/blog/LexicalContentRenderer'
import PreviewHeader from '@/components/blog/PreviewHeader'
import { useGetBlogPostBySlug } from '@/lib/graphql/hooks/useBlogPost'
import { BlogPost } from '@/types/blog'
import { useTheme } from 'next-themes'

export default function BlogPreviewPage() {
  const params = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { theme } = useTheme()

  const slug = typeof params.slug === 'string' ? params.slug : ''
  const { data, loading, error } = useGetBlogPostBySlug(slug)

  useEffect(() => {
    if (data?.blog_postsCollection?.edges?.length > 0) {
      setPost(data.blog_postsCollection.edges[0].node)
      setIsLoading(false)
    } else if (!loading && !error) {
      setIsLoading(false)
    }
  }, [data, loading, error])

  if (isLoading || loading) {
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
        <p className="text-muted-foreground">
          {error ? `Error: ${error.message}` : 'The requested blog post could not be found.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <PreviewHeader slug={slug} mode={theme === 'dark' ? 'dark' : 'light'} />
      
      <div className="container mx-auto py-20 px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="border rounded-lg p-6 bg-card">
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <header className="mb-8">
              <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
              {post.excerpt && (
                <p className="text-xl text-muted-foreground mb-4">{post.excerpt}</p>
              )}
              <div className="flex items-center text-sm text-muted-foreground">
                <time dateTime={post.published_at || post.created_at}>
                  {formatDate(post.published_at || post.created_at)}
                </time>
                <span className="mx-1">•</span>
                <span>
                  {post.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
            </header>
            
            {post.featured_image && (
              <div className="mb-8">
                <img 
                  src={post.featured_image} 
                  alt={post.title} 
                  className="w-full h-auto rounded-lg object-cover aspect-video"
                />
              </div>
            )}
            
            <div className="mt-8">
              <LexicalContentRenderer 
                content={post.content} 
                direction={post.direction as 'ltr' | 'rtl'} 
                className="prose-container"
              />
            </div>
          </article>
        </div>
      </div>
    </>
  )
}

// Helper function to format dates
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
} 