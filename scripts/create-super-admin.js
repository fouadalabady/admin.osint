// Script to create a super admin user with specified email
// Usage: node scripts/create-super-admin.js

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
    
    // Check if user already exists
    console.log(`Checking if user ${email} already exists...`);
    const { data: existingUser, error: checkError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (checkError && !checkError.message.includes('User not found')) {
      console.error('Error checking existing user:', checkError);
      process.exit(1);
    }
    
    let userId;
    
    // If user exists, update it
    if (existingUser?.user) {
      console.log(`User ${email} already exists. Updating user...`);
      userId = existingUser.user.id;
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          password: password,
          email_confirm: true,
          user_metadata: {
            role: 'super_admin',
            status: 'active'
          }
        }
      );
      
      if (updateError) {
        console.error('Error updating user:', updateError);
        process.exit(1);
      }
    } 
    // Otherwise create a new user
    else {
      console.log(`Creating new super admin user with email ${email}...`);
      const { data, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: password,
        email_confirm: true,
        user_metadata: {
          role: 'super_admin',
          status: 'active'
        }
      });
      
      if (createError) {
        console.error('Error creating user:', createError);
        process.exit(1);
      }
      
      userId = data.user.id;
    }
    
    // Set email confirmation timestamp directly in the database
    // This ensures that the user can log in immediately
    const { error: confirmError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE auth.users 
        SET email_confirmed_at = NOW() 
        WHERE id = '${userId}';
      `
    });
    
    if (confirmError) {
      console.error('Error confirming email:', confirmError);
      console.log('User was created but email confirmation may have failed.');
    }
    
    // Output the result
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
    console.log('IMPORTANT: This password is temporary. Please change it immediately after first login.');
    
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    process.exit(1);
  }
}

createSuperAdmin(); 