// @refresh reset
"use client"

import React, { useEffect, useState } from "react"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { TablePlugin } from "@lexical/react/LexicalTablePlugin"
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin"
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin"
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table"
import { ListItemNode, ListNode } from "@lexical/list"
import { CodeHighlightNode, CodeNode } from "@lexical/code"
import { LinkNode } from "@lexical/link"
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $generateHtmlFromNodes } from '@lexical/html'
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
  Image, 
  AlignLeft, 
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  ArrowLeftToLine,
  ArrowRightToLine,
  Undo,
  Redo
} from "lucide-react"
import { Button } from "@/components/ui/button"

// Import necessary Lexical commands and selection utilities
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  COMMAND_PRIORITY_NORMAL,
  createEditor,
  $createRangeSelection,
  $setSelection,
  $createTextNode,
  EditorState
} from "lexical"
import { $createHeadingNode } from "@lexical/rich-text"
import { $wrapNodes } from "@lexical/selection"
import { $createLinkNode } from "@lexical/link"
import { $isAtNodeEnd } from "@lexical/selection"
import { $createListNode, $createListItemNode } from "@lexical/list"
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from "@lexical/list"
import { ImageUploadPlugin } from './ImageUploadPlugin'

// Create a custom AutoFocus plugin instead of importing it
function AutoFocusPlugin() {
  const [editor] = useLexicalComposerContext()
  
  useEffect(() => {
    editor.focus()
  }, [editor])
  
  return null
}

interface LexicalEditorProps {
  content: string
  onChange: (content: string, textContent: string) => void
  placeholder?: string
  minHeight?: string
  autoFocus?: boolean
  editable?: boolean
  rtl?: boolean
}

// Theme for the editor
const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem',
  },
  image: 'editor-image',
  link: 'editor-link',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
    code: 'editor-text-code',
  },
}

// Plugin for handling text direction (RTL/LTR)
function TextDirectionPlugin() {
  const [editor] = useLexicalComposerContext()
  
  const toggleTextDirection = (direction: 'ltr' | 'rtl') => {
    editor.update(() => {
      const selection = $getSelection()
      if (selection) {
        $getRoot().setDirection(direction)
      }
    })
  }
  
  return null
}

// Format commands for the toolbar
const FormatButton = ({ 
  onClick, 
  icon, 
  label,
  active = false
}: { 
  onClick: () => void, 
  icon: React.ReactNode, 
  label: string,
  active?: boolean
}) => (
  <Button
    type="button"
    variant={active ? "secondary" : "ghost"}
    size="sm"
    onClick={onClick}
    className="h-8 w-8 p-0"
  >
    {icon}
    <span className="sr-only">{label}</span>
  </Button>
)

