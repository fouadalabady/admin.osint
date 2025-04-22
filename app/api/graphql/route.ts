import { createYoga, createSchema } from 'graphql-yoga'
import { typeDefs } from '@/graphql/schema'
import { resolvers } from '@/graphql/resolvers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const isDev = process.env.NODE_ENV === 'development'

// Create a GraphQL Yoga instance with improved configuration
const { handleRequest } = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers
  }),
  // GraphQL Yoga options
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
  
  // Disable schema caching in development mode for easier debugging
  schemaOptions: {
    disableCache: isDev,
  },
  
  // Add context with user from session
  context: async ({ request }) => {
    try {
      // Get the session using NextAuth
      const session = await getServerSession(authOptions)
      
      // Return the user from the session
      return {
        user: session?.user || null
      }
    } catch (error) {
      console.error('Error creating GraphQL context:', error)
      return { user: null }
    }
  },
  
  // Error masking is disabled in development for better debugging
  maskedErrors: !isDev,
  
  // Custom error formatter
  errorFormatter: ({ request, error }) => {
    // Log errors in development
    if (isDev) {
      console.error('GraphQL error:', error)
    } else {
      // In production, log but don't expose sensitive details
      console.error('GraphQL error:', error.message)
    }
    
    // Return formatted error
    return {
      message: error.message,
      locations: error.locations,
      path: error.path,
      extensions: {
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        // Only include stack trace in development
        ...(isDev ? { stacktrace: error.extensions?.originalError?.stack } : {})
      }
    }
  },
  
  // Add CORS headers
  cors: {
    origin: '*',
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
})

// Export the handler
export { handleRequest as GET, handleRequest as POST } 