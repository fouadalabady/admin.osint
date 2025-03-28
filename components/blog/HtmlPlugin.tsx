"use client"

import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'
import { $generateNodesFromDOM } from '@lexical/html'

interface HtmlPluginProps {
  content: string
}

export function HtmlPlugin({ content }: HtmlPluginProps) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!content) return

    // Import the HTML content when the component mounts or content changes
    editor.update(() => {
      // Create a DOM parser
      const parser = new DOMParser()
      const dom = parser.parseFromString(content, 'text/html')
      
      // Import the DOM nodes into Lexical nodes
      const nodes = $generateNodesFromDOM(editor, dom)
      
      // Insert the nodes into the editor
      const root = $getRoot()
      root.clear()
      
      // Append each node to the editor
      nodes.forEach(node => {
        root.append(node)
      })
    })
  }, [editor, content])

  return null
} 