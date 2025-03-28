import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import slugify from 'slugify';

/**
 * GET /api/blog/categories
 * Fetch all blog categories
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
      .from("blog_categories")
      .select("*", { count: "exact" });
    
    // Apply search filter
    if (searchQuery) {
      query = query.ilike("name", `%${searchQuery}%`);
    }
    
    // Execute query with pagination
    const { data: categories, count, error } = await query
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error("Error fetching blog categories:", error);
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 }
      );
    }
    
    // Return paginated results
    return NextResponse.json({
      categories,
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Error in blog categories GET handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blog/categories
 * Create a new blog category
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    
    console.log("Session in categories POST:", session);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if user has permission to create categories
    const userRole = session.user.role;
    console.log("User role:", userRole);
    
    if (!["admin", "editor", "super_admin"].includes(userRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }
    
    // Parse request body
    const { name, description } = await request.json();
    
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }
    
    // Generate slug
    const slug = slugify(name, { lower: true, strict: true });
    
    // Initialize Supabase client
    const supabase = createClient();
    
    // Check if category with same name or slug already exists
    const { data: existingCategory } = await supabase
      .from("blog_categories")
      .select("id")
      .or(`name.ilike.${name},slug.eq.${slug}`)
      .maybeSingle();
    
    if (existingCategory) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 400 }
      );
    }
    
    // Insert category
    const { data: category, error } = await supabase
      .from("blog_categories")
      .insert({
        name,
        slug,
        description: description || null,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating blog category:", error);
      return NextResponse.json(
        { error: "Failed to create category" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Error in blog categories POST handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/blog/categories
 * Update an existing blog category
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admins can update categories
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const { id, name, slug: rawSlug, description } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }
    
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }
    
    // Generate slug or sanitize provided slug
    let slug = rawSlug
      ? slugify(rawSlug, { lower: true, strict: true })
      : slugify(name, { lower: true, strict: true });
    
    const supabase = createClient();
    
    // Check if slug already exists for a different category
    const { data: existingCategory, error: checkError } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking slug uniqueness:', checkError);
      return NextResponse.json({ error: 'Failed to check slug uniqueness' }, { status: 500 });
    }
    
    // If slug exists, append a timestamp
    if (existingCategory) {
      slug = `${slug}-${Date.now()}`;
    }
    
    // Update category
    const { data: category, error } = await supabase
      .from('blog_categories')
      .update({
        name,
        slug,
        description: description || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating blog category:', error);
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'Category updated successfully',
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description
      }
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/blog/categories:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 