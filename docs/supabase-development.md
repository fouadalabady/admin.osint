# Supabase Development Guide

This guide provides detailed instructions for working with our hosted Supabase instance for development purposes, with specific focus on the password reset functionality and other authentication features.

## Connecting to Hosted Supabase

### Prerequisites

- Node.js (version 18 or later)
- Supabase project API credentials (URL and keys)

### Configuration Steps

1. **Obtain Supabase credentials** from your team lead or project administrator:
   - Supabase URL (e.g., `https://yourproject.supabase.co`)
   - Supabase anon key
   - Supabase service role key

2. **Configure environment variables** in your `.env.local` file:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

3. **Start the application**:

   ```bash
   npm run dev
   ```

## Database Migrations

### Applying Migrations to Hosted Supabase

Unlike with local development, migrations are applied to the hosted Supabase instance through their web interface:

1. Log in to the [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to the SQL Editor section
4. Create a new query or upload SQL migration files
5. Run the SQL commands

### Migration Content Example

Here's an example of a migration file for the password reset functionality:

```sql
-- Create password reset verifications table
CREATE TABLE IF NOT EXISTS password_reset_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
  CONSTRAINT unique_active_code UNIQUE (email, code, type, verified)
);

-- Enable RLS
ALTER TABLE password_reset_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Service role can manage all verifications"
  ON password_reset_verifications
  USING (auth.role() = 'service_role');

-- Create indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_email ON password_reset_verifications (email);
CREATE INDEX IF NOT EXISTS idx_verification_code ON password_reset_verifications (code);
CREATE INDEX IF NOT EXISTS idx_verification_expires ON password_reset_verifications (expires_at);
```

### Managing Schema Changes

When working with a hosted Supabase instance:

1. Always back up critical data before making schema changes
2. Test migrations in a staging project before applying to production
3. Coordinate with team members when making schema changes
4. Document all migrations in a shared location

## Key Tables for Authentication

### 1. Password Reset Verifications

The `password_reset_verifications` table stores verification codes for password resets:

| Column     | Type        | Description                   |
| ---------- | ----------- | ----------------------------- |
| id         | UUID        | Primary key                   |
| email      | TEXT        | User's email address          |
| code       | TEXT        | Verification code             |
| type       | TEXT        | Purpose (e.g. password_reset) |
| verified   | BOOLEAN     | Whether code has been used    |
| created_at | TIMESTAMPTZ | Creation timestamp            |
| expires_at | TIMESTAMPTZ | Expiration timestamp          |

### 2. OTP Verifications

The `otp_verifications` table handles one-time password verification:

| Column     | Type        | Description                  |
| ---------- | ----------- | ---------------------------- |
| id         | UUID        | Primary key                  |
| email      | TEXT        | User's email address         |
| code       | TEXT        | OTP code                     |
| type       | TEXT        | Purpose (e.g. login, action) |
| verified   | BOOLEAN     | Whether code has been used   |
| created_at | TIMESTAMPTZ | Creation timestamp           |
| expires_at | TIMESTAMPTZ | Expiration timestamp         |

### 3. User Registration Requests

The `user_registration_requests` table manages user registration processes:

| Column       | Type        | Description                      |
| ------------ | ----------- | -------------------------------- |
| id           | UUID        | Primary key                      |
| email        | TEXT        | User's email address             |
| token        | TEXT        | Verification token               |
| status       | TEXT        | Status (pending, completed, etc) |
| created_at   | TIMESTAMPTZ | Creation timestamp               |
| expires_at   | TIMESTAMPTZ | Expiration timestamp             |
| completed_at | TIMESTAMPTZ | When registration was completed  |

## Manual Setup via API

If you're working with a fresh Supabase instance, you can set up tables via our API:

1. **Start the application**:

   ```bash
   npm run dev
   ```

2. **Navigate to setup page**:

   ```
   http://localhost:3000/admin/setup
   ```

   (You need to be logged in as a super admin)

3. **Use API endpoint**:
   ```bash
   curl -X POST http://localhost:3000/api/db/create-tables
   ```

## Testing Email Functionality

### Using Supabase Auth Emails

When working with hosted Supabase:

1. Configure email templates in the Supabase dashboard under Authentication > Email Templates
2. For development testing, use real but controlled email addresses
3. Monitor email delivery with Supabase logs

### Testing with Development Email Services

For safer testing, consider using:

- [Mailtrap](https://mailtrap.io/) for capturing emails in development
- [Ethereal](https://ethereal.email/) for disposable testing emails
- Configure SMTP settings in your environment to point to these services

### Testing Password Reset Flow

1. Navigate to `/auth/forgot-password`
2. Enter a test email address
3. Check the development email service for the reset email
4. Use the code or link to complete the password reset process

## Troubleshooting Common Issues

### Email Issues

- **Problem**: Emails not being delivered
  **Solution**: Verify email settings in Supabase dashboard and check spam folders

### Authentication Issues

- **Problem**: Password reset not working
  **Solution**:
  1. Check that verification tables exist
  2. Verify email templates are configured
  3. Confirm the reset code expiration time
  4. Check Supabase authentication logs

### API Connection Issues

- **Problem**: "Error connecting to Supabase"
  **Solution**:
  1. Verify API keys and URL in your environment variables
  2. Check Supabase status page for service issues
  3. Confirm network connectivity from your development environment

## Advanced Configuration

### Row-Level Security (RLS)

Row-Level Security is enabled on all tables. Here's how to configure policies in the Supabase dashboard:

1. Go to the Table Editor
2. Select your table
3. Go to the "Policies" tab
4. Create policies for each operation type

Example policy:

```sql
-- Example: Allow users to only see their own data
CREATE POLICY "Users can view own data"
  ON my_table
  FOR SELECT
  USING (auth.uid() = user_id);
```

### Supabase Edge Functions

To work with Edge Functions in the hosted environment:

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link to your project:
   ```bash
   supabase login
   supabase link --project-ref your-project-id
   ```

3. Create and deploy functions:
   ```bash
   supabase functions new my-function
   supabase functions deploy my-function
   ```

### Working with Test Data

To create test data in your development environment:

1. Create SQL scripts for inserting test data
2. Run these scripts through the Supabase SQL Editor
3. Alternatively, use the Supabase JS client to programmatically insert data

## Working with the Supabase Dashboard

The Supabase dashboard provides tools for managing your project:

1. **Table Editor**: View and modify database tables
2. **Authentication**: Manage users and authentication settings
3. **SQL Editor**: Run SQL queries and migrations
4. **Storage**: Manage file uploads and storage buckets
5. **Edge Functions**: Deploy serverless functions
6. **Logs**: View database and API logs

Access it at: https://app.supabase.com/project/[your-project-id]

## Conclusion

This guide covers the essentials for working with our hosted Supabase instance, particularly for the authentication and password reset functionality. For additional information, refer to the [Supabase documentation](https://supabase.com/docs) or the [project architecture document](./project-architecture.md).

## Document Purpose & Reference Usage

This document serves as a comprehensive guide for developers working with our hosted Supabase instance for the OSINT Dashboard project. It's intended to be used by:

- Developers connecting to the Supabase API
- Backend engineers working with database schema and migrations
- Authentication specialists implementing or troubleshooting auth flows
- QA testers verifying email functionality and user flows
- New team members getting acquainted with the project's database architecture

The guide should be consulted when:
- Setting up a new development environment
- Implementing schema changes and migrations
- Working on authentication-related features
- Testing email verification and password reset flows
- Troubleshooting database or authentication issues
- Working with Row-Level Security policies
- Configuring test data for development purposes

This document is particularly valuable because it bridges the gap between Supabase's general documentation and the specific implementation in the OSINT Dashboard project, with particular focus on authentication features like password reset and email verification that are critical to the system's security model.
