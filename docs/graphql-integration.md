# GraphQL Integration with Supabase

This document outlines how we've integrated GraphQL with Supabase for the OSINT Dashboard project.

## Purpose & Usage Guide

This documentation serves as the definitive reference for the GraphQL implementation in the OSINT Dashboard project. It's designed to be used by:

- **Frontend developers** implementing UI components that consume GraphQL data (both within this project and for external headless frontends).
- **Backend developers** maintaining or extending the GraphQL schema and resolvers.
- **New team members** getting familiar with the data fetching architecture.
- **DevOps engineers** setting up the necessary infrastructure for GraphQL.

You should consult this document when:

- Building new features that require data fetching from the API.
- Diagnosing performance issues related to data queries.
- Implementing authorization rules for GraphQL operations.
- Extending the schema with new types, queries, or mutations.
- Setting up development or production environments with GraphQL support.
- Understanding the security model for GraphQL endpoints.
- Connecting an external headless frontend to this CMS.

This guide complements the main Project Architecture document but provides deeper technical details specific to GraphQL implementation and usage patterns.

## Overview

We use Apollo Client (`@apollo/client`) within the dashboard to interact with our GraphQL API, which is implemented using GraphQL Yoga (`graphql-yoga`). This provides an efficient and type-safe way to fetch and manipulate data. The API is exposed at `/api/graphql`.

## Implementation Details

### Server-Side Architecture

1.  **GraphQL Yoga Server**:
    - Located in `app/api/graphql/route.ts`.
    - Uses `graphql-yoga` for the server implementation.
    - Handles incoming GraphQL requests (queries and mutations).
    - Integrates directly with Supabase via the Supabase JS client for data operations.

2.  **Schema Definition**:
    - Defined in `graphql/schema.ts` using `graphql-tag`.
    - Includes types (`Post`, `Category`, `Tag`, `User`, etc.), queries, and mutations.
    - **Note:** Input types (`CreatePostInput`, `UpdatePostInput`) currently use **snake_case** for field names (e.g., `featured_image`, `category_id`). This is consistent with the resolver implementation but differs from typical GraphQL camelCase conventions for output types.

3.  **Resolvers**:
    - Implemented in `graphql/resolvers.ts`.
    - Contain the logic for fetching data from Supabase and transforming it for the GraphQL response.
    - Use TypeScript interfaces (defined within `resolvers.ts`) for type safety on arguments and database results.
    - Handle relationships (author, category, tags) by making additional Supabase queries.
    - Include context injection to access authenticated user information from `next-auth`.
    - Employ `try...catch` blocks for error handling, returning `GraphQLError` objects.

4.  **TypeScript Integration**:
    - Strong typing using interfaces within resolvers.
    - Custom hooks (`lib/graphql/hooks/`) provide typed wrappers around Apollo Client's `useQuery` and `useMutation`.
    - A specific `BlogPostInputForResolver` interface in hooks ensures correct snake_case data is sent in mutations.

### Client-Side Setup (Internal Dashboard)

1.  **Apollo Client Configuration**:
    - Configured in `lib/graphql/client.ts`.
    - Uses `createHttpLink` to point to `/api/graphql`.
    - Includes an `authLink` using `setContext`. **Important:** This link currently sends the Supabase *anonymous* key as the Bearer token and `apikey`. While requests from the dashboard work due to server-side session context, external clients needing authenticated mutations would require sending a *user-specific JWT*.
    - Uses `InMemoryCache` for caching.

2.  **Apollo Provider**:
    - The standard Apollo Provider likely wraps the application layout (confirm location if needed, e.g., `app/providers.tsx` or layout file).

3.  **GraphQL Operations**:
    - Defined in `lib/graphql/operations/`.
    - Organized by entity (e.g., `blog.ts`).
    - Fragments (`BLOG_POST_FIELDS`) use camelCase for output fields.
    - Queries (`GET_BLOG_POSTS`, `GET_BLOG_POST_BY_SLUG`) and Mutations (`CREATE_BLOG_POST`, `UPDATE_BLOG_POST`) are defined using `gql`.

