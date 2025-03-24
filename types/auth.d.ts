import 'next-auth';

// Define available user roles in the system 
export type UserRole = 'super_admin' | 'admin' | 'editor' | 'user';

// Extend the Session types from next-auth to include our custom fields
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
    };
    // Add lastActive timestamp to session
    lastActive?: number;
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: UserRole;
  }
}

// Database error type for consistent error handling
export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  [key: string]: any;
} 