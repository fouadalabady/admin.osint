import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";
import { safeBuildExecution } from "@/lib/build-helpers";

/**
 * API endpoint to verify password reset codes
 * 
 * @param request - The HTTP request object
 * @returns NextResponse with the verification result
 */
export async function POST(request: Request) {
  return safeBuildExecution(async () => {
    try {
      // Extract email and reset code from request
      const { email, code } = await request.json();
      
      // Validate inputs
      if (!email || !code) {
        return NextResponse.json({ 
          error: "Email and reset code are required" 
        }, { status: 400 });
      }
      
      // Get Supabase client
      const supabase = createServerSupabaseClient();
      
      // Find matching reset verification record
      const { data: resetRecords, error: queryError } = await supabase
        .from('password_reset_verifications')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (queryError) {
        console.error("Error querying reset records:", queryError);
        return NextResponse.json({ 
          error: "Failed to verify reset code", 
          details: queryError.message
        }, { status: 500 });
      }
      
      if (!resetRecords || resetRecords.length === 0) {
        return NextResponse.json({ 
          error: "No reset code found" 
        }, { status: 404 });
      }
      
      const resetRecord = resetRecords[0];
      
      // Check if code has expired
      const expiresAt = new Date(resetRecord.expires_at);
      const now = new Date();
      
      if (now > expiresAt) {
        return NextResponse.json({ 
          error: "Reset code has expired" 
        }, { status: 400 });
      }
      
      // Verify reset code
      const isValid = verifyOTP(code, email, resetRecord.otp_hash);
      
      if (!isValid) {
        return NextResponse.json({ 
          error: "Invalid reset code" 
        }, { status: 400 });
      }
      
      // Delete the reset record to prevent reuse
      const { error: deleteError } = await supabase
        .from('password_reset_verifications')
        .delete()
        .eq('id', resetRecord.id);
      
      if (deleteError) {
        console.error("Error deleting reset record:", deleteError);
        // Continue as this is not critical
      }
      
      return NextResponse.json({
        message: "Reset code verified successfully",
        userId: resetRecord.user_id
      });
    } catch (error: unknown) {
      const err = error instanceof Error 
        ? error 
        : new Error(String(error));
      
      console.error("Error in reset code verification:", err);
      return NextResponse.json(
        { error: err.message || "Failed to verify reset code" },
        { status: 500 }
      );
    }
  });
} 