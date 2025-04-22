import { gql } from 'graphql-tag'

export const typeDefs = gql`
  type Query {
    posts(
      page: Int
      limit: Int
      status: PostStatus
      categoryId: ID
      tagId: ID
      authorId: ID
      direction: Direction
      featured: Boolean
      search: String
    ): PostConnection!
    post(slug: String!): Post
    categories: [Category!]!
    tags: [Tag!]!
    media(type: MediaType, page: Int, limit: Int): MediaConnection!
    
    # New queries for editable and non-editable posts
    editablePosts(page: Int, limit: Int): PostConnection!
    nonEditablePosts(page: Int, limit: Int): PostConnection!
  }

  type Mutation {
    createPost(input: CreatePostInput!): Post!
    updatePost(id: ID!, input: UpdatePostInput!): Post!
    deletePost(id: ID!): Boolean!
    
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: ID!, input: UpdateCategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!
    
    createTag(input: CreateTagInput!): Tag!
    deleteTag(id: ID!): Boolean!
    
    uploadMedia(file: Upload!, input: UploadMediaInput!): Media!
    deleteMedia(id: ID!): Boolean!
    
    createComment(postId: ID!, input: CreateCommentInput!): Comment!
    deleteComment(id: ID!): Boolean!
  }

  type Post {
    id: ID!
    title: String!
    slug: String!
    excerpt: String
    content: String
    featuredImage: String
    author: User
    category: Category
    tags: [Tag!]!
    status: PostStatus!
    isFeatured: Boolean!
    viewCount: Int!
    publishedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    seoTitle: String
    seoDescription: String
    seoKeywords: String
    direction: Direction!
    comments: [Comment!]!
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    parentId: ID
    direction: Direction!
    posts: [Post!]!
  }

  type Tag {
    id: ID!
    name: String!
    slug: String!
    posts: [Post!]!
  }

  type Media {
    id: ID!
    url: String!
    altText: String
    caption: String
    type: MediaType!
    createdAt: DateTime!
  }

  type Comment {
    id: ID!
    content: String!
    post: Post!
    author: User
    parentId: ID
    authorName: String
    authorEmail: String
    createdAt: DateTime!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    role: UserRole!
    posts: [Post!]!
    comments: [Comment!]!
  }

  type PostConnection {
    edges: [PostEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PostEdge {
    node: Post!
    cursor: String!
  }

  type MediaConnection {
    edges: [MediaEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type MediaEdge {
    node: Media!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  input CreatePostInput {
    title: String!
    content: String!
    excerpt: String
    featured_image: String
    category_id: ID
    tag_ids: [ID!]
    status: PostStatus = draft
    is_featured: Boolean = false
    published_at: DateTime
    seo_title: String
    seo_description: String
    seo_keywords: String
    direction: Direction = ltr
  }

  input UpdatePostInput {
    title: String
    content: String
    excerpt: String
    featured_image: String
    category_id: ID
    tag_ids: [ID!]
    status: PostStatus
    is_featured: Boolean
    published_at: DateTime
    seo_title: String
    seo_description: String
    seo_keywords: String
    direction: Direction
  }

  input CreateCategoryInput {
    name: String!
    slug: String!
    description: String
    parentId: ID
    direction: Direction = ltr
  }

  input UpdateCategoryInput {
    name: String
    slug: String
    description: String
    parentId: ID
    direction: Direction
  }

  input CreateTagInput {
    name: String!
    slug: String!
  }

  input UploadMediaInput {
    altText: String
    caption: String
    type: MediaType!
  }

  input CreateCommentInput {
    content: String!
    parentId: ID
    authorName: String
    authorEmail: String
  }

  enum PostStatus {
    draft
    published
    archived
  }

  enum Direction {
    ltr
    rtl
  }

  enum MediaType {
    image
    video
    document
  }

  enum UserRole {
    admin
    editor
    author
    contributor
  }

  scalar DateTime
  scalar Upload
` 