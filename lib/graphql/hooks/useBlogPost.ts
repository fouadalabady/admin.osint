'use client';

import { useMutation, useQuery } from '@apollo/client';
import { 
  GET_BLOG_POST_BY_SLUG, 
  GET_BLOG_POSTS, 
  CREATE_BLOG_POST, 
  UPDATE_BLOG_POST, 
  DELETE_BLOG_POST 
} from '../operations/blog';
import { BlogPost, BlogPostInput } from '@/types/blog';

export const useGetBlogPostBySlug = (slug: string) => {
  return useQuery(GET_BLOG_POST_BY_SLUG, {
    variables: { slug },
    skip: !slug,
  });
};

export const useGetBlogPosts = (
  page: number = 1, 
  pageSize: number = 10,
  filter = {},
  orderBy: Array<Record<string, string>> = []
) => {
  const offset = (page - 1) * pageSize;
  
  return useQuery(GET_BLOG_POSTS, {
    variables: {
      first: pageSize,
      offset,
      filter,
      orderBy
    }
  });
};

export const useCreateBlogPost = () => {
  return useMutation(CREATE_BLOG_POST);
};

export const useUpdateBlogPost = () => {
  return useMutation(UPDATE_BLOG_POST);
};

export const useDeleteBlogPost = () => {
  return useMutation(DELETE_BLOG_POST);
};

// Helper function to create a new blog post
export const createBlogPostMutation = async (
  createPost: ReturnType<typeof useCreateBlogPost>[0],
  input: BlogPostInput
) => {
  try {
    const { data } = await createPost({
      variables: {
        objects: [input]
      }
    });
    return { data: data?.insertIntoblog_postsCollection?.records[0], error: null };
  } catch (error) {
    console.error('Error creating blog post:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create blog post' };
  }
};

// Helper function to update an existing blog post
export const updateBlogPostMutation = async (
  updatePost: ReturnType<typeof useUpdateBlogPost>[0],
  id: string,
  input: Partial<BlogPostInput>
) => {
  try {
    const { data } = await updatePost({
      variables: {
        filter: { id: { eq: id } },
        set: input
      }
    });
    return { data: data?.updateblog_postsCollection?.records[0], error: null };
  } catch (error) {
    console.error('Error updating blog post:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update blog post' };
  }
};

// Helper function to delete a blog post
export const deleteBlogPostMutation = async (
  deletePost: ReturnType<typeof useDeleteBlogPost>[0],
  id: string
) => {
  try {
    const { data } = await deletePost({
      variables: {
        filter: { id: { eq: id } }
      }
    });
    return { data: data?.deleteFromblog_postsCollection?.records[0], error: null };
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Failed to delete blog post' };
  }
}; 