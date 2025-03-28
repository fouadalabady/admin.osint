import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createImageNode, ImageNode } from './nodes/ImageNode'
import { $insertNodes } from 'lexical'
import { useToast } from '@/components/ui/use-toast'

export function ImagePlugin(): null {
  const [editor] = useLexicalComposerContext()
  const { toast } = useToast()

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return

    const file = files[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/blog/media', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }
      
      const data = await response.json()
      const url = data.media.fileUrl
      
      editor.update(() => {
        const imageNode = $createImageNode({
          src: url,
          altText: file.name,
          width: 800,
        })
        $insertNodes([imageNode])
      })
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })
    } catch (error) {
      console.error('Failed to upload image:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      })
    }
  }

  return null
} 