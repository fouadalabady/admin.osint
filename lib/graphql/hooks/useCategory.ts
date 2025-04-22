import { useMutation, useQuery } from '@apollo/client';
import {
  GET_CATEGORIES,
  CREATE_CATEGORY,
  UPDATE_CATEGORY,
  DELETE_CATEGORY
} from '../operations/categories';

export const useGetCategories = () => {
  return useQuery(GET_CATEGORIES);
};

export const useCreateCategory = () => {
  return useMutation(CREATE_CATEGORY, {
    refetchQueries: [{ query: GET_CATEGORIES }]
  });
};

export const useUpdateCategory = () => {
  return useMutation(UPDATE_CATEGORY, {
    refetchQueries: [{ query: GET_CATEGORIES }]
  });
};

export const useDeleteCategory = () => {
  return useMutation(DELETE_CATEGORY, {
    refetchQueries: [{ query: GET_CATEGORIES }]
  });
};

export const deleteCategoryMutation = async (
  deleteCategory: ReturnType<typeof useDeleteCategory>[0],
  id: string
) => {
  try {
    const { data } = await deleteCategory({
      variables: { id }
    });
    return { data: data?.deleteCategory, error: null };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { 
      data: null, 
      error: error instanceof Error 
        ? error.message 
        : 'Failed to delete category' 
    };
  }
}; 