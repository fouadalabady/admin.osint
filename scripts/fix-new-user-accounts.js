// Script to diagnose and fix email confirmation issues for new user accounts
// Usage: node scripts/fix-new-user-accounts.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixNewUserAccounts() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Supabase environment variables are not defined in .env.local');
    process.exit(1);
  }

  try {
    console.log('Creating Supabase client with service role...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // List all users
    console.log('Fetching all users...');
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      process.exit(1);
    }

    console.log(`Found ${userList.users.length} total users in the system.`);

    // Filter users without email confirmation
    const unconfirmedUsers = userList.users.filter(user => !user.email_confirmed_at);
    console.log(`Found ${unconfirmedUsers.length} users without email confirmation.`);

    // Filter users with pending status
    const pendingUsers = userList.users.filter(user => user.user_metadata?.status === 'pending');
    console.log(`Found ${pendingUsers.length} users with pending status.`);

    if (unconfirmedUsers.length === 0 && pendingUsers.length === 0) {
      console.log(
        'No users need fixing. All users have confirmed emails and no users are pending.'
      );
      process.exit(0);
    }

    console.log('\nUsers without email confirmation:');
    unconfirmedUsers.forEach(user => {
      console.log(
        `- ${user.email} (ID: ${user.id}, Status: ${user.user_metadata?.status || 'none'}, Role: ${
          user.user_metadata?.role || 'none'
        })`
      );
    });

    console.log('\nUsers with pending status:');
    pendingUsers.forEach(user => {
      console.log(
        `- ${user.email} (ID: ${user.id}, Email confirmed: ${
          user.email_confirmed_at ? 'Yes' : 'No'
        }, Role: ${user.user_metadata?.role || 'none'})`
      );
    });

    // Offer to fix all users
    console.log('\nWould you like to fix these users? (y/n)');
    // Since this is a script and not interactive, we'll proceed automatically
    console.log('Proceeding to fix all users automatically...');

    // Use the exec_sql RPC function to fix all unconfirmed users
    if (unconfirmedUsers.length > 0) {
      console.log('\nFixing users without email confirmation...');

      for (const user of unconfirmedUsers) {
        console.log(`Fixing email confirmation for ${user.email}...`);

        const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
          sql: `
            UPDATE auth.users 
            SET email_confirmed_at = NOW() 
            WHERE id = '${user.id}';
          `,
        });

        if (sqlError) {
          console.error(`Error fixing ${user.email}:`, sqlError);
        } else {
          console.log(`Fixed email confirmation for ${user.email}`);
        }
      }
    }

    // Fix users with pending status
    if (pendingUsers.length > 0) {
      console.log('\nFixing users with pending status...');

      for (const user of pendingUsers) {
        console.log(`Updating status to active for ${user.email}...`);

        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            user_metadata: {
              ...user.user_metadata,
              status: 'active',
            },
          }
        );

        if (updateError) {
          console.error(`Error updating status for ${user.email}:`, updateError);
        } else {
          console.log(`Updated status to active for ${user.email}`);
        }
      }
    }

    // Verify fixes
    console.log('\nVerifying fixes...');
    const { data: verifyList, error: verifyError } = await supabase.auth.admin.listUsers();

    if (verifyError) {
      console.error('Error verifying users:', verifyError);
      process.exit(1);
    }

    const stillUnconfirmed = verifyList.users.filter(user => !user.email_confirmed_at);
    const stillPending = verifyList.users.filter(user => user.user_metadata?.status === 'pending');

    console.log(`After fixes: ${stillUnconfirmed.length} users still without email confirmation.`);
    console.log(`After fixes: ${stillPending.length} users still with pending status.`);

    console.log('\nFix completed. Users should now be able to log in.');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

fixNewUserAccounts();
