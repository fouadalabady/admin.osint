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

// POST endpoint to create a new user or update user attributes
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

    const body = await request.json();
    
    // Determine the action based on the request body
    if (body.name && body.email) {
      // This is a user creation request
      return await createUser(body, session);
    } else if (body.userId && body.action) {
      // This is a user update request
      return await updateUser(body, session);
    } else {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error managing user:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to manage user'
    }, { status: 500 });
  }
}

// Helper function to create a new user
async function createUser(data: any, session: any) {
  const { name, email, role = 'user' } = data;
  
  // Validate input
  if (!email || !name) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }
  
  // Only super_admin can create other super_admin users
  if (role === 'super_admin' && session.user.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Only super admins can create super admin accounts' },
      { status: 403 }
    );
  }
  
  try {
    const supabase = createServerSupabaseClient();
    
    // Generate a secure random password (user will reset via email)
    const password = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    
    // Create the user in Supabase Auth
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        name,
        role,
        status: 'active',
        email_verified: true
      }
    });
    
    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    
    // Store additional user data in public.users table
    if (userData.user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: userData.user.id,
          user_metadata: { name, email_verified: true },
          role,
          status: 'active',
        }]);
      
      if (insertError) {
        console.error('Error inserting to users table:', insertError);
        // User was created in auth but not in public schema
        // We could roll back, but it's better to proceed and just log the error
      }
    }
    
    // Send password reset email so user can set their own password
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXTAUTH_URL}/auth/reset-password`,
    });
    
    if (resetError) {
      console.error('Error sending password reset:', resetError);
      // User is created but might not get the reset email
    }
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully. A password reset email has been sent.',
      userId: userData.user?.id,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create user' 
    }, { status: 500 });
  }
}

// Helper function to update a user's attributes
async function updateUser(data: any, session: any) {
  const { userId, action, value } = data;

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
      
      // Also update in the public.users table
      await supabase
        .from('users')
        .update({ status: value })
        .eq('id', userId);
        
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
      
      // Also update in the public.users table
      await supabase
        .from('users')
        .update({ role: value })
        .eq('id', userId);
        
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

      // Delete from public.users table first (it has a foreign key constraint)
      await supabase
        .from('users')
        .delete()
        .eq('id', userId);
        
      // Then delete from auth.users
      result = await supabase.auth.admin.deleteUser(userId);
      break;

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  if (result?.error) {
    console.error(`Error performing ${action}:`, result.error);
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `User ${action === 'deleteUser' ? 'deleted' : 'updated'} successfully`,
    action,
    userId,
  });
}
