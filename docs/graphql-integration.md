# GraphQL Integration with Supabase

This document outlines how we've integrated GraphQL with Supabase for the OSINT Dashboard project.

## Purpose & Usage Guide

This documentation serves as the definitive reference for the GraphQL implementation in the OSINT Dashboard project. It's designed to be used by:

- **Frontend developers** implementing UI components that consume GraphQL data
- **Backend developers** maintaining or extending the GraphQL schema and resolvers
- **New team members** getting familiar with the data fetching architecture
- **DevOps engineers** setting up the necessary infrastructure for GraphQL

You should consult this document when:

- Building new features that require data fetching from the API
- Diagnosing performance issues related to data queries
- Implementing authorization rules for GraphQL operations
- Extending the schema with new types, queries, or mutations
- Setting up development environments with GraphQL support
- Understanding the security model for GraphQL endpoints

This guide complements the main Project Architecture document but provides deeper technical details specific to GraphQL implementation and usage patterns.

## Overview

We use Apollo Client (@apollo/client ^3.13.5) to interact with our GraphQL API, which is implemented using GraphQL Yoga. This provides a more efficient and type-safe way to fetch and manipulate data compared to traditional REST endpoints.

## Implementation Details

### Server-Side Setup

1. **GraphQL Yoga Server**:
   - Located in the `graphql` directory at the project root
   - Uses `graphql-yoga` (^5.13.2) for the server implementation
   - Provides type-safe schema definitions and resolvers
   - Integrates directly with Supabase for data storage

2. **Schema Design**:
   - Defines GraphQL types that map to Supabase tables
   - Includes queries and mutations for all major entities
   - Supports filtering, pagination, and sorting
   - Leverages GraphQL's strong typing for data validation

### Client-Side Setup

1. **Apollo Client Configuration**: 
   - Located at `lib/graphql/client.ts`
   - Configured with authentication headers for GraphQL API
   - Uses environment variables for the GraphQL endpoint and API keys
   - Implements optimistic updates for improved UX

2. **Apollo Provider**:
   - Wraps the application in `components/providers/ApolloProvider.tsx`
   - Integrated in the app layout to ensure global availability
   - Configured with caching strategies for performance

3. **GraphQL Operations**:
   - Defined in `lib/graphql/operations/` directory
   - Organized by domain (blog, users, etc.)
   - Includes fragments, queries, and mutations
   - Uses TypeScript for type safety

4. **React Hooks**:
   - Custom hooks in `lib/graphql/hooks/` directory
   - Provide a clean interface for components to interact with GraphQL operations
   - Handle loading, error, and success states
   - Support for pagination and infinite scrolling

## Authentication and Authorization

GraphQL requests are secured through:

1. **JWT Authentication**:
   - Tokens from Supabase/NextAuth are included in request headers
   - Server-side middleware validates tokens before processing requests

2. **Role-Based Access Control**:
   - Resolvers check user permissions before executing operations
   - Field-level security prevents unauthorized access to sensitive data

3. **Rate Limiting**:
   - Configurable rate limits prevent abuse
   - Different limits for authenticated vs. anonymous users

## Usage Examples

### Fetching a Blog Post by Slug

```tsx
import { useGetBlogPostBySlug } from '@/lib/graphql/hooks/useBlogPost';

function BlogPostComponent({ slug }) {
  const { data, loading, error } = useGetBlogPostBySlug(slug);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  const post = data?.blogPostsCollection?.edges[0]?.node;
  
  return (
    <div>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </div>
  );
}
```

### Creating a Blog Post

```tsx
import { useCreateBlogPost, createBlogPostMutation } from '@/lib/graphql/hooks/useBlogPost';

function CreatePostComponent() {
  const [createPost] = useCreateBlogPost();
  
  const handleSubmit = async (formData) => {
    const result = await createBlogPostMutation(createPost, {
      title: formData.title,
      slug: formData.slug,
      content: formData.content,
      // ... other fields
    });
    
    if (result.error) {
      // Handle error
    } else {
      // Success
    }
  };
  
  // Render form
}
```

### Updating a Blog Post

```tsx
import { useUpdateBlogPost, updateBlogPostMutation } from '@/lib/graphql/hooks/useBlogPost';

function EditPostComponent({ postId }) {
  const [updatePost] = useUpdateBlogPost();
  
  const handleUpdate = async (formData) => {
    const result = await updateBlogPostMutation(updatePost, postId, {
      title: formData.title,
      content: formData.content,
      // ... other fields
    });
    
    if (result.error) {
      // Handle error
    } else {
      // Success
    }
  };
  
  // Render form
}
```

## Rich Text Editor Integration

Our GraphQL API is seamlessly integrated with our rich text editors:

1. **Lexical Editor**:
   - Used for blog posts and complex content creation
   - Sends structured content via GraphQL mutations
   - Preserves formatting and media references

2. **TipTap Editor**:
   - Alternative editor for simpler content needs
   - Full integration with GraphQL operations
   - Supports extensions for color, highlighting, images, and more

## Environment Variables

The GraphQL integration requires the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_GRAPHQL_ENDPOINT=your-api-url/graphql  # URL to your GraphQL Yoga endpoint
GRAPHQL_SERVER_SECRET=your-server-secret-key       # Used for server-to-server authentication
```

## Benefits Over REST API

1. **Reduced Over-fetching**: Only fetch the fields you need for each component
2. **Single Request for Complex Data**: Get related data in a single request
3. **Type Safety**: Better type definitions and validation
4. **Real-time Capabilities**: Easier to implement with subscriptions
5. **Consistent Interface**: Same interface for all data operations
6. **Self-documenting API**: Introspection provides built-in documentation
7. **Optimized Network Performance**: Fewer HTTP requests and reduced payload size

## Performance Optimizations

1. **Caching Strategy**:
   - Apollo InMemoryCache for client-side caching
   - Type policies for normalized data storage
   - Custom cache invalidation for data consistency

2. **Batching and Deduplication**:
   - Automatic query batching to reduce network requests
   - Request deduplication to prevent redundant fetches

3. **Prefetching and Preloading**:
   - Strategic prefetching for anticipated user actions
   - Data preloading for important application paths

## Error Handling

1. **Client-Side Errors**:
   - Standardized error presentation UI components
   - Automatic retry logic for transient failures
   - Detailed error logging for debugging

2. **Server-Side Errors**:
   - Structured error responses with error codes
   - Contextual error messages for developers
   - Security-conscious error handling that doesn't leak sensitive information

## Future Enhancements

1. **Subscriptions**: Real-time updates with GraphQL subscriptions
2. **Code Generation**: Automated type generation from GraphQL schema
3. **Persisted Queries**: Hash-based query identification for security and performance
4. **Federation**: Distributed GraphQL services for scaling
5. **Advanced Monitoring**: GraphQL-specific performance metrics and insights