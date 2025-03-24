// Script to confirm a user's email in Supabase
// Usage: node scripts/confirm-user-email.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function confirmUserEmail() {
  const email = 'fouadelababdy@gmail.com'; // The email to confirm
  
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
    
    // Update user to confirm email
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { 
        email_confirm: true,
        user_metadata: {
          ...user.user_metadata,
          role: "super_admin",
          status: "active"
        }
      }
    );
    
    if (error) {
      console.error('Error confirming email:', error);
      process.exit(1);
    }
    
    // Verify the user's email is now confirmed
    const { data: updatedData, error: verifyError } = await supabase.auth.admin.getUserById(user.id);
    
    if (verifyError) {
      console.error('Error verifying user email confirmation:', verifyError);
      process.exit(1);
    }
    
    if (updatedData.user.email_confirmed_at) {
      console.log('Success! Email confirmed.');
      console.log('User details:', {
        id: updatedData.user.id,
        email: updatedData.user.email,
        email_confirmed_at: updatedData.user.email_confirmed_at,
        role: updatedData.user.user_metadata?.role || 'none',
        status: updatedData.user.user_metadata?.status || 'none'
      });
    } else {
      console.log('Warning: Email confirmation timestamp not set. The user may still have issues logging in.');
      console.log('You may need to delete and recreate the user with different settings.');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

confirmUserEmail(); 