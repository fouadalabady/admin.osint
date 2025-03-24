import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Define which paths need authentication
  const protectedPaths = ['/dashboard', '/admin'];
  const isProtectedPath = protectedPaths.some(pp => path.startsWith(pp));
  
  // For protected paths, check for authentication
  if (isProtectedPath) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // If not authenticated, redirect to login
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check for session expiration (8 hours)
    const lastActive = token.lastActive as number || 0;
    const now = Date.now();
    const inactiveTime = now - lastActive;
    
    if (inactiveTime > 8 * 60 * 60 * 1000) { // 8 hours
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('timeout', '1');
      loginUrl.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // For login path, if already authenticated, redirect to dashboard
  if (path.startsWith('/auth/login')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/auth/login'],
}; 