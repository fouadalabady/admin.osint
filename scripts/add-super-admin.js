// Script to add a super admin user
// Usage: node scripts/add-super-admin.js

const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function addSuperAdmin() {
  const email = 'fouadelababdy@gmail.com'; // The email to make a super admin
  const adminKey = process.env.ADMIN_ACTIVATION_KEY;

  if (!adminKey) {
    console.error('Error: ADMIN_ACTIVATION_KEY is not defined in .env.local');
    process.exit(1);
  }

  try {
    // First, check if the local server is running
    console.log('Checking if the server is running...');

    try {
      await fetch('http://localhost:3000');
      console.log('Server is running.');
    } catch (error) {
      console.error(
        'Error: The local server is not running. Please start the server with "npm run dev"'
      );
      process.exit(1);
    }

    console.log(`Attempting to add super admin role to ${email}...`);

    const response = await fetch('http://localhost:3000/api/auth/activate-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        adminKey,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error:', result.error);
      process.exit(1);
    }

    console.log('Success!');
    console.log('User details:', result.user);
    console.log(`${email} is now a super admin.`);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

addSuperAdmin();
