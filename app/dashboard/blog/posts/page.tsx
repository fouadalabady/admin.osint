"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useGetBlogPosts, useDeleteBlogPost, deleteBlogPostMutation } from '@/lib/graphql/hooks/useBlogPost'
import { DashboardShell } from '@/components/dashboard/shell'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, MoreVertical, Plus } from 'lucide-react'
import { BlogPost } from '@/types/blog'
import { useQuery } from '@apollo/client'
import { GET_EDITABLE_POSTS, GET_NON_EDITABLE_POSTS } from '@/lib/graphql/operations/blog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Edit, Eye, Trash } from 'lucide-react'
import { formatDistance } from 'date-fns'
import EmptyState from '@/components/ui/empty-state'
import LoadingSpinner from '@/components/ui/loading-spinner'
import ExportAllToPDF from '@/components/blog/ExportAllToPDF'
import ExportCatalogToPDF from '@/components/blog/ExportCatalogToPDF'

export default function BlogPostsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentPage, setCurrentPage] = useState(1)
  const limit = 10

  // Fetch editable posts (authored by current user)
  const { 
    data: editableData, 
    loading: editableLoading, 
    error: editableError 
  } = useQuery(GET_EDITABLE_POSTS, {
    variables: { page: currentPage, limit },
    fetchPolicy: 'network-only',
  })

  // Fetch non-editable posts (not authored by current user)
  const { 
    data: nonEditableData, 
    loading: nonEditableLoading, 
    error: nonEditableError 
  } = useQuery(GET_NON_EDITABLE_POSTS, {
    variables: { page: currentPage, limit },
    fetchPolicy: 'network-only',
  })

  const editablePosts = editableData?.editablePosts?.edges?.map((edge: any) => edge.node) || []
  const nonEditablePosts = nonEditableData?.nonEditablePosts?.edges?.map((edge: any) => edge.node) || []
  
  const editableTotal = editableData?.editablePosts?.totalCount || 0
  const nonEditableTotal = nonEditableData?.nonEditablePosts?.totalCount || 0

  const [deletePost, { loading: deleteLoading }] = useDeleteBlogPost()

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return
    }

    try {
      const result = await deleteBlogPostMutation(deletePost, postId)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      toast({
        title: "Success",
        description: "Post deleted successfully",
      })
      
      // Refetch posts after deletion
      await Promise.all([
        editableData?.refetch(),
        nonEditableData?.refetch()
      ])
    } catch (error) {
      console.error("Error deleting post:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete post",
        variant: "destructive"
      })
    }
  }

  const renderPostsList = (posts: any[], isEditable: boolean) => {
    if (posts.length === 0) {
      return (
        <EmptyState
          title={isEditable ? "No posts you can edit" : "No posts from others"}
          description={isEditable ? "Create a new post to get started" : "Other users haven't created any posts yet"}
          icon={<AlertCircle className="h-8 w-8 text-muted-foreground" />}
          action={isEditable ? (
            <Link href="/dashboard/blog/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Post
              </Button>
            </Link>
          ) : undefined}
        />
      )
    }

    return posts.map((post: any) => (
      <Card key={post.id} className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="mr-2 truncate">{post.title}</CardTitle>
            <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
              {post.status}
            </Badge>
          </div>
          <CardDescription className="flex items-center text-sm text-muted-foreground">
            <span>
              {post.author?.name || 'Unknown'} • 
              {post.publishedAt 
                ? ` Published ${formatDistance(new Date(post.publishedAt), new Date(), { addSuffix: true })}` 
                : ` Created ${formatDistance(new Date(post.createdAt), new Date(), { addSuffix: true })}`}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {post.excerpt || 'No excerpt available'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {post.category && (
              <Badge variant="outline" className="bg-primary/10">
                {post.category.name}
              </Badge>
            )}
            {post.tags?.map((tag: any) => (
              <Badge key={tag.id} variant="outline">
                {tag.name}
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Link href={`/dashboard/blog/${post.slug}`} prefetch={false}>
            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" />
              View
            </Button>
          </Link>
          
          {isEditable && (
            <>
              <Link href={`/dashboard/blog/edit/${post.slug}`}>
                <Button variant="default" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleDelete(post.id)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    ))
  }

  const renderErrorState = (error: any) => (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error.message || 'Failed to load posts. Please try again.'}
      </AlertDescription>
    </Alert>
  )

  return (
    <div className="container max-w-5xl py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground">Manage your blog content</p>
        </div>
        <div className="flex gap-2">
          <ExportCatalogToPDF 
            posts={[...editablePosts, ...nonEditablePosts]} 
            variant="outline"
          />
          <ExportAllToPDF 
            posts={[...editablePosts, ...nonEditablePosts]} 
            variant="outline"
          />
          
          <Link href="/dashboard/blog/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="editable">
        <TabsList className="mb-4">
          <TabsTrigger value="editable">
            My Posts ({editableTotal})
          </TabsTrigger>
          <TabsTrigger value="non-editable">
            Other Posts ({nonEditableTotal})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editable">
          {editableLoading && <LoadingSpinner />}
          {editableError && renderErrorState(editableError)}
          {!editableLoading && !editableError && renderPostsList(editablePosts, true)}
        </TabsContent>

        <TabsContent value="non-editable">
          {nonEditableLoading && <LoadingSpinner />}
          {nonEditableError && renderErrorState(nonEditableError)}
          {!nonEditableLoading && !nonEditableError && renderPostsList(nonEditablePosts, false)}
        </TabsContent>
      </Tabs>
    </div>
  )
} 