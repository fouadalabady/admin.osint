import { gql } from '@apollo/client';

// Fragment for consistent blog post fields
export const BLOG_POST_FIELDS = gql`
  fragment BlogPostFields on Post {
    id
    title
    slug
    content
    excerpt
    featuredImage
    seoDescription
    seoTitle
    seoKeywords
    status
    direction
    isFeatured
    publishedAt
    createdAt
    updatedAt
    author {
      id
      name
    }
    category {
      id
      name
    }
    tags {
      id
      name
    }
  }
`;

// Query to get a single blog post by slug
export const GET_BLOG_POST_BY_SLUG = gql`
  query GetBlogPostBySlug($slug: String!) {
    post(slug: $slug) {
      ...BlogPostFields
    }
  }
  ${BLOG_POST_FIELDS}
`;

// Query to get all blog posts with pagination
export const GET_BLOG_POSTS = gql`
  query GetBlogPosts(
    $page: Int, 
    $limit: Int, 
    $status: PostStatus, 
    $categoryId: ID, 
    $tagId: ID,
    $authorId: ID,
    $direction: Direction,
    $featured: Boolean,
    $search: String
  ) {
    posts(
      page: $page, 
      limit: $limit, 
      status: $status, 
      categoryId: $categoryId,
      tagId: $tagId,
      authorId: $authorId,
      direction: $direction,
      featured: $featured,
      search: $search
    ) {
      edges {
        node {
          ...BlogPostFields
        }
        cursor
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
  ${BLOG_POST_FIELDS}
`;

// Mutation to create a new blog post
export const CREATE_BLOG_POST = gql`
  mutation CreateBlogPost($input: CreatePostInput!) {
    createPost(input: $input) {
      ...BlogPostFields
    }
  }
  ${BLOG_POST_FIELDS}
`;

// Mutation to update an existing blog post
export const UPDATE_BLOG_POST = gql`
  mutation UpdateBlogPost($id: ID!, $input: UpdatePostInput!) {
    updatePost(id: $id, input: $input) {
      ...BlogPostFields
    }
  }
  ${BLOG_POST_FIELDS}
`;

// Mutation to delete a blog post
export const DELETE_BLOG_POST = gql`
  mutation DeleteBlogPost($id: ID!) {
    deletePost(id: $id)
  }
`;

// Get editable posts for the current user
export const GET_EDITABLE_POSTS = gql`
  query GetEditablePosts($page: Int, $limit: Int) {
    editablePosts(page: $page, limit: $limit) {
      edges {
        node {
          id
          title
          slug
          excerpt
          featuredImage
          status
          publishedAt
          createdAt
          author {
            id
            name
          }
          category {
            id
            name
          }
          tags {
            id
            name
          }
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
`;

// Get non-editable posts (posts the current user cannot edit)
export const GET_NON_EDITABLE_POSTS = gql`
  query GetNonEditablePosts($page: Int, $limit: Int) {
    nonEditablePosts(page: $page, limit: $limit) {
      edges {
        node {
          id
          title
          slug
          excerpt
          featuredImage
          status
          publishedAt
          createdAt
          author {
            id
            name
          }
          category {
            id
            name
          }
          tags {
            id
            name
          }
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
`;

// Add or update the GET_POST_BY_SLUG query
export const GET_POST_BY_SLUG = gql`
  query GetPostBySlug($slug: String!) {
    post(slug: $slug) {
      id
      title
      slug
      excerpt
      content
      featuredImage
      status
      isFeatured
      viewCount
      publishedAt
      createdAt
      updatedAt
      seoTitle
      seoDescription
      seoKeywords
      direction
      author {
        id
        name
        email
      }
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
    }
  }
`; 