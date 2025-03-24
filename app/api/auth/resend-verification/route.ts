import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { generateOTP, hashOTP, getOTPExpiry } from "@/lib/otp";
import { sendEmail } from "@/lib/email";
import { safeBuildExecution } from "@/lib/build-helpers";

/**
 * API endpoint to resend verification OTP
 * 
 * @param request - The HTTP request object
 * @returns NextResponse with the result
 */
export async function POST(request: Request) {
  return safeBuildExecution(async () => {
    try {
      // Extract email from request
      const { email, purpose = 'email_verification' } = await request.json();
      
      // Validate inputs
      if (!email) {
        return NextResponse.json({ 
          error: "Email is required" 
        }, { status: 400 });
      }
      
      // Get Supabase client
      const supabase = createServerSupabaseClient();
      
      // Check if user exists
      const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email);
      
      if (userError || !userData?.user) {
        // Don't reveal if user exists or not for security
        return NextResponse.json({ 
          message: "If your email is registered, a verification code will be sent." 
        });
      }
      
      const user = userData.user;
      
      // Generate new OTP
      const otp = generateOTP(6);
      const otpHash = hashOTP(otp, email);
      const expiresAt = getOTPExpiry(15); // 15 minutes expiry
      
      // Delete any previous OTP records for this purpose
      const { error: deleteError } = await supabase
        .from('otp_verifications')
        .delete()
        .eq('email', email)
        .eq('purpose', purpose);
      
      if (deleteError) {
        console.error("Error deleting previous OTP records:", deleteError);
        // Continue anyway
      }
      
      // Store new OTP verification record
      const { error: otpError } = await supabase
        .from('otp_verifications')
        .insert({
          user_id: user.id,
          email: email,
          otp_hash: otpHash,
          purpose: purpose,
          expires_at: new Date(expiresAt).toISOString()
        });
      
      if (otpError) {
        console.error("Error storing OTP verification:", otpError);
        return NextResponse.json({ 
          error: "Failed to generate verification code", 
          details: otpError.message
        }, { status: 500 });
      }
      
      // Prepare email content based on purpose
      let emailSubject, emailHtml;
      
      if (purpose === 'email_verification') {
        emailSubject = "Verify Your Email Address";
        emailHtml = `
          <h1>Verify Your Email Address</h1>
          <p>You requested a new verification code. Please use the following code to verify your email:</p>
          <h2 style="background: #f4f4f4; padding: 10px; font-size: 24px; text-align: center; letter-spacing: 5px;">${otp}</h2>
          <p>This code will expire in 15 minutes.</p>
          <p>If you did not request this verification, please ignore this email.</p>
          <p>Thank you,<br>The Admin Dashboard Team</p>
        `;
      } else if (purpose === 'password_reset') {
        emailSubject = "Password Reset Code";
        emailHtml = `
          <h1>Password Reset</h1>
          <p>You requested a new password reset code. Please use the following code to reset your password:</p>
          <h2 style="background: #f4f4f4; padding: 10px; font-size: 24px; text-align: center; letter-spacing: 5px;">${otp}</h2>
          <p>This code will expire in 15 minutes.</p>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Thank you,<br>The Admin Dashboard Team</p>
        `;
      } else {
        emailSubject = "Verification Code";
        emailHtml = `
          <h1>Verification Code</h1>
          <p>You requested a verification code. Please use the following code:</p>
          <h2 style="background: #f4f4f4; padding: 10px; font-size: 24px; text-align: center; letter-spacing: 5px;">${otp}</h2>
          <p>This code will expire in 15 minutes.</p>
          <p>If you did not request this verification, please ignore this email.</p>
          <p>Thank you,<br>The Admin Dashboard Team</p>
        `;
      }
      
      try {
        // Send verification email
        const emailResult = await sendEmail({
          to: email,
          subject: emailSubject,
          html: emailHtml
        });
        
        if (!emailResult.success) {
          console.error("Error sending verification email:", emailResult.error);
          return NextResponse.json({ 
            error: "Failed to send verification email" 
          }, { status: 500 });
        }
      } catch (emailError: unknown) {
        const error = emailError instanceof Error 
          ? emailError 
          : new Error(String(emailError));
        
        console.error("Failed to send verification email:", error);
        return NextResponse.json({ 
          error: "Failed to send verification email" 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        message: "Verification code sent to your email",
        userId: user.id
      });
    } catch (error: unknown) {
      const err = error instanceof Error 
        ? error 
        : new Error(String(error));
      
      console.error("Error in resend verification process:", err);
      return NextResponse.json(
        { error: err.message || "Failed to resend verification code" },
        { status: 500 }
      );
    }
  });
} 