import { gql } from '@apollo/client';

// Fragment for consistent blog post fields
export const BLOG_POST_FIELDS = gql`
  fragment BlogPostFields on blog_posts {
    id
    title
    slug
    content
    excerpt
    featured_image
    seo_description
    seo_title
    seo_keywords
    status
    direction
    author_id
    category_id
    is_featured
    published_at
    created_at
    updated_at
  }
`;

// Query to get a single blog post by slug
export const GET_BLOG_POST_BY_SLUG = gql`
  query GetBlogPostBySlug($slug: String!) {
    blog_postsCollection(filter: {slug: {eq: $slug}}, first: 1) {
      edges {
        node {
          ...BlogPostFields
        }
      }
    }
  }
  ${BLOG_POST_FIELDS}
`;

// Query to get all blog posts with pagination
export const GET_BLOG_POSTS = gql`
  query GetBlogPosts($first: Int!, $offset: Int!, $filter: blog_postsFilter, $orderBy: [blog_postsOrderBy!]) {
    blog_postsCollection(first: $first, offset: $offset, filter: $filter, orderBy: $orderBy) {
      edges {
        node {
          ...BlogPostFields
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
    # Get all posts to manually count them
    allPosts: blog_postsCollection(filter: $filter) {
      edges {
        node {
          id
        }
      }
    }
  }
  ${BLOG_POST_FIELDS}
`;

// Mutation to create a new blog post
export const CREATE_BLOG_POST = gql`
  mutation CreateBlogPost($objects: [blog_postsInsertInput!]!) {
    insertIntoblog_postsCollection(objects: $objects) {
      records {
        ...BlogPostFields
      }
    }
  }
  ${BLOG_POST_FIELDS}
`;

// Mutation to update an existing blog post
export const UPDATE_BLOG_POST = gql`
  mutation UpdateBlogPost($filter: blog_postsFilter!, $set: blog_postsUpdateInput!) {
    updateblog_postsCollection(filter: $filter, set: $set) {
      records {
        ...BlogPostFields
      }
    }
  }
  ${BLOG_POST_FIELDS}
`;

// Mutation to delete a blog post
export const DELETE_BLOG_POST = gql`
  mutation DeleteBlogPost($filter: blog_postsFilter!) {
    deleteFromblog_postsCollection(filter: $filter) {
      records {
        id
      }
    }
  }
`; 