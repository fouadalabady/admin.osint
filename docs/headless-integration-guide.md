# Headless Integration Guide

**Version:** 1.1  
**Date:** October 27, 2023

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
   - [Required Environment Variables](#required-environment-variables)
   - [Environment Configuration Examples](#environment-configuration-examples)
4. [Authentication](#authentication)
   - [Public vs. Protected Routes](#public-vs-protected-routes)
   - [Setting Up Authentication](#setting-up-authentication)
5. [GraphQL API Integration](#graphql-api-integration)
   - [Apollo Client Setup](#apollo-client-setup)
   - [Creating GraphQL Operations](#creating-graphql-operations)
   - [Fetching Blog Posts](#fetching-blog-posts)
   - [Post Details](#post-details)
   - [Categories and Tags](#categories-and-tags)
   - [Authentication with GraphQL](#authentication-with-graphql)
6. [REST API Integration](#rest-api-integration)
   - [Endpoint Structure](#endpoint-structure)
   - [Fetching Blog Posts](#fetching-blog-posts-rest)
   - [Query Parameters](#query-parameters)
   - [Response Format](#response-format)
7. [Static Site Generation (SSG)](#static-site-generation-ssg)
   - [Implementation with Next.js](#implementation-with-nextjs)
   - [Incremental Static Regeneration](#incremental-static-regeneration)
8. [CORS Configuration](#cors-configuration)
9. [Error Handling](#error-handling)
10. [Performance Optimization](#performance-optimization)
11. [Troubleshooting](#troubleshooting)
12. [Summary](#summary)

## Introduction

This guide provides comprehensive instructions for connecting an external frontend application (such as a public website, mobile app, or other client) to the OSINT Dashboard's backend CMS API. It focuses on fetching and displaying blog content, including posts, categories, and tags.

There are two primary methods for accessing data:
1. **GraphQL API (Recommended)**: Offers more flexibility, type safety, and efficient data fetching
2. **REST API (Alternative)**: Simpler to implement but less flexible

## Prerequisites

Before integrating with the OSINT Dashboard CMS API, ensure you have:

- A frontend project set up (React, Vue, Angular, Next.js, etc.)
- Node.js (v16+) and npm/yarn installed
- Basic knowledge of GraphQL (for GraphQL integration) or REST APIs
- Understanding of asynchronous JavaScript and data fetching
- Access credentials for the CMS if working with protected routes

## Environment Setup

### Required Environment Variables

Create a `.env.local` file in your frontend project root with these variables:

```
# Base URL for your CMS backend
NEXT_PUBLIC_SITE_URL=http://your-backend-domain.com

# GraphQL API endpoint (recommended)
NEXT_PUBLIC_GRAPHQL_API_URL=http://your-backend-domain.com/api/graphql

# REST API endpoint (alternative)
NEXT_PUBLIC_API_BASE_URL=http://your-backend-domain.com/api/blog

# Optional: Authentication (if working with protected content)
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Environment Configuration Examples

#### Next.js Project

```javascript
// In your Next.js frontend project

// For GraphQL endpoint
const GRAPHQL_API_URL = process.env.NEXT_PUBLIC_GRAPHQL_API_URL || 'http://localhost:3000/api/graphql'

// For REST API endpoint
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/blog'
```

#### React Project

```javascript
// In your React frontend project
const GRAPHQL_API_URL = process.env.REACT_APP_GRAPHQL_API_URL || 'http://localhost:3000/api/graphql'
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/blog'
```

## Authentication

### Public vs. Protected Routes

The CMS API provides both public and protected routes:

- **Public Routes**: Available without authentication (public blog posts, categories, tags)
- **Protected Routes**: Require authentication (creating/editing posts, accessing draft content)

### Setting Up Authentication

For protected routes, you'll need to set up authentication using Supabase:

1. Install Supabase client:

```bash
npm install @supabase/supabase-js
```

2. Create a Supabase client:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

3. Implement sign-in functionality:

```javascript
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    console.error('Error signing in:', error)
    return null
  }
  
  return data
}
```

## GraphQL API Integration

### Apollo Client Setup

1. Install Apollo Client and GraphQL:

```bash
npm install @apollo/client graphql
```

2. Set up Apollo Client in your application:

```javascript
// lib/apollo-client.js
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { supabase } from './supabase-client'

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL,
})

// Add auth header for protected routes
const authLink = setContext(async (_, { headers }) => {
  // Get the session from supabase
  const { data } = await supabase.auth.getSession()
  const session = data?.session
  
  // Return the headers to the context
  return {
    headers: {
      ...headers,
      authorization: session ? `Bearer ${session.access_token}` : "",
    }
  }
})

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
})

export default client
```

3. Wrap your application with Apollo Provider:

```jsx
// pages/_app.js (Next.js) or App.js (React)
import { ApolloProvider } from '@apollo/client'
import client from '../lib/apollo-client'

function MyApp({ Component, pageProps }) {
  return (
    <ApolloProvider client={client}>
      <Component {...pageProps} />
    </ApolloProvider>
  )
}

export default MyApp
```

### Creating GraphQL Operations

Create a `graphql` folder in your project to store queries and mutations:

```javascript
// graphql/queries.js
import { gql } from '@apollo/client'

export const GET_BLOG_POSTS = gql`
  query GetBlogPosts($limit: Int, $offset: Int, $categorySlug: String) {
    posts(limit: $limit, offset: $offset, categorySlug: $categorySlug) {
      id
      title
      slug
      excerpt
      featuredImage
      publishedAt
      category {
        name
        slug
      }
      author {
        name
        avatar
      }
    }
  }
`

export const GET_POST_BY_SLUG = gql`
  query GetPostBySlug($slug: String!) {
    post(slug: $slug) {
      id
      title
      slug
      content
      featuredImage
      publishedAt
      isFeatured
      category {
        id
        name
        slug
      }
      tags {
        id
        name
        slug
      }
      author {
        id
        name
        avatar
        bio
      }
    }
  }
`

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      slug
      postCount
    }
  }
`

export const GET_TAGS = gql`
  query GetTags {
    tags {
      id
      name
      slug
      postCount
    }
  }
`
```

### Fetching Blog Posts

Use the queries in your components:

```jsx
// components/BlogList.jsx
import { useQuery } from '@apollo/client'
import { GET_BLOG_POSTS } from '../graphql/queries'

export default function BlogList() {
  const { loading, error, data } = useQuery(GET_BLOG_POSTS, {
    variables: { limit: 10, offset: 0 },
  })

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div>
      <h1>Blog Posts</h1>
      <div className="blog-grid">
        {data.posts.map(post => (
          <div key={post.id} className="blog-card">
            {post.featuredImage && (
              <img 
                src={post.featuredImage} 
                alt={post.title} 
                className="blog-image" 
              />
            )}
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
            <div className="blog-meta">
              <span>By {post.author.name}</span>
              <span>Category: {post.category.name}</span>
              <span>Published: {new Date(post.publishedAt).toLocaleDateString()}</span>
            </div>
            <a href={`/blog/${post.slug}`}>Read more</a>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Post Details

Fetch and display a single post:

```jsx
// pages/blog/[slug].jsx (Next.js) or similar component
import { useQuery } from '@apollo/client'
import { useRouter } from 'next/router'
import { GET_POST_BY_SLUG } from '../../graphql/queries'

export default function BlogPost() {
  const router = useRouter()
  const { slug } = router.query

  const { loading, error, data } = useQuery(GET_POST_BY_SLUG, {
    variables: { slug },
    // Skip the query if slug is not available yet
    skip: !slug,
  })

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>
  if (!data?.post) return <p>Post not found</p>

  const { post } = data

  return (
    <article>
      <h1>{post.title}</h1>
      
      {post.featuredImage && (
        <img 
          src={post.featuredImage} 
          alt={post.title} 
          className="featured-image" 
        />
      )}
      
      <div className="post-meta">
        <span>By {post.author.name}</span>
        <span>Category: {post.category.name}</span>
        <span>Published: {new Date(post.publishedAt).toLocaleDateString()}</span>
        <div className="tags">
          {post.tags.map(tag => (
            <span key={tag.id} className="tag">
              {tag.name}
            </span>
          ))}
        </div>
      </div>
      
      <div 
        className="post-content"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  )
}
```

### Categories and Tags

Displaying categories and tags for navigation:

```jsx
// components/CategoryList.jsx
import { useQuery } from '@apollo/client'
import { GET_CATEGORIES } from '../graphql/queries'

export default function CategoryList() {
  const { loading, error, data } = useQuery(GET_CATEGORIES)

  if (loading) return <p>Loading categories...</p>
  if (error) return <p>Error loading categories</p>

  return (
    <div className="categories">
      <h3>Categories</h3>
      <ul>
        {data.categories.map(category => (
          <li key={category.id}>
            <a href={`/category/${category.slug}`}>
              {category.name} ({category.postCount})
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Authentication with GraphQL

For operations that require authentication:

```javascript
// Example of a protected mutation
import { gql, useMutation } from '@apollo/client'

const CREATE_COMMENT = gql`
  mutation CreateComment($postId: ID!, $content: String!) {
    createComment(postId: $postId, content: $content) {
      id
      content
      createdAt
      author {
        name
      }
    }
  }
`

function CommentForm({ postId }) {
  const [content, setContent] = useState('')
  const [createComment, { loading, error }] = useMutation(CREATE_COMMENT)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const { data } = await createComment({
        variables: { postId, content }
      })
      
      // Reset form and handle success
      setContent('')
      console.log('Comment created:', data.createComment)
    } catch (err) {
      console.error('Error creating comment:', err)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea 
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Comment'}
      </button>
      {error && <p className="error">{error.message}</p>}
    </form>
  )
}
```

## REST API Integration

### Endpoint Structure

The REST API provides a simpler alternative for fetching public content:

- Base URL: `https://your-backend-domain.com/api/blog`
- Endpoints:
  - `/posts` - List all published posts
  - `/posts/:slug` - Get a specific post by slug
  - `/categories` - List all categories
  - `/tags` - List all tags

### Fetching Blog Posts (REST)

```javascript
// utils/api.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/blog'

export async function fetchPosts(page = 1, limit = 10, category = null) {
  let url = `${API_BASE_URL}/posts?page=${page}&limit=${limit}`
  
  if (category) {
    url += `&category=${category}`
  }
  
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching posts:', error)
    return { posts: [], total: 0 }
  }
}

export async function fetchPostBySlug(slug) {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${slug}`)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Error fetching post with slug ${slug}:`, error)
    return null
  }
}
```

Using the API functions in components:

```jsx
// components/BlogListREST.jsx
import { useState, useEffect } from 'react'
import { fetchPosts } from '../utils/api'

export default function BlogListREST() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    async function loadPosts() {
      try {
        setLoading(true)
        const data = await fetchPosts()
        setPosts(data.posts)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadPosts()
  }, [])
  
  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error}</p>
  
  return (
    <div>
      <h1>Blog Posts</h1>
      <div className="blog-grid">
        {posts.map(post => (
          <div key={post.id} className="blog-card">
            {post.featuredImage && (
              <img 
                src={post.featuredImage} 
                alt={post.title} 
                className="blog-image" 
              />
            )}
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
            <a href={`/blog/${post.slug}`}>Read more</a>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Query Parameters

The REST API supports these query parameters:

- `limit`: Number of posts to return (default: 10)
- `page`: Page number for pagination (default: 1)
- `category`: Filter posts by category slug
- `tag`: Filter posts by tag slug
- `search`: Search posts by content
- `sortBy`: Field to sort by (default: 'publishedAt')
- `sortOrder`: 'asc' or 'desc' (default: 'desc')

### Response Format

The REST API returns JSON responses with this structure:

```json
{
  "posts": [
    {
      "id": "1",
      "title": "Sample Post Title",
      "slug": "sample-post-title",
      "excerpt": "This is a sample excerpt for the post...",
      "content": "<p>Full HTML content of the post...</p>",
      "featuredImage": "https://example.com/image.jpg",
      "publishedAt": "2023-10-15T12:00:00.000Z",
      "isFeatured": true,
      "category": {
        "id": "1",
        "name": "Technology",
        "slug": "technology"
      },
      "author": {
        "id": "1",
        "name": "John Doe",
        "avatar": "https://example.com/avatar.jpg"
      },
      "tags": [
        {
          "id": "1",
          "name": "JavaScript",
          "slug": "javascript"
        }
      ]
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

## Static Site Generation (SSG)

For optimal performance and SEO, use static generation for your blog pages.

### Implementation with Next.js

```javascript
// pages/blog/[slug].js
import { fetchPostBySlug, fetchPosts } from '../../utils/api'

export default function BlogPost({ post }) {
  if (!post) return <p>Post not found</p>
  
  return (
    <article>
      <h1>{post.title}</h1>
      {/* Post content rendering as in previous examples */}
    </article>
  )
}

// Generate static paths for all blog posts
export async function getStaticPaths() {
  const data = await fetchPosts(1, 100) // Get first 100 posts
  
  const paths = data.posts.map(post => ({
    params: { slug: post.slug }
  }))
  
  return {
    paths,
    fallback: 'blocking' // Show 404 for non-existent slugs
  }
}

// Generate static props for each post
export async function getStaticProps({ params }) {
  const post = await fetchPostBySlug(params.slug)
  
  if (!post) {
    return {
      notFound: true
    }
  }
  
  return {
    props: { post },
    revalidate: 3600 // Regenerate page after 1 hour
  }
}
```

### Incremental Static Regeneration

Configure ISR (Incremental Static Regeneration) to update content periodically:

```javascript
// For list pages like index or category pages
export async function getStaticProps({ params }) {
  const categorySlug = params?.slug
  const data = await fetchPosts(1, 12, categorySlug)
  
  return {
    props: {
      posts: data.posts,
      category: categorySlug || null
    },
    revalidate: 600 // Regenerate every 10 minutes
  }
}
```

## CORS Configuration

The backend API is configured to allow cross-origin requests from approved domains. For production, ensure that your frontend domain is added to the API's CORS configuration.

If you're developing locally and encounter CORS issues:

1. Ensure your frontend is served from a supported origin
2. Use a proxy in development (e.g., Next.js API routes)
3. Contact the API administrator to add your development domain to the allowed origins

## Error Handling

Implement robust error handling in your frontend:

```javascript
// Error boundary component
import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Caught error:', error, errorInfo)
    // Optionally log to an error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>We're sorry, but there was an error loading this content.</p>
          <button onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
```

## Performance Optimization

To optimize performance when using the CMS API:

1. **Request only what you need**: With GraphQL, specify only the fields you need
2. **Implement pagination**: Limit the number of posts fetched at once
3. **Cache API responses**: Use Apollo Client's caching capabilities
4. **Use Static Generation**: For content that doesn't change frequently
5. **Implement lazy loading**: For images and other heavy content
6. **Add proper loading states**: Show loading indicators for better UX

## Troubleshooting

Common issues and solutions:

### CORS Errors
- Check that your frontend domain is allowed by the API
- Ensure you're using the correct API endpoint URL

### Authentication Issues
- Verify your Supabase credentials are correct
- Check that your token is being included in requests
- Ensure your user has the necessary permissions

### GraphQL Errors
- Check for typos in your queries
- Ensure you're requesting fields that exist in the schema
- Look for nested field errors (requesting fields on null objects)

### Data Fetching Problems
- Confirm API endpoints are accessible
- Check network requests in browser developer tools
- Verify environment variables are correctly set
- Check for rate limiting issues

## Summary

To integrate your frontend with the OSINT Dashboard CMS API:

1. **Set up environment variables** for API endpoints and authentication
2. **Choose an integration method**:
   - GraphQL with Apollo Client (recommended)
   - REST API with fetch/axios (simpler)
3. **Implement authentication** if working with protected routes
4. **Create components** to fetch and display blog content
5. **Use Static Site Generation** for better performance and SEO
6. **Handle errors robustly** to provide a good user experience
7. **Optimize for performance** using caching and lazy loading

For further assistance or questions about the API integration, contact the development team or refer to the [API Documentation](./New_API_DOCUMENTATION.md) and [GraphQL Integration Guide](./graphql-integration.md). 