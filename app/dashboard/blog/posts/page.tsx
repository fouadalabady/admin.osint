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

export default function BlogPostsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const pageSize = 10
  
  // Add default sorting by created_at descending
  const orderBy = [{created_at: "DescNullsLast"}]
  
  const { data, loading, error, refetch } = useGetBlogPosts(page, pageSize, {}, orderBy)
  const [deletePost, { loading: deleting }] = useDeleteBlogPost()
  
  const posts = data?.blog_postsCollection?.edges?.map((edge: any) => edge.node) || []
  const totalCount = data?.allPosts?.edges?.length || 0
  const totalPages = Math.ceil(totalCount / pageSize)
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }
  
  const handleDelete = async () => {
    if (!postToDelete) return
    
    try {
      const result = await deleteBlogPostMutation(deletePost, postToDelete)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      toast({
        title: 'Success',
        description: 'Post deleted successfully'
      })
      
      refetch()
    } catch (error) {
      console.error('Error deleting post:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete post'
      })
    } finally {
      setPostToDelete(null)
    }
  }
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default">Published</Badge>
      case 'draft':
        return <Badge variant="outline">Draft</Badge>
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  if (error) {
    return (
      <DashboardShell>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Blog Posts</h1>
          <Button onClick={() => router.push('/dashboard/blog/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>
        
        <div className="rounded-md bg-destructive/15 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-destructive">Error loading posts</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">
                {error instanceof Error ? error.message : 'Unknown error'}
              </h3>
            </div>
          </div>
        </div>
        
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </DashboardShell>
    )
  }
  
  return (
    <DashboardShell>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Blog Posts</h1>
        <Button onClick={() => router.push('/dashboard/blog/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-10">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!posts || posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      No posts found. Create your first blog post!
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post: BlogPost) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">
                        <Link 
                          href={`/dashboard/blog/edit/${post.slug}`}
                          className="hover:underline"
                        >
                          {post.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(post.status)}
                      </TableCell>
                      <TableCell>
                        {post.published_at ? formatDate(post.published_at) : '-'}
                      </TableCell>
                      <TableCell>
                        {formatDate(post.updated_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/blog/edit/${post.slug}`)}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.open(`/blog/${post.slug}/preview`, '_blank')}
                            >
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    setPostToDelete(post.id)
                                  }}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the post
                                    and remove the data from our servers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setPostToDelete(null)}>
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDelete}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {deleting ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                      </>
                                    ) : (
                                      'Delete'
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <nav className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={`inline-flex items-center px-3 py-2 border rounded-md text-sm ${
                    page === 1
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className="sr-only">Previous page</span>
                  <span>Previous</span>
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`inline-flex items-center px-3 py-2 border rounded-md text-sm ${
                      page === i + 1
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className={`inline-flex items-center px-3 py-2 border rounded-md text-sm ${
                    page === totalPages
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className="sr-only">Next page</span>
                  <span>Next</span>
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  )
} 