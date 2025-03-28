"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Category } from "@/types/blog"
import { 
  PlusCircle, 
  Edit, 
  Trash, 
  FileText, 
  Loader2 
} from "lucide-react"

export default function CategoriesPage() {
  const { toast } = useToast()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  // New category form
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/blog/categories")
        
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories || [])
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch categories",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCategories()
  }, [toast])
  
  // Filter categories based on search query
  const filteredCategories = categories.filter(
    category => category.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewCategory(prev => ({ ...prev, [name]: value }))
  }
  
  const resetForm = () => {
    setNewCategory({
      name: "",
      description: "",
    })
    setIsEditing(false)
    setEditingId(null)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      if (!newCategory.name) {
        toast({
          title: "Error",
          description: "Category name is required",
          variant: "destructive"
        })
        return
      }
      
      const url = isEditing 
        ? `/api/blog/categories/${editingId}` 
        : "/api/blog/categories"
      
      const method = isEditing ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newCategory)
      })
      
      if (response.ok) {
        const data = await response.json()
        
        toast({
          title: "Success",
          description: isEditing 
            ? "Category updated successfully" 
            : "Category created successfully"
        })
        
        if (isEditing) {
          // Update category in state
          setCategories(prev => 
            prev.map(cat => cat.id === editingId ? data.category : cat)
          )
        } else {
          // Add new category to state
          setCategories(prev => [...prev, data.category])
        }
        
        resetForm()
        setIsDialogOpen(false)
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to save category")
      }
    } catch (error) {
      console.error("Error saving category:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save category",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleEdit = (category: Category) => {
    setNewCategory({
      name: category.name,
      description: category.description || "",
    })
    setIsEditing(true)
    setEditingId(category.id)
    setIsDialogOpen(true)
  }
  
  const handleDelete = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return
    }
    
    try {
      const response = await fetch(`/api/blog/categories/${categoryId}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Category deleted successfully"
        })
        
        // Remove the deleted category from state
        setCategories(prev => prev.filter(cat => cat.id !== categoryId))
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete category")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete category",
        variant: "destructive"
      })
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1 flex items-center gap-2 relative">
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Category" : "Create Category"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Category name"
                  value={newCategory.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Category description"
                  value={newCategory.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {filteredCategories.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <h3 className="text-lg font-medium">No categories found</h3>
          <p className="text-muted-foreground mt-1">
            {categories.length === 0
              ? "Create your first category to organize your blog posts."
              : "Try adjusting your search to find what you're looking for."}
          </p>
          
          {categories.length === 0 && (
            <Button
              className="mt-4"
              onClick={() => setIsDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Category
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="truncate">{category.name}</CardTitle>
              </CardHeader>
              
              <CardContent className="pb-2 flex-1">
                {category.description ? (
                  <p className="text-muted-foreground line-clamp-3">
                    {category.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    No description available
                  </p>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between pt-4 border-t">
                <div className="flex items-center text-muted-foreground text-sm">
                  <FileText className="h-4 w-4 mr-1" />
                  <span>0 posts</span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 