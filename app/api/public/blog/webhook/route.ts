import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

/**
 * POST endpoint for blog content update webhooks
 * This endpoint will be called whenever blog content changes in the dashboard
 * The headless site can subscribe to these webhooks to get real-time updates
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const headersList = headers();
    const webhookSecret = headersList.get('x-webhook-secret');
    
    if (webhookSecret !== process.env.BLOG_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { event, resource, resourceId } = body;
    
    // Validate required fields
    if (!event || !resource) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }
    
    // Process webhook based on event type
    switch (event) {
      case 'post.published':
      case 'post.updated':
      case 'post.deleted':
      case 'category.updated':
      case 'tag.updated':
        // Log the webhook event for audit
        console.log(`Webhook received: ${event} for ${resource} ${resourceId || ''}`);
        
        // In a real implementation, you could store this event in a database
        // or trigger a notification to connected clients
        
        return NextResponse.json({ 
          success: true,
          message: 'Webhook processed successfully',
          event,
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({ error: 'Unsupported event type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for subscribing to WebSocket updates (for testing only)
 * In production, you'd use a proper WebSocket server
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'WebSocket subscription endpoint (not implemented)',
    documentation: 'Use Server-Sent Events or WebSockets for real-time updates',
    suggestion: 'For production use, implement proper WebSocket server or use Supabase Realtime'
  });
} 