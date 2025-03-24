import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { generateOTP, hashOTP, getOTPExpiry } from "@/lib/otp";
import { sendEmail } from "@/lib/email";
import { safeBuildExecution } from "@/lib/build-helpers";

/**
 * API endpoint to handle password reset requests
 * 
 * @param request - The HTTP request object
 * @returns NextResponse with the result of the reset request
 */
export async function POST(request: Request) {
  return safeBuildExecution(async () => {
    try {
      // Extract email from request
      const { email } = await request.json();
      
      // Validate inputs
      if (!email) {
        return NextResponse.json({ 
          error: "Email is required" 
        }, { status: 400 });
      }
      
      // Get Supabase admin client
      const supabase = createServerSupabaseClient();
      
      // Check if user exists
      const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(email);
      
      if (userError || !user) {
        // Don't reveal if user exists or not for security
        return NextResponse.json({ 
          message: "If your email is registered, you will receive a password reset code shortly." 
        });
      }
      
      // Generate OTP for password reset
      const otp = generateOTP(6);
      const otpHash = hashOTP(otp, email);
      const expiresAt = getOTPExpiry(15); // 15 minutes expiry
      
      // Store OTP verification record
      const { error: otpError } = await supabase
        .from('password_reset_verifications')
        .insert({
          user_id: user.id,
          email: email,
          otp_hash: otpHash,
          expires_at: new Date(expiresAt).toISOString()
        });
      
      if (otpError) {
        console.error("Error storing password reset verification:", otpError);
        return NextResponse.json({ 
          error: "Failed to initiate password reset", 
          details: otpError.message
        }, { status: 500 });
      }
      
      try {
        // Send password reset email
        const emailResult = await sendEmail({
          to: email,
          subject: "Password Reset Code",
          html: `
            <h1>Password Reset</h1>
            <p>You requested a password reset. Please use the following code to reset your password:</p>
            <h2 style="background: #f4f4f4; padding: 10px; font-size: 24px; text-align: center; letter-spacing: 5px;">${otp}</h2>
            <p>This code will expire in 15 minutes.</p>
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            <p>Thank you,<br>The Admin Dashboard Team</p>
          `
        });
        
        if (!emailResult.success) {
          console.error("Error sending password reset email:", emailResult.error);
          return NextResponse.json({ 
            error: "Failed to send password reset email" 
          }, { status: 500 });
        }
      } catch (emailError: unknown) {
        const error = emailError instanceof Error 
          ? emailError 
          : new Error(String(emailError));
        
        console.error("Failed to send password reset email:", error);
        return NextResponse.json({ 
          error: "Failed to send password reset email" 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        message: "Password reset code sent to your email",
        userId: user.id
      });
    } catch (error: unknown) {
      const err = error instanceof Error 
        ? error 
        : new Error(String(error));
      
      console.error("Error in password reset process:", err);
      return NextResponse.json(
        { error: err.message || "Failed to process password reset request" },
        { status: 500 }
      );
    }
  });
} 