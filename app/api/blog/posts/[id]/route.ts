import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import slugify from 'slugify';

/**
 * GET /api/blog/posts/[id]
 * Fetch a single blog post by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createClient();
    
    // Fetch the post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        category:category_id(id, name, slug)
      `)
      .eq('id', postId)
      .single();
    
    if (error) {
      console.error('Error fetching blog post:', error);
      return NextResponse.json(
        { error: 'Failed to fetch blog post' },
        { status: 500 }
      );
    }
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Fetch author info
    const { data: author } = await supabase
      .from('users')
      .select('id, email, user_metadata')
      .eq('id', post.author_id)
      .single();
    
    if (author) {
      post.author = {
        id: author.id,
        email: author.email,
        name: author.user_metadata?.name || author.email.split('@')[0],
        avatarUrl: author.user_metadata?.avatar_url
      };
    }
    
    // Fetch tags
    const { data: postTags } = await supabase
      .from('blog_posts_tags')
      .select('tag_id, tag:tag_id(id, name, slug)')
      .eq('post_id', postId);
    
    post.tags = postTags?.map((t: any) => t.tag) || [];
    
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error in blog post GET handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/blog/posts/[id]
 * Update a blog post
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    console.log("Session in blog post PATCH:", session);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user has permission to update posts
    const userRole = session.user.role;
    console.log("User role for blog post update:", userRole);
    
    if (!['admin', 'editor', 'author', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    const postId = params.id;
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createClient();
    
    // Check if post exists and user is authorized to edit it
    const { data: existingPost, error: fetchError } = await supabase
      .from('blog_posts')
      .select('author_id')
      .eq('id', postId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching blog post:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch blog post' },
        { status: 500 }
      );
    }
    
    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Only post author, admin or super_admin can edit posts
    if (
      existingPost.author_id !== session.user.id && 
      !['admin', 'super_admin'].includes(userRole)
    ) {
      return NextResponse.json(
        { error: 'You are not authorized to edit this post' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    console.log("Blog post update data:", JSON.stringify(body, null, 2));
    
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      category,
      tags = [],
      seo,
      status,
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
    
    // Check if slug is already in use by another post
    if (slug && slug !== existingPost.slug) {
      const { data: slugExists } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', postSlug)
        .neq('id', postId)
        .maybeSingle();
      
      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug is already in use by another post' },
          { status: 400 }
        );
      }
    }
    
    // Format SEO metadata
    const seoMetadata = {
      title: seo?.title || title,
      description: seo?.description || excerpt || "",
      keywords: seo?.keywords || "",
      canonical: seo?.canonical || "",
      ogImage: seo?.ogImage || featuredImage || "",
    };
    
    // Update post
    const { data: updatedPost, error: updateError } = await supabase
      .from('blog_posts')
      .update({
        title,
        slug: postSlug,
        excerpt,
        content,
        featured_image: featuredImage,
        category_id: category || null,
        status,
        seo_title: seoMetadata.title,
        seo_description: seoMetadata.description,
        seo_keywords: seoMetadata.keywords,
        published_at: isPublished && !existingPost.published_at ? new Date().toISOString() : existingPost.published_at,
        direction: direction
      })
      .eq('id', postId)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('Error updating blog post:', updateError);
      return NextResponse.json(
        { error: 'Failed to update blog post' },
        { status: 500 }
      );
    }
    
    // Update post-tag relationships if tags are provided
    if (tags) {
      // First, delete existing tag relationships
      const { error: deleteTagsError } = await supabase
        .from('blog_posts_tags')
        .delete()
        .eq('post_id', postId);
      
      if (deleteTagsError) {
        console.error('Error removing existing tags:', deleteTagsError);
      }
      
      // Then insert new tag relationships
      if (tags.length > 0) {
        const tagRelations = tags.map((tagId: string) => ({
          post_id: postId,
          tag_id: tagId,
        }));
        
        const { error: tagsError } = await supabase
          .from('blog_posts_tags')
          .insert(tagRelations);
        
        if (tagsError) {
          console.error('Error associating tags with post:', tagsError);
        }
      }
    }
    
    return NextResponse.json({
      message: 'Blog post updated successfully',
      post: updatedPost,
    });
  } catch (error) {
    console.error('Error in blog posts PATCH handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/blog/posts/[id]
 * Delete a blog post
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user has permission to delete posts
    const userRole = session.user.role;
    
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    const postId = params.id;
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createClient();
    
    // Check if post exists
    const { data: existingPost, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, author_id')
      .eq('id', postId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching blog post:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch blog post' },
        { status: 500 }
      );
    }
    
    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Only post author, admin or super_admin can delete posts
    if (
      existingPost.author_id !== session.user.id && 
      !['admin', 'super_admin'].includes(userRole)
    ) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this post' },
        { status: 403 }
      );
    }
    
    // First, delete tag relationships
    const { error: deleteTagsError } = await supabase
      .from('blog_posts_tags')
      .delete()
      .eq('post_id', postId);
    
    if (deleteTagsError) {
      console.error('Error deleting post tags:', deleteTagsError);
      // Continue despite error
    }
    
    // Delete the post
    const { error: deleteError } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', postId);
    
    if (deleteError) {
      console.error('Error deleting blog post:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete blog post' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Error in blog posts DELETE handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 