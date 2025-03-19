# OSINT Dashboard

A modern, secure admin dashboard built with Next.js 14, Supabase, and shadcn/ui. Features include authentication, user management, and a beautiful dark/light theme.

## Features

- 🔐 **Secure Authentication**
  - Email/Password authentication with NextAuth.js
  - Password reset functionality
  - Role-based access control (RBAC)
  - Protected API routes and middleware

- 🎨 **Modern UI**
  - Built with shadcn/ui components
  - Dark/Light theme support
  - Responsive design
  - Clean and intuitive interface

- 👥 **User Management**
  - User roles and permissions
  - User creation and management
  - Profile management

- 🛠️ **Technical Stack**
  - Next.js 14 (App Router)
  - TypeScript
  - Supabase (Database & Auth)
  - Tailwind CSS
  - shadcn/ui Components

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/osintdash.git
cd osintdash
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with the following variables:
```env
# Next Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── dashboard/         # Dashboard pages
├── components/            # React components
│   ├── auth/             # Authentication components
│   └── ui/               # UI components (shadcn/ui)
├── lib/                   # Utility functions
└── public/               # Static files
```

## Authentication Flow

1. **Sign Up**
   - User registers with email/password
   - Email verification sent
   - User role assigned

2. **Sign In**
   - Credentials validation
   - JWT token generation
   - Role-based redirection

3. **Password Reset**
   - Request reset link
   - Email verification
   - Secure password update

## Development

### Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Adding New Features

1. Create new components in `components/`
2. Add new pages in `app/`
3. Update API routes in `app/api/`
4. Add new UI components using shadcn/ui

## Deployment

The project can be deployed to any platform that supports Next.js:

1. **Vercel** (Recommended)
   - Connect your GitHub repository
   - Add environment variables
   - Deploy

2. **Manual Deployment**
   ```bash
   npm run build
   npm run start
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
