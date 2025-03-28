"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import DashboardShell from "@/components/dashboard/shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import LexicalEditor from "@/components/blog/LexicalEditor"
import SeoAnalyzer from "@/components/blog/SeoAnalyzer"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { Category, Tag } from "@/types/blog"
import { Loader2 } from "lucide-react"
import slugify from "slugify"

interface FormData {
  title: string
  slug: string
  excerpt: string
  content: string
  textContent: string // Plain text content for SEO analysis
  featuredImage: string
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  seo: {
    title: string
    description: string
    keywords: string
    canonical: string
    ogImage: string
  }
  direction: 'ltr' | 'rtl'
}

export default function EditBlogPost() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    textContent: "",
    featuredImage: "",
    category: "",
    tags: [],
    status: "draft",
    direction: "ltr",
    seo: {
      title: "",
      description: "",
      keywords: "",
      canonical: "",
      ogImage: ""
    }
  })
  
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  
  // Fetch post data and all categories/tags
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch post data
        const postRes = await fetch(`/api/blog/posts/${postId}`)
        
        // Fetch categories and tags
        const categoriesRes = await fetch("/api/blog/categories")
        const tagsRes = await fetch("/api/blog/tags")
        
        if (!postRes.ok) {
          throw new Error('Failed to fetch post')
        }
        
        const postData = await postRes.json()
        const post = postData.post
        
        if (!post) {
          throw new Error('Post not found')
        }
        
        // Extract post data
        setFormData({
          title: post.title || "",
          slug: post.slug || "",
          excerpt: post.excerpt || "",
          content: post.content || "",
          textContent: "", // Will be populated by Lexical editor
          featuredImage: post.featured_image || "",
          category: post.category_id || "",
          tags: post.tags ? post.tags.map((tag: any) => tag.id) : [],
          status: post.status || "draft",
          direction: post.direction || "ltr",
          seo: {
            title: post.seo_title || "",
            description: post.seo_description || "",
            keywords: post.seo_keywords || "",
            canonical: "",
            ogImage: ""
          }
        })
        
        // Fetch categories and tags data
        if (categoriesRes.ok && tagsRes.ok) {
          const categoriesData = await categoriesRes.json()
          const tagsData = await tagsRes.json()
          
          setCategories(categoriesData.categories || [])
          setTags(tagsData.tags || [])
        } else {
          toast({
            title: "Warning",
            description: "Failed to load categories and tags",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load post data",
          variant: "destructive"
        })
        router.push("/dashboard/blog")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [postId, toast, router])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name.startsWith("seo.")) {
      const seoField = name.split(".")[1]
      setFormData(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          [seoField]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }
  
  const handleSelectChange = (value: string, field: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const handleDirectionChange = (direction: 'ltr' | 'rtl') => {
    setFormData(prev => ({ ...prev, direction }))
  }
  
  const handleTagToggle = (tagId: string) => {
    setFormData(prev => {
      const tagExists = prev.tags.includes(tagId)
      let updatedTags = [...prev.tags]
      
      if (tagExists) {
        updatedTags = updatedTags.filter(id => id !== tagId)
      } else {
        updatedTags.push(tagId)
      }
      
      return { ...prev, tags: updatedTags }
    })
  }
  
  const handleContentChange = (content: string, textContent: string) => {
    setFormData(prev => ({ ...prev, content, textContent }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const isPublished = formData.status === "published"
      
      const response = await fetch(`/api/blog/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          excerpt: formData.excerpt,
          content: formData.content,
          featuredImage: formData.featuredImage,
          category: formData.category,
          tags: formData.tags,
          status: formData.status,
          isPublished,
          seo: formData.seo,
          direction: formData.direction
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        toast({
          title: "Success",
          description: "Blog post updated successfully"
        })
        
        // Redirect to the blog post list
        router.push("/dashboard/blog")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update blog post",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error updating blog post:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDeletePost = async () => {
    try {
      setIsSubmitting(true)
      
      const response = await fetch(`/api/blog/posts/${postId}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Blog post deleted successfully"
        })
        
        // Redirect to the blog post list
        router.push("/dashboard/blog")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete blog post",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting blog post:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
      setShowDeleteDialog(false)
    }
  }
  
  const togglePreview = () => {
    setIsPreview(prev => !prev)
  }
  
  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardShell>
    )
  }
  
  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Edit Blog Post</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={togglePreview}
            disabled={!formData.content}
          >
            {isPreview ? "Edit" : "Preview"}
          </Button>
          
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isSubmitting}>
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the blog post.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeletePost} 
                  className="bg-destructive text-destructive-foreground"
                >
                  {isSubmitting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button 
            variant="secondary" 
            onClick={() => router.push("/dashboard/blog")}
          >
            Cancel
          </Button>
          
          <Button 
            type="submit" 
            form="blog-form" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
      
      <form id="blog-form" onSubmit={handleSubmit}>
        <Tabs defaultValue="content">
          <TabsList className="mb-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO & Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content">
            <Card>
              <CardContent className="pt-6 pb-4 space-y-6">
                <div className="grid gap-3">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Post title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="post-url-slug"
                    value={formData.slug}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    placeholder="Brief description of your post (used in search results and social sharing)"
                    value={formData.excerpt}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
                
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content">Content</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={formData.direction === 'ltr' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleDirectionChange('ltr')}
                      >
                        LTR
                      </Button>
                      <Button
                        type="button"
                        variant={formData.direction === 'rtl' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleDirectionChange('rtl')}
                      >
                        RTL
                      </Button>
                    </div>
                  </div>
                  {isPreview ? (
                    <div 
                      className="prose prose-sm sm:prose-base max-w-none p-4 border rounded-md min-h-[300px]"
                      style={{ direction: formData.direction }}
                      dangerouslySetInnerHTML={{ __html: formData.content }}
                    />
                  ) : (
                    <LexicalEditor
                      content={formData.content}
                      onChange={handleContentChange}
                      minHeight="300px"
                      rtl={formData.direction === 'rtl'}
                    />
                  )}
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="featuredImage">Featured Image URL</Label>
                  <Input
                    id="featuredImage"
                    name="featuredImage"
                    placeholder="https://example.com/image.jpg"
                    value={formData.featuredImage}
                    onChange={handleChange}
                  />
                  {formData.featuredImage && (
                    <div className="mt-2">
                      <img 
                        src={formData.featuredImage} 
                        alt="Featured image preview" 
                        className="h-32 object-cover rounded-md" 
                      />
                    </div>
                  )}
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange(value, "category")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-3">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Button
                        key={tag.id}
                        type="button"
                        variant={formData.tags.includes(tag.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTagToggle(tag.id)}
                      >
                        {tag.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="seo">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6 pb-4 space-y-6">
                  <div className="grid gap-3">
                    <Label htmlFor="seo.title">SEO Title</Label>
                    <Input
                      id="seo.title"
                      name="seo.title"
                      placeholder="Title for search engines"
                      value={formData.seo.title}
                      onChange={handleChange}
                    />
                    <p className="text-sm text-muted-foreground">
                      {formData.seo.title.length}/60 characters
                    </p>
                  </div>
                  
                  <div className="grid gap-3">
                    <Label htmlFor="seo.description">Meta Description</Label>
                    <Textarea
                      id="seo.description"
                      name="seo.description"
                      placeholder="Description for search results"
                      value={formData.seo.description}
                      onChange={handleChange}
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground">
                      {formData.seo.description.length}/160 characters
                    </p>
                  </div>
                  
                  <div className="grid gap-3">
                    <Label htmlFor="seo.keywords">Meta Keywords</Label>
                    <Input
                      id="seo.keywords"
                      name="seo.keywords"
                      placeholder="keyword1, keyword2, keyword3"
                      value={formData.seo.keywords}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="grid gap-3">
                    <Label htmlFor="seo.canonical">Canonical URL</Label>
                    <Input
                      id="seo.canonical"
                      name="seo.canonical"
                      placeholder="https://yourdomain.com/canonical-url"
                      value={formData.seo.canonical}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="grid gap-3">
                    <Label htmlFor="seo.ogImage">Social Image URL</Label>
                    <Input
                      id="seo.ogImage"
                      name="seo.ogImage"
                      placeholder="Image URL for social sharing"
                      value={formData.seo.ogImage}
                      onChange={handleChange}
                    />
                    <p className="text-sm text-muted-foreground">
                      {!formData.seo.ogImage && formData.featuredImage && 
                        "Will use featured image if not specified."}
                    </p>
                    {formData.seo.ogImage && (
                      <div className="mt-2">
                        <img 
                          src={formData.seo.ogImage} 
                          alt="Social image preview" 
                          className="h-32 object-cover rounded-md" 
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <SeoAnalyzer
                title={formData.seo.title || formData.title}
                description={formData.seo.description || formData.excerpt}
                keywords={formData.seo.keywords}
                content={formData.content}
                textContent={formData.textContent}
                slug={formData.slug}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardContent className="pt-6 pb-4 space-y-6">
                <div className="grid gap-3">
                  <Label htmlFor="status">Publication Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange(value as any, "status")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select post status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label>Text Direction</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="direction-toggle"
                        checked={formData.direction === 'rtl'}
                        onCheckedChange={(checked) => handleDirectionChange(checked ? 'rtl' : 'ltr')}
                      />
                      <Label htmlFor="direction-toggle" className="font-normal">
                        {formData.direction === 'rtl' ? 'Right-to-Left (RTL)' : 'Left-to-Right (LTR)'}
                      </Label>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    This setting affects how text is displayed in your post
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </DashboardShell>
  )
} 