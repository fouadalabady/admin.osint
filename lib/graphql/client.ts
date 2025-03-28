'use client';

import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Create an HTTP link with the Supabase GraphQL endpoint
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_SUPABASE_GRAPHQL_URL || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`,
});

// Add authentication headers to include the API key for every request
const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
    },
  };
});

// Create Apollo client with our configured links and cache settings
const client = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

export default client; 