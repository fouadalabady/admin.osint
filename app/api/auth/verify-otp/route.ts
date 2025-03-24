import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";
import { sendEmail } from "@/lib/email";
import { safeBuildExecution } from "@/lib/build-helpers";

/**
 * API endpoint to verify OTP codes sent during registration
 * 
 * @param request - The HTTP request object
 * @returns NextResponse with the verification result
 */
export async function POST(request: Request) {
  return safeBuildExecution(async () => {
    try {
      // Extract email and OTP from request
      const { email, otp, purpose = 'email_verification' } = await request.json();
      
      // Validate inputs
      if (!email || !otp) {
        return NextResponse.json({ 
          error: "Email and OTP are required" 
        }, { status: 400 });
      }
      
      // Get Supabase admin client
      const supabase = createServerSupabaseClient();
      
      // Find matching OTP record
      const { data: otpRecords, error: queryError } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('email', email)
        .eq('purpose', purpose)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (queryError) {
        console.error("Error querying OTP records:", queryError);
        return NextResponse.json({ 
          error: "Failed to verify OTP", 
          details: queryError.message
        }, { status: 500 });
      }
      
      if (!otpRecords || otpRecords.length === 0) {
        return NextResponse.json({ 
          error: "No verification records found" 
        }, { status: 404 });
      }
      
      const otpRecord = otpRecords[0];
      
      // Check if OTP has expired
      const expiresAt = new Date(otpRecord.expires_at);
      const now = new Date();
      
      if (now > expiresAt) {
        return NextResponse.json({ 
          error: "Verification code has expired" 
        }, { status: 400 });
      }
      
      // Verify OTP
      const isValid = verifyOTP(otp, email, otpRecord.otp_hash);
      
      if (!isValid) {
        return NextResponse.json({ 
          error: "Invalid verification code" 
        }, { status: 400 });
      }
      
      // Delete the OTP record to prevent reuse
      const { error: deleteError } = await supabase
        .from('otp_verifications')
        .delete()
        .eq('id', otpRecord.id);
      
      if (deleteError) {
        console.error("Error deleting OTP record:", deleteError);
        // Continue as this is not critical
      }
      
      if (purpose === 'email_verification') {
        // Update registration request status
        const { error: updateError } = await supabase
          .from('user_registration_requests')
          .update({ email_verified: true })
          .eq('user_id', otpRecord.user_id);
        
        if (updateError) {
          console.error("Error updating registration request:", updateError);
          return NextResponse.json({ 
            error: "Failed to update verification status", 
            details: updateError.message
          }, { status: 500 });
        }
        
        try {
          // Notify admins about the new registration
          const { data: admins, error: adminQueryError } = await supabase
            .from('auth.users')
            .select('email')
            .eq('user_metadata->>role', 'admin')
            .eq('user_metadata->>status', 'active');
          
          if (!adminQueryError && admins && admins.length > 0) {
            const adminEmails = admins.map((admin: any) => admin.email);
            
            // Send notification email to admins
            await sendEmail({
              to: adminEmails.join(','),
              subject: "New User Registration Requires Approval",
              html: `
                <h1>New User Registration</h1>
                <p>A new user has verified their email and is awaiting admin approval:</p>
                <ul>
                  <li><strong>Email:</strong> ${email}</li>
                  <li><strong>User ID:</strong> ${otpRecord.user_id}</li>
                </ul>
                <p>Please log in to the admin dashboard to review and approve this registration.</p>
              `
            });
          }
        } catch (notificationError: unknown) {
          const error = notificationError instanceof Error
            ? notificationError
            : new Error(String(notificationError));
            
          console.error("Failed to send admin notification:", error);
          // Continue as this is not critical for the user flow
        }
        
        // Update user status in auth metadata
        const { error: userUpdateError } = await supabase.auth.admin.updateUserById(
          otpRecord.user_id,
          {
            user_metadata: { email_verified: true, status: 'pending_approval' }
          }
        );
        
        if (userUpdateError) {
          console.error("Error updating user metadata:", userUpdateError);
          // Continue as the registration is still completed
        }
        
        return NextResponse.json({
          message: "Email verified successfully. Your account is pending admin approval.",
          status: 'pending_approval',
          userId: otpRecord.user_id
        });
      } else if (purpose === 'password_reset') {
        // Password reset verification
        return NextResponse.json({
          message: "Password reset verification successful",
          status: 'verified',
          userId: otpRecord.user_id
        });
      } else {
        return NextResponse.json({
          message: `Verification successful for purpose: ${purpose}`,
          status: 'verified',
          userId: otpRecord.user_id
        });
      }
    } catch (error: unknown) {
      const err = error instanceof Error 
        ? error 
        : new Error(String(error));
      
      console.error("Error in OTP verification process:", err);
      return NextResponse.json(
        { error: err.message || "Failed to verify OTP" },
        { status: 500 }
      );
    }
  });
} 