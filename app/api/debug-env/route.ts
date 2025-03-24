import { NextResponse } from 'next/server';

// This is a debugging endpoint only available in development mode
export async function GET() {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'This endpoint is only available in development mode' }, { status: 403 });
  }

  // Safe environment variables to expose (no secrets)
  const safeEnvVars = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    RUNTIME: process.env.NEXT_RUNTIME,
    // Add masked versions of sensitive variables (don't expose full values)
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
      `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 5)}...` : undefined,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
      `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5)}...` : undefined,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set but hidden' : undefined,
    // Add additional safe environment variables as needed
  };

  return NextResponse.json({
    message: 'Environment variables (safe values only)',
    environment: safeEnvVars,
  });
} 