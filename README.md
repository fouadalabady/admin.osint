# OSINT Dashboard

A secure, Next.js-powered dashboard for OSINT operations with admin capabilities, user management, and secure authentication.

## Features

- **Authentication**: Secure login system with role-based access control
- **Admin Dashboard**: Manage users, content, and settings
- **Responsive Design**: Mobile-friendly interface using shadcn/ui components
- **i18n Support**: Multi-language support with next-intl
- **API Integration**: Connect to external data sources
- **Security**: Built-in security features including OTP verification

## Technologies

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Supabase for database and authentication
- **Deployment**: Vercel, Coolify
- **Security**: NextAuth.js, OTP verification, RBAC
- **UI Components**: shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/osintdash.git
   cd osintdash
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env.local` file based on the environment variables documentation
   ```bash
   # Create a new .env.local file
   touch .env.local
   ```

4. Configure the required environment variables in `.env.local` using the guidance in the [Environment Variables Documentation](docs/environment-variables.md)

5. Start the development server
   ```bash
   npm run dev
   ```

## Deployment

### Deploying to Vercel

This project is optimized for deployment on Vercel. See [Vercel Deployment Guide](docs/vercel-deployment.md) for detailed instructions.

Quick steps:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in the Vercel dashboard
3. Deploy from the Vercel dashboard or push to your main branch

### Deploying to Coolify

See our [documentation](docs/coolify-deployment.md) for instructions on deploying to Coolify.

## Project Structure

```
osintdash/
├── app/               # Next.js App Router
├── components/        # React components
├── lib/               # Utility functions and helpers
├── public/            # Static assets
├── styles/            # Global styles
├── types/             # TypeScript type definitions
└── docs/              # Documentation
```

## Environment Variables

Key environment variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key |
| `NEXTAUTH_URL` | Base URL for NextAuth |
| `NEXTAUTH_SECRET` | Secret for NextAuth |

For a complete list and setup instructions, see the [Environment Variables Documentation](docs/environment-variables.md).

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [NextAuth.js](https://next-auth.js.org/)

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

For Coolify deployments, we use a specialized build command that ensures clean builds:

```bash
npm run coolify-build
# or
yarn coolify-build
```