4.  **React Hooks**:
    - Custom hooks in `lib/graphql/hooks/` (e.g., `useBlogPost.ts`).
    - Simplify component interaction (e.g., `useGetBlogPosts`, `useCreateBlogPost`).
    - Helper functions (`createBlogPostMutation`, `updateBlogPostMutation`) wrap the mutation execution, expecting the snake_case `BlogPostInputForResolver`.

## Authentication and Authorization

1.  **Authentication Context (Server-Side)**:
    - The Yoga server (`app/api/graphql/route.ts`) uses `getServerSession(authOptions)` to retrieve the NextAuth.js session for the incoming request.
    - The `session.user` object (or `null`) is passed into the GraphQL `context`.
    - Resolvers requiring authentication (e.g., `createPost`, `updatePost`, `deletePost`, `editablePosts`) check for `context.user`. If absent, they throw a `GraphQLError('Unauthorized: ...')`.

2.  **Client Authentication (External Clients)**:
    - For external clients (headless frontends) needing to perform *authenticated* mutations (if any are exposed or required beyond public reads), they **must** obtain a valid JWT for the user (e.g., via a separate login flow potentially interacting with the NextAuth endpoints or Supabase directly) and send it in the `Authorization: Bearer <USER_JWT>` header with their GraphQL requests. The internal dashboard's reliance on the Supabase anon key in `lib/graphql/client.ts` is insufficient for external authenticated operations.

3.  **Authorization (Permissions)**:
    - Current implementation primarily checks for *authentication* (`context.user` exists).
    - Finer-grained *authorization* (e.g., checking user roles like 'admin' or 'editor' before allowing certain mutations) is **not explicitly implemented** in the provided resolvers but could be added by inspecting `context.user.role` or similar properties within the resolvers.
    - Database-level authorization is enforced by Supabase Row Level Security (RLS), primarily based on `auth.uid()`.

## Key GraphQL Operations (Examples)

*(Note: Input fields use snake_case)*

### Queries

```graphql
# Fetch posts with filtering and pagination
# Accessible publicly (filtered by status=published) or internally
query GetPosts($page: Int, $limit: Int, $status: PostStatus, $categoryId: ID, $tagId: ID, $featured: Boolean, $search: String) {
  posts(page: $page, limit: $limit, status: $status, categoryId: $categoryId, tagId: $tagId, featured: $featured, search: $search) {
    edges {
      node {
        # Using camelCase for output fields
        id
        title
        slug
        excerpt
        featuredImage
        status
        isFeatured
        publishedAt
        author { id name }
        category { id name slug }
        tags { id name slug }
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}

# Get a single post by slug (publicly accessible if published)
query GetPost($slug: String!) {
  post(slug: $slug) {
    id
    title
    slug
    content # Often needed for detail view
    featuredImage
    author { id name }
    category { id name slug }
    tags { id name slug }
    viewCount
    publishedAt
    createdAt
    updatedAt
    direction
    # Add other fields like SEO as needed
  }
}

# Fetch all categories (publicly accessible)
query GetCategories {
  categories {
    id
    name
    slug
    description
    direction
    # The 'posts' field here fetches related posts within the resolver
    # posts { id title } # Be mindful of performance impact
  }
}

# Fetch all tags (publicly accessible)
query GetTags {
  tags {
    id
    name
    slug
    # The 'posts' field here fetches related posts within the resolver
    # posts { id title } # Be mindful of performance impact
  }
}

# Fetch posts editable by the current authenticated user
query GetEditablePosts($page: Int, $limit: Int) {
  editablePosts(page: $page, limit: $limit) {
     # ... structure similar to GetPosts ...
  }
}
```

### Mutations

*(Requires Authentication)*

