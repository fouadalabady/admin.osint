import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { Database } from "./types";

export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    cookies: {
      get: (name: string) => cookies().get(name)?.value,
      set: () => {}, // No-op since we're on the server
      remove: () => {}, // No-op since we're on the server
    },
  });
}; 