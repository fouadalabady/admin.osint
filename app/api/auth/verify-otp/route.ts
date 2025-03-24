import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyOTP, isOTPExpired } from '@/lib/otp';
import { sendEmail } from '@/lib/email';
import { SupabaseClient } from '@supabase/supabase-js';

// Type definition for admin user
interface AdminUser {
  email: string;
  raw_user_meta_data: {
    role?: string;
    [key: string]: unknown;
  };
}

export async function POST(request: Request) {
  try {
    const { userId, email, otp, purpose = 'email_verification' } = await request.json();

    // Validate inputs
    if (!userId || !email || !otp) {
      return NextResponse.json({ error: 'User ID, email, and OTP are required' }, { status: 400 });
    }

    // Get Supabase admin client
    const supabase = createServerSupabaseClient();

    // Get the latest OTP verification record for this user and purpose
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('email', email)
      .eq('purpose', purpose)
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError) {
      console.error('Error fetching OTP verification:', otpError);
      return NextResponse.json({ error: 'No pending verification found' }, { status: 404 });
    }

    // Check if OTP is expired
    if (isOTPExpired(new Date(otpRecord.expires_at).getTime())) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (!verifyOTP(otp, otpRecord.otp_hash, email)) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Mark OTP as verified
    const { error: updateError } = await supabase
      .from('otp_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', otpRecord.id);

    if (updateError) {
      console.error('Error updating OTP verification:', updateError);
      return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
    }

    // If this is email verification for registration, update the registration request
    if (purpose === 'email_verification') {
      const { error: registrationError } = await supabase
        .from('user_registration_requests')
        .update({ email_verified: true })
        .eq('user_id', userId);

      if (registrationError) {
        console.error('Error updating registration request:', registrationError);
        return NextResponse.json(
          { error: 'Failed to update registration status' },
          { status: 500 }
        );
      }

      // Update the user's email_confirm status in Supabase Auth
      const { error: updateUserError } = await supabase.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });

      if (updateUserError) {
        console.error('Error confirming user email in Auth:', updateUserError);
        // Don't fail the request if this fails, but log the error
      } else {
        console.log(`Successfully confirmed email for user ${userId} in Supabase Auth`);
      }

      // Notify admins about the new registration that needs approval
      await notifyAdminsAboutNewRegistration(supabase, userId, email);
    }

    return NextResponse.json({
      success: true,
      message:
        purpose === 'email_verification'
          ? 'Email verified successfully. Your registration is pending admin approval.'
          : 'Verification completed successfully.',
    });
  } catch (error) {
    console.error('Error in OTP verification process:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to verify OTP';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Helper function to notify admins about new registrations
async function notifyAdminsAboutNewRegistration(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string
) {
  try {
    // Get all admin/super_admin users
    const { data: admins, error } = await supabase
      .from('auth.users')
      .select('email, raw_user_meta_data')
      .or('raw_user_meta_data->role.eq.admin,raw_user_meta_data->role.eq.super_admin');

    if (error || !admins?.length) {
      console.error('Error fetching admins:', error);
      return;
    }

    const adminEmails = admins
      .filter(
        (admin: AdminUser) =>
          admin.raw_user_meta_data?.role === 'admin' ||
          admin.raw_user_meta_data?.role === 'super_admin'
      )
      .map((admin: AdminUser) => admin.email);

    if (adminEmails.length > 0) {
      // Send notifications to admins
      for (const adminEmail of adminEmails) {
        await sendEmail({
          to: adminEmail,
          subject: 'New User Registration Requires Approval',
          html: `
            <h1>New User Registration</h1>
            <p>A new user has registered and verified their email address. Their account requires your approval:</p>
            <p><strong>User Email:</strong> ${userEmail}</p>
            <p><strong>User ID:</strong> ${userId}</p>
            <p>Please log in to the admin dashboard to review and approve or reject this registration.</p>
            <p><a href="${process.env.NEXTAUTH_URL}/dashboard/registrations">Go to Registrations Dashboard</a></p>
          `,
        });
      }
    }
  } catch (err) {
    console.error('Error notifying admins:', err);
    // Don't throw here, as this is a secondary operation
  }
}
