# Project Architecture

This document outlines the architecture of the OSINT Dashboard & Agency Website project, detailing key components, their interactions, and the technologies used.

## System Overview

The project is a headless admin dashboard and agency website built with modern web technologies. It consists of:

1. **Public-facing Agency Website** - Marketing site with service pages, blog, and lead generation forms
2. **Admin Dashboard** - Secure internal tool for content management and administration
3. **API Layer** - RESTful and GraphQL endpoints for data operations
4. **Authentication System** - Secure user management with role-based access
5. **Database Layer** - Supabase PostgreSQL for data persistence

## Tech Stack

| Category               | Technology                                | Purpose                                    |
| ---------------------- | ----------------------------------------- | ------------------------------------------ |
| **Frontend Framework** | Next.js 14+                               | Server-side rendering, routing, API routes |
| **UI Components**      | shadcn/ui, Radix UI                       | Accessible, customizable components        |
| **State Management**   | React Context, Apollo Client              | Global state and data fetching             |
| **Database**           | Supabase (PostgreSQL)                     | Data storage, real-time subscriptions      |
| **Authentication**     | NextAuth.js, Supabase Auth                | User management, session handling          |
| **GraphQL**            | Apollo Client, GraphQL Yoga               | Type-safe API with efficient data fetching |
| **Content Editing**    | Lexical, TipTap                           | Rich text editing and content management   |
| **Styling**            | Tailwind CSS                              | Utility-first styling                      |
| **Localization**       | next-intl, i18n routing                   | Multi-language support                     |
| **Forms**              | React Hook Form, Zod                      | Form handling and validation               |
| **Security**           | reCAPTCHA v3, HTTPS, CSRF, DOMPurify      | Anti-bot, secure communications, sanitization |
| **Deployment**         | Vercel                                    | Continuous deployment and hosting          |

## Application Structure

```
/
├── app/                    # Next.js App Router
│   ├── [locale]/           # i18n routes
│   │   ├── admin/          # Admin dashboard routes
│   │   ├── auth/           # Authentication routes
│   │   ├── blog/           # Blog routes
│   │   └── (site)/         # Public site routes
│   ├── api/                # API routes
│   │   ├── auth/           # Auth-related endpoints
│   │   ├── blog/           # Blog content endpoints
│   │   └── webhooks/       # External service webhooks
├── components/             # Shared React components
│   ├── admin/              # Admin-specific components
│   ├── auth/               # Authentication components
│   ├── blog/               # Blog-specific components
│   ├── forms/              # Form components
│   ├── layout/             # Layout components
│   ├── providers/          # Context providers (Apollo, etc.)
│   └── ui/                 # UI components (shadcn)
├── config/                 # Configuration files
├── db/                     # Database migrations and schemas
├── graphql/                # GraphQL server implementation
│   ├── resolvers/          # GraphQL resolvers
│   ├── schema/             # GraphQL schema definitions
│   ├── directives/         # Custom GraphQL directives
│   └── index.ts            # GraphQL server entry point
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and shared logic
│   ├── auth/               # Authentication utilities
│   ├── api/                # API utilities
│   ├── graphql/            # GraphQL client code
│   │   ├── client.ts       # Apollo Client setup
│   │   ├── operations/     # GraphQL queries and mutations
│   │   └── hooks/          # Custom GraphQL hooks
│   ├── supabase/           # Supabase client and helpers
│   └── validation/         # Zod schemas
├── locales/                # Translation files
├── public/                 # Static assets
└── styles/                 # Global styles
```

## Key Components and Interactions

### Authentication Flow

```mermaid
sequenceDiagram
    User->>Frontend: Login Request
    Frontend->>API: Authenticate (credentials)
    API->>NextAuth: Verify credentials
    NextAuth->>Supabase: Query user data
    Supabase-->>NextAuth: User data
    NextAuth-->>API: Session token
    API-->>Frontend: Session & CSRF token
    Frontend->>User: Redirect to dashboard
```

### Content Management Flow

```mermaid
sequenceDiagram
    Admin->>Dashboard: Create/Edit content
    Dashboard->>GraphQL API: Submit content
    GraphQL API->>Middleware: Validate request
    Middleware->>RoleGuard: Check permissions
    RoleGuard-->>GraphQL API: Authorization result
    GraphQL API->>Database: Store content
    Database-->>GraphQL API: Success/Failure
    GraphQL API-->>Dashboard: Response
    Dashboard-->>Admin: Feedback
```

### Rich Text Editing Flow

```mermaid
sequenceDiagram
    Editor->>LexicalEditor: User Input
    LexicalEditor->>EditorState: Update State
    LexicalEditor->>Sanitizer: Sanitize Content
    Sanitizer-->>LexicalEditor: Clean HTML
    LexicalEditor->>GraphQL: Save Content
    GraphQL->>Database: Store in Supabase
    Database-->>GraphQL: Confirmation
    GraphQL-->>LexicalEditor: Success/Error
    LexicalEditor-->>Editor: Feedback
```

### Public Site Data Flow

