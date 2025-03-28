import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { nanoid } from 'nanoid'

type UserRole = 'admin' | 'editor' | 'super_admin'

// Define public routes that don't need authentication
const publicRoutes = ['/auth/login', '/auth/register', '/', '/about', '/contact']

// Define protected routes and their required roles
const protectedRoutes = {
  '/dashboard': ['admin', 'editor', 'super_admin'],
  '/admin': ['admin', 'super_admin'],
  '/blog': ['admin', 'editor', 'super_admin']
} as Record<string, UserRole[]>

// List of paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/api/dashboard',
  '/api/admin',
]

// Paths that are only accessible by specific roles
const adminPaths = [
  '/dashboard/users',
  '/dashboard/settings/global',
  '/api/admin',
]

const superAdminPaths = [
  '/dashboard/database',
  '/api/admin/database',
]

// Check if the path starts with any of the protected paths
const isProtectedPath = (path: string) => {
  return protectedPaths.some((prefix) => path.startsWith(prefix))
}

// Check if the path is restricted to admins
const isAdminPath = (path: string) => {
  return adminPaths.some((prefix) => path.startsWith(prefix))
}

// Check if the path is restricted to super admins
const isSuperAdminPath = (path: string) => {
  return superAdminPaths.some((prefix) => path.startsWith(prefix))
}

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url)
  
  // Create a response object that we'll modify and return
  const response = NextResponse.next()

  // Skip middleware for public assets and API routes
  if (
    requestUrl.pathname.startsWith('/_next') ||
    requestUrl.pathname.startsWith('/api') ||
    requestUrl.pathname.startsWith('/static') ||
    publicRoutes.some(route => requestUrl.pathname === route)
  ) {
    return response
  }

  try {
    // Get the session token using NextAuth
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    console.log('Auth check:', token ? `User: ${token.email}` : 'No session')

    // Check if the current path requires protection
    const isProtectedRoute = Object.keys(protectedRoutes).some(route => 
      requestUrl.pathname.startsWith(route)
    )

    // If user is not authenticated and tries to access protected route
    if (isProtectedRoute && !token) {
      console.log('Redirecting to login - User not authenticated')
      const loginUrl = new URL('/auth/login', requestUrl)
      loginUrl.searchParams.set('redirectTo', requestUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // If user is authenticated
    if (token) {
      console.log('User authenticated:', token.email)
      
      // Handle login page access when already authenticated
      if (requestUrl.pathname === '/auth/login') {
        const redirectTo = requestUrl.searchParams.get('redirectTo')
        if (redirectTo) {
          const redirectUrl = new URL(redirectTo, requestUrl.origin)
          if (redirectUrl.origin === requestUrl.origin) {
            return NextResponse.redirect(redirectUrl)
          }
        }
        return NextResponse.redirect(new URL('/dashboard', requestUrl))
      }

      // For protected routes, verify role permissions
      if (isProtectedRoute) {
        const userRole = token.role as UserRole

        console.log('Role check - User role:', userRole)

        if (!userRole) {
          console.error('Error: User has no role assigned')
          return NextResponse.redirect(new URL('/', requestUrl))
        }

        const requiredRoles = Object.entries(protectedRoutes).find(([route]) => 
          requestUrl.pathname.startsWith(route)
        )?.[1] || []

        if (!requiredRoles.includes(userRole)) {
          console.log(`Access denied - User role: ${userRole}, Required roles:`, requiredRoles)
          return NextResponse.redirect(new URL('/', requestUrl))
        }

        // Add user info to headers
        response.headers.set('x-user-role', userRole)
        response.headers.set('x-user-id', token.sub as string)
        response.headers.set('x-user-email', token.email as string)
      }
    }

    // Add Content Security Policy headers in production
    if (process.env.NODE_ENV === 'production') {
      // Generate a random nonce
      const nonce = Buffer.from(nanoid(32)).toString('base64')

      response.headers.set(
        'Content-Security-Policy',
        `default-src 'self'; 
        script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:; 
        style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com; 
        img-src 'self' data: https:; 
        font-src 'self' https://fonts.gstatic.com data:; 
        connect-src 'self' https://*.supabase.co;
        frame-ancestors 'none';
        base-uri 'self';
        form-action 'self';`
      )

      // Add other security headers
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

      response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    if (Object.keys(protectedRoutes).some(route => requestUrl.pathname.startsWith(route))) {
      const loginUrl = new URL('/auth/login', requestUrl)
      loginUrl.searchParams.set('redirectTo', requestUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ]
}