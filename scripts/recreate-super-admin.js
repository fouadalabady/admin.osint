// Script to delete and recreate a super admin user
// Usage: node scripts/recreate-super-admin.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function recreateSuperAdmin() {
  const email = 'fouadelababdy@gmail.com'; // The email to recreate
  const password = 'StrongPassword123!'; // New password

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Supabase environment variables are not defined in .env.local');
    process.exit(1);
  }

  try {
    console.log('Creating Supabase client with service role...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists
    console.log(`Checking if user ${email} exists...`);
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      process.exit(1);
    }

    // Find the user with the given email
    const user = userList.users.find(u => u.email === email);

    if (user) {
      console.log(`User found: ${user.id}. Deleting...`);

      // Delete the existing user
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        process.exit(1);
      }

      console.log('User deleted successfully.');
    } else {
      console.log(`No existing user found with email ${email}. Will create new.`);
    }

    // Create new user
    console.log('Creating new super admin user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'super_admin',
        status: 'active',
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      process.exit(1);
    }

    console.log('New super admin user created with ID:', newUser.user.id);

    // Execute a direct SQL command to ensure email_confirmed_at is set
    const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE auth.users 
        SET email_confirmed_at = NOW() 
        WHERE id = '${newUser.user.id}';
      `,
    });

    if (sqlError) {
      console.warn('Warning: Could not execute SQL to directly set email_confirmed_at:', sqlError);
      console.log(
        'The user has still been created, but you may encounter email confirmation issues.'
      );
    } else {
      console.log('Email confirmation time set via SQL.');
    }

    // Verify the user creation
    const { data: verifyData, error: verifyError } = await supabase.auth.admin.getUserById(
      newUser.user.id
    );

    if (verifyError) {
      console.error('Error verifying user:', verifyError);
      process.exit(1);
    }

    console.log('Super admin user details:', {
      id: verifyData.user.id,
      email: verifyData.user.email,
      email_confirmed_at: verifyData.user.email_confirmed_at,
      role: verifyData.user.user_metadata?.role || 'none',
      status: verifyData.user.user_metadata?.status || 'none',
    });

    console.log(
      'IMPORTANT: The password has been set to "StrongPassword123!". Please change it after login.'
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

recreateSuperAdmin();
