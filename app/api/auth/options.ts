import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/supabase';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password');
        }

        try {
          const {
            data: { user },
            error,
          } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error) throw error;
          if (!user) return null;

          // Verify if user is active (not pending or rejected)
          if (user.user_metadata?.status !== 'active') {
            if (user.user_metadata?.status === 'pending') {
              throw new Error(
                'Your account is pending approval. Please check your email for verification instructions.'
              );
            } else if (user.user_metadata?.status === 'rejected') {
              throw new Error(
                'Your account registration has been rejected. Please contact support for more information.'
              );
            } else {
              throw new Error('Your account is not active. Please contact support.');
            }
          }

          console.log('Login successful for user:', user.email);

          return {
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role || 'user',
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Initial sign in
        token.role = user.role;
        token.lastActive = Date.now();
        console.log('JWT callback - user signed in:', user.email);
      }

      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.sub;

        // Add lastActive to session for client-side awareness
        session.lastActive = token.lastActive;

        console.log('Session callback - user session updated:', session.user.email);
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
    signOut: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
