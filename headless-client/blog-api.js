/**
 * OSINT Blog API Client
 * 
 * This client library is for use by the headless blog site to fetch blog content
 * from the OSINT Dashboard API. It provides a simple interface for fetching posts,
 * categories, and tags, as well as utilities for real-time updates.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.example.com';
const API_ENDPOINT = `${API_BASE_URL}/api/public/blog`;
const WEBHOOK_SECRET = process.env.NEXT_PUBLIC_WEBHOOK_SECRET;

/**
 * Fetch all blog posts with pagination and filtering
 */
export async function getPosts({ 
  page = 1, 
  limit = 10, 
  category = null, 
  tag = null, 
  search = null 
} = {}) {
  const params = new URLSearchParams({
    resource: 'posts',
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (category) params.append('categoryId', category);
  if (tag) params.append('tagId', tag);
  if (search) params.append('search', search);
  
  try {
    const response = await fetch(`${API_ENDPOINT}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching posts:', error);
    return {
      posts: [],
      page: 1,
      limit,
      total: 0,
      totalPages: 0,
      error: error.message
    };
  }
}

/**
 * Fetch a single blog post by slug
 */
export async function getPostBySlug(slug) {
  if (!slug) {
    throw new Error('Slug is required');
  }
  
  const params = new URLSearchParams({
    resource: 'post',
    slug
  });
  
  try {
    const response = await fetch(`${API_ENDPOINT}?${params.toString()}`);
    if (response.status === 404) {
      return { notFound: true };
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch post: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching post with slug "${slug}":`, error);
    return { error: error.message };
  }
}

/**
 * Fetch all categories
 */
export async function getCategories() {
  const params = new URLSearchParams({
    resource: 'categories'
  });
  
  try {
    const response = await fetch(`${API_ENDPOINT}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Fetch all tags
 */
export async function getTags() {
  const params = new URLSearchParams({
    resource: 'tags'
  });
  
  try {
    const response = await fetch(`${API_ENDPOINT}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tags: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

/**
 * Setup real-time updates using Server-Sent Events (SSE)
 * This allows the headless site to receive updates when content changes
 */
export function setupRealtimeUpdates(callback) {
  if (!WEBHOOK_SECRET) {
    console.warn('Webhook secret not configured. Real-time updates will not work.');
    return { close: () => {} };
  }
  
  try {
    const eventSource = new EventSource(`${API_BASE_URL}/api/public/blog/webhook?token=${WEBHOOK_SECRET}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (e) {
        console.error('Failed to parse SSE data:', e);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
      // Attempt to reconnect after 5 seconds
      setTimeout(() => setupRealtimeUpdates(callback), 5000);
    };
    
    return {
      close: () => eventSource.close()
    };
  } catch (error) {
    console.error('Failed to setup real-time updates:', error);
    return { close: () => {} };
  }
} 