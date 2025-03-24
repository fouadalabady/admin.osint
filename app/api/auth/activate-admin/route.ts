import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a direct Supabase client using env variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    console.log('Activate admin endpoint called');
    const { email, adminKey } = await request.json();
    console.log('Email:', email);
    console.log('Admin key matches:', adminKey === process.env.ADMIN_ACTIVATION_KEY);

    // Simple security check - requires an admin key for authorization
    if (adminKey !== process.env.ADMIN_ACTIVATION_KEY) {
      console.log("Admin key doesn't match");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!email) {
      console.log('Email is missing');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Create a direct Supabase client with the service role key
    console.log('Creating direct Supabase client with service role');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, check if the user exists
    console.log('Checking if user exists');
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return NextResponse.json(
        { error: `Failed to list users: ${listError.message}` },
        { status: 500 }
      );
    }

    // Find the user with the given email
    const user = userList.users.find(u => u.email === email);

    if (!user) {
      console.log('User not found');
      return NextResponse.json(
        { error: 'User not found with this email address' },
        { status: 404 }
      );
    }

    console.log('User found:', user.id);
    console.log('Current metadata:', user.user_metadata);

    // Update the user metadata to set status to active
    console.log('Updating user metadata');
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          status: 'active',
          role: user.user_metadata?.role || 'super_admin',
        },
      }
    );

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { error: `Failed to update user: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log('User updated successfully');
    console.log('New metadata:', updatedUser?.user?.user_metadata);

    return NextResponse.json({
      success: true,
      message: 'Admin user activated successfully',
      user: {
        id: updatedUser?.user?.id,
        email: updatedUser?.user?.email,
        metadata: updatedUser?.user?.user_metadata,
      },
    });
  } catch (error) {
    console.error('Error activating admin:', error);
    return NextResponse.json(
      {
        error: `Failed to activate admin user: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
