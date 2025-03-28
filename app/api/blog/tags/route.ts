import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import slugify from 'slugify';

/**
 * GET /api/blog/tags
 * Fetch all blog tags
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const url = new URL(request.url);
    
    // Extract query parameters
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const searchQuery = url.searchParams.get("search");
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Initialize query
    let query = supabase
      .from("blog_tags")
      .select("*", { count: "exact" });
    
    // Apply search filter
    if (searchQuery) {
      query = query.ilike("name", `%${searchQuery}%`);
    }
    
    // Execute query with pagination
    const { data: tags, count, error } = await query
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error("Error fetching blog tags:", error);
      return NextResponse.json(
        { error: "Failed to fetch tags" },
        { status: 500 }
      );
    }
    
    // Return paginated results
    return NextResponse.json({
      tags,
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Error in blog tags GET handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blog/tags
 * Create a new blog tag
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    
    console.log("Session in tags POST:", session);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if user has permission to create tags
    const userRole = session.user.role;
    console.log("User role:", userRole);
    
    if (!["admin", "editor", "super_admin"].includes(userRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }
    
    // Parse request body
    const { name } = await request.json();
    
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Tag name is required" },
        { status: 400 }
      );
    }
    
    // Generate slug
    const slug = slugify(name, { lower: true, strict: true });
    
    // Initialize Supabase client
    const supabase = createClient();
    
    // Check if tag with same name or slug already exists
    const { data: existingTag } = await supabase
      .from("blog_tags")
      .select("id")
      .or(`name.ilike.${name},slug.eq.${slug}`)
      .maybeSingle();
    
    if (existingTag) {
      return NextResponse.json(
        { error: "Tag with this name already exists" },
        { status: 400 }
      );
    }
    
    // Insert tag
    const { data: tag, error } = await supabase
      .from("blog_tags")
      .insert({
        name,
        slug,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating blog tag:", error);
      return NextResponse.json(
        { error: "Failed to create tag" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: "Tag created successfully",
      tag,
    });
  } catch (error) {
    console.error("Error in blog tags POST handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/blog/tags
 * Delete a blog tag
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admins can delete tags
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }
    
    const supabase = createClient();
    
    // Delete tag
    const { error } = await supabase
      .from('blog_tags')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting blog tag:', error);
      return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/blog/tags:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 