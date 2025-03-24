# Supabase Local Development Guide

This guide provides detailed instructions for working with Supabase locally in the OSINT Dashboard project, with special emphasis on database migrations and troubleshooting common issues.

## Setting Up Local Supabase

### Prerequisites

- Docker installed and running
- Node.js 18+
- Supabase CLI installed

### Initial Setup

1. Install Supabase CLI globally:
```bash
npm install -g supabase
```

2. Initialize Supabase in your project:
```bash
npx supabase init
```

3. Start Supabase locally:
```bash
npx supabase start
```

This starts several services:
- PostgreSQL database (port 54322)
- Supabase API (port 54321)
- Supabase Studio (port 54323)
- Inbucket for email testing (port 54324)

4. Set environment variables in `.env.local` to use local Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The exact values will be shown in the console after running `supabase start`.

## Working with Migrations

### Migration Structure

Our migration files are located in the `supabase/migrations` directory and follow this naming convention:
```
YYYYMMDD_description.sql
```

Example:
```
20240401000001_create_password_reset_verifications.sql
```

### Creating New Migrations

1. Create a new migration file:
```bash
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_descriptive_name.sql
```

2. Add SQL commands with proper error handling. Always use idempotent operations:
```sql
-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add policy with checks to prevent duplicate policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE schemaname = 'public' 
    AND tablename = 'my_table' 
    AND policyname = 'My policy name'
  ) THEN
    CREATE POLICY "My policy name" ON public.my_table
      FOR SELECT USING (true);
  END IF;
END
$$;
```

### Applying Migrations

Apply all migrations at once:
```bash
npx supabase db reset
```

This will:
1. Wipe your local database
2. Apply all migrations in order
3. Seed the database if a seed file exists

## Database Tables for Password Reset Flow

### password_reset_verifications Table

This table stores one-time passwords (OTP) for the password reset flow:

```sql
CREATE TABLE public.password_reset_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  CONSTRAINT unique_active_code UNIQUE (email, code, type, verified)
);
```

Features:
- Each code has a 1-hour expiration (expires_at)
- Codes are marked as verified after use (verified)
- The type field allows for different verification purposes (e.g., 'password_reset')

### Row-Level Security (RLS)

Password reset verifications are protected by RLS:

```sql
-- Enable RLS
ALTER TABLE public.password_reset_verifications ENABLE ROW LEVEL SECURITY;

-- Service role can do anything
CREATE POLICY "Service role can manage all password reset verifications"
  ON public.password_reset_verifications
  FOR ALL TO service_role
  USING (true);

-- Users can only see their own codes
CREATE POLICY "Users can view their own password reset verifications"
  ON public.password_reset_verifications
  FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Only the service role can create codes
CREATE POLICY "Service role can insert password reset verifications"
  ON public.password_reset_verifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);
```

## Troubleshooting

### Common Migration Issues

1. **Duplicate Migration Keys**

Error:
```
ERROR: duplicate key value violates unique constraint "schema_migrations_pkey"
```

Solution:
- Delete the schema_migrations record:
```sql
DELETE FROM supabase_migrations.schema_migrations 
WHERE name = 'problematic_migration_name';
```
- Then reset the database:
```bash
npx supabase db reset
```

2. **Policy Creation Errors**

Error:
```
ERROR: policy already exists
```

Solution:
- Use the DO/BEGIN/IF NOT EXISTS pattern shown above in all migrations
- Or manually drop the policy before creating:
```sql
DROP POLICY IF EXISTS "Policy name" ON public.table_name;
```

3. **Syntax Errors in Functions**

Error:
```
ERROR: syntax error at or near "NEW"
```

Solution:
- For functions inside DO blocks, use double dollar signs to delimit nested functions:
```sql
DO $$
BEGIN
  CREATE OR REPLACE FUNCTION my_func() 
  RETURNS TRIGGER AS $func$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $func$ LANGUAGE plpgsql;
END
$$;
```

### Viewing Email Verifications

For testing password reset emails:

1. Start Supabase locally
2. Access the Inbucket interface at http://127.0.0.1:54324
3. Find emails sent to your test user's email

### Manual Table Creation

If migrations aren't working, use the API route or direct SQL:

1. Using our API:
```bash
curl -X POST http://localhost:3000/api/db/create-otp-table
```

2. Using direct SQL (if psql is installed):
```bash
cat supabase/migrations/20240401000001_create_password_reset_verifications.sql | PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres
```

3. Using Supabase Studio:
- Open http://127.0.0.1:54323
- Go to the SQL Editor
- Copy-paste the migration SQL
- Run the query

## Best Practices

1. **Always Use Idempotent Migrations**
   - Use `IF NOT EXISTS` for all table and index creations
   - Wrap policy creation in `DO/BEGIN/IF NOT EXISTS` blocks

2. **Handle Policy Errors Gracefully**
   - Policies can cause duplicate key errors
   - Use check statements to prevent duplicate policies

3. **Test Migrations Before Committing**
   - Apply migrations to a clean local database
   - Verify they can be applied multiple times without errors

4. **Seed with Test Data**
   - Create a seed file in `supabase/seed.sql` for testing
   - Include test users with different roles

5. **Use the Admin Setup UI**
   - The `/admin/setup` page provides a user-friendly way to create necessary tables
   - Only accessible to super_admin users

---

By following these guidelines, you'll be able to work effectively with Supabase locally for development and testing, especially for the password reset functionality and other authentication features. 