import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { UserRole } from '@/types/auth';

// Create a direct Supabase client using env variables for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Only admins and super admins can invite users
    if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const { email, name, role = 'user' } = await request.json();
    
    // Validate input
    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }
    
    // Only super_admin can create admin users
    if ((role === 'admin' || role === 'super_admin') && session.user.role !== 'super_admin') {
      return NextResponse.json({ 
        error: 'Only super admins can invite admin users'
      }, { status: 403 });
    }
    
    // Check if user already exists
    const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers({
      perPage: 1,
      page: 1,
    });
    
    if (listError) {
      console.error('Error checking existing users:', listError);
      return NextResponse.json({ error: 'Failed to check if user exists' }, { status: 500 });
    }
    
    // Find the user with the matching email
    const existingUser = existingUsers.users.find(user => user.email === email);
    let userId: string;
    
    // If user doesn't exist, create a new one
    if (!existingUser) {
      // Create a secure random password (won't be used since we're using magic link)
      const password = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
      
      // Create user with Supabase admin API
      const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm the email
        user_metadata: {
          name,
          role: role as UserRole,
          status: 'active',
          invited_by: session.user.id,
          invited_at: new Date().toISOString(),
        }
      });
      
      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
      
      if (!userData.user) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
      
      userId = userData.user.id;
      
      // Store additional user data in public.users table
      const supabase = createServerSupabaseClient();
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          role: role as UserRole,
          status: 'active',
          user_metadata: { 
            name,
            invited_by: session.user.id,
            invited_at: new Date().toISOString(),
          },
        }]);
      
      if (insertError) {
        console.error('Error inserting to users table:', insertError);
        // Log error but continue since auth user is created
      }
    } else {
      // User already exists
      userId = existingUser.id;
      console.log(`User ${email} already exists with ID ${userId}, sending magic link`);
      
      // Optionally update user metadata or role if needed
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            name,
            role: role as UserRole,
            status: 'active',
            reinvited_by: session.user.id,
            reinvited_at: new Date().toISOString(),
          }
        }
      );
      
      if (updateError) {
        console.error('Error updating existing user:', updateError);
        // Continue despite error
      }
      
      // Update entry in users table as well
      const supabase = createServerSupabaseClient();
      const { error: updateDbError } = await supabase
        .from('users')
        .upsert([{
          id: userId,
          role: role as UserRole,
          status: 'active',
          user_metadata: { 
            name,
            reinvited_by: session.user.id,
            reinvited_at: new Date().toISOString(),
          },
        }], { onConflict: 'id' });
      
      if (updateDbError) {
        console.error('Error updating users table:', updateDbError);
        // Continue despite error
      }
    }
    
    // Generate a magic link for the user to complete their profile
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${process.env.NEXTAUTH_URL}/auth/complete-profile?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`,
      }
    });
    
    if (linkError) {
      console.error('Error generating magic link:', linkError);
      return NextResponse.json({ 
        error: 'User created but failed to generate invitation link'
      }, { status: 500 });
    }
    
    // Send invitation email
    try {
      await sendEmail({
        to: email,
        subject: 'You have been invited to join the OSINT Dashboard',
        html: `
          <h1>Welcome to OSINT Dashboard</h1>
          <p>You have been invited by ${session.user.email} to join the OSINT Dashboard with the role of ${role}.</p>
          <p>To complete your profile setup and set your password, please click the link below:</p>
          <p><a href="${linkData.properties.action_link}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Complete Your Profile</a></p>
          <p>The link will expire in 24 hours.</p>
          <p>If you didn't expect this invitation, please ignore this email.</p>
        `,
      });
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      return NextResponse.json({ 
        warning: 'User created but failed to send invitation email',
        userId: userId
      }, { status: 201 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'User invited successfully. An invitation email has been sent.',
      userId: userId,
      isExistingUser: !!existingUser
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to invite user'
    }, { status: 500 });
  }
} 