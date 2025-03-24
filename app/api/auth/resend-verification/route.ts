import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { generateOTP, hashOTP, getOTPExpiry } from "@/lib/otp";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Get Supabase admin client
    const supabase = createServerSupabaseClient();

    // Check if user exists
    const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(email);

    if (userError || !user) {
      console.error("Error fetching user:", userError);
      return NextResponse.json(
        { error: "User not found with this email address" },
        { status: 404 }
      );
    }

    // Generate new OTP
    const otp = generateOTP(6);
    const otpHash = hashOTP(otp, email);
    const expiresAt = getOTPExpiry(15); // 15 minutes expiry

    // Store OTP verification record
    const { error: otpError } = await supabase
      .from('otp_verifications')
      .insert({
        user_id: user.user.id,
        email: email,
        otp_hash: otpHash,
        purpose: 'email_verification',
        expires_at: new Date(expiresAt).toISOString()
      });

    if (otpError) {
      console.error("Error storing OTP verification:", otpError);
      return NextResponse.json(
        { error: "Failed to create verification code" },
        { status: 500 }
      );
    }

    try {
      // Send verification email
      const emailResult = await sendEmail({
        to: email,
        subject: "Verify Your Email Address",
        html: `
          <h1>Verify Your Email Address</h1>
          <p>Please use the following verification code to verify your email address:</p>
          <h2 style="background: #f4f4f4; padding: 10px; font-size: 24px; text-align: center; letter-spacing: 5px;">${otp}</h2>
          <p>This code will expire in 15 minutes.</p>
          <p>If you did not request this verification, please ignore this email.</p>
          <p>Thank you,<br>The Admin Dashboard Team</p>
        `
      });

      if (!emailResult.success) {
        console.error("Error sending verification email:", emailResult.error);
        return NextResponse.json(
          { error: "Failed to send verification email" },
          { status: 500 }
        );
      }
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully"
    });
  } catch (error) {
    console.error("Error in resend verification process:", error);
    return NextResponse.json(
      { error: "Failed to resend verification email" },
      { status: 500 }
    );
  }
} 