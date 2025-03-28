import { useMutation, gql } from '@apollo/client'
import { $convertToMarkdownString } from '@lexical/markdown'
import { $generateHtmlFromNodes } from '@lexical/html'
import { EditorState, LexicalEditor } from 'lexical'

// GraphQL mutations for blog posts
const UPDATE_POST_CONTENT = gql`
  mutation UpdatePostContent($id: ID!, $content: String!, $contentHtml: String!) {
    updatePost(id: $id, input: { content: $content, contentHtml: $contentHtml }) {
      id
      content
      contentHtml
    }
  }
`

export const useLexicalGraphQL = (postId: string) => {
  const [updatePostContent] = useMutation(UPDATE_POST_CONTENT)

  const handleEditorChange = async (editorState: EditorState, editor: LexicalEditor) => {
    // Convert editor state to both Markdown and HTML
    let markdown = ''
    let html = ''

    editorState.read(() => {
      try {
        // Check if converter is available and provide transformers if needed
        markdown = $convertToMarkdownString()
      } catch (error) {
        console.warn('Error converting to markdown:', error)
        markdown = '' // Fallback to empty string
      }
      
      try {
        html = $generateHtmlFromNodes(editor)
      } catch (error) {
        console.warn('Error generating HTML:', error)
        html = '' // Fallback to empty string
      }
    })

    try {
      await updatePostContent({
        variables: {
          id: postId,
          content: markdown,
          contentHtml: html
        }
      })
    } catch (error) {
      console.error('Error updating post content:', error)
    }
  }

  return {
    handleEditorChange
  }
} 