import { User } from "next-auth";

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'user';

export interface CustomUser extends User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  emailVerified: Date | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
    };
    lastActive?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: UserRole;
  }
} 