```graphql
# Create a new post
mutation CreatePost($input: CreatePostInput!) {
  # Input uses snake_case fields:
  # input: { title: "...", content: "...", category_id: "...", tag_ids: ["..."], status: draft, is_featured: false, ... }
  createPost(input: $input) {
    # Output uses camelCase fields
    id
    title
    slug
    status
    isFeatured
  }
}

# Update an existing post
mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
  # Input uses snake_case fields:
  # input: { title: "...", content: "...", is_featured: true, ... }
  updatePost(id: $id, input: $input) {
    id
    title
    slug
    updatedAt
    isFeatured
  }
}

# Delete a post
mutation DeletePost($id: ID!) {
  deletePost(id: $id) # Returns Boolean
}

# Other mutations for categories, tags follow similar patterns...
```

## Troubleshooting Common Issues

1.  **Authentication Errors (401/Unauthorized)**:
    *   **Internal:** Ensure the user is logged into the dashboard (valid NextAuth session).
    *   **External:** Ensure a valid user JWT is being sent in the `Authorization: Bearer` header for protected mutations. The Supabase anon key is insufficient. Check token validity and expiration.
    *   Verify the resolver logic correctly checks `context.user`.

2.  **Incorrect Data in Mutations (Snake vs. Camel Case)**:
    *   Remember that **input objects** (`CreatePostInput`, `UpdatePostInput`) in the schema expect **snake_case** fields.
    *   Ensure client-side code (especially the `createBlogPostMutation` and `updateBlogPostMutation` helpers) sends data matching the `BlogPostInputForResolver` interface (snake_case).

3.  **Relationship Data Not Loading**:
    *   Check that your query explicitly requests the nested fields (e.g., `author { id name }`).
    *   Verify resolver logic correctly fetches and maps related data (author, category, tags).
    *   Check Supabase foreign key constraints and RLS policies.

4.  **Schema Mismatches/Errors**:
    *   Restart the development server (`npm run dev`) after schema changes (`graphql/schema.ts`).
    *   Check the server console for GraphQL Yoga schema validation errors on startup.
    *   Ensure client-side queries/mutations match the defined schema.

5.  **Performance Problems**:
    *   Analyze resolver logic for potential N+1 issues (multiple queries inside loops). While `Promise.all` is used in some places, review complex queries.
    *   Limit fields requested by the client. Use fragments effectively.
    *   Implement pagination correctly (`page`, `limit` args).
    *   Consider database indexing in Supabase for frequently queried columns (slug, status, category_id, author_id).

## Example Implementation: `post` Resolver Analysis

The `post` resolver demonstrates the current pattern:

