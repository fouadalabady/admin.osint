import NextAuth from 'next-auth';
import { authOptions } from '../options';

// Add explicit config to avoid build-time vs runtime detection issues
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
