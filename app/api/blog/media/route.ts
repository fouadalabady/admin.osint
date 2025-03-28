import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { nanoid } from "nanoid"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * GET /api/blog/media
 * List media files
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url)
    const type = url.searchParams.get("type")
    const limit = parseInt(url.searchParams.get("limit") || "50")
    const offset = parseInt(url.searchParams.get("offset") || "0")
    
    // Build query
    let query = supabase
      .from("blog_media")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1)
    
    // Apply type filter if provided
    if (type) {
      if (type === "image") {
        query = query.like("file_type", "image/%")
      } else if (type === "document") {
        query = query.or("file_type.like.%pdf%,file_type.like.%doc%,file_type.like.%xls%,file_type.like.%ppt%,file_type.like.%txt%")
      }
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error("Error fetching media:", error)
      return NextResponse.json(
        { error: "Failed to fetch media files" },
        { status: 500 }
      )
    }
    
    // Transform data to match frontend expectations
    const mediaItems = data.map(item => ({
      id: item.id,
      fileName: item.file_name,
      fileUrl: item.file_path ? supabase.storage.from('media').getPublicUrl(item.file_path).data.publicUrl : null,
      fileType: item.file_type,
      fileSize: item.file_size,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }))
    
    return NextResponse.json({ media: mediaItems })
  } catch (error) {
    console.error("Error in GET /api/blog/media:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/blog/media
 * Upload new media file
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }
    
    // Get file details
    const fileName = file.name
    const fileType = file.type
    const fileSize = file.size
    
    // Generate a unique filename
    const fileExt = fileName.split(".").pop()
    const uniqueFileName = `${nanoid()}.${fileExt}`
    
    // Create a storage path based on file type
    let storagePath = "blog"
    if (fileType.startsWith("image/")) {
      storagePath = "blog/images"
    } else if (
      fileType.includes("pdf") || 
      fileType.includes("doc") || 
      fileType.includes("xls") ||
      fileType.includes("ppt") ||
      fileType.includes("txt")
    ) {
      storagePath = "blog/documents"
    }
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media")
      .upload(`${storagePath}/${uniqueFileName}`, file, {
        contentType: fileType,
        cacheControl: "3600"
      })
    
    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload file: " + uploadError.message },
        { status: 500 }
      )
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from("media")
      .getPublicUrl(`${storagePath}/${uniqueFileName}`)
    
    // Store file metadata in database
    const { data: mediaData, error: mediaError } = await supabase
      .from("blog_media")
      .insert({
        file_name: fileName,
        file_path: `${storagePath}/${uniqueFileName}`,
        file_type: fileType,
        file_size: fileSize,
        author_id: session.user.id
      })
      .select()
      .single()
    
    if (mediaError) {
      console.error("Error saving media metadata:", mediaError)
      return NextResponse.json(
        { error: "Failed to save file metadata: " + mediaError.message },
        { status: 500 }
      )
    }
    
    // Transform response to match frontend expectations
    const media = {
      id: mediaData.id,
      fileName: mediaData.file_name,
      fileUrl: publicUrl,
      fileType: mediaData.file_type,
      fileSize: mediaData.file_size,
      createdAt: mediaData.created_at,
      updatedAt: mediaData.updated_at
    }
    
    return NextResponse.json({ media })
  } catch (error) {
    console.error("Error in POST /api/blog/media:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/blog/media
 * Delete a media file
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });
    }
    
    const supabase = createServerSupabaseClient();
    
    // First get the media entry to check permissions and get file path
    const { data: media, error: fetchError } = await supabase
      .from('blog_media')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Media not found' }, { status: 404 });
      }
      
      console.error('Error fetching media:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
    }
    
    // Check permissions - users can only delete their own media unless they're admins
    const isAdmin = ['admin', 'super_admin'].includes(session.user.role);
    const isAuthor = media.author_id === session.user.id;
    
    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ 
        error: 'You do not have permission to delete this media' 
      }, { status: 403 });
    }
    
    // Delete the file from storage
    const { error: deleteFileError } = await supabase
      .storage
      .from('blog-images')
      .remove([media.file_path]);
    
    if (deleteFileError) {
      console.error('Error deleting file from storage:', deleteFileError);
      // Continue despite error to clean up database entry
    }
    
    // Try to delete the original file too
    try {
      // Extract the original file path (might be in a different format if using WebP conversion)
      const pathParts = media.file_path.split('/');
      const fileName = pathParts[pathParts.length - 1];
      
      // Check if it's a WebP file (from our processing)
      if (fileName.endsWith('.webp')) {
        // Try to find the original file by UUID part
        const uuid = fileName.split('.')[0];
        
        // List files in the author's directory to find the original
        const { data: originalFiles } = await supabase
          .storage
          .from('blog-images-original')
          .list(media.author_id);
        
        if (originalFiles) {
          // Find the file that starts with the same UUID
          const originalFile = originalFiles.find(file => file.name.startsWith(uuid));
          
          if (originalFile) {
            // Delete the original file
            await supabase
              .storage
              .from('blog-images-original')
              .remove([`${media.author_id}/${originalFile.name}`]);
          }
        }
      } else {
        // If not a processed WebP, just try to delete the same path
        await supabase
          .storage
          .from('blog-images-original')
          .remove([media.file_path]);
      }
    } catch (originalDeleteError) {
      console.error('Error deleting original file:', originalDeleteError);
      // Continue anyway
    }
    
    // Delete the database entry
    const { error: deleteDbError } = await supabase
      .from('blog_media')
      .delete()
      .eq('id', id);
    
    if (deleteDbError) {
      console.error('Error deleting media entry:', deleteDbError);
      return NextResponse.json({ error: 'Failed to delete media entry' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'Media deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/blog/media:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 