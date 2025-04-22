'use client';

import { useQuery } from '@apollo/client';
import { ArrowLeft, CalendarIcon, Edit, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GET_POST_BY_SLUG } from '@/lib/graphql/operations/blog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import ExportToPDF from '@/components/blog/ExportToPDF';

export default function PostPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { slug } = params;
  
  const { data, loading, error } = useQuery(GET_POST_BY_SLUG, {
    variables: { slug },
    fetchPolicy: 'network-only'
  });

  const post = data?.post;

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back
        </Button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container py-10">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Post not found</AlertTitle>
          <AlertDescription>
            The post you are looking for does not exist or has been removed.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push('/dashboard/blog/posts')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to posts
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex space-x-2">
          <ExportToPDF post={post} />
          
          <Link href={`/dashboard/blog/edit/${slug}`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Post
            </Button>
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden">
        {post.featuredImage && (
          <div className="relative h-72 w-full overflow-hidden bg-muted">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Badge 
                variant={post.status === 'published' ? 'default' : 'secondary'}
                className="mb-2"
              >
                {post.status}
              </Badge>
              {post.category && (
                <Badge variant="outline" className="ml-2 mb-2 bg-primary/10">
                  {post.category.name}
                </Badge>
              )}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarIcon className="mr-1 h-3 w-3" />
              {post.publishedAt 
                ? format(new Date(post.publishedAt), 'MMMM dd, yyyy')
                : format(new Date(post.createdAt), 'MMMM dd, yyyy')
              }
            </div>
          </div>
          
          <CardTitle className="text-3xl font-bold">{post.title}</CardTitle>
          
          {post.author && (
            <CardDescription>
              By {post.author.name}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent>
          {post.excerpt && (
            <div className="mb-6 italic text-muted-foreground">
              {post.excerpt}
            </div>
          )}
          
          <div className="prose max-w-none" 
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </CardContent>
        
        <CardFooter className="flex flex-wrap gap-2 border-t p-6">
          {post.tags && post.tags.map((tag: any) => (
            <Badge 
              key={tag.id} 
              variant="secondary"
            >
              {tag.name}
            </Badge>
          ))}
        </CardFooter>
      </Card>
    </div>
  );
} 