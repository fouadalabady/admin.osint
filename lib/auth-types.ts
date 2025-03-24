import { type UserRole } from '@/types/auth';

// Extend the default session type
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
    }
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
  }
}
