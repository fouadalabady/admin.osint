import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import { AuthError } from '@supabase/supabase-js';

// Schema for validating request body
const resetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  code: z.string().min(6, 'Code must be at least 6 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// POST /api/auth/verify-reset-code
// Request body: { email: string, code: string, password: string }
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const validation = resetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { email, code, password } = validation.data;

    // Initialize Supabase client
    const supabase = createServerSupabaseClient();

    // First verify the reset code
    const { data: verificationData, error: verificationError } = await supabase
      .from('password_reset_verifications')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('type', 'password_reset')
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (verificationError || !verificationData) {
      // Check if code already used
      const { data: usedCode } = await supabase
        .from('password_reset_verifications')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .eq('verified', true)
        .limit(1);

      if (usedCode && usedCode.length > 0) {
        return NextResponse.json(
          { error: 'This verification code has already been used' },
          { status: 400 }
        );
      }

      // Check if code expired
      const { data: expiredCode } = await supabase
        .from('password_reset_verifications')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .lt('expires_at', new Date().toISOString())
        .limit(1);

      if (expiredCode && expiredCode.length > 0) {
        return NextResponse.json(
          { error: 'This verification code has expired. Please request a new code.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: 'Invalid verification code',
          details: verificationError?.message || 'Code not found or already used',
        },
        { status: 400 }
      );
    }

    // Get user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('Error retrieving users:', userError);
      return NextResponse.json(
        { error: 'Error retrieving user', details: userError.message },
        { status: 500 }
      );
    }

    const user = userData.users?.find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found with this email address' },
        { status: 404 }
      );
    }

    try {
      // Update user's password
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password,
        email_confirm: true, // Ensure email is confirmed when resetting password
      });

      if (updateError) {
        throw updateError;
      }

      // Mark the verification code as verified
      const { error: markVerifiedError } = await supabase
        .from('password_reset_verifications')
        .update({ verified: true })
        .eq('id', verificationData.id);

      if (markVerifiedError) {
        console.error('Error marking code as verified:', markVerifiedError);
        // Continue anyway since the password was updated successfully
      }

      return NextResponse.json({
        success: true,
        message: 'Password has been reset successfully',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      // Handle AuthError specifically
      if (error instanceof AuthError) {
        return NextResponse.json(
          { error: 'Failed to update password', details: error.message },
          { status: 500 }
        );
      }
      // Handle other error types
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { error: 'Failed to update password', details: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in reset password verification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: errorMessage },
      { status: 500 }
    );
  }
}
