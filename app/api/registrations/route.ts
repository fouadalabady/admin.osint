import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';
import { createServerSupabaseClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import { PostgrestError } from '@supabase/supabase-js';

// Get registration requests with filtering
export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin or super_admin can view registrations
    if (!['admin', 'super_admin'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse status filter from query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    // Get Supabase admin client
    const supabase = createServerSupabaseClient();

    // Fetch registration requests
    const { data, error } = await supabase
      .from('user_registration_requests')
      .select(
        `
        *,
        user:user_id (
          email
        )
      `
      )
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    
    // Handle PostgrestError
    if (error instanceof PostgrestError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Handle other error types
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch registrations';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Update registration status (approve/reject)
export async function PUT(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin or super_admin can update registrations
    if (!['admin', 'super_admin'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, status, notes } = await request.json();

    if (!userId || !status) {
      return NextResponse.json({ error: 'User ID and status are required' }, { status: 400 });
    }

    // Validate status
    if (!['active', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'active' or 'rejected'" },
        { status: 400 }
      );
    }

    // Get Supabase admin client
    const supabase = createServerSupabaseClient();

    // First, get the user details to have the email
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user metadata based on status
    const { error: updateUserError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        status,
        role: status === 'active' ? 'user' : 'rejected', // Default to 'user' role when approving
      },
    });

    if (updateUserError) {
      console.error('Error updating user:', updateUserError);
      throw updateUserError;
    }

    // Get the requested role from the registration request
    const { data: registrationData, error: registrationError } = await supabase
      .from('user_registration_requests')
      .select('requested_role')
      .eq('user_id', userId)
      .single();

    if (registrationError) {
      console.error('Error fetching registration request:', registrationError);
    } else if (status === 'active') {
      // Update the user's role to the requested role
      const { error: roleUpdateError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          role: registrationData.requested_role,
          status: 'active',
        },
      });

      if (roleUpdateError) {
        console.error('Error updating user role:', roleUpdateError);
      }
    }

    // Update registration request status
    const { error: updateError } = await supabase
      .from('user_registration_requests')
      .update({
        status,
        admin_notes: notes,
        reviewed_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating registration request:', updateError);
      throw updateError;
    }

    // Send email notification to the user
    const emailSubject =
      status === 'active'
        ? 'Your Account Registration Has Been Approved'
        : 'Your Account Registration Has Been Rejected';

    const emailHtml =
      status === 'active'
        ? `
        <h1>Account Approved</h1>
        <p>Congratulations! Your account registration has been approved.</p>
        <p>You can now log in to the system with your email and password.</p>
        ${notes ? `<p><strong>Admin Notes:</strong> ${notes}</p>` : ''}
        <p><a href="${process.env.NEXTAUTH_URL}/auth">Login to Your Account</a></p>
      `
        : `
        <h1>Account Registration Rejected</h1>
        <p>We regret to inform you that your account registration has been rejected.</p>
        ${notes ? `<p><strong>Reason:</strong> ${notes}</p>` : ''}
        <p>If you believe this is an error, please contact our support team.</p>
      `;

    await sendEmail({
      to: userData.email,
      subject: emailSubject,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: `User registration ${status === 'active' ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    console.error('Error updating registration status:', error);
    
    // Handle PostgrestError
    if (error instanceof PostgrestError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Handle other error types
    const errorMessage = error instanceof Error ? error.message : 'Failed to update registration status';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
