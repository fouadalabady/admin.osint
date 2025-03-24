import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { safeBuildExecution } from "@/lib/build-helpers";

/**
 * API endpoint to update password after verification
 * 
 * @param request - The HTTP request object
 * @returns NextResponse with the result
 */
export async function POST(request: Request) {
  return safeBuildExecution(async () => {
    try {
      // Extract data from request
      const { userId, newPassword } = await request.json();
      
      // Validate inputs
      if (!userId || !newPassword) {
        return NextResponse.json({ 
          error: "User ID and new password are required" 
        }, { status: 400 });
      }
      
      if (newPassword.length < 8) {
        return NextResponse.json({ 
          error: "Password must be at least 8 characters" 
        }, { status: 400 });
      }
      
      // Get Supabase client
      const supabase = createServerSupabaseClient();
      
      // Update the user's password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId, 
        { password: newPassword }
      );
      
      if (updateError) {
        console.error("Error updating password:", updateError);
        return NextResponse.json({ 
          error: "Failed to update password", 
          details: updateError.message 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        message: "Password updated successfully"
      });
    } catch (error: unknown) {
      const err = error instanceof Error 
        ? error 
        : new Error(String(error));
      
      console.error("Error updating password:", err);
      return NextResponse.json(
        { error: err.message || "Failed to update password" },
        { status: 500 }
      );
    }
  });
} 