import { createClient } from '@supabase/supabase-js'
import { GraphQLError } from 'graphql'

// Create Supabase client with admin privileges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Define interfaces for resolver arguments
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
  slug?: string
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

// Define interfaces for database entities
interface DbUser {
  id: string
  email: string
  user_metadata?: {
    name?: string
    [key: string]: unknown
  }
}

interface DbCategory {
  id: string
  name: string
  slug: string
  description?: string
  direction?: string
}

interface DbTag {
  id: string
  name: string
  slug: string
}

interface DbPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  content?: string
  featured_image?: string
  author_id?: string
  category_id?: string
  status: string
  is_featured: boolean
  view_count: number
  published_at?: string
  created_at: string
  updated_at: string
  seo_title?: string
  seo_description?: string
  seo_keywords?: string
  direction: string
}

export const resolvers = {
  Query: {
    posts: async (_: unknown, args: PostsArgs) => {
      console.log("Fetching posts with args:", JSON.stringify(args, null, 2));
      try {
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
        } = args;

        // Calculate pagination
        const offset = (page - 1) * limit;

        // Start query with base selection
        let query = supabase
          .from('blog_posts')
          .select('*', { count: 'exact' });

        // Apply filters
        if (status) query = query.eq('status', status);
        if (categoryId) query = query.eq('category_id', categoryId);
        if (authorId) query = query.eq('author_id', authorId);
        if (direction) query = query.eq('direction', direction);
        if (featured !== undefined) query = query.eq('is_featured', featured);
        if (search) {
          query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
        }

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        // Execute query
        const { data: posts, error, count } = await query;

        if (error) {
          console.error("Error fetching posts:", error);
          throw new GraphQLError(`Failed to fetch posts: ${error.message}`);
        }

        if (!posts || posts.length === 0) {
          console.log("No posts found with the given criteria");
          return {
            edges: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: page > 1,
              startCursor: null,
              endCursor: null
            },
            totalCount: 0
          };
        }

        // Fetch authors for all posts
        const authorIds = posts
          .filter(post => post.author_id)
          .map(post => post.author_id);

        let authors: DbUser[] = [];
        if (authorIds.length > 0) {
          const { data: authorsData } = await supabase
            .from('users')
            .select('id, email, user_metadata')
            .in('id', authorIds);

          authors = authorsData || [];
        }

        // Fetch categories for all posts
        const categoryIds = posts
          .filter(post => post.category_id)
          .map(post => post.category_id);

        let categories: DbCategory[] = [];
        if (categoryIds.length > 0) {
          const { data: categoriesData } = await supabase
            .from('blog_categories')
            .select('*')
            .in('id', categoryIds);

          categories = categoriesData || [];
        }

        // Fetch tags for all posts
        const postIds = posts.map(post => post.id);
        const tagsMap: Record<string, DbTag[]> = {};

        if (postIds.length > 0) {
          // First get all post_tag relationships
          const { data: postTagRelations } = await supabase
            .from('blog_posts_tags')
            .select('post_id, tag_id')
            .in('post_id', postIds);

          if (postTagRelations && postTagRelations.length > 0) {
            // Get all tag ids
            const tagIds = [...new Set(postTagRelations.map(pt => pt.tag_id))];

            // Fetch all tags
            const { data: tagsData } = await supabase
              .from('blog_tags')
              .select('*')
              .in('id', tagIds);

            if (tagsData) {
              // Organize tags by post id
              postTagRelations.forEach(relation => {
                const tag = tagsData.find(t => t.id === relation.tag_id);
                if (tag) {
                  if (!tagsMap[relation.post_id]) {
                    tagsMap[relation.post_id] = [];
                  }
                  tagsMap[relation.post_id].push(tag);
                }
              });
            }
          }
        }

        // Filter by tag if necessary
        let filteredPosts = [...posts];
        if (tagId) {
          filteredPosts = posts.filter(post => {
            const tags = tagsMap[post.id] || [];
            return tags.some((tag: { id: string }) => tag.id === tagId);
          });
        }

        // Transform posts to expected GraphQL format
        const transformedPosts = filteredPosts.map(post => {
          // Find author
          const author = authors.find(a => a.id === post.author_id);
          // Find category
          const category = categories.find(c => c.id === post.category_id);
          // Get tags
          const tags = tagsMap[post.id] || [];

          return {
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            featuredImage: post.featured_image,
            author: author ? {
              id: author.id,
              email: author.email,
              name: author.user_metadata?.name || author.email.split('@')[0],
              role: 'author'
            } : null,
            category: category ? {
              id: category.id,
              name: category.name,
              slug: category.slug,
              description: category.description,
              direction: category.direction || 'ltr'
            } : null,
            tags: tags.map((tag: DbTag) => ({
              id: tag.id,
              name: tag.name,
              slug: tag.slug
            })),
            status: post.status,
            isFeatured: post.is_featured,
            viewCount: post.view_count,
            publishedAt: post.published_at,
            createdAt: post.created_at,
            updatedAt: post.updated_at,
            seoTitle: post.seo_title,
            seoDescription: post.seo_description,
            seoKeywords: post.seo_keywords,
            direction: post.direction
          };
        });

        return {
          edges: transformedPosts.map(post => ({
            node: post,
            cursor: post.id
          })),
          pageInfo: {
            hasNextPage: (count || 0) > offset + filteredPosts.length,
            hasPreviousPage: page > 1,
            startCursor: transformedPosts[0]?.id,
            endCursor: transformedPosts[transformedPosts.length - 1]?.id
          },
          totalCount: count || 0
        };
      } catch (error) {
        console.error("Unexpected error in posts resolver:", error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    },

    // New query for editable posts
    editablePosts: async (_: unknown, args: PostsArgs, context: Context) => {
      console.log("Fetching editable posts");
      try {
        // Ensure user is authenticated
        if (!context.user) {
          throw new GraphQLError('Authentication required to view editable posts');
        }

        const userId = context.user.id;
        const {
          page = 1,
          limit = 10,
        } = args;

        // Calculate pagination
        const offset = (page - 1) * limit;

        // Get posts authored by the current user or where user has edit rights
        let query = supabase
          .from('blog_posts')
          .select('*', { count: 'exact' })
          .or(`author_id.eq.${userId}`);

        // Apply pagination
        query = query.range(offset, offset + limit - 1)
          .order('created_at', { ascending: false });

        // Execute query
        const { data: posts, error, count } = await query;

        if (error) {
          console.error("Error fetching editable posts:", error);
          throw new GraphQLError(`Failed to fetch editable posts: ${error.message}`);
        }

        if (!posts || posts.length === 0) {
          console.log("No editable posts found");
          return {
            edges: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: page > 1,
              startCursor: null,
              endCursor: null
            },
            totalCount: 0
          };
        }

        // Fetch related data in parallel
        const [authorsResult, categoriesResult, tagsResult] = await Promise.all([
          // Fetch authors
          supabase
            .from('users')
            .select('id, email, user_metadata')
            .in('id', posts.filter(post => post.author_id).map(post => post.author_id)),
          
          // Fetch categories
          supabase
            .from('blog_categories')
            .select('*')
            .in('id', posts.filter(post => post.category_id).map(post => post.category_id)),
          
          // Fetch post-tag relationships
          supabase
            .from('blog_posts_tags')
            .select('post_id, tag_id')
            .in('post_id', posts.map(post => post.id))
        ]);

        // Process authors
        const authors = authorsResult.data || [];
        
        // Process categories
        const categories = categoriesResult.data || [];
        
        // Process tags
        const postTagRelations = tagsResult.data || [];
        let tagIds: string[] = [];
        
        if (postTagRelations.length > 0) {
          tagIds = [...new Set(postTagRelations.map(pt => pt.tag_id))];
        }
        
        // Fetch tag details if needed
        let tags: DbTag[] = [];
        if (tagIds.length > 0) {
          const { data: tagsData } = await supabase
            .from('blog_tags')
            .select('*')
            .in('id', tagIds);
          
          tags = tagsData || [];
        }
        
        // Create a map of post ID to tags
        const postTags: Record<string, DbTag[]> = {};
        postTagRelations.forEach(relation => {
          const tag = tags.find(t => t.id === relation.tag_id);
          if (tag) {
            if (!postTags[relation.post_id]) {
              postTags[relation.post_id] = [];
            }
            postTags[relation.post_id].push(tag);
          }
        });

        // Transform posts to expected GraphQL format
        const transformedPosts = posts.map(post => {
          const author = authors.find(a => a.id === post.author_id);
          const category = categories.find(c => c.id === post.category_id);
          const postTagsList = postTags[post.id] || [];

          return {
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            featuredImage: post.featured_image,
            author: author ? {
              id: author.id,
              email: author.email,
              name: author.user_metadata?.name || author.email.split('@')[0],
              role: 'author'
            } : null,
            category: category ? {
              id: category.id,
              name: category.name,
              slug: category.slug,
              description: category.description,
              direction: category.direction || 'ltr'
            } : null,
            tags: postTagsList.map((tag: DbTag) => ({
              id: tag.id,
              name: tag.name,
              slug: tag.slug
            })),
            status: post.status,
            isFeatured: post.is_featured,
            viewCount: post.view_count,
            publishedAt: post.published_at,
            createdAt: post.created_at,
            updatedAt: post.updated_at,
            seoTitle: post.seo_title,
            seoDescription: post.seo_description,
            seoKeywords: post.seo_keywords,
            direction: post.direction
          };
        });

        return {
          edges: transformedPosts.map(post => ({
            node: post,
            cursor: post.id
          })),
          pageInfo: {
            hasNextPage: (count || 0) > offset + posts.length,
            hasPreviousPage: page > 1,
            startCursor: transformedPosts[0]?.id,
            endCursor: transformedPosts[transformedPosts.length - 1]?.id
          },
          totalCount: count || 0
        };
      } catch (error) {
        console.error("Error in editablePosts resolver:", error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    },

    // New query for non-editable posts
    nonEditablePosts: async (_: unknown, args: PostsArgs, context: Context) => {
      console.log("Fetching non-editable posts");
      try {
        // Ensure user is authenticated
        if (!context.user) {
          throw new GraphQLError('Authentication required to view non-editable posts');
        }

        const userId = context.user.id;
        const {
          page = 1,
          limit = 10,
        } = args;

        // Calculate pagination
        const offset = (page - 1) * limit;

        // Get posts NOT authored by the current user
        let query = supabase
          .from('blog_posts')
          .select('*', { count: 'exact' })
          .not('author_id', 'eq', userId);

        // Apply pagination
        query = query.range(offset, offset + limit - 1)
          .order('created_at', { ascending: false });

        // Execute query
        const { data: posts, error, count } = await query;

        if (error) {
          console.error("Error fetching non-editable posts:", error);
          throw new GraphQLError(`Failed to fetch non-editable posts: ${error.message}`);
        }

        if (!posts || posts.length === 0) {
          console.log("No non-editable posts found");
          return {
            edges: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: page > 1,
              startCursor: null,
              endCursor: null
            },
            totalCount: 0
          };
        }

        // Fetch related data in parallel
        const [authorsResult, categoriesResult, tagsResult] = await Promise.all([
          // Fetch authors
          supabase
            .from('users')
            .select('id, email, user_metadata')
            .in('id', posts.filter(post => post.author_id).map(post => post.author_id)),
          
          // Fetch categories
          supabase
            .from('blog_categories')
            .select('*')
            .in('id', posts.filter(post => post.category_id).map(post => post.category_id)),
          
          // Fetch post-tag relationships
          supabase
            .from('blog_posts_tags')
            .select('post_id, tag_id')
            .in('post_id', posts.map(post => post.id))
        ]);

        // Process authors
        const authors = authorsResult.data || [];
        
        // Process categories
        const categories = categoriesResult.data || [];
        
        // Process tags
        const postTagRelations = tagsResult.data || [];
        let tagIds: string[] = [];
        
        if (postTagRelations.length > 0) {
          tagIds = [...new Set(postTagRelations.map(pt => pt.tag_id))];
        }
        
        // Fetch tag details if needed
        let tags: DbTag[] = [];
        if (tagIds.length > 0) {
          const { data: tagsData } = await supabase
            .from('blog_tags')
            .select('*')
            .in('id', tagIds);
          
          tags = tagsData || [];
        }
        
        // Create a map of post ID to tags
        const postTags: Record<string, DbTag[]> = {};
        postTagRelations.forEach(relation => {
          const tag = tags.find(t => t.id === relation.tag_id);
          if (tag) {
            if (!postTags[relation.post_id]) {
              postTags[relation.post_id] = [];
            }
            postTags[relation.post_id].push(tag);
          }
        });

        // Transform posts to expected GraphQL format
        const transformedPosts = posts.map(post => {
          const author = authors.find(a => a.id === post.author_id);
          const category = categories.find(c => c.id === post.category_id);
          const postTagsList = postTags[post.id] || [];

          return {
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            featuredImage: post.featured_image,
            author: author ? {
              id: author.id,
              email: author.email,
              name: author.user_metadata?.name || author.email.split('@')[0],
              role: 'author'
            } : null,
            category: category ? {
              id: category.id,
              name: category.name,
              slug: category.slug,
              description: category.description,
              direction: category.direction || 'ltr'
            } : null,
            tags: postTagsList.map((tag: DbTag) => ({
              id: tag.id,
              name: tag.name,
              slug: tag.slug
            })),
            status: post.status,
            isFeatured: post.is_featured,
            viewCount: post.view_count,
            publishedAt: post.published_at,
            createdAt: post.created_at,
            updatedAt: post.updated_at,
            seoTitle: post.seo_title,
            seoDescription: post.seo_description,
            seoKeywords: post.seo_keywords,
            direction: post.direction
          };
        });

        return {
          edges: transformedPosts.map(post => ({
            node: post,
            cursor: post.id
          })),
          pageInfo: {
            hasNextPage: (count || 0) > offset + posts.length,
            hasPreviousPage: page > 1,
            startCursor: transformedPosts[0]?.id,
            endCursor: transformedPosts[transformedPosts.length - 1]?.id
          },
          totalCount: count || 0
        };
      } catch (error) {
        console.error("Error in nonEditablePosts resolver:", error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    },

    post: async (_: unknown, { slug }: PostArgs) => {
      console.log(`Fetching post with slug: ${slug}`);
      try {
        // Get post by slug
        const { data: post, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            console.log(`Post not found with slug: ${slug}`);
            return null;
          }
          console.error(`Error fetching post with slug ${slug}:`, error);
          throw new GraphQLError(`Failed to fetch post: ${error.message}`);
        }

        // Get author
        let author = null;
        if (post.author_id) {
          const { data: authorData } = await supabase
            .from('users')
            .select('id, email, user_metadata')
            .eq('id', post.author_id)
            .single();

          author = authorData;
        }

        // Get category
        let category = null;
        if (post.category_id) {
          const { data: categoryData } = await supabase
            .from('blog_categories')
            .select('*')
            .eq('id', post.category_id)
            .single();

          category = categoryData;
        }

        // Get tags
        const { data: postTagRelations } = await supabase
          .from('blog_posts_tags')
          .select('tag_id')
          .eq('post_id', post.id);

        let tags: DbTag[] = [];
        if (postTagRelations && postTagRelations.length > 0) {
          const tagIds = postTagRelations.map(pt => pt.tag_id);

          const { data: tagsData } = await supabase
            .from('blog_tags')
            .select('*')
            .in('id', tagIds);

          tags = tagsData || [];
        }

        // Transform to GraphQL format
        return {
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          featuredImage: post.featured_image,
          author: author ? {
            id: author.id,
            email: author.email,
            name: author.user_metadata?.name || author.email.split('@')[0],
            role: 'author'
          } : null,
          category: category ? {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            direction: category.direction || 'ltr'
          } : null,
          tags: tags.map((tag: DbTag) => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug
          })),
          status: post.status,
          isFeatured: post.is_featured,
          viewCount: post.view_count,
          publishedAt: post.published_at,
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          seoTitle: post.seo_title,
          seoDescription: post.seo_description,
          seoKeywords: post.seo_keywords,
          direction: post.direction
        };
      } catch (error) {
        console.error(`Unexpected error fetching post with slug ${slug}:`, error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    },

    categories: async () => {
      try {
        const { data, error } = await supabase
          .from('blog_categories')
          .select('*')
          .order('name');

        if (error) throw new GraphQLError(error.message);
        
        // For each category, count the number of published posts
        const categories = data || [];
        
        for (const category of categories) {
          const { count } = await supabase
            .from('blog_posts')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'published');
            
          category.postCount = count || 0;
        }
        
        return categories;
      } catch (error) {
        console.error("Error fetching categories:", error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    },

    tags: async () => {
      try {
        const { data, error } = await supabase
          .from('blog_tags')
          .select('*')
          .order('name');

        if (error) throw new GraphQLError(error.message);
        
        // For each tag, count the number of posts
        const tags = data || [];
        
        for (const tag of tags) {
          const { data: postTagRelations } = await supabase
            .from('blog_posts_tags')
            .select('post_id')
            .eq('tag_id', tag.id);
            
          tag.postCount = postTagRelations?.length || 0;
        }
        
        return tags;
      } catch (error) {
        console.error("Error fetching tags:", error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    }
  },

  Mutation: {
    createPost: async (_: unknown, { input }: CreatePostArgs, context: Context) => {
      console.log("Creating post with input:", JSON.stringify(input, null, 2));
      try {
        // Check authentication
        if (!context.user) {
          throw new GraphQLError('Unauthorized: Authentication required');
        }

        // Generate a slug from the title if not provided
        const slug = input.slug || input.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        // Check if slug already exists
        const { data: existingPost } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (existingPost) {
          throw new GraphQLError(`Post with slug "${slug}" already exists`);
        }

        // Prepare post data
        const postData = {
          ...input,
          slug,
          author_id: context.user.id
        };

        // Extract tag_ids if present
        const tagIds = postData.tag_ids;
        delete postData.tag_ids;

        // Insert post
        const { data: post, error } = await supabase
          .from('blog_posts')
          .insert(postData)
          .select()
          .single();

        if (error) {
          console.error("Error creating post:", error);
          throw new GraphQLError(`Failed to create post: ${error.message}`);
        }

        // Create tag relationships if tags are provided
        if (tagIds && tagIds.length > 0) {
          const tagRelations = tagIds.map(tagId => ({
            post_id: post.id,
            tag_id: tagId
          }));

          const { error: tagError } = await supabase
            .from('blog_posts_tags')
            .insert(tagRelations);

          if (tagError) {
            console.error("Error associating tags with post:", tagError);
            // Continue despite tag error as post was created successfully
          }
        }

        // Return created post with relationships
        return resolvers.Query.post(null, { slug: post.slug });
      } catch (error) {
        console.error("Error in createPost mutation:", error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    },

    updatePost: async (_: unknown, { id, input }: UpdatePostArgs, context: Context) => {
      console.log(`Updating post ${id} with:`, JSON.stringify(input, null, 2));
      try {
        // Check authentication
        if (!context.user) {
          throw new GraphQLError('Unauthorized: Authentication required');
        }

        // Check if post exists
        const { data: existingPost, error: fetchError } = await supabase
          .from('blog_posts')
          .select('slug')
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error(`Error fetching post ${id}:`, fetchError);
          throw new GraphQLError(`Post not found: ${fetchError.message}`);
        }

        // Prepare update data
        const updateData = { ...input };
        
        // Extract tag_ids if present
        const tagIds = updateData.tag_ids;
        delete updateData.tag_ids;

        // Update post
        const { data: updatedPost, error } = await supabase
          .from('blog_posts')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error(`Error updating post ${id}:`, error);
          throw new GraphQLError(`Failed to update post: ${error.message}`);
        }

        // Update tags if provided
        if (tagIds !== undefined) {
          // First delete existing relationships
          const { error: deleteTagError } = await supabase
            .from('blog_posts_tags')
            .delete()
            .eq('post_id', id);

          if (deleteTagError) {
            console.error(`Error deleting existing tag relationships for post ${id}:`, deleteTagError);
            // Continue despite error
          }

          // Create new tag relationships
          if (tagIds && tagIds.length > 0) {
            const tagRelations = tagIds.map(tagId => ({
              post_id: id,
              tag_id: tagId
            }));

            const { error: insertTagError } = await supabase
              .from('blog_posts_tags')
              .insert(tagRelations);

            if (insertTagError) {
              console.error(`Error associating tags with post ${id}:`, insertTagError);
              // Continue despite tag error as post was updated successfully
            }
          }
        }

        // Return updated post with relationships
        return resolvers.Query.post(null, { slug: updatedPost.slug });
      } catch (error) {
        console.error(`Error in updatePost mutation for ${id}:`, error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    },

    deletePost: async (_: unknown, { id }: DeletePostArgs, context: Context) => {
      console.log(`Deleting post with ID: ${id}`);
      try {
        // Check authentication
        if (!context.user) {
          throw new GraphQLError('Unauthorized: Authentication required');
        }

        // First delete tag relationships
        const { error: tagError } = await supabase
          .from('blog_posts_tags')
          .delete()
          .eq('post_id', id);

        if (tagError) {
          console.error(`Error deleting tag relationships for post ${id}:`, tagError);
          // Continue despite tag error
        }

        // Delete the post
        const { error } = await supabase
          .from('blog_posts')
          .delete()
          .eq('id', id);

        if (error) {
          console.error(`Error deleting post ${id}:`, error);
          throw new GraphQLError(`Failed to delete post: ${error.message}`);
        }

        return true;
      } catch (error) {
        console.error(`Error in deletePost mutation for ${id}:`, error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    },

    createCategory: async (_: unknown, { input }: { input: any }, context: Context) => {
      console.log("Creating category with input:", JSON.stringify(input, null, 2));
      try {
        // Check authentication
        if (!context.user) {
          throw new GraphQLError('Unauthorized: Authentication required');
        }

        // Generate a slug from the name if not provided
        const slug = input.slug || input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        // Check if slug already exists
        const { data: existingCategory } = await supabase
          .from('blog_categories')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (existingCategory) {
          throw new GraphQLError(`Category with slug "${slug}" already exists`);
        }

        // Insert category
        const { data: category, error } = await supabase
          .from('blog_categories')
          .insert({
            ...input,
            slug
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating category:", error);
          throw new GraphQLError(`Failed to create category: ${error.message}`);
        }

        return category;
      } catch (error) {
        console.error("Error in createCategory mutation:", error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    },

    updateCategory: async (_: unknown, { id, input }: { id: string, input: any }, context: Context) => {
      console.log(`Updating category ${id} with:`, JSON.stringify(input, null, 2));
      try {
        // Check authentication
        if (!context.user) {
          throw new GraphQLError('Unauthorized: Authentication required');
        }

        // Update category
        const { data: category, error } = await supabase
          .from('blog_categories')
          .update(input)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error(`Error updating category ${id}:`, error);
          throw new GraphQLError(`Failed to update category: ${error.message}`);
        }

        return category;
      } catch (error) {
        console.error(`Error in updateCategory mutation for ${id}:`, error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    },

    deleteCategory: async (_: unknown, { id }: { id: string }, context: Context) => {
      console.log(`Deleting category with ID: ${id}`);
      try {
        // Check authentication
        if (!context.user) {
          throw new GraphQLError('Unauthorized: Authentication required');
        }

        // Check if category is in use
        const { count, error: countError } = await supabase
          .from('blog_posts')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', id);

        if (countError) {
          console.error(`Error checking if category ${id} is in use:`, countError);
          throw new GraphQLError(`Failed to check if category is in use: ${countError.message}`);
        }

        if (count && count > 0) {
          throw new GraphQLError(`Cannot delete category that is associated with ${count} posts. Update or delete the posts first.`);
        }

        // Delete the category
        const { error } = await supabase
          .from('blog_categories')
          .delete()
          .eq('id', id);

        if (error) {
          console.error(`Error deleting category ${id}:`, error);
          throw new GraphQLError(`Failed to delete category: ${error.message}`);
        }

        return true;
      } catch (error) {
        console.error(`Error in deleteCategory mutation for ${id}:`, error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    },

    createTag: async (_: unknown, { input }: { input: any }, context: Context) => {
      console.log("Creating tag with input:", JSON.stringify(input, null, 2));
      try {
        // Check authentication
        if (!context.user) {
          throw new GraphQLError('Unauthorized: Authentication required');
        }

        // Generate a slug from the name if not provided
        const slug = input.slug || input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        // Check if slug already exists
        const { data: existingTag } = await supabase
          .from('blog_tags')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (existingTag) {
          throw new GraphQLError(`Tag with slug "${slug}" already exists`);
        }

        // Insert tag
        const { data: tag, error } = await supabase
          .from('blog_tags')
          .insert({
            ...input,
            slug
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating tag:", error);
          throw new GraphQLError(`Failed to create tag: ${error.message}`);
        }

        return tag;
      } catch (error) {
        console.error("Error in createTag mutation:", error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    },

    deleteTag: async (_: unknown, { id }: { id: string }, context: Context) => {
      console.log(`Deleting tag with ID: ${id}`);
      try {
        // Check authentication
        if (!context.user) {
          throw new GraphQLError('Unauthorized: Authentication required');
        }

        // Delete tag associations first
        const { error: relationshipError } = await supabase
          .from('blog_posts_tags')
          .delete()
          .eq('tag_id', id);

        if (relationshipError) {
          console.error(`Error deleting tag relationships for tag ${id}:`, relationshipError);
          // Continue despite error
        }

        // Delete the tag
        const { error } = await supabase
          .from('blog_tags')
          .delete()
          .eq('id', id);

        if (error) {
          console.error(`Error deleting tag ${id}:`, error);
          throw new GraphQLError(`Failed to delete tag: ${error.message}`);
        }

        return true;
      } catch (error) {
        console.error(`Error in deleteTag mutation for ${id}:`, error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    }
  },

  Category: {
    posts: async (category: { id: string }) => {
      try {
        const { data: posts, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('category_id', category.id)
          .eq('status', 'published');

        if (error) throw new GraphQLError(error.message);
        return posts || [];
      } catch (error) {
        console.error(`Error fetching posts for category ${category.id}:`, error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    }
  },

  Tag: {
    posts: async (tag: { id: string }) => {
      try {
        // Get post ids associated with this tag
        const { data: postTags, error: relationshipError } = await supabase
          .from('blog_posts_tags')
          .select('post_id')
          .eq('tag_id', tag.id);

        if (relationshipError) throw new GraphQLError(relationshipError.message);
        
        if (!postTags || postTags.length === 0) {
          return [];
        }

        // Get the posts
        const postIds = postTags.map(pt => pt.post_id);
        const { data: posts, error } = await supabase
          .from('blog_posts')
          .select('*')
          .in('id', postIds)
          .eq('status', 'published');

        if (error) throw new GraphQLError(error.message);
        return posts || [];
      } catch (error) {
        console.error(`Error fetching posts for tag ${tag.id}:`, error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    }
  },

  Post: {
    comments: async (post: { id: string }) => {
      try {
        const { data, error } = await supabase
          .from('blog_comments')
          .select('*')
          .eq('post_id', post.id)
          .order('created_at', { ascending: false });

        if (error) throw new GraphQLError(error.message);
        return data || [];
      } catch (error) {
        console.error(`Error fetching comments for post ${post.id}:`, error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    }
  }
} 