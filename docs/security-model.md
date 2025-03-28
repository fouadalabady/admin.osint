# Security Model

This document outlines the security architecture and implementation details for the OSINT Dashboard & Agency Website project.

## 1. Overview

Security is a core consideration in the design and implementation of this application. The security model follows multiple layers of defense and incorporates industry best practices for web application security.

## 2. Authentication & Authorization

### 2.1 Authentication

The application implements a secure authentication system using NextAuth.js integrated with Supabase Auth:

- **JWT-based authentication** with secure token storage
- **HTTP-only cookies** for session management
- **CSRF protection** with double-submit cookie pattern
- **Session timeout** with configurable expiration
- **Refresh token rotation** for long-lived sessions
- **Password complexity requirements** enforced through zxcvbn
- **Multi-factor authentication (MFA)** for sensitive operations
- **Password reset with dual delivery** (Supabase Auth + custom SMTP)
- **Email verification** through one-time passwords (OTP)

### 2.2 Authorization

Access control is implemented through:

- **Role-based access control (RBAC)** with predefined roles:
  - Super Admin: Full system access
  - Editor: Content management access
  - Contributor: Limited content creation access
- **Row-level security (RLS)** in Supabase
- **Policy-based permissions** at the application level
- **API endpoint protection** with role verification middleware

## 3. Data Security

### 3.1 Database Security

- **Parameterized queries** to prevent SQL injection
- **Row-level security policies** in Supabase
- **Data encryption at rest** for sensitive fields
- **Database connection pooling** with connection limits
- **Minimal privilege principle** for database access

### 3.2 API Security

- **Input validation** with Zod schemas
- **Rate limiting** for API endpoints
- **HTTPS-only connections** for all API traffic
- **API versioning** for backward compatibility
- **Error handling** that doesn't leak sensitive information

### 3.3. GraphQL Security

- **Authentication middleware** that validates JWT tokens before processing requests
- **Depth limiting** to prevent nested query attacks
- **Query complexity analysis** to prevent resource exhaustion
- **Field-level permissions** based on user roles
- **Input validation** with GraphQL schema constraints
- **Batching protection** to prevent abuse of batch operations
- **Error masking** to prevent information leakage

## 4. Content Security

### 4.1 User-Generated Content

- **HTML sanitization** using DOMPurify to prevent XSS attacks
- **Content validation** before storage in database
- **Media file validation** including type, size, and content verification
- **SVG sanitization** to prevent script execution in images

### 4.2 Rich Text Security

- **Lexical editor security** with content normalization and sanitization
- **TipTap editor security** with restricted HTML output
- **Markdown rendering security** with safe rendering options
- **Image proxy** for external content to prevent CORS issues
- **Attribute filtering** to remove potentially dangerous HTML attributes

### 4.3 Password Security

- **Password strength validation** using zxcvbn library
- **Visual strength indicator** for user feedback
- **Common password detection** to prevent weak password choices
- **Length and complexity requirements** for all passwords
- **Password change enforcement** for compromised credentials

## 5. Infrastructure Security

### 5.1 Network Security

- **TLS/SSL encryption** for all connections
- **HTTP security headers**:
  - Content-Security-Policy
  - X-XSS-Protection
  - X-Content-Type-Options
  - Strict-Transport-Security
  - Referrer-Policy
- **CORS configuration** to limit cross-origin requests

### 5.2 Application Security

- **Google reCAPTCHA v3** for bot protection
- **Session management** with secure defaults
- **CSRF protection** across all state-changing operations
- **Regular dependency updates** to address vulnerabilities
- **Content Security Policy** to restrict resource loading

## 6. Monitoring & Incident Response

### 6.1 Security Monitoring

- **Audit logging** for security-related events
- **Login attempt monitoring** with alerting for suspicious activity
- **API usage monitoring** to detect abnormal patterns
- **Error tracking** with contextual information

### 6.2 Incident Response

- **Defined incident response plan** for different security scenarios
- **Automatic blocking** of suspicious IP addresses
- **User notification** for security events related to their account
- **Administrative alerts** for potential security incidents

## 7. Compliance Considerations

The application is designed with the following compliance considerations:

- **GDPR-compliant data handling**
- **CCPA-compliant privacy controls**
- **Accessibility compliance** (WCAG 2.1)
- **Secure coding practices** following OWASP guidelines

## 8. Security Testing

The application undergoes security testing:

- **Static application security testing (SAST)**
- **Dynamic application security testing (DAST)**
- **Dependency vulnerability scanning**
- **Regular penetration testing**

## 9. Future Security Enhancements

Planned security enhancements include:

- **Hardware security key support** for MFA
- **Advanced threat detection** with machine learning
- **Enhanced API security** with OAuth 2.0 and OpenID Connect
- **Self-service security tools** for users
- **Security score tracking** for continuous improvement

## Document Purpose & Reference Usage

This document outlines the security architecture and features of the OSINT Dashboard project and should be used as a reference for:

- Understanding the security controls in place
- Maintaining secure coding practices during development
- Identifying potential areas for security enhancement
- Training new team members on security considerations
- Informing security-related decisions in the development process
