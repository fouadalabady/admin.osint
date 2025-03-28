import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import slugify from 'slugify';

/**
 * GET /api/blog/posts
 * Fetch blog posts with optional filtering, sorting, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const url = new URL(request.url);
    
    // Extract query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    const categoryId = url.searchParams.get('categoryId');
    const tagId = url.searchParams.get('tagId');
    const searchQuery = url.searchParams.get('search');
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Initialize query - Fix the join with auth.users instead of using a relationship
    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        category:category_id(id, name, slug)
      `, { count: 'exact' });
    
    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%, content.ilike.%${searchQuery}%`);
    }
    
    // Execute query with pagination
    const { data: posts, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching blog posts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch blog posts' },
        { status: 500 }
      );
    }
    
    // Fetch author info in a separate query 
    if (posts && posts.length > 0) {
      const authorIds = [...new Set(posts.map(post => post.author_id))];
      const { data: authors } = await supabase
        .from('users')
        .select('id, email, user_metadata')
        .in('id', authorIds);
      
      // Map authors to posts
      if (authors) {
        posts.forEach(post => {
          const author = authors.find(a => a.id === post.author_id);
          if (author) {
            post.author = {
              id: author.id,
              email: author.email,
              name: author.user_metadata?.name || author.email.split('@')[0],
              avatarUrl: author.user_metadata?.avatar_url
            };
          }
        });
      }

      // If tag filtering was requested, fetch tag info
      if (tagId) {
        for (const post of posts) {
          const { data: postTags } = await supabase
            .from('blog_posts_tags')
            .select('tag_id, tag:tag_id(id, name, slug)')
            .eq('post_id', post.id);
          
          post.tags = postTags?.map((t: any) => t.tag) || [];
        }
      }
    }
    
    // Return paginated results
    return NextResponse.json({
      posts,
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Error in blog posts GET handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blog/posts
 * Create a new blog post
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    
    console.log("Session in blog posts POST:", session);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user has permission to create posts
    const userRole = session.user.role;
    console.log("User role for blog posts:", userRole);
    
    if (!['admin', 'editor', 'author', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    console.log("Blog post data:", JSON.stringify(body, null, 2));
    
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      category,
      tags = [],
      seo,
      status = 'draft',
      isPublished = false,
      direction = 'ltr',
    } = body;
    
    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    // Generate slug if not provided
    const postSlug = slug || slugify(title, { lower: true, strict: true });
    
    // Initialize Supabase client
    const supabase = createClient();
    
    // Check if slug is already in use
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', postSlug)
      .maybeSingle();
    
    if (existingPost) {
      return NextResponse.json(
        { error: 'Slug is already in use' },
        { status: 400 }
      );
    }
    
    // Format SEO metadata
    const seoMetadata = {
      title: seo?.title || title,
      description: seo?.description || excerpt || "",
      keywords: seo?.keywords || "",
      canonical: seo?.canonical || "",
      ogImage: seo?.ogImage || featuredImage || "",
    };
    
    // Insert post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert({
        title,
        slug: postSlug,
        excerpt,
        content,
        featured_image: featuredImage,
        category_id: category || null,
        author_id: session.user.id,
        status,
        is_featured: false,
        seo_title: seoMetadata.title,
        seo_description: seoMetadata.description,
        seo_keywords: seoMetadata.keywords,
        published_at: isPublished ? new Date().toISOString() : null,
        direction: direction
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating blog post:', error);
      return NextResponse.json(
        { error: 'Failed to create blog post' },
        { status: 500 }
      );
    }
    
    // Insert post-tag relationships if tags are provided
    if (tags.length > 0) {
      const tagRelations = tags.map((tagId: string) => ({
        post_id: post.id,
        tag_id: tagId,
      }));
      
      const { error: tagsError } = await supabase
        .from('blog_posts_tags')
        .insert(tagRelations);
      
      if (tagsError) {
        console.error('Error associating tags with post:', tagsError);
        // Continue despite tag error, as the post was created successfully
      }
    }
    
    return NextResponse.json({
      message: 'Blog post created successfully',
      post,
    });
  } catch (error) {
    console.error('Error in blog posts POST handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/blog/posts
 * Bulk update blog posts (status changes, featured status, etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only users with appropriate roles can update posts in bulk
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const { postIds, updates } = await request.json();
    
    if (!Array.isArray(postIds) || !updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    
    if (postIds.length === 0) {
      return NextResponse.json({ error: 'No posts specified' }, { status: 400 });
    }
    
    // Validate updates object
    const allowedFields = ['status', 'is_featured', 'category_id'];
    const updateFields = Object.keys(updates);
    
    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No update fields specified' }, { status: 400 });
    }
    
    const invalidFields = updateFields.filter(field => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
      return NextResponse.json({
        error: `Invalid update fields: ${invalidFields.join(', ')}`
      }, { status: 400 });
    }
    
    // Handle special case for status update to published
    if (updates.status === 'published') {
      updates.published_at = new Date().toISOString();
    }
    
    const supabase = createClient();
    
    const { error } = await supabase
      .from('blog_posts')
      .update(updates)
      .in('id', postIds);
    
    if (error) {
      console.error('Error updating blog posts:', error);
      return NextResponse.json({ error: 'Failed to update blog posts' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: `Successfully updated ${postIds.length} blog post(s)`,
      updatedPosts: postIds
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/blog/posts:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 