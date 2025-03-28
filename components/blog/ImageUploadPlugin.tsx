import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'
import { useCallback, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'

// Create a custom command for inserting images
export const INSERT_IMAGE_COMMAND = 'INSERT_IMAGE'

export function ImageUploadPlugin() {
  const [editor] = useLexicalComposerContext()
  const { toast } = useToast()

  const handleDrop = useCallback(
    async (event: DragEvent) => {
      event.preventDefault()
      
      const files = event.dataTransfer?.files

      if (!files || files.length === 0) return

      const file = files[0]
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "File must be an image",
          variant: "destructive"
        })
        return
      }

      try {
        // Create FormData for API request
        const formData = new FormData()
        formData.append('file', file)

        // Upload via API
        const response = await fetch('/api/blog/media', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to upload image')
        }

        const data = await response.json()
        const publicUrl = data.media.fileUrl

        // Insert image into editor
        editor.update(() => {
          const root = $getRoot()
          const paragraph = $createParagraphNode()
          const imageNode = $createTextNode(`![${file.name}](${publicUrl})`)
          paragraph.append(imageNode)
          root.append(paragraph)
        })

        toast({
          title: "Success",
          description: "Image uploaded successfully",
        })
      } catch (error) {
        console.error('Error uploading image:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to upload image",
          variant: "destructive"
        })
      }
    },
    [editor, toast]
  )

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items || items.length === 0) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          event.preventDefault()
          const file = item.getAsFile()
          if (!file) continue

          try {
            // Create FormData for API request
            const formData = new FormData()
            formData.append('file', file)

            // Upload via API
            const response = await fetch('/api/blog/media', {
              method: 'POST',
              body: formData
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || 'Failed to upload image')
            }

            const data = await response.json()
            const publicUrl = data.media.fileUrl

            // Insert image into editor
            editor.update(() => {
              const root = $getRoot()
              const paragraph = $createParagraphNode()
              const imageNode = $createTextNode(`![Pasted image](${publicUrl})`)
              paragraph.append(imageNode)
              root.append(paragraph)
            })

            toast({
              title: "Success",
              description: "Image uploaded successfully",
            })
            break
          } catch (error) {
            console.error('Error uploading pasted image:', error)
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : "Failed to upload pasted image",
              variant: "destructive"
            })
          }
        }
      }
    },
    [editor, toast]
  )

  useEffect(() => {
    const editorElement = editor.getRootElement()
    if (!editorElement) return

    // Add event listeners
    editorElement.addEventListener('drop', handleDrop)
    editorElement.addEventListener('paste', handlePaste)

    // Remove event listeners on cleanup
    return () => {
      editorElement.removeEventListener('drop', handleDrop)
      editorElement.removeEventListener('paste', handlePaste)
    }
  }, [editor, handleDrop, handlePaste])

  return null
} 