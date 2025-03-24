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

## Technology Stack

- **Frontend**: Next.js 15 & React 19
- **UI Components**: shadcn/ui
- **Authentication**: NextAuth.js with Supabase
- **Database**: Supabase PostgreSQL
- **Localization**: next-intl
- **Form Handling**: React Hook Form with Zod validation
- **Email**: SMTP service integration

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

## Local Supabase Setup

See the [Supabase Local Development Guide](docs/supabase-local-development.md) for detailed instructions.

## Documentation

- [Project Architecture](docs/project-architecture.md) - Overview of system architecture and flows
- [Security Model](docs/security-model.md) - Details on security implementation
- [Testing Guidelines](docs/testing-guidelines.md) - Testing strategy and examples
- [Supabase Local Development](docs/supabase-local-development.md) - Guide for local development
- [Authentication Flow](docs/authentication-flow.md) - Authentication process documentation

## Password Reset System

Our system implements a robust password reset flow with dual delivery methods:

1. **Primary method**: Supabase Auth's built-in email delivery
2. **Fallback method**: Custom SMTP email service

This ensures reliability even when one delivery method fails. The system includes:

- Secure verification code generation and storage
- Time-limited tokens (1 hour validity)
- One-time use verification
- Password strength validation

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
