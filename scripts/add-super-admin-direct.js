// Script to create a super admin user with specified email
// Usage: node scripts/add-super-admin-direct.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createSuperAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Supabase environment variables are not defined in .env.local');
    process.exit(1);
  }

  // Email and password for the super admin
  const email = 'test@admin.com';
  const password = 'Temp123456!'; // Temporary password to be changed after first login

  try {
    console.log('Creating Supabase client with service role...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already exists by querying the auth.users table
    console.log(`Checking if user ${email} already exists...`);
    const { data: existingUsers, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', email)
      .limit(1);

    if (usersError) {
      // Try alternative approach if the above fails
      console.log('Using alternative approach to check user existence...');
      const {
        data: { users },
        error: listError,
      } = await supabase.auth.admin.listUsers();

      if (listError) {
        console.error('Error listing users:', listError);
        process.exit(1);
      }

      const existingUser = users.find(user => user.email === email);

      if (existingUser) {
        // User exists, update it
        console.log(`User ${email} already exists. Updating user...`);
        const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
          password,
          user_metadata: { role: 'super_admin', status: 'active' },
        });

        if (updateError) {
          console.error('Error updating user:', updateError);
          process.exit(1);
        }

        // Set email confirmation directly in the database
        await setEmailConfirmation(supabase, existingUser.id);

        outputResult(email, password, existingUser.id);
        return;
      }
    } else if (existingUsers && existingUsers.length > 0) {
      // User exists, update it through admin API
      const userId = existingUsers[0].id;
      console.log(`User ${email} already exists with ID ${userId}. Updating user...`);

      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password,
        user_metadata: { role: 'super_admin', status: 'active' },
      });

      if (updateError) {
        console.error('Error updating user:', updateError);
        process.exit(1);
      }

      // Set email confirmation directly in the database
      await setEmailConfirmation(supabase, userId);

      outputResult(email, password, userId);
      return;
    }

    // Create new user
    console.log(`Creating new super admin user with email ${email}...`);
    const { data, error: createError } = await supabase.auth.admin.createUser({
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

    // Set email confirmation directly in the database
    await setEmailConfirmation(supabase, data.user.id);

    outputResult(email, password, data.user.id);
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    process.exit(1);
  }
}

// Helper function to set email confirmation timestamp
async function setEmailConfirmation(supabase, userId) {
  try {
    // Try with RPC first
    const { error: rpcError } = await supabase.rpc('admin_confirm_user', {
      user_id: userId,
    });

    if (rpcError) {
      console.log('RPC method failed, trying direct SQL...');
      // Fallback to direct SQL if RPC isn't available
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = '${userId}';`,
      });

      if (sqlError) {
        console.error('Error confirming email via SQL:', sqlError);
        console.log(
          'User was created but email confirmation may have failed. Manual confirmation required.'
        );
      }
    }
  } catch (error) {
    console.error('Error in email confirmation:', error);
  }
}

// Helper function to output the result
function outputResult(email, password, userId) {
  console.log('\n========================================');
  console.log('         SUPER ADMIN CREATED            ');
  console.log('========================================\n');
  console.log('Account Details:');
  console.log(`Email:     ${email}`);
  console.log(`Password:  ${password}`);
  console.log(`User ID:   ${userId}`);
  console.log(`Role:      super_admin`);
  console.log(`Status:    active`);
  console.log(`Email Confirmed: YES\n`);
  console.log(
    'IMPORTANT: This password is temporary. Please change it immediately after first login.'
  );
}

createSuperAdmin();
