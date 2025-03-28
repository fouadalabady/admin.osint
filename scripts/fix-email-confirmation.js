// Script to directly set email_confirmed_at in the Supabase database
// Usage: node scripts/fix-email-confirmation.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixEmailConfirmation() {
  const email = 'fouadelababdy@gmail.com'; // The email to fix

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

    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    console.log(`User found: ${user.id}`);
    console.log('Current email_confirmed_at:', user.email_confirmed_at);

    // Use direct SQL to update the auth.users table
    console.log('Executing SQL to directly set email_confirmed_at...');

    // Execute SQL using RPC to set email_confirmed_at
    const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE auth.users 
        SET email_confirmed_at = NOW() 
        WHERE id = '${user.id}';
        
        -- Also ensure user_metadata has the right values
        UPDATE auth.users
        SET raw_user_meta_data = jsonb_build_object(
          'role', 'super_admin',
          'status', 'active'
        )
        WHERE id = '${user.id}';
      `,
    });

    if (sqlError) {
      console.error('Error executing SQL:', sqlError);

      // Try an alternative approach if RPC fails
      console.log('Trying alternative approach using admin API...');

      // Use the admin API to set email_confirm to true
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          email_confirm: true,
          user_metadata: {
            role: 'super_admin',
            status: 'active',
          },
        }
      );

      if (updateError) {
        console.error('Error updating user:', updateError);
        process.exit(1);
      }

      console.log('User updated using admin API');
    } else {
      console.log('SQL executed successfully');
    }

    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase.auth.admin.getUserById(user.id);

    if (verifyError) {
      console.error('Error verifying user:', verifyError);
      process.exit(1);
    }

    console.log('Updated user details:', {
      id: verifyData.user.id,
      email: verifyData.user.email,
      email_confirmed_at: verifyData.user.email_confirmed_at,
      role: verifyData.user.user_metadata?.role || 'none',
      status: verifyData.user.user_metadata?.status || 'none',
    });

    if (verifyData.user.email_confirmed_at) {
      console.log('Success! Email is now confirmed.');
    } else {
      console.log('Warning: Email confirmation still not set.');
      console.log('As a last resort, we can try recreating the user...');

      // Ask for confirmation before recreating
      console.log('If you want to try recreating the user, run the recreate-super-admin.js script');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

fixEmailConfirmation();
