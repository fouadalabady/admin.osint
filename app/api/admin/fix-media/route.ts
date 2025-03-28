import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * POST /api/admin/fix-media
 * Admin-only endpoint to fix media records
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Check if user is an admin
    if (!["admin", "super_admin"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }
    
    // Fetch all media records
    const { data: mediaItems, error: fetchError } = await supabase
      .from("blog_media")
      .select("*")
    
    if (fetchError) {
      console.error("Error fetching media items:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch media items" },
        { status: 500 }
      )
    }
    
    if (!mediaItems || mediaItems.length === 0) {
      return NextResponse.json({ message: "No media items found" })
    }
    
    const results = {
      total: mediaItems.length,
      updated: 0,
      failed: 0,
      errors: [] as string[]
    }
    
    // Process each media item
    for (const item of mediaItems) {
      if (!item.file_path) {
        results.failed++
        results.errors.push(`Item ${item.id}: Missing file_path`)
        continue
      }
      
      try {
        // Get the public URL for the file
        const { data: { publicUrl } } = supabase.storage
          .from("media")
          .getPublicUrl(item.file_path)
        
        // Update the record
        const { error: updateError } = await supabase
          .from("blog_media")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", item.id)
        
        if (updateError) {
          results.failed++
          results.errors.push(`Item ${item.id}: ${updateError.message}`)
        } else {
          results.updated++
        }
      } catch (error) {
        results.failed++
        results.errors.push(`Item ${item.id}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    
    return NextResponse.json({ 
      message: "Media items processed", 
      results 
    })
  } catch (error) {
    console.error("Error in POST /api/admin/fix-media:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 