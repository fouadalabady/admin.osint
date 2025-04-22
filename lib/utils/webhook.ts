/**
 * Utility for triggering webhooks when content changes in the dashboard
 * This will notify the headless blog site about updated content
 */

const WEBHOOK_SECRET = process.env.BLOG_WEBHOOK_SECRET;
const WEBHOOK_ENDPOINTS = process.env.WEBHOOK_ENDPOINTS?.split(',') || [];

/**
 * Send a webhook notification to registered endpoints
 * 
 * @param event The event type (e.g., 'post.published', 'post.updated')
 * @param resource The resource type (e.g., 'post', 'category')
 * @param resourceId The ID of the affected resource
 * @param data Optional data to include in the webhook
 */
export async function triggerWebhook(
  event: string,
  resource: string,
  resourceId: string,
  data?: any
) {
  // Skip if no webhook endpoints are configured
  if (WEBHOOK_ENDPOINTS.length === 0 || !WEBHOOK_SECRET) {
    console.log('No webhook endpoints configured. Skipping webhook notification.');
    return;
  }
  
  const payload = {
    event,
    resource,
    resourceId,
    timestamp: new Date().toISOString(),
    data
  };
  
  // Send webhook to all configured endpoints
  const results = await Promise.allSettled(
    WEBHOOK_ENDPOINTS.map(endpoint => 
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': WEBHOOK_SECRET
        },
        body: JSON.stringify(payload)
      })
    )
  );
  
  // Log results
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Webhook sent successfully to ${WEBHOOK_ENDPOINTS[index]}`);
    } else {
      console.error(`Failed to send webhook to ${WEBHOOK_ENDPOINTS[index]}:`, result.reason);
    }
  });
}

/**
 * Convenience methods for common webhook events
 */
export const webhooks = {
  post: {
    published: (postId: string, data?: any) => triggerWebhook('post.published', 'post', postId, data),
    updated: (postId: string, data?: any) => triggerWebhook('post.updated', 'post', postId, data),
    deleted: (postId: string, data?: any) => triggerWebhook('post.deleted', 'post', postId, data)
  },
  category: {
    created: (categoryId: string, data?: any) => triggerWebhook('category.created', 'category', categoryId, data),
    updated: (categoryId: string, data?: any) => triggerWebhook('category.updated', 'category', categoryId, data),
    deleted: (categoryId: string, data?: any) => triggerWebhook('category.deleted', 'category', categoryId, data)
  },
  tag: {
    created: (tagId: string, data?: any) => triggerWebhook('tag.created', 'tag', tagId, data),
    updated: (tagId: string, data?: any) => triggerWebhook('tag.updated', 'tag', tagId, data),
    deleted: (tagId: string, data?: any) => triggerWebhook('tag.deleted', 'tag', tagId, data)
  }
}; 