```typescript
// graphql/resolvers.ts
post: async (_: unknown, { slug }: PostArgs, context: Context) => { // Added context for potential future use
  console.log(`Fetching post with slug: ${slug}`);
  try {
    // 1. Fetch the main post data
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('*') // Selects all columns (consider specifying needed ones)
      .eq('slug', slug)
      .maybeSingle(); // Use maybeSingle for graceful not-found

    if (postError && postError.code !== 'PGRST116') { // Handle specific errors
      console.error(`Error fetching post DB ${slug}:`, postError);
      throw new GraphQLError(`Database error fetching post: ${postError.message}`);
    }
    if (!post) {
      console.log(`Post not found with slug: ${slug}`);
      return null; // Return null if post not found
    }

    // 2. Fetch related data in parallel (Good use of Promise.all)
    const [authorResult, categoryResult, tagsResult] = await Promise.all([
      post.author_id ? supabase.from('users').select('id, email, user_metadata').eq('id', post.author_id).single() : Promise.resolve({ data: null, error: null }),
      post.category_id ? supabase.from('blog_categories').select('*').eq('id', post.category_id).single() : Promise.resolve({ data: null, error: null }),
      supabase.from('blog_posts_tags').select('tag_id').eq('post_id', post.id)
    ]);

    // Error checking for related data (Important!)
    if (authorResult.error) console.error(`Error fetching author ${post.author_id}:`, authorResult.error);
    if (categoryResult.error) console.error(`Error fetching category ${post.category_id}:`, categoryResult.error);
    if (tagsResult.error) console.error(`Error fetching post tags ${post.id}:`, tagsResult.error);

    // 3. Fetch actual tag details based on relations (Potential N+1 if not handled carefully elsewhere, but okay here)
    let tags: DbTag[] = [];
    const tagRelations = tagsResult.data || [];
    if (tagRelations.length > 0) {
      const tagIds = tagRelations.map(pt => pt.tag_id);
      const { data: tagsData, error: tagsDataError } = await supabase
        .from('blog_tags')
        .select('*')
        .in('id', tagIds);
      if (tagsDataError) console.error(`Error fetching tag details:`, tagsDataError);
      tags = tagsData || [];
    }

    // 4. Transform DB data (snake_case) to GraphQL Type (camelCase)
    const author = authorResult.data;
    const category = categoryResult.data;
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content, // Ensure content is handled correctly (JSON vs HTML)
      featuredImage: post.featured_image, // Mapping snake_case to camelCase
      author: author ? {
        id: author.id,
        email: author.email,
        name: author.user_metadata?.name || author.email.split('@')[0],
        // role: author.user_metadata?.role || 'contributor' // Example if role exists
      } : null,
      category: category ? {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        direction: category.direction || 'ltr'
      } : null,
      tags: tags.map((tag: DbTag) => ({ // Map tag data
        id: tag.id,
        name: tag.name,
        slug: tag.slug
      })),
      status: post.status,
      isFeatured: post.is_featured, // Mapping
      viewCount: post.view_count,   // Mapping
      publishedAt: post.published_at, // Mapping
      createdAt: post.created_at,     // Mapping
      updatedAt: post.updated_at,     // Mapping
      seoTitle: post.seo_title,         // Mapping
      seoDescription: post.seo_description, // Mapping
      seoKeywords: post.seo_keywords,     // Mapping
      direction: post.direction
    };
  } catch (error) { // Catch unexpected errors
    console.error(`Unexpected error fetching post ${slug}:`, error);
    // Don't throw generic 'Failed to fetch post', use specific error if possible
    throw new GraphQLError(error instanceof Error ? error.message : 'An unexpected error occurred while fetching the post.');
  }
}
```

## Best Practices

1.  **Schema Design:** Clearly define types, queries, and mutations. Use descriptions. Strive for consistency (e.g., decide on snake_case vs. camelCase for inputs and stick to it, though camelCase is more standard for GraphQL APIs).
2.  **Type Safety:** Leverage TypeScript interfaces extensively in resolvers and client-side hooks. Use generated types if possible (e.g., with GraphQL Code Generator).
3.  **Resolver Logic:**
    *   Keep resolvers focused. Offload complex logic to service/utility functions.
    *   Fetch data efficiently (use `Promise.all`, avoid N+1).
    *   Handle errors gracefully (specific errors, proper logging).
    *   Perform authorization checks early.
    *   Map database results to GraphQL types accurately.
4.  **Client Usage:**
    *   Use fragments to avoid repeating field selections.
    *   Define operations clearly (queries/mutations).
    *   Use custom hooks for cleaner component logic.
    *   Handle loading and error states appropriately in the UI.
5.  **Authentication:** Clearly document which operations require authentication and how external clients should provide credentials (Bearer JWT).

## Future Enhancements

1.  **Type Generation:** Implement GraphQL Code Generator to automatically create TypeScript types from the schema for both backend and frontend, reducing manual interface definitions and potential mismatches.
2.  **Improved Authorization:** Implement role-based checks within resolvers for mutations.
3.  **DataLoaders:** For more complex relationship fetching and potential N+1 issues, investigate using `DataLoader` to batch and cache database requests within a single GraphQL request lifecycle.
4.  **Input Validation:** Add more robust input validation (e.g., using `zod` or a GraphQL directive) beyond basic type checking.
5.  **Schema Consistency:** Consider migrating input object fields to camelCase for consistency with GraphQL output types, although this would require updating resolvers and client-side mutation calls.