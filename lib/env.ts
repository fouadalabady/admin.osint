export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url-will-be-replaced.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-will-be-replaced',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  auth: {
    skipValidation: process.env.SKIP_AUTH_VALIDATION === 'true',
  },
  admin: {
    activationKey: process.env.ADMIN_ACTIVATION_KEY,
  },
}; 