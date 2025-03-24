// Script to automatically fix unconfirmed emails for all users
// This script checks if a user has verified their email through OTP but their email_confirm flag is false
// Usage: node scripts/fix-all-user-emails.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixAllUserEmails() {
  // Get Supabase connection details from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Supabase environment variables are not defined in .env.local');
    process.exit(1);
  }
  
  try {
    console.log('Creating Supabase client with service role...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get all users
    console.log('Fetching all users...');
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      process.exit(1);
    }
    
    console.log(`Total users found: ${userList.users.length}`);
    
    // Find users with unconfirmed emails
    const unconfirmedUsers = userList.users.filter(user => 
      user.email_confirmed_at === null || new Date(user.email_confirmed_at).getTime() === 0
    );
    
    console.log(`Users with unconfirmed emails: ${unconfirmedUsers.length}`);
    
    if (unconfirmedUsers.length === 0) {
      console.log('No users with unconfirmed emails found. Nothing to fix!');
      process.exit(0);
    }
    
    // For each unconfirmed user, check if they have verified their email through OTP
    let fixedCount = 0;
    
    for (const user of unconfirmedUsers) {
      console.log(`Checking user ${user.email} (${user.id})...`);
      
      // Check if user has a verified OTP for email verification
      const { data: otpVerifications, error: otpError } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('purpose', 'email_verification')
        .not('verified_at', 'is', null)
        .limit(1);
      
      // Also check if user has email_verified flag in registration requests
      const { data: registrationRequests, error: regError } = await supabase
        .from('user_registration_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('email_verified', true)
        .limit(1);
      
      const hasVerifiedOtp = otpVerifications && otpVerifications.length > 0;
      const hasVerifiedRegistration = registrationRequests && registrationRequests.length > 0;
      
      if (hasVerifiedOtp || hasVerifiedRegistration) {
        console.log(`User ${user.email} has verified their email but email_confirm is false. Fixing...`);
        
        // Update user to confirm email
        const { data, error } = await supabase.auth.admin.updateUserById(
          user.id,
          { email_confirm: true }
        );
        
        if (error) {
          console.error(`Error confirming email for ${user.email}:`, error);
          continue;
        }
        
        console.log(`✅ Successfully confirmed email for ${user.email}`);
        fixedCount++;
      } else {
        console.log(`User ${user.email} has not verified their email through OTP. Skipping.`);
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total users processed: ${unconfirmedUsers.length}`);
    console.log(`Total users fixed: ${fixedCount}`);
    console.log(`Remaining unfixed: ${unconfirmedUsers.length - fixedCount}`);
    
    if (unconfirmedUsers.length - fixedCount > 0) {
      console.log(`\nNote: The remaining ${unconfirmedUsers.length - fixedCount} users have not verified their email through OTP yet.`);
      console.log(`They will need to complete the email verification process or have their email manually confirmed.`);
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

fixAllUserEmails(); 