// Toolbar component for the Lexical editor
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()
  const [isRTL, setIsRTL] = useState(false)
  
  // Format text commands (bold, italic, etc.)
  const formatBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
  }
  
  const formatItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
  }
  
  const formatUnderline = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
  }
  
  const formatCode = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')
  }
  
  // Format heading commands
  const formatHeading = (level: 'h1' | 'h2' | 'h3') => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $wrapNodes(selection, () => $createHeadingNode(level))
      }
    })
  }
  
  // Insert list commands
  const formatBulletList = () => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
  }
  
  const formatNumberedList = () => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
  }
  
  // Format quote command
  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const node = $createParagraphNode()
        node.append($createTextNode('> '))
        selection.insertNodes([node])
      }
    })
  }
  
  // Alignment commands
  const formatAlignment = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment)
  }
  
  // Text direction commands
  const toggleDirection = () => {
    const newDirection = !isRTL ? 'rtl' : 'ltr'
    setIsRTL(!isRTL)
    
    editor.update(() => {
      const root = $getRoot()
      root.setDirection(newDirection)
    })
  }
  
  // Insert link command
  const insertLink = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const url = prompt('Enter URL:')
        if (url) {
          const linkNode = $createLinkNode(url)
          selection.insertNodes([linkNode])
        }
      }
    })
  }
  
  // Insert image command
  const insertImage = () => {
    editor.update(() => {
      const url = prompt('Enter image URL:')
      if (url) {
        // Create an img element (Lexical doesn't have a built-in image node)
        const imageNode = $createParagraphNode()
        const textNode = $createTextNode('📷 ' + url)
        imageNode.append(textNode)
        $getRoot().append(imageNode)
      }
    })
  }
  
  // Undo/redo commands
  const undo = () => {
    editor.dispatchCommand(UNDO_COMMAND, undefined)
  }
  
  const redo = () => {
    editor.dispatchCommand(REDO_COMMAND, undefined)
  }
  
  return (
    <div className="flex flex-wrap gap-1 p-2 bg-muted/50 border-b">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={undo}
        className="h-8 w-8 p-0"
      >
        <Undo className="h-4 w-4" />
        <span className="sr-only">Undo</span>
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={redo}
        className="h-8 w-8 p-0"
      >
        <Redo className="h-4 w-4" />
        <span className="sr-only">Redo</span>
      </Button>
      
      <div className="w-px h-6 bg-border my-auto mx-1" />
      
      <FormatButton
        onClick={formatBold}
        icon={<Bold className="h-4 w-4" />}
        label="Bold"
      />
      
      <FormatButton
        onClick={formatItalic}
        icon={<Italic className="h-4 w-4" />}
        label="Italic"
      />
      
      <FormatButton
        onClick={formatUnderline}
        icon={<Underline className="h-4 w-4" />}
        label="Underline"
      />
      
      <FormatButton
        onClick={formatCode}
        icon={<Code className="h-4 w-4" />}
        label="Code"
      />
      
      <div className="w-px h-6 bg-border my-auto mx-1" />
      
      <FormatButton
        onClick={() => formatHeading('h1')}
        icon={<Heading1 className="h-4 w-4" />}
        label="Heading 1"
      />
      
      <FormatButton
        onClick={() => formatHeading('h2')}
        icon={<Heading2 className="h-4 w-4" />}
        label="Heading 2"
      />
      
      <FormatButton
        onClick={() => formatHeading('h3')}
        icon={<Heading3 className="h-4 w-4" />}
        label="Heading 3"
      />
      
      <div className="w-px h-6 bg-border my-auto mx-1" />
      
      <FormatButton
        onClick={formatBulletList}
        icon={<List className="h-4 w-4" />}
        label="Bullet List"
      />
      
      <FormatButton
        onClick={formatNumberedList}
        icon={<ListOrdered className="h-4 w-4" />}
        label="Numbered List"
      />
      
      <FormatButton
        onClick={formatQuote}
        icon={<Quote className="h-4 w-4" />}
        label="Quote"
      />
      
      <div className="w-px h-6 bg-border my-auto mx-1" />
      
      <FormatButton
        onClick={() => formatAlignment('left')}
        icon={<AlignLeft className="h-4 w-4" />}
        label="Align Left"
      />
      
      <FormatButton
        onClick={() => formatAlignment('center')}
        icon={<AlignCenter className="h-4 w-4" />}
        label="Align Center"
      />
      
      <FormatButton
        onClick={() => formatAlignment('right')}
        icon={<AlignRight className="h-4 w-4" />}
        label="Align Right"
      />
      
      <FormatButton
        onClick={() => formatAlignment('justify')}
        icon={<AlignJustify className="h-4 w-4" />}
        label="Align Justify"
      />
      
      <div className="w-px h-6 bg-border my-auto mx-1" />
      
      <FormatButton
        onClick={toggleDirection}
        icon={isRTL ? <ArrowLeftToLine className="h-4 w-4" /> : <ArrowRightToLine className="h-4 w-4" />}
        label={isRTL ? "Switch to LTR" : "Switch to RTL"}
        active={isRTL}
      />
      
      <div className="w-px h-6 bg-border my-auto mx-1" />
      
      <FormatButton
        onClick={insertLink}
        icon={<LinkIcon className="h-4 w-4" />}
        label="Insert Link"
      />
      
      <FormatButton
        onClick={insertImage}
        icon={<Image className="h-4 w-4" />}
        label="Insert Image"
      />
    </div>
  )
}

// Inner Editor component that uses the composer context
function Editor({
  content,
  onChange,
  placeholder,
  minHeight,
  autoFocus,
  editable,
  rtl
}: LexicalEditorProps) {
  const [editor] = useLexicalComposerContext()
  
  // Calculate the editor styles
  const editorStyle: React.CSSProperties = {
    minHeight,
    direction: rtl ? 'rtl' : 'ltr'
  }
  
  // Handler for content changes
  const handleEditorChange = (state: EditorState) => {
    editor.update(() => {
      const htmlContent = $generateHtmlFromNodes(editor)
      const textContent = $getRoot().getTextContent()
      onChange(htmlContent, textContent)
    })
  }

  return (
    <>
      <ToolbarPlugin />
      <div className="relative" style={editorStyle}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable 
              className="p-4 outline-none w-full overflow-y-auto focus:outline-none" 
              style={{ minHeight }}
            />
          }
          placeholder={
            <div className="absolute top-[1.125rem] left-[1.125rem] text-muted-foreground">
              {placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <TabIndentationPlugin />
        {autoFocus && <AutoFocusPlugin />}
        <TextDirectionPlugin />
        <TablePlugin />
        <CheckListPlugin />
        <HorizontalRulePlugin />
        <ImageUploadPlugin />
        
        <OnChangePlugin onChange={handleEditorChange} />
      </div>
    </>
  )
}

const LexicalEditor: React.FC<LexicalEditorProps> = ({
  content,
  onChange,
  placeholder = "Write your content here...",
  minHeight = "200px",
  autoFocus = false,
  editable = true,
  rtl = false
}) => {
  // Initialize the editor config
  const initialConfig = {
    namespace: 'LexicalEditor',
    theme,
    onError: (error: Error) => {
      console.error('Lexical Editor Error:', error)
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode
    ],
    editorState: content ? () => {
      const parser = new DOMParser()
      const doc = parser.parseFromString(content, 'text/html')
      return doc.body.innerHTML
    } : undefined,
    editable
  }

  return (
    <div className="border rounded-md flex flex-col w-full">
      <LexicalComposer initialConfig={initialConfig}>
        <Editor
          content={content}
          onChange={onChange}
          placeholder={placeholder}
          minHeight={minHeight}
          autoFocus={autoFocus}
          editable={editable}
          rtl={rtl}
        />
      </LexicalComposer>
    </div>
  )
}

export default LexicalEditor 