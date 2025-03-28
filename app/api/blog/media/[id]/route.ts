import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface Params {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const mediaId = params.id
    
    // Fetch the media item
    const { data, error } = await supabase
      .from("blog_media")
      .select("*")
      .eq("id", mediaId)
      .single()
    
    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Media not found" },
          { status: 404 }
        )
      }
      
      console.error("Error fetching media:", error)
      return NextResponse.json(
        { error: "Failed to fetch media" },
        { status: 500 }
      )
    }
    
    // Transform data to match frontend expectations
    const media = {
      id: data.id,
      fileName: data.file_name,
      fileUrl: data.file_path ? supabase.storage.from('media').getPublicUrl(data.file_path).data.publicUrl : null,
      fileType: data.file_type,
      fileSize: data.file_size,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
    
    return NextResponse.json({ media })
  } catch (error) {
    console.error("Error in GET /api/blog/media/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const mediaId = params.id
    const updates = await request.json()
    
    // Validate request body
    const allowedFields = ["alt_text", "caption"]
    const validUpdates: Record<string, any> = {}
    
    // Only allow updates to specific fields
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        validUpdates[key] = updates[key]
      }
    }
    
    if (Object.keys(validUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      )
    }
    
    // Update the media item
    const { data, error } = await supabase
      .from("blog_media")
      .update(validUpdates)
      .eq("id", mediaId)
      .select()
      .single()
    
    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Media not found" },
          { status: 404 }
        )
      }
      
      console.error("Error updating media:", error)
      return NextResponse.json(
        { error: "Failed to update media" },
        { status: 500 }
      )
    }
    
    // Transform data to match frontend expectations
    const media = {
      id: data.id,
      fileName: data.file_name,
      fileUrl: data.file_path ? supabase.storage.from('media').getPublicUrl(data.file_path).data.publicUrl : null,
      fileType: data.file_type,
      fileSize: data.file_size,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
    
    return NextResponse.json({ media })
  } catch (error) {
    console.error("Error in PATCH /api/blog/media/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const mediaId = params.id
    
    // First, get the media record to know the file path
    const { data: mediaData, error: fetchError } = await supabase
      .from("blog_media")
      .select("*")
      .eq("id", mediaId)
      .single()
    
    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Media not found" },
          { status: 404 }
        )
      }
      
      console.error("Error fetching media for deletion:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch media for deletion" },
        { status: 500 }
      )
    }
    
    // Delete the file from storage
    const { error: storageError } = await supabase
      .storage
      .from("media")
      .remove([mediaData.file_path])
    
    if (storageError) {
      console.error("Error deleting file from storage:", storageError)
      // Continue with database deletion even if storage deletion fails
    }
    
    // Delete the record from the database
    const { error: deleteError } = await supabase
      .from("blog_media")
      .delete()
      .eq("id", mediaId)
    
    if (deleteError) {
      console.error("Error deleting media record:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete media record" },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { message: "Media deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error in DELETE /api/blog/media/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 