"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { 
  Bold, 
  Italic, 
  Underline, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  AlignLeft, 
  AlignCenter,
  AlignRight,
  Quote
} from "lucide-react"

interface RichTextEditorProps {
  content: string
  onChange: (value: string) => void
  minHeight?: string
  placeholder?: string
  readOnly?: boolean
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start typing...",
  readOnly = false,
  minHeight = "200px"
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editorContent, setEditorContent] = useState<string>(content);
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setEditorContent(newContent);
      onChange(newContent);
    }
  }, [onChange]);

  const execCommand = useCallback((command: string, value: string = "") => {
    document.execCommand(command, false, value);
    handleInput();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, [handleInput]);

  const formatText = useCallback((format: string) => {
    execCommand("formatBlock", format)
  }, [execCommand])

  const insertLink = useCallback(() => {
    const url = prompt("Enter URL:")
    if (url) {
      execCommand("createLink", url)
    }
  }, [execCommand])

  const insertImage = useCallback(() => {
    const url = prompt("Enter image URL:")
    if (url) {
      execCommand("insertImage", url)
    }
  }, [execCommand])

  return (
    <div className="border-0 flex flex-col w-full">
      {!readOnly && (
        <div className="flex flex-wrap gap-1 p-2 bg-muted/50 border-b">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("bold")}
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
            <span className="sr-only">Bold</span>
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("italic")}
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
            <span className="sr-only">Italic</span>
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("underline")}
            className="h-8 w-8 p-0"
          >
            <Underline className="h-4 w-4" />
            <span className="sr-only">Underline</span>
          </Button>
          
          <div className="w-px h-6 bg-border my-auto mx-1" />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText("h1")}
            className="h-8 w-8 p-0"
          >
            <Heading1 className="h-4 w-4" />
            <span className="sr-only">Heading 1</span>
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText("h2")}
            className="h-8 w-8 p-0"
          >
            <Heading2 className="h-4 w-4" />
            <span className="sr-only">Heading 2</span>
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText("h3")}
            className="h-8 w-8 p-0"
          >
            <Heading3 className="h-4 w-4" />
            <span className="sr-only">Heading 3</span>
          </Button>
          
          <div className="w-px h-6 bg-border my-auto mx-1" />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("insertUnorderedList")}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
            <span className="sr-only">Bullet List</span>
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("insertOrderedList")}
            className="h-8 w-8 p-0"
          >
            <ListOrdered className="h-4 w-4" />
            <span className="sr-only">Numbered List</span>
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("formatBlock", "blockquote")}
            className="h-8 w-8 p-0"
          >
            <Quote className="h-4 w-4" />
            <span className="sr-only">Quote</span>
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("formatBlock", "pre")}
            className="h-8 w-8 p-0"
          >
            <Code className="h-4 w-4" />
            <span className="sr-only">Code</span>
          </Button>
          
          <div className="w-px h-6 bg-border my-auto mx-1" />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("justifyLeft")}
            className="h-8 w-8 p-0"
          >
            <AlignLeft className="h-4 w-4" />
            <span className="sr-only">Align Left</span>
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("justifyCenter")}
            className="h-8 w-8 p-0"
          >
            <AlignCenter className="h-4 w-4" />
            <span className="sr-only">Align Center</span>
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("justifyRight")}
            className="h-8 w-8 p-0"
          >
            <AlignRight className="h-4 w-4" />
            <span className="sr-only">Align Right</span>
          </Button>
          
          <div className="w-px h-6 bg-border my-auto mx-1" />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertLink}
            className="h-8 w-8 p-0"
          >
            <LinkIcon className="h-4 w-4" />
            <span className="sr-only">Insert Link</span>
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertImage}
            className="h-8 w-8 p-0"
          >
            <ImageIcon className="h-4 w-4" />
            <span className="sr-only">Insert Image</span>
          </Button>
        </div>
      )}
      
      <div 
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleInput}
        className="p-4 outline-none w-full overflow-y-auto"
        style={{ minHeight }}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  )
}

export default RichTextEditor 