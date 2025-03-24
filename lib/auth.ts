/**
 * Auth configuration for Next-Auth
 * This file exports the auth options from the original location for easier imports
 * with fallback options in case the import fails during build time
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { z } from 'zod';
import { Database } from './supabase/types';
import { DatabaseUser } from './types/database';

type DbUser = Database['public']['Tables']['users']['Row'];

// Define custom user type that matches our database schema
interface CustomUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: DatabaseUser['role'];
}

// Extend next-auth types
declare module 'next-auth' {
  interface User extends CustomUser {}
  
  interface Session {
    expires: string;
    // @ts-expect-error
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: DatabaseUser['role'];
    }
  }

  interface JWT {
    role?: DatabaseUser['role'];
    id?: string;
  }
}

// Validate credentials schema
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Export auth options
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'Enter your email',
        },
        password: {
          label: 'Password',
          type: 'password',
          placeholder: 'Enter your password',
        },
      },
      async authorize(credentials, req) {
        try {
          // Validate credentials
          const { email, password } = credentialsSchema.parse(credentials);

          // Get Supabase client
          const supabase = createServerSupabaseClient();

          // Sign in with credentials
          const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError || !authData.user) {
            throw new Error(signInError?.message || 'Invalid credentials');
          }

          // Get user data from our users table
          const { data, error: userError } = await supabase
            .from('users')
            .select()
            .match({ id: authData.user.id });

          if (userError || !data || data.length === 0) {
            throw new Error('User not found in database');
          }

          // Type guard to ensure we have a valid user
          const dbUser = data[0] as unknown as DbUser;
          if (!dbUser?.id || !dbUser?.role) {
            throw new Error('Invalid user data');
          }

          // Return user object that matches our CustomUser type
          return {
            id: authData.user.id,
            email: authData.user.email ?? '',
            name: dbUser.user_metadata?.name ?? null,
            image: dbUser.user_metadata?.avatar_url ?? null,
            role: dbUser.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as DatabaseUser['role'];
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
}; 