import { useQuery, gql } from '@apollo/client'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ImageNode } from './plugins/nodes/ImageNode'
import { ToolbarPlugin } from './plugins/ToolbarPlugin'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import * as React from 'react'

function LexicalErrorBoundary({ children }: { children: React.ReactNode }) {
  return <React.Fragment>{children}</React.Fragment>
}

// GraphQL query to fetch post content
const GET_POST_CONTENT = gql`
  query GetPostContent($id: ID!) {
    post(id: $id) {
      id
      content
      contentHtml
      direction
    }
  }
`

interface GraphQLLexicalEditorProps {
  postId: string
  placeholder?: string
  minHeight?: string
  autoFocus?: boolean
  editable?: boolean
}

export function GraphQLLexicalEditor({
  postId,
  placeholder = 'Start writing...',
  minHeight = '200px',
  autoFocus = false,
  editable = true,
}: GraphQLLexicalEditorProps) {
  const { loading, error, data } = useQuery(GET_POST_CONTENT, {
    variables: { id: postId },
  })

  if (loading) return <LoadingSpinner />
  if (error) return <div>Error loading content: {error.message}</div>

  const initialConfig = {
    namespace: 'GraphQLLexicalEditor',
    theme: {
      // Add your theme configuration here
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
      },
      heading: {
        h1: 'text-4xl font-bold',
        h2: 'text-3xl font-bold',
        h3: 'text-2xl font-bold',
        h4: 'text-xl font-bold',
        h5: 'text-lg font-bold',
        h6: 'font-bold',
      },
      quote: 'border-l-4 border-gray-200 pl-4 my-4',
    },
    onError(error: Error) {
      console.error(error)
    },
    nodes: [HeadingNode, QuoteNode, ImageNode],
    editable,
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative min-h-[200px] w-full border rounded-lg">
        <ToolbarPlugin />
        <div className="relative" style={{ minHeight }}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="outline-none px-4 py-4 min-h-full" />
            }
            placeholder={
              <div className="absolute top-4 left-4 text-gray-400">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        {autoFocus && <AutoFocusPlugin />}
      </div>
    </LexicalComposer>
  )
} 