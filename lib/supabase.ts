import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only throw errors at runtime, not during build time
const isBuildPhase = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'build';

if (!supabaseUrl || !supabaseAnonKey) {
  if (!isBuildPhase) {
    throw new Error('Missing required Supabase environment variables');
  }
  console.warn('Missing Supabase environment variables during build - this is expected');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Create a server-side supabase client (for use in API functions and server components only)
export const createServerSupabaseClient = () => {
  if (!supabaseServiceRoleKey && !isBuildPhase) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  return createClient(
    supabaseUrl || 'https://placeholder-url.supabase.co',
    supabaseServiceRoleKey || 'placeholder-service-key'
  );
}; 