import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/types/auth';

interface CustomUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<CustomUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Authenticate with Supabase Auth
          const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (signInError || !user) {
            console.error("Sign in error:", signInError);
            return null;
          }

          // Get user details including role
          const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

          if (userError || !users) {
            console.error("Error fetching user details:", userError);
            return null;
          }

          const userDetails = users.find(u => u.email === credentials.email);

          if (!userDetails) {
            console.error("User not found");
            return null;
          }

          // Return custom user object
          return {
            id: userDetails.id,
            email: userDetails.email || "",
            name: userDetails.user_metadata?.name || "",
            role: (userDetails.user_metadata?.role as UserRole) || "user"
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as UserRole;
      }
      return session;
    }
  }
};
