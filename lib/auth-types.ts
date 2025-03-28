import { DefaultSession } from 'next-auth';

export type UserRole = 'admin' | 'editor' | 'user';

// Extend the default session type
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
    lastActive?: number;
  }

  interface User {
    role: UserRole;
  }
}

// Extend the JWT type
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    lastActive?: number;
  }
}
