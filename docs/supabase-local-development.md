# Supabase Local Development Guide

This guide provides detailed instructions for setting up and working with Supabase locally for development purposes, with specific focus on the password reset functionality and other authentication features.

## Setting Up Supabase Locally

### Prerequisites

- Node.js (version 18 or later)
- Docker Desktop
- Supabase CLI

### Installation Steps

1. **Install Supabase CLI** (if not already installed):

   ```bash
   npm install -g supabase
   ```

2. **Start Supabase locally**:

   ```bash
   npx supabase start
   ```

   This command will:
   - Pull necessary Docker images
   - Start all Supabase services
   - Set up a local PostgreSQL database
   - Create default authentication tables
   - Generate local API keys

3. **Verify installation**:

   ```bash
   npx supabase status
   ```

   You should see output indicating all services are running.

### Local Development URLs

- **API URL**: http://127.0.0.1:54321
- **Studio URL**: http://127.0.0.1:54323
- **Inbucket (Email Testing)**: http://127.0.0.1:54324

Take note of the `anon` and `service_role` keys displayed after starting Supabase, as you'll need these for your local `.env.local` file.

## Configuring the Project

1. **Create a `.env.local` file** with your local Supabase credentials:

   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-local-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-local-service-role-key>
   ```

2. **Start the application**:

   ```bash
   npm run dev
   ```

## Database Migrations

### Creating Migration Files

Migrations are stored in the `db/migrations` directory and follow this format:

```
YYYYMMDDHHmmss_migration-name.sql
```

To create a new migration file:

```bash
export MIGRATION_NAME="create-password-reset-tables"
export TIMESTAMP=$(date +%Y%m%d%H%M%S)
touch "db/migrations/${TIMESTAMP}_${MIGRATION_NAME}.sql"
```

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

### Applying Migrations

To apply all pending migrations:

```bash
npx supabase db reset
```

This command will:
1. Detect all migration files in the `db/migrations` directory
2. Apply them in chronological order
3. Update the database schema

### Handling Migration Errors

If you encounter errors during migration:

1. Check the error message for specific issues
2. Verify SQL syntax and constraints
3. You can reset the entire database with `npx supabase db reset --force`

## Key Tables for Authentication

### 1. Password Reset Verifications

The `password_reset_verifications` table stores verification codes for password resets:

| Column      | Type        | Description                   |
|-------------|-------------|-------------------------------|
| id          | UUID        | Primary key                   |
| email       | TEXT        | User's email address          |
| code        | TEXT        | Verification code             |
| type        | TEXT        | Purpose (e.g. password_reset) |
| verified    | BOOLEAN     | Whether code has been used    |
| created_at  | TIMESTAMPTZ | Creation timestamp            |
| expires_at  | TIMESTAMPTZ | Expiration timestamp          |

### 2. OTP Verifications

The `otp_verifications` table handles one-time password verification:

| Column      | Type        | Description                   |
|-------------|-------------|-------------------------------|
| id          | UUID        | Primary key                   |
| email       | TEXT        | User's email address          |
| code        | TEXT        | OTP code                      |
| type        | TEXT        | Purpose (e.g. login, action)  |
| verified    | BOOLEAN     | Whether code has been used    |
| created_at  | TIMESTAMPTZ | Creation timestamp            |
| expires_at  | TIMESTAMPTZ | Expiration timestamp          |

### 3. User Registration Requests

The `user_registration_requests` table manages user registration processes:

| Column           | Type        | Description                      |
|------------------|-------------|----------------------------------|
| id               | UUID        | Primary key                      |
| email            | TEXT        | User's email address             |
| token            | TEXT        | Verification token               |
| status           | TEXT        | Status (pending, completed, etc) |
| created_at       | TIMESTAMPTZ | Creation timestamp               |
| expires_at       | TIMESTAMPTZ | Expiration timestamp             |
| completed_at     | TIMESTAMPTZ | When registration was completed  |

## Manual Setup via API

If you prefer to set up tables directly via API:

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

### Using Inbucket

Supabase includes Inbucket, a service that captures all outgoing emails:

1. Access Inbucket at http://127.0.0.1:54324
2. All emails sent by your application will appear here
3. You can view, inspect and delete test emails

### Testing Password Reset Flow

1. Navigate to `/auth/forgot-password`
2. Enter a test email address
3. Check Inbucket for the reset email
4. Use the code or link to complete the password reset process

## Troubleshooting Common Issues

### Email Issues

- **Problem**: Emails not appearing in Inbucket
  **Solution**: Verify the SMTP settings and check that Inbucket service is running (`npx supabase status`)

### Database Connection Issues

- **Problem**: "Error connecting to database"
  **Solution**: Ensure Supabase container is running and check database connection details

### Migration Errors

- **Problem**: "Error applying migration"
  **Solution**: 
  1. Check SQL syntax
  2. Verify table doesn't already exist
  3. Try resetting the database: `npx supabase db reset --force`

### Authentication Issues

- **Problem**: Password reset not working
  **Solution**:
  1. Check that verification tables exist
  2. Verify email delivery in Inbucket
  3. Confirm the reset code expiration time

## Advanced Configuration

### Row-Level Security (RLS)

Row-Level Security is enabled on all tables. Here's how to configure policies:

```sql
-- Example: Allow users to only see their own data
CREATE POLICY "Users can view own data" 
  ON my_table 
  FOR SELECT 
  USING (auth.uid() = user_id);
```

### Supabase Edge Functions

For local testing of Edge Functions:

```bash
npx supabase functions serve
```

### Seeding Test Data

To populate your local database with test data:

```bash
npx supabase db reset --seed-data
```

## Working with the Supabase Database Directly

If you need to access the local PostgreSQL database directly:

```bash
npx supabase db connect
```

This will open a psql connection to your local Supabase database where you can run SQL commands directly.

## Conclusion

This guide covers the essentials for working with Supabase locally, particularly for the authentication and password reset functionality. For additional information, refer to the [Supabase documentation](https://supabase.com/docs) or the [project architecture document](./project-architecture.md). 