import { gql } from '@apollo/client';

// Fragment for consistent tag fields
export const TAG_FIELDS = gql`
  fragment TagFields on Tag {
    id
    name
    slug
    postCount
  }
`;

// Query to get all tags
export const GET_TAGS = gql`
  query GetTags {
    tags {
      ...TagFields
    }
  }
  ${TAG_FIELDS}
`;

// Query to get a single tag by ID
export const GET_TAG = gql`
  query GetTag($id: ID!) {
    tag(id: $id) {
      ...TagFields
    }
  }
  ${TAG_FIELDS}
`;

// Mutation to create a new tag
export const CREATE_TAG = gql`
  mutation CreateTag($input: CreateTagInput!) {
    createTag(input: $input) {
      ...TagFields
    }
  }
  ${TAG_FIELDS}
`;

// Mutation to update a tag
export const UPDATE_TAG = gql`
  mutation UpdateTag($id: ID!, $input: UpdateTagInput!) {
    updateTag(id: $id, input: $input) {
      ...TagFields
    }
  }
  ${TAG_FIELDS}
`;

// Mutation to delete a tag
export const DELETE_TAG = gql`
  mutation DeleteTag($id: ID!) {
    deleteTag(id: $id)
  }
`; 