import { NextAuthOptions } from "next-auth";
import { createClient } from "@/lib/supabase/server";
import Credentials from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import { UserRole } from "@/types/auth";

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        // Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error || !data.user) {
          return null;
        }

        // Fetch additional user data from your database if needed
        const { data: userProfile } = await supabase
          .from('users')
          .select('id, name, role, avatar_url')
          .eq('id', data.user.id)
          .single();

        const role = userProfile?.role as UserRole || 'user';
        
        return {
          id: data.user.id,
          email: data.user.email,
          name: userProfile?.name || data.user.email?.split('@')[0] || 'User',
          role: role,
          image: userProfile?.avatar_url || null
        };
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        return {
          ...token,
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          name: token.name,
          email: token.email,
          role: token.role as UserRole,
          image: token.image as string | null,
        };
      }
      return session;
    },
  },
}; 