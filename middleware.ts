import { NextRequestWithAuth, withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    const { pathname } = request.nextUrl;
    const { token } = request.nextauth;

    // Check for admin routes
    if (pathname.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/auth", request.url));
    }

    // Check for editor routes
    if (pathname.startsWith("/editor") && 
        token?.role !== "admin" && 
        token?.role !== "editor") {
      return NextResponse.redirect(new URL("/auth", request.url));
    }

    // Allow all other authenticated routes
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Specify which paths should be protected by the middleware
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/editor/:path*",
    "/profile/:path*",
  ],
}; 