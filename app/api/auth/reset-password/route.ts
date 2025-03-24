import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import nodemailer from 'nodemailer';
import { generateRandomCode } from '@/lib/utils';
import { z } from 'zod';

// Schema for validating request body
const resetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// POST /api/auth/reset-password
// Request body: { email: string }
export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = resetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email address', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    const supabase = createServerSupabaseClient();

    // Check if user exists before proceeding
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error('Error checking user existence:', userError);
      return NextResponse.json({ error: 'Error checking user account' }, { status: 500 });
    }

    const userExists = userData.users.some(user => user.email === email);
    if (!userExists) {
      // For security reasons, don't tell the user that the email doesn't exist
      // Instead, return a success response as if we sent the email
      return NextResponse.json({
        message: 'Password reset instructions sent to email',
      });
    }

    // Generate verification code
    const code = generateRandomCode(6);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    // Store verification code in Supabase (even before sending email)
    try {
      await supabase.from('password_reset_verifications').insert({
        email,
        code,
        type: 'password_reset',
        verified: false,
        expires_at: expiresAt.toISOString(),
      });

      console.log('Verification code stored successfully');
    } catch (dbError) {
      console.error('Failed to store verification code:', dbError);
      // Continue anyway to try the email methods
    }

    let emailSent = false;

    // Method 1: Try Supabase's built-in password reset
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXTAUTH_URL}/auth/reset-password`,
      });

      if (!error) {
        emailSent = true;
        console.log('Supabase password reset email sent successfully');
      } else {
        console.error('Supabase password reset failed:', error);
      }
    } catch (supabaseError) {
      console.error('Error with Supabase password reset:', supabaseError);
    }

    // Method 2: Fallback to SMTP if Supabase didn't work
    if (!emailSent) {
      try {
        // Get SMTP configuration from environment variables
        const host = process.env.SMTP_SERVER_HOST || process.env.SMTP_HOST;
        const port = parseInt(process.env.SMTP_SERVER_PORT || process.env.SMTP_PORT || '587');
        const user = process.env.SMTP_SERVER_USERNAME || process.env.SMTP_USER;
        const pass = process.env.SMTP_SERVER_PASSWORD || process.env.SMTP_PASSWORD;
        const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || user;

        if (!host || !user || !pass) {
          throw new Error('SMTP configuration is incomplete');
        }

        // Configure SMTP transport
        const transport = nodemailer.createTransport({
          host,
          port,
          secure: false, // true for 465, false for other ports
          auth: { user, pass },
        });

        // Create reset URL with verification code
        const resetUrl = `${
          process.env.NEXTAUTH_URL
        }/auth/reset-password?code=${code}&email=${encodeURIComponent(email)}`;

        // Send email
        await transport.sendMail({
          from: `"Admin Dashboard" <${fromEmail}>`,
          to: email,
          subject: 'Reset Your Password',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Reset Your Password</h2>
              <p>We received a request to reset your password. Use one of the following methods:</p>
              
              <div style="margin: 20px 0; padding: 15px; background-color: #f7f7f7; border-radius: 5px;">
                <p><strong>Option 1:</strong> Click the link below to reset your password:</p>
                <p><a href="${resetUrl}" style="color: #0070f3; text-decoration: none;">Reset Password</a></p>
              </div>
              
              <div style="margin: 20px 0; padding: 15px; background-color: #f7f7f7; border-radius: 5px;">
                <p><strong>Option 2:</strong> Enter this verification code on the reset password page:</p>
                <p style="font-size: 24px; letter-spacing: 2px; color: #333; font-weight: bold;">${code}</p>
              </div>
              
              <p>This code will expire in 1 hour.</p>
              <p>If you didn't request a password reset, you can ignore this email.</p>
            </div>
          `,
        });

        emailSent = true;
        console.log('SMTP fallback email sent successfully');
      } catch (smtpError) {
        console.error('Error with SMTP fallback:', smtpError);
      }
    }

    if (emailSent) {
      return NextResponse.json({
        message: 'Password reset instructions sent to email',
      });
    } else {
      return NextResponse.json({ error: 'Failed to send password reset email' }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in reset-password API:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
