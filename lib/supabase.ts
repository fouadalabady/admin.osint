import { createClient } from '@supabase/supabase-js';

// Safely get environment variables with fallbacks
const getEnv = (key: string, fallback: string = '') => {
  // In Next.js, process.browser is deprecated but still works for checking client-side
  const isBrowser = typeof window !== 'undefined';
  const isBuildTime = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' || 
                     process.env.VERCEL_ENV === 'build' || 
                     process.env.NODE_ENV === 'production';
  
  // During build time, return fallbacks to avoid errors
  if (isBuildTime && !isBrowser) {
    return fallback;
  }
  
  return process.env[key] || fallback;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder-url.supabase.co');
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'placeholder-key');
const supabaseServiceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY', 'placeholder-service-key');

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a server-side supabase client (for use in API functions and server components only)
export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}; 