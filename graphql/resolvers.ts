import { createClient } from '@supabase/supabase-js'
import { GraphQLError } from 'graphql'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Define appropriate types for resolver arguments
interface PostsArgs {
  page?: number
  limit?: number
  status?: string
  categoryId?: string
  tagId?: string
  authorId?: string
  direction?: string
  featured?: boolean
  search?: string
}

interface PostArgs {
  slug: string
}

interface PostInput {
  title: string
  content: string
  status?: string
  category_id?: string
  tag_ids?: string[]
  is_featured?: boolean
  direction?: string
}

interface CreatePostArgs {
  input: PostInput
}

interface UpdatePostArgs {
  id: string
  input: Partial<PostInput>
}

interface DeletePostArgs {
  id: string
}

interface Context {
  user?: {
    id: string
    [key: string]: unknown
  }
}

export const resolvers = {
  Query: {
    posts: async (_: unknown, args: PostsArgs) => {
      const {
        page = 1,
        limit = 10,
        status,
        categoryId,
        tagId,
        authorId,
        direction,
        featured,
        search
      } = args

      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          author:users(*),
          category:blog_categories(*),
          tags:blog_tags(*)
        `)

      // Apply filters
      if (status) query = query.eq('status', status)
      if (categoryId) query = query.eq('category_id', categoryId)
      if (authorId) query = query.eq('author_id', authorId)
      if (direction) query = query.eq('direction', direction)
      if (featured !== undefined) query = query.eq('is_featured', featured)
      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
      }
      if (tagId) {
        query = query.contains('tag_ids', [tagId])
      }

      // Add pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: posts, error, count } = await query

      if (error) {
        throw new GraphQLError(error.message)
      }

      return {
        edges: posts.map(post => ({
          node: post,
          cursor: post.id
        })),
        pageInfo: {
          hasNextPage: (count || 0) > to + 1,
          hasPreviousPage: page > 1,
          startCursor: posts[0]?.id,
          endCursor: posts[posts.length - 1]?.id
        },
        totalCount: count || 0
      }
    },

    post: async (_: unknown, { slug }: PostArgs) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:users(*),
          category:blog_categories(*),
          tags:blog_tags(*)
        `)
        .eq('slug', slug)
        .single()

      if (error) throw new GraphQLError(error.message)
      return data
    },

    categories: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')

      if (error) throw new GraphQLError(error.message)
      return data
    },

    tags: async () => {
      const { data, error } = await supabase
        .from('blog_tags')
        .select('*')

      if (error) throw new GraphQLError(error.message)
      return data
    }
  },

  Mutation: {
    createPost: async (_: unknown, { input }: CreatePostArgs, context: Context) => {
      // Check authentication
      if (!context.user) throw new GraphQLError('Unauthorized')

      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          ...input,
          author_id: context.user.id,
          slug: input.title.toLowerCase().replace(/\s+/g, '-')
        })
        .select()
        .single()

      if (error) throw new GraphQLError(error.message)
      return data
    },

    updatePost: async (_: unknown, { id, input }: UpdatePostArgs, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized')

      const { data, error } = await supabase
        .from('blog_posts')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new GraphQLError(error.message)
      return data
    },

    deletePost: async (_: unknown, { id }: DeletePostArgs, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized')

      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id)

      if (error) throw new GraphQLError(error.message)
      return true
    }
  },

  Post: {
    comments: async (post: { id: string }) => {
      const { data, error } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('post_id', post.id)

      if (error) throw new GraphQLError(error.message)
      return data
    }
  }
} 