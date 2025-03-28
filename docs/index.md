# OSINT Dashboard Documentation

Welcome to the documentation for the OSINT Dashboard project. This comprehensive guide covers the technical architecture, security considerations, and implementation details of the dashboard and agency website.

## Core Documentation

| Document                                                    | Description                                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| [Project Architecture](project-architecture.md)             | Overview of system architecture, component diagrams, and data flows       |
| [Security Model](security-model.md)                         | Security implementation details, threat models, and mitigation strategies |
| [Testing Guidelines](testing-guidelines.md)                 | Testing approaches, examples, and best practices                          |
| [Supabase Development](supabase-development.md)               | Guide for connecting to and working with hosted Supabase                  |
| [GraphQL Integration](graphql-integration.md)               | GraphQL implementation details with Apollo Client and GraphQL Yoga        |
| [API Documentation](API_DOCUMENTATION.md)                   | Complete REST and GraphQL API reference                                   |

## GraphQL API

The project implements a GraphQL API for efficient and type-safe data operations. Key features include:

### Implementation Details

- **GraphQL Yoga** server for request handling
- **Apollo Client** for front-end data fetching
- **Type-safe operations** with GraphQL schema
- **Authentication integration** with NextAuth.js and Supabase
- **Field-level permissions** based on user roles

### Documentation

For complete details on working with the GraphQL API, see:

1. **[GraphQL Integration](graphql-integration.md)**
   - Implementation architecture
   - Server and client setup
   - Security considerations
   - Usage examples and best practices

2. **[API Documentation: GraphQL](API_DOCUMENTATION.md#graphql-api)**
   - Schema reference
   - Query and mutation examples
   - Authentication requirements
   - Error handling

## Rich Text Editing

The dashboard implements advanced rich text editing capabilities for content management:

### Editing Solutions

- **Lexical Editor**: Primary editor for complex content like blog posts
- **TipTap Editor**: Alternative editor for simpler content needs
- **Content Sanitization**: DOMPurify integration for XSS prevention
- **Media Embedding**: Support for images, videos, and other media types
- **Format Conversion**: Import/export to HTML, Markdown, and JSON

### Integration

The rich text editors are fully integrated with:
- GraphQL mutations for data persistence
- Content validation workflows
- Responsive design system
- Localization framework for multilingual content

## Password Reset System

The password reset flow has been built with reliability, security, and user experience in mind. It implements a dual-delivery approach using both Supabase Auth and custom SMTP email services.

### Key Features

- **Dual-Delivery Email System**
  - Primary: Supabase Auth's built-in email service
  - Fallback: Custom SMTP email delivery
- **Multiple Reset Methods**
  - Link-based reset (Supabase PKCE flow)
  - Code-based reset (custom verification code)
- **Security Considerations**
  - Time-limited tokens (1 hour validity)
  - One-time use verification codes
  - Row-level security policies
  - IP-based rate limiting
- **User Experience**
  - Tabbed interface for reset options
  - Password strength validation
  - Clear success/error feedback
  - Responsive design

### Documentation Map

To understand the password reset system fully, review these documents:

1. **[Project Architecture: Password Reset Flow](project-architecture.md)**
   - Component diagram
   - Database schema
   - Request and verification phases
   - Error handling and edge cases
2. **[Security Model: Password Reset Flow](security-model.md)**
   - Threat modeling
   - Authentication controls
   - API security measures
   - Database security
   - Audit logging
3. **[Testing Guidelines: Password Reset Flow](testing-guidelines.md)**

   - Unit testing examples
   - Integration testing
   - End-to-end testing
   - Security testing
   - Manual testing checklist

4. **[Supabase Development](supabase-development.md)**
   - Database configurations
   - Authentication setup
   - Email templates
   - Troubleshooting

## Implementation Status

The system is fully implemented and includes:

- Frontend UI components for all major features
- Backend API endpoints (REST and GraphQL)
- Database schema and migrations
- Security controls and monitoring
- Comprehensive testing suite
- Documentation and developer guides

## Additional Resources

- [API Documentation](API_DOCUMENTATION.md)
- [User Roles & Permissions](user-roles.md)
- [Deployment Guide](deployment-guide.md)
- [Troubleshooting Common Issues](troubleshooting.md)
- [Build Process](build-process.md)
- [Code Quality](code-quality.md)
- [Vercel Deployment](vercel-deployment.md)
- [Type Checking](type-checking.md)
- [Linting Guide](linting-guide.md)

## Contributing to Documentation

To improve this documentation:

1. Clone the repository
2. Create a new branch for your changes
3. Update the relevant documentation files
4. Submit a pull request with your changes
5. Include a clear description of what you've updated or added

## Document Purpose & Reference Usage

This index document serves as the central navigation hub for all documentation related to the OSINT Dashboard project. It's designed to provide:

- A comprehensive overview of the project's documentation structure
- Quick links to specific documentation sections
- Focused information about key system components
- Guidance for both new and existing team members

The document should be used as:
- The starting point for exploring project documentation
- A reference to locate specific technical documentation
- An introduction for new team members to understand the project scope
- A dashboard for evaluating documentation completeness

Project stakeholders including developers, designers, project managers, and DevOps personnel should begin here to navigate to the most relevant documentation for their specific needs. The index is organized to highlight both core documentation and specialized guides for specific system components like the GraphQL API, rich text editing, and password reset functionality.
