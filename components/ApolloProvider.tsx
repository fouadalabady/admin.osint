'use client';

import { ApolloProvider as BaseApolloProvider } from '@apollo/client';
import getApolloClient from '@/lib/graphql/client';

export default function ApolloProvider({ children }: { children: React.ReactNode }) {
  // Get the Apollo client instance
  const client = getApolloClient;
  
  return (
    <BaseApolloProvider client={client}>
      {children}
    </BaseApolloProvider>
  );
} 