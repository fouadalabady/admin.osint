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

// Use a custom interface that matches the resolver's expected format
export interface BlogPostInputForResolver {
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  status?: string;
  direction?: string;
  category_id?: string;
  tag_ids?: string[];
  is_featured?: boolean;
  published_at?: string;
}

export const useGetBlogPostBySlug = (slug: string) => {
  return useQuery(GET_BLOG_POST_BY_SLUG, {
    variables: { slug },
    skip: !slug,
  });
};

export const useGetBlogPosts = (
  page: number = 1, 
  limit: number = 10,
  status?: string,
  categoryId?: string,
  tagId?: string,
  authorId?: string,
  direction?: string,
  featured?: boolean,
  search?: string
) => {
  return useQuery(GET_BLOG_POSTS, {
    variables: {
      page,
      limit,
      status,
      categoryId,
      tagId,
      authorId,
      direction,
      featured,
      search
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
  input: BlogPostInputForResolver
) => {
  try {
    const { data } = await createPost({
      variables: {
        input
      }
    });
    return { data: data?.createPost, error: null };
  } catch (error) {
    console.error('Error creating blog post:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create blog post' };
  }
};

// Helper function to update an existing blog post
export const updateBlogPostMutation = async (
  updatePost: ReturnType<typeof useUpdateBlogPost>[0],
  id: string,
  input: Partial<BlogPostInputForResolver>
) => {
  try {
    const { data } = await updatePost({
      variables: {
        id,
        input
      }
    });
    return { data: data?.updatePost, error: null };
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
        id
      }
    });
    return { data: data?.deletePost, error: null };
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Failed to delete blog post' };
  }
}; 