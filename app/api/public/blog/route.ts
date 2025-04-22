import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

const BLOG_API_VERSION = '1.0';

/**
 * Unified API Gateway for the headless blog site
 * 
 * This endpoint serves as the single entry point for the headless blog site to access content.
 * It supports:
 * - Standard REST API for basic operations
 * - Real-time updates through webhooks
 * - Content caching
 */

/**
 * GET handler for fetching blog content
 * 
 * Supported query parameters:
 * - resource: What type of resource to fetch (posts, post, categories, tags)
 * - slug: Slug for fetching a specific post
 * - page: Pagination page number
 * - limit: Number of items per page
 * - categoryId: Filter by category ID
 * - tagId: Filter by tag ID
 * - status: Filter by post status (only published is available for public API)
 * - search: Search term for filtering
 * - direction: Content direction (ltr, rtl)
 * - cacheBuster: Force cache refresh
 */
export async function GET(request: NextRequest) {
  console.log('Public blog API request received');
  try {
    const url = new URL(request.url);
    const resource = url.searchParams.get('resource') || 'posts';
    const slug = url.searchParams.get('slug');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const categoryId = url.searchParams.get('categoryId');
    const tagId = url.searchParams.get('tagId');
    const search = url.searchParams.get('search');
    const direction = url.searchParams.get('direction');
    const cacheBuster = url.searchParams.get('cacheBuster');
    
    // Prepare response headers with caching directives
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'application/json');
    responseHeaders.set('X-API-Version', BLOG_API_VERSION);
    
    // Only allow caching for GET requests without cache busters
    if (!cacheBuster) {
      responseHeaders.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    } else {
      responseHeaders.set('Cache-Control', 'no-store, must-revalidate');
    }
    
    // Create Supabase client
    const supabase = createClient();
    
    // Handle different resource types
    switch (resource) {
      case 'posts':
        return await getPosts(supabase, { 
          page, 
          limit, 
          categoryId, 
          tagId, 
          search,
          direction
        }, responseHeaders);
        
      case 'post':
        if (!slug) {
          return NextResponse.json(
            { error: 'Slug is required for post details' }, 
            { status: 400, headers: responseHeaders }
          );
        }
        return await getPostBySlug(supabase, slug, responseHeaders);
        
      case 'categories':
        return await getCategories(supabase, responseHeaders);
        
      case 'tags':
        return await getTags(supabase, responseHeaders);
        
      case 'featured':
        return await getFeaturedPosts(supabase, limit, responseHeaders);
        
      default:
        return NextResponse.json(
          { error: 'Invalid resource type' }, 
          { status: 400, headers: responseHeaders }
        );
    }
  } catch (error) {
    console.error('Error in public blog API:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Webhook handler for real-time updates
export async function POST(request: NextRequest) {
  try {
    // Verify webhook subscription
    const headersList = headers();
    const apiKey = headersList.get('x-api-key');
    
    if (!apiKey || apiKey !== process.env.BLOG_WEBHOOK_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get subscription request
    const body = await request.json();
    
    if (body.action === 'subscribe') {
      // Store subscription URL for later notifications
      // In a real implementation, store this in a database
      console.log(`Registered webhook subscriber: ${body.callbackUrl}`);
      
      return NextResponse.json({
        success: true,
        message: 'Subscription successful',
        subscriptionId: 'sub_' + Date.now(),
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing webhook subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper Functions
 */

async function getFeaturedPosts(supabase: any, limit: number, headers: Headers) {
  // Fetch featured posts
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      category:blog_categories(id, name, slug)
    `)
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching featured posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured posts' },
      { status: 500, headers }
    );
  }
  
  // Process posts to get author and tag information
  if (posts && posts.length > 0) {
    await enhancePostsWithRelations(supabase, posts);
  }
  
  return NextResponse.json(posts, { headers });
}

async function getPosts(supabase: any, options: any, headers: Headers) {
  const { page, limit, categoryId, tagId, search, direction } = options;
  const offset = (page - 1) * limit;
  
  // Initialize query
  let query = supabase
    .from('blog_posts')
    .select(`
      *,
      category:blog_categories(id, name, slug)
    `, { count: 'exact' })
    .eq('status', 'published') // Public API only shows published posts
    .order('published_at', { ascending: false });
  
  // Apply filters
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  
  if (direction) {
    query = query.eq('direction', direction);
  }
  
  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }
  
  // Apply pagination
  query = query.range(offset, offset + limit - 1);
  
  // Execute query
  const { data: posts, count, error } = await query;
  
  if (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500, headers }
    );
  }
  
  // Process posts to get author and tag information
  if (posts && posts.length > 0) {
    await enhancePostsWithRelations(supabase, posts);
    
    // If tag filtering is requested, do it client-side after fetching tags
    if (tagId) {
      const filteredPosts = posts.filter(post => 
        post.tags.some((tag: any) => tag.id === tagId)
      );
      
      // Return the filtered posts with pagination info
      return NextResponse.json({
        posts: filteredPosts,
        page,
        limit,
        total: filteredPosts.length,
        totalPages: Math.ceil(filteredPosts.length / limit)
      }, { headers });
    }
  }
  
  // Return posts with pagination information
  return NextResponse.json({
    posts,
    page,
    limit,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / limit)
  }, { headers });
}

async function getPostBySlug(supabase: any, slug: string, headers: Headers) {
  // Fetch the post
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      category:blog_categories(id, name, slug)
    `)
    .eq('slug', slug)
    .eq('status', 'published') // Public API only shows published posts
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Post not found' }, 
        { status: 404, headers }
      );
    }
    console.error('Error fetching post by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500, headers }
    );
  }
  
  if (!post) {
    return NextResponse.json(
      { error: 'Post not found' }, 
      { status: 404, headers }
    );
  }
  
  // Get author, tags, and increment view count
  await enhancePostWithRelations(supabase, post);
  
  // Increment view count
  await supabase
    .from('blog_posts')
    .update({ view_count: (post.view_count || 0) + 1 })
    .eq('id', post.id);
  
  return NextResponse.json(post, { headers });
}

async function getCategories(supabase: any, headers: Headers) {
  // Fetch categories
  const { data: categories, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500, headers }
    );
  }
  
  // Count posts in each category
  if (categories && categories.length > 0) {
    for (const category of categories) {
      const { count } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .eq('status', 'published');
      
      category.postCount = count || 0;
    }
  }
  
  return NextResponse.json(categories, { headers });
}

async function getTags(supabase: any, headers: Headers) {
  // Fetch tags
  const { data: tags, error } = await supabase
    .from('blog_tags')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500, headers }
    );
  }
  
  // Count posts for each tag
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      const { data: postTags } = await supabase
        .from('blog_posts_tags')
        .select('post_id')
        .eq('tag_id', tag.id);
      
      // We need to count only the published posts
      if (postTags && postTags.length > 0) {
        const postIds = postTags.map(pt => pt.post_id);
        
        const { count } = await supabase
          .from('blog_posts')
          .select('*', { count: 'exact', head: true })
          .in('id', postIds)
          .eq('status', 'published');
        
        tag.postCount = count || 0;
      } else {
        tag.postCount = 0;
      }
    }
  }
  
  return NextResponse.json(tags, { headers });
}

