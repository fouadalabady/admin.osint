'use client';

import { ApolloClient, InMemoryCache, createHttpLink, from, NormalizedCacheObject } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Use a function to create the client to avoid shared instances between requests
let clientInstance: ApolloClient<NormalizedCacheObject> | null = null;

function createApolloClient() {
  // Create an HTTP link with our custom GraphQL endpoint
  const httpLink = createHttpLink({
    uri: '/api/graphql',
  });

  // Add authentication headers to include the API key for every request
  const authLink = setContext((_, { headers }) => {
    // Safely access environment variables
    const supabaseAnonKey = typeof window !== 'undefined' 
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      : '';

    return {
      headers: {
        ...headers,
        // We still include Supabase authentication since our GraphQL resolvers use Supabase
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    };
  });

  // Create Apollo client with our configured links and cache settings
  return new ApolloClient({
    link: from([authLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
    ssrMode: typeof window === 'undefined',
  });
}

// Get the Apollo Client instance (create if it doesn't exist)
function getApolloClient() {
  // For SSR, always create a new client
  if (typeof window === 'undefined') {
    return createApolloClient();
  }

  // For client-side, reuse the client instance
  if (!clientInstance) {
    clientInstance = createApolloClient();
  }

  return clientInstance;
}

export default getApolloClient(); 