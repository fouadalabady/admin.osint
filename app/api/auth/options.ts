import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/lib/auth-types';

interface CustomUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<CustomUser | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password');
        }

        try {
          console.log("Auth attempt for:", credentials.email);
          
          const {
            data: { user },
            error,
          } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error) throw error;
          if (!user) return null;

          console.log("Supabase auth successful for user:", user.id);

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

          // Assign role based on email for admin
          let role: UserRole = "user";
          if (credentials.email === "admin@osint.sa") {
            role = "admin";
          } else {
            // Map role from user metadata to one of the allowed roles
            const metadataRole = user.user_metadata?.role as string;
            // Map roles to valid UserRole values
            if (metadataRole === "super_admin" || metadataRole === "admin") {
              role = "admin";
            } else if (metadataRole === "editor" || metadataRole === "contributor") {
              role = "editor";
            } else {
              role = "user";
            }
          }
          
          console.log("Assigned role:", role);
          console.log('Login successful for user:', user.email);

          return {
            id: user.id,
            email: user.email || "",
            name: user.user_metadata?.name || "",
            role: role
          };
        } catch (error) {
          console.error('Auth error:', error);
          if (error instanceof Error) {
            throw error;
          }
          throw new Error("Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Initial sign in
        console.log("JWT callback with user:", user.email);
        
        // Ensure role is a valid UserRole
        const validRole = (user.role as string) === 'admin' || 
                          (user.role as string) === 'editor' || 
                          (user.role as string) === 'user' ? 
                          (user.role as UserRole) : 'user';
        
        token.role = validRole;
        token.id = user.id;
        token.email = user.email;
        token.name = user.name ?? null;
        token.lastActive = Date.now();
      } else {
        token.lastActive = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      console.log("Session callback for user:", token.email);
      if (token && session.user) {
        session.user.role = token.role as UserRole;
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string | null;
        
        // Add lastActive to session for client-side awareness
        session.lastActive = token.lastActive;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
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
