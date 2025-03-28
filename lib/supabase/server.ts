import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = (cookieStore?: ReturnType<typeof cookies>) => {
  const cookieObj = cookieStore || cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieObj.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieObj.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieObj.set({ name, value: '', ...options });
        },
      },
    }
  );
};

// Alias for backward compatibility
export const createServerSupabaseClient = createClient; 