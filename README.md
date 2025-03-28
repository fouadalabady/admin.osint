# OSINT Dashboard

Admin dashboard and agency website with headless CMS capabilities, built with Next.js, React, Supabase, and shadcn/ui.

## Features

- **Landing Page & Service Pages**: Fully customizable content management
- **Blog Module**: Create, edit, and publish blog posts with SEO management
- **Lead Generation Forms**:
  - Schedule a Demo
  - Contact Us
  - Newsletter Subscription
  - Join Our Team
- **Multilingual Support**: Full localization for Arabic and English
- **Role-Based Access Control**: Admin, Editor, and Contributor roles
- **Secure Authentication**: Including password reset with fallback mechanisms
- **GraphQL API**: Type-safe data fetching with Apollo Client and GraphQL Yoga
- **Rich Text Editing**: Advanced content creation with Lexical and TipTap editors

## Technology Stack

- **Frontend**: Next.js 15 & React 19
- **UI Components**: shadcn/ui with Radix UI primitives
- **Authentication**: NextAuth.js with Supabase
- **Database**: Supabase PostgreSQL
- **Localization**: next-intl
- **Form Handling**: React Hook Form with Zod validation
- **Email**: SMTP service integration
- **GraphQL**: Apollo Client and GraphQL Yoga
- **Rich Text Editing**: Lexical and TipTap
- **Content Security**: DOMPurify for sanitization
- **Data Visualization**: Recharts for analytics
- **Deployment**: Vercel with Edge Functions

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (see .env.example)
4. Run development server:
   ```bash
   npm run dev
   ```

## Supabase Setup

See the [Supabase Development Guide](docs/supabase-development.md) for detailed instructions on connecting to our hosted Supabase instance.

## Documentation

- [Project Architecture](docs/project-architecture.md) - Overview of system architecture and flows
- [Security Model](docs/security-model.md) - Details on security implementation
- [Testing Guidelines](docs/testing-guidelines.md) - Testing strategy and examples
- [Supabase Development](docs/supabase-development.md) - Guide for working with Supabase
- [Authentication Flow](docs/authentication-flow.md) - Authentication process documentation
- [GraphQL Integration](docs/graphql-integration.md) - GraphQL implementation details
- [API Documentation](docs/API_DOCUMENTATION.md) - REST and GraphQL API reference

## Password Reset System

Our system implements a robust password reset flow with dual delivery methods:

1. **Primary method**: Supabase Auth's built-in email delivery
2. **Fallback method**: Custom SMTP email service

This ensures reliability even when one delivery method fails. The system includes:

- Secure verification code generation and storage
- Time-limited tokens (1 hour validity)
- One-time use verification
- Password strength validation with zxcvbn

For detailed information about the password reset system, see:

- [Password Reset Architecture](docs/project-architecture.md)
- [Password Reset Security Model](docs/security-model.md)
- [Password Reset Testing Guide](docs/testing-guidelines.md)

## Email Confirmation Process

The user registration flow in this application includes email verification using a one-time password (OTP) system. Here's how it works:

1. When a user registers, a new record is created in Supabase Auth with `email_confirm: false`
2. An OTP code is generated, hashed, and stored in the `otp_verifications` table
3. A verification email with the OTP is sent to the user
4. When the user verifies their email by submitting the OTP:
   - The OTP is verified against the hash in the database
   - The `verified_at` timestamp is set in the `otp_verifications` table
   - The `email_verified` flag is set to `true` in the `user_registration_requests` table
   - The user's `email_confirm` status is updated in Supabase Auth

### Troubleshooting Email Confirmation Issues

If users encounter "Email not confirmed" errors despite completing verification:

1. Check if the `verify-otp` endpoint correctly updates both:

   - `email_verified` flag in the `user_registration_requests` table
   - `email_confirm` flag in Supabase Auth via `supabase.auth.admin.updateUserById`

2. Run the email confirmation fix script:

   ```
   node scripts/fix-all-user-emails.js
   ```

   This script identifies users who have verified their email through OTP but whose email confirmation status is not set in Supabase Auth.

3. For individual users, you can use:
   ```
   node scripts/fix-new-user-accounts.js
   ```
   This script analyzes and fixes email confirmation issues for specific accounts.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Development

This project uses Next.js with Turbopack for faster development experience.

To start the development server with Turbopack:

```bash
npm run dev
# or
yarn dev
```

If you encounter any issues with Turbopack, you can fall back to the traditional webpack development server:

```bash
npm run dev:webpack
# or
yarn dev:webpack
```

### Code Quality

We maintain high code quality standards in this project. Before committing any code, please ensure:

1. Your code follows the linting rules
2. TypeScript types are properly used (avoid `any`)
3. No unused variables or imports remain
4. React hooks have proper dependency arrays

Run the following to check and fix code quality issues:

```bash
npm run fix-code-quality
```

For detailed guidelines, see [Code Quality Guidelines](docs/code-quality.md).

## Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

For Vercel deployments:

```bash
npm run vercel-build
# or
yarn vercel-build
```

For optimized production builds with quality checks:

```bash
npm run build:production
# or
yarn build:production
```

## Database Setup

The project uses Supabase as its database. The SQL scripts for setting up the database are organized in the `sql` directory:

1. **00_run_all.sql**: Master script that runs all other scripts in order
2. **01_init.sql**: Creates base functions and types
3. **02_auth_tables.sql**: Sets up authentication-related tables
4. **03_rls_policies.sql**: Configures Row Level Security policies

To set up the database in your hosted Supabase instance:

1. Log in to the [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to the SQL Editor section
4. Upload and run the SQL scripts in order:
   ```sql
   \i sql/00_run_all.sql
   ```
