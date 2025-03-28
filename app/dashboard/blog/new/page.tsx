"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import LexicalEditor from "@/components/blog/LexicalEditor"
import SeoAnalyzer from "@/components/blog/SeoAnalyzer"
import { useToast } from "@/hooks/use-toast"
import { Category, Tag } from "@/types/blog"
import { useCreateBlogPost, createBlogPostMutation } from "@/lib/graphql/hooks/useBlogPost"
import slugify from "slugify"
import { useSession } from "next-auth/react"

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

const NewBlogPost = () => {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()
  
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
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isPreview, setIsPreview] = useState(false)
  
  // Initialize GraphQL mutation hook
  const [createPost] = useCreateBlogPost();
  
  // Fetch categories and tags
  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesRes = await fetch("/api/blog/categories")
        const tagsRes = await fetch("/api/blog/tags")
        
        if (categoriesRes.ok && tagsRes.ok) {
          const categoriesData = await categoriesRes.json()
          const tagsData = await tagsRes.json()
          
          setCategories(categoriesData.categories || [])
          setTags(tagsData.tags || [])
        } else {
          toast({
            title: "Error",
            description: "Failed to load categories and tags",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading data",
          variant: "destructive"
        })
      }
    }
    
    fetchData()
  }, [toast])
  
  // Generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const generatedSlug = slugify(formData.title, { lower: true, strict: true })
      setFormData(prev => ({
        ...prev,
        slug: generatedSlug
      }))
    }
    
    if (formData.title && !formData.seo.title) {
      setFormData(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          title: formData.title
        }
      }))
    }
  }, [formData.title])
  
  // Generate SEO description from excerpt
  useEffect(() => {
    if (formData.excerpt && !formData.seo.description) {
      setFormData(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          description: formData.excerpt.substring(0, 160)
        }
      }))
    }
  }, [formData.excerpt])
  
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
    setFormData(prev => ({ 
      ...prev, 
      content,
      textContent 
    }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Use GraphQL mutation instead of REST API
      const authorId = session?.user?.id || '';
      
      if (!authorId) {
        throw new Error('User not authenticated');
      }
      
      const result = await createBlogPostMutation(createPost, {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt,
        featured_image: formData.featuredImage,
        seo_title: formData.seo.title,
        seo_description: formData.seo.description,
        seo_keywords: formData.seo.keywords,
        status: formData.status,
        direction: formData.direction,
        author_id: authorId,
        category_id: formData.category || null,
        is_featured: false,
        published_at: formData.status === 'published' ? new Date().toISOString() : null
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      toast({
        title: "Success",
        description: "Blog post created successfully"
      });
      
      // Redirect to the blog post list
      router.push("/dashboard/blog");
    } catch (error) {
      console.error("Error creating blog post:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const togglePreview = () => {
    setIsPreview(prev => !prev)
  }
  
  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Create New Blog Post</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={togglePreview}
            disabled={!formData.content}
          >
            {isPreview ? "Edit" : "Preview"}
          </Button>
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
            {isSubmitting ? "Creating..." : "Create Post"}
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
                      autoFocus
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

export default NewBlogPost 