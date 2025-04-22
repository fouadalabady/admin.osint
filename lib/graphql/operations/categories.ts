import { gql } from '@apollo/client';

// Fragment for consistent category fields
export const CATEGORY_FIELDS = gql`
  fragment CategoryFields on Category {
    id
    name
    slug
    description
    direction
    postCount
  }
`;

// Query to get all categories
export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      ...CategoryFields
    }
  }
  ${CATEGORY_FIELDS}
`;

// Mutation to create a new category
export const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      ...CategoryFields
    }
  }
  ${CATEGORY_FIELDS}
`;

// Mutation to update an existing category
export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: ID!, $input: UpdateCategoryInput!) {
    updateCategory(id: $id, input: $input) {
      ...CategoryFields
    }
  }
  ${CATEGORY_FIELDS}
`;

// Mutation to delete a category
export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id)
  }
`; 