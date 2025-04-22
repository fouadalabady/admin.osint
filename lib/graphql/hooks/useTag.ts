import { useMutation, useQuery } from '@apollo/client';
import {
  GET_TAGS,
  CREATE_TAG,
  DELETE_TAG
} from '../operations/tags';
import { Tag } from '@/types/blog';

export interface CreateTagInput {
  name: string;
  slug?: string;
}

export const useGetTags = () => {
  return useQuery(GET_TAGS);
};

export const useCreateTag = () => {
  return useMutation(CREATE_TAG, {
    refetchQueries: [{ query: GET_TAGS }]
  });
};

export const useDeleteTag = () => {
  return useMutation(DELETE_TAG, {
    refetchQueries: [{ query: GET_TAGS }]
  });
};

export const deleteTagMutation = async (
  deleteTag: ReturnType<typeof useDeleteTag>[0],
  id: string
) => {
  try {
    const { data } = await deleteTag({
      variables: { id }
    });
    return { data: data?.deleteTag, error: null };
  } catch (error) {
    console.error('Error deleting tag:', error);
    return { 
      data: null, 
      error: error instanceof Error 
        ? error.message 
        : 'Failed to delete tag' 
    };
  }
}; 