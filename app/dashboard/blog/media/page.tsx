"use client"

import { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  PlusCircle, 
  Image as ImageIcon, 
  File, 
  Copy, 
  Trash, 
  Upload, 
  Loader2,
  Search
} from "lucide-react"

interface MediaItem {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  createdAt: string
  updatedAt: string
}

export default function MediaPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [mediaType, setMediaType] = useState("all")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  
  // Fetch media
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch("/api/blog/media")
        
        if (response.ok) {
          const data = await response.json()
          setMediaItems(data.media || [])
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch media",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Error fetching media:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchMedia()
  }, [toast])
  
  // Filter media items based on search query and type
  const filteredMedia = mediaItems.filter(item => {
    const matchesSearch = item.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (mediaType === "all") return matchesSearch
    if (mediaType === "images") return matchesSearch && item.fileType.startsWith("image/")
    if (mediaType === "documents") return matchesSearch && (
      item.fileType.includes("pdf") || 
      item.fileType.includes("doc") || 
      item.fileType.includes("xls") ||
      item.fileType.includes("ppt") ||
      item.fileType.includes("txt")
    )
    
    return matchesSearch
  })
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    const file = files[0]
    const formData = new FormData()
    formData.append("file", file)
    
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 300)
      
      const response = await fetch("/api/blog/media", {
        method: "POST",
        body: formData,
      })
      
      clearInterval(progressInterval)
      
      if (response.ok) {
        setUploadProgress(100)
        
        const data = await response.json()
        
        toast({
          title: "Success",
          description: "File uploaded successfully"
        })
        
        // Add new media item to state
        setMediaItems(prev => [data.media, ...prev])
        
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload file")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }
  
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        toast({
          title: "URL Copied",
          description: "File URL copied to clipboard"
        })
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to copy URL",
          variant: "destructive"
        })
      })
  }
  
  const confirmDelete = (item: MediaItem) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }
  
  const handleDelete = async () => {
    if (!selectedItem) return
    
    try {
      const response = await fetch(`/api/blog/media/${selectedItem.id}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "File deleted successfully"
        })
        
        // Remove the deleted media item from state
        setMediaItems(prev => prev.filter(item => item.id !== selectedItem.id))
        setIsDeleteDialogOpen(false)
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete file")
      }
    } catch (error) {
      console.error("Error deleting file:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive"
      })
    }
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }
  
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5" />
    }
    return <File className="h-5 w-5" />
  }
  
  const getFilePreview = (item: MediaItem) => {
    if (item.fileType.startsWith("image/")) {
      return (
        <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
          <img
            src={item.fileUrl}
            alt={item.fileName}
            className="h-full w-full object-cover transition-all hover:scale-105"
          />
        </div>
      )
    }
    
    return (
      <div className="flex aspect-square items-center justify-center rounded-md bg-muted/50">
        <File className="h-8 w-8 text-muted-foreground" />
      </div>
    )
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
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs value={mediaType} onValueChange={setMediaType} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          />
          
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading... {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </div>
      
      {filteredMedia.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <h3 className="text-lg font-medium">No media found</h3>
          <p className="text-muted-foreground mt-1">
            {mediaItems.length === 0
              ? "Upload your first file to get started."
              : "Try adjusting your search or filter to find what you're looking for."}
          </p>
          
          {mediaItems.length === 0 && (
            <Button
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredMedia.map((item) => (
            <Card key={item.id} className="overflow-hidden flex flex-col">
              <CardContent className="p-0">
                {getFilePreview(item)}
              </CardContent>
              
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  {getFileIcon(item.fileType)}
                  <div className="truncate flex-1 font-medium text-sm">
                    {item.fileName}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                  <span>{formatFileSize(item.fileSize)}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between pt-0 p-3 border-t bg-muted/10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleCopyUrl(item.fileUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  onClick={() => confirmDelete(item)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>Are you sure you want to delete this file?</p>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedItem?.fileName}
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 