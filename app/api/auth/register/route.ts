import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { generateOTP, hashOTP, getOTPExpiry } from '@/lib/otp';
import { sendEmail } from '@/lib/email';
import { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { DatabaseError } from '@/types/auth';

interface TableCheckResult {
  otpTableExists: boolean;
  registrationTableExists: boolean;
  errors: {
    otpTableError: DatabaseError | null;
    registrationTableError: DatabaseError | null;
  };
}

async function tablesExist(supabase: SupabaseClient): Promise<TableCheckResult> {
  // Check if the OTP verifications table exists
  const { data: otpData, error: otpError } = await supabase
    .from('otp_verifications')
    .select('id')
    .limit(1)
    .throwOnError();

  // Check if the registration requests table exists
  const { data: regData, error: regError } = await supabase
    .from('user_registration_requests')
    .select('id')
    .limit(1)
    .throwOnError();

  return {
    otpTableExists: !!otpData,
    registrationTableExists: !!regData,
    errors: {
      // Use type assertion to convert PostgrestError to DatabaseError
      otpTableError: otpError as DatabaseError | null,
      registrationTableError: regError as DatabaseError | null,
    },
  };
}

// Add explicit runtime configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, password, role = 'user' } = await request.json();

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Get Supabase admin client
    const supabase = createServerSupabaseClient();

    // Check if required tables exist
    const { otpTableExists, registrationTableExists, errors } = await tablesExist(supabase);

    if (!otpTableExists || !registrationTableExists) {
      console.error('Required tables do not exist:', {
        otpTableExists,
        registrationTableExists,
        errors,
      });
      return NextResponse.json(
        {
          error: 'Database setup incomplete. Please run the migrations first.',
          details: errors,
        },
        { status: 500 }
      );
    }

    // Create user with Supabase auth
    const {
      data: { user },
      error: signUpError,
    } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // We'll handle email confirmation ourselves
      user_metadata: { role, status: 'pending' },
    });

    if (signUpError) {
      console.error('Error creating user:', signUpError);
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Generate OTP
    const otp = generateOTP(6);
    const otpHash = hashOTP(otp, email);
    const expiresAt = getOTPExpiry(15); // 15 minutes expiry

    try {
      // Store OTP verification record
      const { error: otpError } = await supabase.from('otp_verifications').insert({
        user_id: user.id,
        email: user.email!,
        otp_hash: otpHash,
        purpose: 'email_verification',
        expires_at: new Date(expiresAt).toISOString(),
      });

      if (otpError) {
        console.error('Error storing OTP verification:', otpError);
        throw new Error(otpError.message || 'Failed to store verification details');
      }
    } catch (otpInsertError: unknown) {
      const error =
        otpInsertError instanceof Error ? otpInsertError : new Error(String(otpInsertError));

      console.error('Failed to insert OTP verification:', error);

      // Attempt to delete the user since we couldn't complete registration
      await supabase.auth.admin.deleteUser(user.id);

      return NextResponse.json(
        {
          error: 'Failed to store verification details',
          details: error.message,
        },
        { status: 500 }
      );
    }

    try {
      // Create registration request
      const { error: requestError } = await supabase.from('user_registration_requests').insert({
        user_id: user.id,
        status: 'pending',
        requested_role: role,
      });

      if (requestError) {
        console.error('Error creating registration request:', requestError);
        throw new Error(requestError.message || 'Failed to create registration request');
      }
    } catch (registrationError: unknown) {
      const error =
        registrationError instanceof Error
          ? registrationError
          : new Error(String(registrationError));

      console.error('Failed to insert registration request:', error);

      // Clean up - delete the user and OTP record
      await supabase.from('otp_verifications').delete().eq('user_id', user.id);
      await supabase.auth.admin.deleteUser(user.id);

      return NextResponse.json(
        {
          error: 'Failed to create registration request',
          details: error.message,
        },
        { status: 500 }
      );
    }

    try {
      // Send verification email
      const emailResult = await sendEmail({
        to: email,
        subject: 'Verify Your Email Address',
        html: `
          <h1>Verify Your Email Address</h1>
          <p>Thank you for registering. Please use the following verification code to complete your registration:</p>
          <h2 style="background: #f4f4f4; padding: 10px; font-size: 24px; text-align: center; letter-spacing: 5px;">${otp}</h2>
          <p>This code will expire in 15 minutes.</p>
          <p>Please note that your account registration is subject to admin approval after email verification.</p>
          <p>Thank you,<br>The Admin Dashboard Team</p>
        `,
      });

      if (!emailResult.success) {
        console.error('Error sending verification email:', emailResult.error);
        // We still continue as the user is created, but log the error
      }
    } catch (emailError: unknown) {
      const error = emailError instanceof Error ? emailError : new Error(String(emailError));

      console.error('Failed to send verification email:', error);
      // We still continue as the user is created, but log the error
    }

    return NextResponse.json({
      message: 'Registration initiated. Please check your email for verification code.',
      userId: user.id,
      status: 'pending',
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));

    console.error('Error in registration process:', err);
    return NextResponse.json({ error: err.message || 'Failed to register user' }, { status: 500 });
  }
}
