import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import slugify from 'slugify';

/**
 * GET /api/blog/tags/[id]
 * Get a specific tag by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: "Tag ID is required" },
        { status: 400 }
      );
    }
    
    const supabase = createClient();
    
    // Fetch tag by ID
    const { data: tag, error } = await supabase
      .from("blog_tags")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      console.error("Error fetching tag:", error);
      return NextResponse.json(
        { error: "Failed to fetch tag" },
        { status: 500 }
      );
    }
    
    if (!tag) {
      return NextResponse.json(
        { error: "Tag not found" },
        { status: 404 }
      );
    }
    
    // Get post count for this tag
    const { count: postCount, error: countError } = await supabase
      .from("blog_posts_tags")
      .select("*", { count: "exact", head: true })
      .eq("tag_id", id);
    
    if (!countError) {
      tag.postCount = postCount || 0;
    }
    
    return NextResponse.json({ tag });
  } catch (error) {
    console.error("Error in GET /api/blog/tags/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/blog/tags/[id]
 * Update a tag by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check permissions
    const userRole = session.user.role;
    
    if (!["admin", "editor", "super_admin"].includes(userRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }
    
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: "Tag ID is required" },
        { status: 400 }
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
    
    // Generate slug from name
    const slug = slugify(name, { lower: true, strict: true });
    
    const supabase = createClient();
    
    // Check if tag exists
    const { data: existingTag, error: fetchError } = await supabase
      .from("blog_tags")
      .select("id")
      .eq("id", id)
      .single();
    
    if (fetchError || !existingTag) {
      return NextResponse.json(
        { error: "Tag not found" },
        { status: 404 }
      );
    }
    
    // Check if another tag with the same name or slug exists
    const { data: duplicateTag, error: duplicateError } = await supabase
      .from("blog_tags")
      .select("id")
      .or(`name.ilike.${name},slug.eq.${slug}`)
      .neq("id", id)
      .maybeSingle();
    
    if (duplicateTag) {
      return NextResponse.json(
        { error: "Another tag with this name already exists" },
        { status: 400 }
      );
    }
    
    // Update tag
    const { data: tag, error } = await supabase
      .from("blog_tags")
      .update({
        name,
        slug,
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating tag:", error);
      return NextResponse.json(
        { error: "Failed to update tag" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: "Tag updated successfully",
      tag,
    });
  } catch (error) {
    console.error("Error in PUT /api/blog/tags/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/blog/tags/[id]
 * Delete a tag by ID
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
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check permissions
    const userRole = session.user.role;
    
    if (!["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }
    
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: "Tag ID is required" },
        { status: 400 }
      );
    }
    
    const supabase = createClient();
    
    // Check if tag exists
    const { data: existingTag, error: fetchError } = await supabase
      .from("blog_tags")
      .select("id")
      .eq("id", id)
      .single();
    
    if (fetchError || !existingTag) {
      return NextResponse.json(
        { error: "Tag not found" },
        { status: 404 }
      );
    }
    
    // First, delete relationships in the junction table
    const { error: relationshipError } = await supabase
      .from("blog_posts_tags")
      .delete()
      .eq("tag_id", id);
    
    if (relationshipError) {
      console.error("Error deleting tag relationships:", relationshipError);
      return NextResponse.json(
        { error: "Failed to delete tag relationships" },
        { status: 500 }
      );
    }
    
    // Delete the tag
    const { error } = await supabase
      .from("blog_tags")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting tag:", error);
      return NextResponse.json(
        { error: "Failed to delete tag" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: "Tag deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/blog/tags/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 