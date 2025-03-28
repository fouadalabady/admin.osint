import { DefaultSession } from "next-auth";

export type UserRole = "user" | "admin" | "super_admin" | "editor" | "contributor";

// Extend the built-in session types
declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: UserRole;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
    } & DefaultSession["user"];
  }
} 