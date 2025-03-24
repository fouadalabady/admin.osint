/**
 * Auth configuration for Next-Auth
 * This file exports the auth options from the original location for easier imports
 * with fallback options in case the import fails during build time
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";

let authOptions: NextAuthOptions;

try {
  // Try to import from the original location
  const { authOptions: originalAuthOptions } = require("@/app/api/auth/options");
  authOptions = originalAuthOptions;
} catch (error) {
  // Fallback options if import fails
  console.warn("Failed to import original authOptions, using fallback:", error);
  
  authOptions = {
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Please enter your email and password');
          }

          try {
            const { data: { user }, error } = await supabase.auth.signInWithPassword({
              email: credentials.email,
              password: credentials.password,
            });

            if (error) throw error;
            if (!user) return null;

            return {
              id: user.id,
              email: user.email,
              role: user.user_metadata?.role || 'user',
            };
          } catch (error) {
            console.error('Auth error:', error);
            throw error;
          }
        }
      })
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.role = user.role;
          token.lastActive = Date.now();
        }
        return token;
      },
      async session({ session, token }) {
        if (session?.user) {
          session.user.role = token.role;
          session.user.id = token.sub;
          session.lastActive = token.lastActive;
        }
        return session;
      }
    },
    pages: {
      signIn: '/auth/login',
      error: '/auth/login',
      signOut: '/',
    },
    session: {
      strategy: "jwt",
      maxAge: 24 * 60 * 60, // 24 hours
    },
    debug: process.env.NODE_ENV === 'development',
  };
}

export { authOptions }; 