/**
 * Helper function to add author and tags to a collection of posts
 */
async function enhancePostsWithRelations(supabase: any, posts: any[]) {
  // Get all unique author IDs
  const authorIds = [...new Set(posts.map(post => post.author_id))];
  
  // Fetch authors in a single query
  let authors: any[] = [];
  if (authorIds.length > 0) {
    const { data: authorsData } = await supabase
      .from('users')
      .select('id, email, user_metadata')
      .in('id', authorIds);
    
    authors = authorsData || [];
  }
  
  // Get post IDs for tag lookup
  const postIds = posts.map(post => post.id);
  
  // Fetch all tag relationships in a single query
  const { data: postTagsData } = await supabase
    .from('blog_posts_tags')
    .select('post_id, tag_id')
    .in('post_id', postIds);
  
  // If we have tag relationships, fetch the tag details
  let tagDetails: Record<string, any> = {};
  if (postTagsData && postTagsData.length > 0) {
    const tagIds = [...new Set(postTagsData.map(pt => pt.tag_id))];
    
    const { data: tagsData } = await supabase
      .from('blog_tags')
      .select('*')
      .in('id', tagIds);
    
    // Create a map of tag ID to tag details
    if (tagsData) {
      tagDetails = tagsData.reduce((acc, tag) => {
        acc[tag.id] = tag;
        return acc;
      }, {} as Record<string, any>);
    }
  }
  
  // Organize tags by post
  const postTags: Record<string, any[]> = {};
  if (postTagsData) {
    postTagsData.forEach(pt => {
      const tag = tagDetails[pt.tag_id];
      if (tag) {
        if (!postTags[pt.post_id]) {
          postTags[pt.post_id] = [];
        }
        postTags[pt.post_id].push(tag);
      }
    });
  }
  
  // Enhance each post with author and tags
  posts.forEach(post => {
    // Add author
    const author = authors.find(a => a.id === post.author_id);
    post.author = author ? {
      id: author.id,
      name: author.user_metadata?.name || author.email.split('@')[0],
      email: author.email
    } : null;
    
    // Add tags
    post.tags = postTags[post.id] || [];
  });
}

/**
 * Helper function to add author and tags to a single post
 */
async function enhancePostWithRelations(supabase: any, post: any) {
  // Get author
  if (post.author_id) {
    const { data: author } = await supabase
      .from('users')
      .select('id, email, user_metadata')
      .eq('id', post.author_id)
      .single();
    
    if (author) {
      post.author = {
        id: author.id,
        name: author.user_metadata?.name || author.email.split('@')[0],
        email: author.email
      };
    }
  }
  
  // Get tags for the post
  const { data: postTags } = await supabase
    .from('blog_posts_tags')
    .select('tag_id, tag:blog_tags(*)')
    .eq('post_id', post.id);
  
  post.tags = postTags?.map((t: any) => t.tag) || [];
} 