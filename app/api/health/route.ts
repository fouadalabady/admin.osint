import { NextResponse } from 'next/server';

/**
 * API route for health checking
 * Used by Vercel and other monitoring services to verify application health
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
  });
}