```mermaid
sequenceDiagram
    User->>Frontend: Visit page
    Frontend->>GraphQL: Request data
    GraphQL->>Database: Query content
    Database-->>GraphQL: Content data
    GraphQL-->>Frontend: Structured response
    Frontend->>User: Render page
```

## Database Schema

The database uses a normalized schema with the following core tables:

- **users**: User accounts and authentication data
- **profiles**: Extended user profile information
- **roles**: User role definitions for RBAC
- **user_roles**: Junction table relating users to roles
- **blog_posts**: Blog content with metadata
- **blog_categories**: Categories for blog posts
- **blog_tags**: Tags for blog posts
- **forms_submissions**: Lead generation form submissions
- **password_reset_verifications**: Password reset tokens and verification
- **otp_verifications**: One-time password verification records
- **security_logs**: Audit logging for security events

## GraphQL Architecture

The GraphQL implementation follows a layered architecture:

1. **Schema Layer**: Type definitions and operation specifications
2. **Resolver Layer**: Business logic that connects schema to data sources
3. **Data Access Layer**: Database interactions via Supabase clients
4. **Authentication Layer**: JWT validation and user identification
5. **Authorization Layer**: Permission checks based on user roles

Key features of the GraphQL implementation:

- **Type-Safe Operations**: Strongly typed queries and mutations
- **Optimized Data Fetching**: Only retrieve what's needed, reducing over-fetching
- **Field-Level Security**: Control access at the field level based on permissions
- **Error Handling**: Standardized error reporting with contextual information
- **Caching Strategy**: Apollo InMemoryCache with type policies for optimal performance

## Rich Text Editing Architecture

Our content management system implements two rich text editors:

1. **Lexical Editor**:
   - Used for complex content like blog posts
   - Framework-agnostic core with React bindings
   - Plugin-based architecture for extensibility
   - Structured content model with serialization to HTML/JSON
   - Support for markdown, code blocks, and tables

2. **TipTap Editor**:
   - Used for simpler content needs
   - Based on ProseMirror with React integration
   - Extension system for custom functionality
   - Focus on user experience and accessibility
   - Support for collaborative editing (future enhancement)

Both editors integrate with:
- Content sanitization via DOMPurify
- GraphQL mutations for persistence
- Consistent styling with design system
- Media management for images and attachments

## Security Architecture

Security is implemented across multiple layers:

1. **Network Layer**: HTTPS, secure headers
2. **Application Layer**: Input validation, CSRF protection
3. **Authentication Layer**: JWT, session management, MFA
4. **Authorization Layer**: RBAC, row-level security
5. **Database Layer**: Parameterized queries, encryption at rest
6. **Content Layer**: DOMPurify sanitization for user-generated content

For detailed security information, see the [Security Model](./security-model.md) document.

## i18n Architecture

The application supports multiple languages through:

- Locale-based routing
- Runtime message translation with `next-intl`
- RTL layout support for Arabic
- Translation files stored in JSON format in `/locales`
- Server and client components translation support

## Deployment Architecture

The application is deployed using a CI/CD pipeline:

1. GitHub Actions for CI (tests, linting)
2. Automated deployment to Vercel
3. Environment-specific configurations (Production, Preview, Development)
4. Database migrations applied automatically
5. Edge functions for improved global performance
6. Zero-downtime deployments
7. Vercel Analytics for monitoring and performance insights

## Performance Considerations

The architecture prioritizes performance through:

- Server components for reduced client JavaScript
- Static generation where possible
- Edge functions for dynamic but fast APIs
- GraphQL for efficient data fetching
- Optimized bundle sizes with code-splitting
- Image optimization with Next.js Image component
- Efficient database queries with proper indexing
- Vercel's global CDN for asset delivery

## Extensibility

The system is designed for extensibility:

- Modular component architecture
- Pluggable authentication providers
- Extensible API using middleware pattern
- GraphQL schema designed for evolution
- Clear separation of concerns
- Standardized state management patterns

## Monitoring and Observability

The application includes:

- Structured logging for all operations
- Error tracking integration
- Performance monitoring via Vercel Analytics
- User activity analytics
- Security audit logging
- GraphQL-specific metrics and insights

## Future Architecture Considerations

Planned architectural enhancements:

- GraphQL subscriptions for real-time updates
- Microservices for specific high-load components
- Enhanced real-time capabilities
- AI-powered content recommendations
- Edge computing for global performance
- GraphQL federation for distributed services

## Document Purpose & Reference Usage

This document serves as the authoritative architectural blueprint for the OSINT Dashboard & Agency Website project. It's designed to be referenced by:

- System architects and tech leads for understanding the overall system design
- Developers who need to understand component relationships and data flows
- DevOps engineers configuring deployment pipelines and monitoring
- New team members gaining a high-level understanding of the project
- External consultants and auditors evaluating the system architecture

The architecture document should be consulted when:
- Planning new features or subsystems
- Troubleshooting complex integration issues
- Making significant changes to existing components
- Evaluating technology choices for new development
- Onboarding new developers to the project
- Conducting security or performance reviews

This document provides the "big picture" view of how all components fit together, making it the foundation for more detailed documentation like the Security Model, Testing Guidelines, and deployment-specific guides. It should be maintained as a living document that reflects the current state of the system while indicating planned future directions.
