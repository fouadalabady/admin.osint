import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET endpoint to retrieve all users
export async function GET() {
  try {
    // Check if user is authenticated and has admin privileges
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (session.user.role !== 'super_admin' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get Supabase admin client
    const supabase = createServerSupabaseClient();

    // Fetch all users
    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error listing users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format the user data to include only necessary information
    const formattedUsers = users.users.map(user => ({
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at,
      role: user.user_metadata?.role || 'user',
      status: user.user_metadata?.status || 'pending',
      emailConfirmed: user.email_confirmed_at ? true : false,
    }));

    return NextResponse.json({
      users: formattedUsers,
      count: formattedUsers.length,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST endpoint to update a user's status or role
export async function POST(request: Request) {
  try {
    // Check if user is authenticated and has admin privileges
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (session.user.role !== 'super_admin' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { userId, action, value } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and action are required' }, { status: 400 });
    }

    // Validate actions
    const validActions = ['updateStatus', 'updateRole', 'deleteUser'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get Supabase admin client
    const supabase = createServerSupabaseClient();

    // Get current user data
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let result;

    // Perform the requested action
    switch (action) {
      case 'updateStatus':
        // Prevent modification of super_admin users by non-super_admin
        if (
          userData.user.user_metadata?.role === 'super_admin' &&
          session.user.role !== 'super_admin'
        ) {
          return NextResponse.json(
            { error: 'You cannot modify a super admin account' },
            { status: 403 }
          );
        }

        result = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...userData.user.user_metadata,
            status: value,
          },
        });
        break;

      case 'updateRole':
        // Only super_admin can create other super_admin users
        if (value === 'super_admin' && session.user.role !== 'super_admin') {
          return NextResponse.json(
            { error: 'Only super admins can create super admin accounts' },
            { status: 403 }
          );
        }

        // Prevent modification of super_admin users by non-super_admin
        if (
          userData.user.user_metadata?.role === 'super_admin' &&
          session.user.role !== 'super_admin'
        ) {
          return NextResponse.json(
            { error: 'You cannot modify a super admin account' },
            { status: 403 }
          );
        }

        result = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...userData.user.user_metadata,
            role: value,
          },
        });
        break;

      case 'deleteUser':
        // Prevent deletion of super_admin users by non-super_admin
        if (
          userData.user.user_metadata?.role === 'super_admin' &&
          session.user.role !== 'super_admin'
        ) {
          return NextResponse.json(
            { error: 'You cannot delete a super admin account' },
            { status: 403 }
          );
        }

        result = await supabase.auth.admin.deleteUser(userId);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (result.error) {
      console.error(`Error performing ${action}:`, result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${action === 'deleteUser' ? 'deleted' : 'updated'} successfully`,
      action,
      userId,
    });
  } catch (error) {
    console.error('Error managing user:', error);
    return NextResponse.json({ error: 'Failed to manage user' }, { status: 500 });
  }
}
