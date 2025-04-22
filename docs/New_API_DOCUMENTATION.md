# OSINT Blog Headless API Documentation

**Version:** 1.1 (Updated 2023-10-27)

## Overview
This documentation describes the API system for the OSINT Dashboard blog CMS. The primary method for interacting with blog data is via the **GraphQL API**. A secondary, potentially legacy or simplified, RESTful endpoint is also available for basic public content retrieval.

This system provides a backend for managing a multilingual blog with posts, categories, tags, and media.

**Primary API:** [GraphQL API](#graphql-api) (Recommended)
**Secondary API:** [Public REST API](#public-rest-api-endpoint)

## Implementation Status Key
- ✅ **Implemented** - Feature is fully implemented and available
- 🟡 **Partially Implemented** - Basic functionality is available but may need refinement
- 🔄 **In Progress** - Feature is currently being implemented
- 📅 **Planned** - Feature is planned but not yet implemented

## Base URL / Endpoints

*   **GraphQL API Endpoint:** `/api/graphql` ✅
*   **Public REST API Endpoint:** `/api/public/blog` ✅

Use the appropriate base URL for your deployment:
```
Production: https://<your_production_domain>/api
Development: http://localhost:3000/api
```

## Authentication ✅

*   **GraphQL:**
    *   Public queries (reading published posts, categories, tags) generally do not require authentication.
    *   Mutations (create, update, delete) and queries for non-published content (drafts, `editablePosts`) require authentication.
    *   Authentication is handled via JWT tokens (typically from NextAuth.js session).
    *   Internal dashboard requests benefit from server-side context injection.
    *   **External clients MUST send a valid user JWT in the `Authorization: Bearer <USER_JWT>` header for authenticated operations.**
    *   See `graphql-integration.md` for details.
*   **Public REST API:** This endpoint is designed for public data access and does **not** require authentication.

## GraphQL API (Recommended) ✅

**Endpoint:** `/api/graphql`
**Method:** POST

This is the **primary and most flexible** way to interact with the blog data. It offers strongly-typed queries, allows fetching complex nested data efficiently, and supports mutations for content management.

**Key Features:**

*   Fetch posts (published, drafts, featured, by author, etc.) with filtering, pagination, and sorting.
*   Fetch single posts by slug.
*   Fetch categories and tags, including associated post counts.
*   Create, update, and delete posts, categories, and tags (requires authentication).
*   Supports fetching posts editable by the current user.

**Detailed Documentation:**

Please refer to the dedicated **[GraphQL Integration Documentation](graphql-integration.md)** for:

*   Complete schema details (types, queries, mutations).
*   Authentication specifics for internal and external clients.
*   Client setup examples (Apollo Client).
*   Query and mutation examples.
*   Troubleshooting guide.

**Example GraphQL Query:**
```graphql
query GetPublishedPosts($limit: Int, $categoryId: ID) {
  # Fetch published posts, optionally filtered by category
  posts(limit: $limit, categoryId: $categoryId, status: published) {
    edges {
      node {
        id
        title
        slug
        excerpt
        featuredImage
        publishedAt
        author { name }
        category { name slug }
        tags { name slug }
      }
    }
    totalCount
  }
}
```

## Public REST API Endpoint 🟡

**Endpoint:** `/api/public/blog`
**Method:** GET

This endpoint provides a simpler, RESTful way to access **publicly available** blog content. It is less flexible than GraphQL but suitable for basic content retrieval without needing a GraphQL client.

**Status:** Implemented, but may be considered secondary to the GraphQL API.

### Fetch Public Content
```http
GET /api/public/blog
```

**Query Parameters:**

*   `resource` (string, **required**): Specifies the type of content to fetch.
    *   `posts`: Retrieve a list of published blog posts.
    *   `post`: Retrieve a single published post by its slug.
    *   `categories`: Retrieve a list of all categories.
    *   `tags`: Retrieve a list of all tags.
    *   `featured`: Retrieve a list of published posts marked as featured.
*   `slug` (string): Required **only** when `resource=post`.
*   `page` (integer): Page number for paginated resources (`posts`, `featured`). Default: `1`.
*   `limit` (integer): Number of items per page for paginated resources. Default: `10`.
*   `categoryId` (uuid): Filter `posts` or `featured` by a specific category ID.
*   `tagId` (uuid): Filter `posts` or `featured` by a specific tag ID.
*   `search` (string): Filter `posts` by a search term (searches title and content).
*   `direction` (string): Filter `posts` by content direction (`ltr` or `rtl`).
*   `cacheBuster` (string): Optional random string to bypass potential caching.

**Examples:**
```
# Get latest 5 published posts
/api/public/blog?resource=posts&limit=5

# Get a specific post
/api/public/blog?resource=post&slug=my-example-post-slug

# Get all categories
/api/public/blog?resource=categories

# Get all tags
/api/public/blog?resource=tags

# Get 3 featured posts
/api/public/blog?resource=featured&limit=3

# Get posts from a specific category
/api/public/blog?resource=posts&categoryId=123e4567-e89b-12d3-a456-426614174000
```

**Response Format (Success):**

The structure of the response depends on the `resource` requested. It generally returns an object containing the requested data (e.g., `posts`, `post`, `categories`, `tags`) and potentially pagination info.

*Example for `resource=posts`:*
```json
{
  "posts": [
    {
      "id": "uuid",
      "title": "Post Title",
      "slug": "post-title",
      "excerpt": "Post excerpt...",
      "content": "...", // Content might be truncated or omitted in list view
      "featuredImage": "https://...",
      "author": { "id": "uuid", "name": "Author Name" },
      "category": { "id": "uuid", "name": "Category", "slug": "category" },
      "tags": [ { "id": "uuid", "name": "Tag", "slug": "tag" } ],
      "status": "published",
      "isFeatured": false,
      "publishedAt": "2024-01-01T00:00:00Z",
      "direction": "ltr"
      // Other fields as available in the underlying implementation
    }
    // ... more posts
  ],
  "page": 1,
  "limit": 10,
  "total": 50, // Total number of published posts matching filters
  "totalPages": 5
}
```

*Example for `resource=post`:*
```json
{
  "post": {
    "id": "uuid",
    "title": "Post Title",
    "slug": "post-title",
    "excerpt": "Post excerpt...",
    "content": "Full post content...",
    "featuredImage": "https://...",
    "author": { "id": "uuid", "name": "Author Name" },
    "category": { "id": "uuid", "name": "Category", "slug": "category" },
    "tags": [ { "id": "uuid", "name": "Tag", "slug": "tag" } ],
    "status": "published",
    "isFeatured": false,
    "viewCount": 123,
    "publishedAt": "2024-01-01T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "seoTitle": "SEO Title",
    "seoDescription": "SEO Description",
    "seoKeywords": "keywords",
    "direction": "ltr"
    // ... other fields
  }
}
```

*Example for `resource=categories`:*
```json
{
  "categories": [
    { "id": "uuid", "name": "Tech", "slug": "tech", "description": "...", "direction": "ltr" },
    { "id": "uuid", "name": "News", "slug": "news", "description": "...", "direction": "ltr" }
    // ... more categories
  ]
}
```

**Response Format (Error):**
```json
{
  "error": "Error Type",
  "message": "Detailed error description (e.g., Missing required parameter: slug)"
}
```

### Real-time Updates / Webhooks 🟡

While the original documentation mentioned webhook subscriptions (`POST /api/public/blog`), the implementation status and exact mechanism require confirmation. A webhook route (`/api/public/blog/webhook/route.ts`) exists but its functionality is not fully detailed here.

Real-time updates are more robustly supported via **GraphQL Subscriptions**. Refer to `graphql-integration.md` if real-time updates are needed.

## Performance Optimizations ✅

Both GraphQL and REST APIs benefit from:

1.  **Efficient Database Queries**: Resolvers and route handlers aim to fetch data efficiently from Supabase.
2.  **Caching**: Standard HTTP caching headers (`Cache-Control`, `ETag`) may be implemented by the underlying framework (Next.js/Vercel). Cache behaviour depends on deployment configuration.
3.  **Network Efficiency**: Pagination limits payload size. GraphQL allows clients to request only necessary fields.

## Code Architecture & Best Practices ✅

The backend follows modern development practices:

1.  **Technology**: Next.js, TypeScript, Supabase, GraphQL Yoga, Apollo Client.
2.  **Structure**: Code is organized into API routes, GraphQL schema/resolvers, libraries, components, and hooks.
3.  **Type Safety**: TypeScript is used throughout.
4.  **Error Handling**: `try...catch` blocks and structured error responses.
5.  **Security**: Relies on Supabase RLS, NextAuth.js for sessions, and standard web security practices.

## Example Usage (Conceptual REST)

*(Refer to `graphql-integration.md` for recommended GraphQL examples)*

### JavaScript Fetch API (REST Example)
```javascript
// Fetch latest published posts via REST
async function fetchLatestPostsRest() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ''; // Get base URL from env
    const response = await fetch(`${apiUrl}/api/public/blog?resource=posts&limit=5`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.error) {
       throw new Error(data.message || data.error);
    }
    return data.posts || [];
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return []; // Return empty array on error
  }
}

// Fetch a single post via REST
async function fetchPostRest(slug) {
  if (!slug) return null;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const response = await fetch(`${apiUrl}/api/public/blog?resource=post&slug=${encodeURIComponent(slug)}`);
     if (!response.ok) {
      // Handle 404 specifically
      if (response.status === 404) return null;
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
     if (data.error) {
       throw new Error(data.message || data.error);
    }
    return data.post || null;
  } catch (error) {
     console.error(`Failed to fetch post ${slug}:`, error);
     return null;
  }
}
```

## Error Handling Codes (REST)

*   **400 Bad Request**: Missing or invalid query parameters (e.g., missing `resource`, missing `slug` when `resource=post`).
*   **404 Not Found**: Resource not found (e.g., invalid post slug).
*   **500 Internal Server Error**: An unexpected error occurred on the server.

## Security Considerations ✅

1.  **Authentication**: Enforced for GraphQL mutations.
2.  **Authorization**: Primarily relies on Supabase RLS based on `auth.uid()` for data access control. Fine-grained role checks can be added to GraphQL resolvers.
3.  **Input Validation**: Basic validation via TypeScript types. Query parameters in REST are checked.
4.  **Rate Limiting**: Depends on deployment platform (e.g., Vercel) capabilities.
5.  **CORS**: Configured in `app/api/graphql/route.ts` for the GraphQL endpoint (`origin: '*'`). The REST endpoint's CORS behavior depends on Next.js defaults or specific configuration.

## Document Purpose & Reference Usage

This document provides an overview of the available APIs (GraphQL and REST) for the OSINT Blog CMS. 

**Use this document to:**

*   Understand the available API endpoints and their purpose.
*   Get a high-level overview of how to fetch public blog content via REST.
*   Know where to find detailed GraphQL documentation (`graphql-integration.md`).

**Consult the linked `graphql-integration.md` for:**

*   Detailed GraphQL schema, queries, mutations.
*   Instructions on using Apollo Client.
*   Authentication requirements for GraphQL.
*   Advanced GraphQL usage patterns.