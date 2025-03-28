"use client"

import React from "react"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { TablePlugin } from "@lexical/react/LexicalTablePlugin"
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin"
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table"
import { ListItemNode, ListNode } from "@lexical/list"
import { CodeHighlightNode, CodeNode } from "@lexical/code"
import { LinkNode } from "@lexical/link"
import { HtmlPlugin } from './HtmlPlugin'

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

interface LexicalContentRendererProps {
  content: string
  direction?: 'ltr' | 'rtl'
  className?: string
}

const LexicalContentRenderer: React.FC<LexicalContentRendererProps> = ({
  content,
  direction = 'ltr',
  className = ''
}) => {
  // Initialize the editor with read-only mode
  const initialConfig = {
    namespace: 'BlogPreview',
    theme,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      CodeNode,
      CodeHighlightNode
    ],
    editable: false,
    onError: (error: Error) => {
      console.error('Lexical Editor Error:', error);
    },
  };

  return (
    <div className={`blog-content ${direction} ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="editor-container">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="editor-input" />
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <LinkPlugin />
          <ListPlugin />
          <TablePlugin />
          <CheckListPlugin />
          <HorizontalRulePlugin />
          <HtmlPlugin content={content} />
        </div>
      </LexicalComposer>
    </div>
  );
};

export default LexicalContentRenderer; 