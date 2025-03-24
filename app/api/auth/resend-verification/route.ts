import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError || !users) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate OTP verification code
    const { data: otpData, error: otpError } = await supabase
      .from('otp_verifications')
      .insert([
        {
          user_id: user.id,
          email: email,
          expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        }
      ])
      .select()
      .single();

    if (otpError) {
      console.error('Error generating OTP:', otpError);
      return NextResponse.json(
        { error: 'Failed to generate verification code' },
        { status: 500 }
      );
    }

    // Send verification email
    await sendVerificationEmail(email, otpData.otp_code);

    return NextResponse.json(
      { message: 'Verification email sent successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in resend verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
