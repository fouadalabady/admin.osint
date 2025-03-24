import { NextResponse } from 'next/server';
import pkg from '../../../package.json';

// Simple health check endpoint for monitoring
export async function GET() {
  const healthInfo = {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
    version: pkg.version || '0.1.0',
    environment: process.env.NODE_ENV || 'development'
  };

  return NextResponse.json(healthInfo, { status: 200 });
} 