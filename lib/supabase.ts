import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url-will-be-replaced.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-will-be-replaced';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only throw error in non-build environments
if ((!supabaseUrl || !supabaseAnonKey) && process.env.NODE_ENV !== 'production') {
  throw new Error('Missing required Supabase environment variables');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Add runtime detection to avoid build-time validation
    autoRefreshToken: true,
    persistSession: true,
  }
});

// Create a server-side supabase client (for use in API functions and server components only)
export const createServerSupabaseClient = () => {
  if (!supabaseServiceRoleKey && process.env.NODE_ENV !== 'production') {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  return createClient(
    supabaseUrl, 
    supabaseServiceRoleKey || 'placeholder-service-key-will-be-replaced',
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      }
    }
  );
};
