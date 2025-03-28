import { createYoga, createSchema } from 'graphql-yoga'
import { typeDefs } from '@/graphql/schema'
import { resolvers } from '@/graphql/resolvers'

const { handleRequest } = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers
  }),
  // Yoga specific options
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response }
})

export { handleRequest as GET, handleRequest as POST } 