"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Tag } from "@/types/blog"
import { 
  PlusCircle, 
  Edit, 
  Trash, 
  Tag as TagIcon, 
  Loader2 
} from "lucide-react"

export default function TagsPage() {
  const { toast } = useToast()
  
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  // New tag form
  const [newTag, setNewTag] = useState({
    name: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Fetch tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch("/api/blog/tags")
        
        if (response.ok) {
          const data = await response.json()
          setTags(data.tags || [])
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch tags",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Error fetching tags:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTags()
  }, [toast])
  
  // Filter tags based on search query
  const filteredTags = tags.filter(
    tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewTag(prev => ({ ...prev, [name]: value }))
  }
  
  const resetForm = () => {
    setNewTag({
      name: "",
    })
    setIsEditing(false)
    setEditingId(null)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      if (!newTag.name) {
        toast({
          title: "Error",
          description: "Tag name is required",
          variant: "destructive"
        })
        return
      }
      
      const url = isEditing 
        ? `/api/blog/tags/${editingId}` 
        : "/api/blog/tags"
      
      const method = isEditing ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newTag)
      })
      
      if (response.ok) {
        const data = await response.json()
        
        toast({
          title: "Success",
          description: isEditing 
            ? "Tag updated successfully" 
            : "Tag created successfully"
        })
        
        if (isEditing) {
          // Update tag in state
          setTags(prev => 
            prev.map(tag => tag.id === editingId ? data.tag : tag)
          )
        } else {
          // Add new tag to state
          setTags(prev => [...prev, data.tag])
        }
        
        resetForm()
        setIsDialogOpen(false)
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to save tag")
      }
    } catch (error) {
      console.error("Error saving tag:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save tag",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleEdit = (tag: Tag) => {
    setNewTag({
      name: tag.name,
    })
    setIsEditing(true)
    setEditingId(tag.id)
    setIsDialogOpen(true)
  }
  
  const handleDelete = async (tagId: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) {
      return
    }
    
    try {
      const response = await fetch(`/api/blog/tags/${tagId}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Tag deleted successfully"
        })
        
        // Remove the deleted tag from state
        setTags(prev => prev.filter(tag => tag.id !== tagId))
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete tag")
      }
    } catch (error) {
      console.error("Error deleting tag:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete tag",
        variant: "destructive"
      })
    }
  }
  
  const getTagColors = (index: number) => {
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-yellow-100 text-yellow-800",
      "bg-purple-100 text-purple-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
    ]
    
    return colors[index % colors.length]
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
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Tag" : "Create Tag"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Tag name"
                  value={newTag.name}
                  onChange={handleInputChange}
                  required
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
      
      {filteredTags.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <h3 className="text-lg font-medium">No tags found</h3>
          <p className="text-muted-foreground mt-1">
            {tags.length === 0
              ? "Create your first tag to categorize your blog posts."
              : "Try adjusting your search to find what you're looking for."}
          </p>
          
          {tags.length === 0 && (
            <Button
              className="mt-4"
              onClick={() => setIsDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Tag
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredTags.map((tag, index) => (
            <Card key={tag.id} className="flex flex-col">
              <CardContent className="pt-6 pb-2 flex-1">
                <div className="flex items-center">
                  <div 
                    className={`inline-flex h-8 items-center rounded-md px-2.5 py-0.5 text-sm font-medium mr-2 ${getTagColors(index)}`}
                  >
                    <TagIcon className="h-3.5 w-3.5 mr-1" />
                    {tag.name}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end pt-0 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(tag)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(tag.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 