// This file is used to prepare the runtime environment before the app starts
// It helps prevent invalid URL errors during build time by ensuring environment variables
// are properly handled

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run in Node.js environment
    
    // Check if we're in a production build environment
    const isProductionBuild = process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (isProductionBuild) {
      console.log('Build-time environment detected, skipping actual auth initialization');
      
      // Set placeholder values that will be replaced at runtime
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder-url-will-be-replaced.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'placeholder-key-will-be-replaced';
      
      // Prevent NextAuth from validating URLs during build
      process.env.SKIP_AUTH_VALIDATION = 'true';
    }
  }
} 