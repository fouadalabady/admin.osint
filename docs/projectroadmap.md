# DevOps Management & Best Practices Guide

**Project:** OSINT Dashboard & Agency Website  
**Version:** 2.0  
**Last Updated:** 2023-04-02

---

## 1. Project Overview

This project comprises a headless admin dashboard and agency website built with Next.js, React, Supabase, and shadcn/ui. The system includes:

- **Landing & Service Pages**  
- **Blog Module**  
- **Lead Generation Forms:**  
  - Schedule a Demo  
  - Contact Us  
  - Newsletter Subscription  
  - Join Our Team  

Additional features include:
- Multilingual support (Arabic & English) via next-intl and i18n routing.
- Secure authentication and role-based access control (RBAC) using NextAuth.js integrated with Supabase.
- Enhanced security measures such as Google reCAPTCHA v3, MFA, and OTP verification.

---

## 2. Environment Setup & Version Control

### 2.1 Local Development
- **Setup:**
  - Clone the repository from GitHub.
  - Install dependencies using:
    ```bash
    npm install
    ```
  - Create a `.env.local` file (refer to `.env.example`) and configure required environment variables.
  - Run the development server:
    ```bash
    npm run dev
    ```
- **Best Practices:**
  - Use containerization or virtual environments to mirror production settings as closely as possible.
  - Ensure consistency by aligning your local environment with staging and production configurations.

### 2.2 Version Control with GitHub
- **Repository Management:**
  - All code is versioned on GitHub.
  - Use branching strategies (e.g., feature branches, Git Flow) to manage new features, bug fixes, and experiments.
- **Best Practices:**
  - Commit frequently with clear, descriptive messages.
  - Utilize pull requests for code reviews and merge processes.
  - Enforce pre-commit hooks, linters, and automated tests to maintain code quality.

### 2.3 Deployment Options

#### 2.3.1 Vercel Deployment
- **Key Benefits:**
  - Seamless integration with Next.js
  - Global CDN with edge caching
  - Automated preview deployments
  - Simple environment variable management
  - Zero-configuration SSL

- **Setup Process:**
  1. Connect your GitHub repository to Vercel
  2. Configure environment variables in the Vercel dashboard
  3. Deploy automatically on push to main branch
  4. Use the included deployment script: `./scripts/deploy-vercel.sh`

- **Documentation:**
  - Detailed guide available at [docs/vercel-deployment.md](docs/vercel-deployment.md)
  - Deployment script: [scripts/deploy-vercel.sh](scripts/deploy-vercel.sh)

#### 2.3.2 Coolify Deployment
- **Key Benefits:**
  - Self-hosted option
  - Container-based deployment
  - No cold starts
  - Fine-grained resource control
  - Predictable pricing

- **Setup Process:**
  1. Set up a Coolify instance
  2. Configure build settings and environment variables
  3. Connect to your GitHub repository
  4. Deploy manually or via webhooks

- **Documentation:**
  - Detailed guide available at [docs/coolify-deployment.md](docs/coolify-deployment.md)

#### 2.3.3 Deployment Comparison
For a detailed comparison between Vercel and Coolify, see [docs/deployment-comparison.md](docs/deployment-comparison.md). This document helps teams choose the most appropriate deployment platform based on specific project needs.

---

## 3. Continuous Integration & Delivery (CI/CD)

### 3.1 Automated Pipelines
- **Build & Test:**
  - Set up CI pipelines (e.g., GitHub Actions) to automatically run unit, integration, and end-to-end tests on every commit.
  - Prioritize coverage of critical modules such as authentication, form handling, and email workflows.
- **Deployment Automation:**
  - Configure CD pipelines to push changes to either Vercel or Coolify after successful tests and code reviews.
  - Use the Vercel build script included in the project: `vercel-build` in package.json
  - Use approval gates for production deployments where necessary.

### 3.2 Rollback & Recovery
- Plan for automated rollback strategies in case of deployment failures.
- Implement comprehensive logging and monitoring to quickly diagnose and respond to issues.
- Use the deployment checklist available at [docs/deployment-checklist.md](docs/deployment-checklist.md) to ensure smooth deployments.

---

## 4. Security & Compliance

### 4.1 Application Security
- **Authentication & Authorization:**
  - Use NextAuth.js with Supabase for secure authentication.
  - Implement role-based access control (RBAC) for managing different user types (Super Admin, Editor, Contributor).
  - Enforce Multi-Factor Authentication (MFA) and OTP verification for high-risk operations.
- **Data Protection:**
  - Encrypt data in transit (TLS/SSL) and at rest.
  - Store tokens in HTTP-only cookies with secure token refresh mechanisms.

### 4.2 Infrastructure Security
- **Logging & Auditing:**
  - Utilize structured logging (e.g., with Pino) to capture detailed system and user events.
  - Maintain immutable audit logs for sensitive actions.
- **Real-Time Monitoring:**
  - Integrate SIEM platforms to monitor logs and trigger alerts for anomalous activities.

---

## 5. Developer & Operational Guidance

### 5.1 Documentation & Developer Onboarding
- **Project Documentation:**
  - Project architecture: [docs/project-architecture.md](docs/project-architecture.md)
  - Security model: [docs/security-model.md](docs/security-model.md)
  - Deployment guides for [Vercel](docs/vercel-deployment.md) and [Coolify](docs/coolify-deployment.md)
- **Onboarding:**
  - Ensure new team members understand the project structure, local setup, and CI/CD workflows.
  - Provide clear guidelines for local Supabase setup and environment configurations.

### 5.2 UI Component & Code Standards
- **UI Components:**
  - Use only the components provided by [shadcn/ui](https://ui.shadcn.com) to ensure design consistency.
- **Coding Practices:**
  - Follow auto-formatting guidelines (Prettier, ESLint) and use strong typing (TypeScript recommended) to minimize runtime errors.

---

## 6. Production Environment Sanitization & DevOps Enhancements

This section outlines specific guidelines for maintaining a clean production environment and incorporates additional DevOps details:

- **Separation of Concerns:**  
  - Ensure that production builds and deployments are free of any development-specific instructions, debug logs, or test endpoints.
  - Remove local development commands and instructions from production documentation and build artifacts.

- **Production Build Hygiene:**  
  - Implement build scripts that strip out development-only comments, debugging code, and testing frameworks.
  - Use environment-specific configurations to guarantee that development tools and instructions are not included in production bundles.

- **DevOps Enhancements:**  
  - Use the specialized build scripts in package.json:
    - `vercel-build`: For Vercel deployments
    - `coolify-build`: For Coolify deployments
  - Safely handle environment variables during build with the techniques documented in `lib/build-helpers.ts`
  - Ensure API routes use the `safeBuildExecution` function to handle build-time processing

- **Documentation Standards:**  
  - Maintain separate documentation for development and production environments.
  - Ensure production documentation contains only operational details and secure configuration steps.

---

## 7. Environment Variables & Configuration

### 7.1 Key Environment Variables
| **Variable**            | **Description**                                           | **Example**                     |
|-----------------------|-----------------------------------------------------|------------------------------|
| `NEXTAUTH_URL`          | Base URL for NextAuth.js configuration                    | `https://yourapp.com`           |
| `NEXTAUTH_SECRET`       | Secret key for encrypting tokens/sessions                 | `super-secret-key`              |
| `NEXT_PUBLIC_SUPABASE_URL` | URL for Supabase project                                  | `https://abcd1234.supabase.co`  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key for Supabase                         | `eyJh...`                       |
| `SUPABASE_SERVICE_KEY`  | Service key for server-side operations                    | `eyJh...`                       |
| `SMTP_HOST`             | SMTP server host                                          | `smtp.mailtrap.io`              |
| `SMTP_PORT`             | SMTP server port                                          | `587`                           |
| `SMTP_USER`             | SMTP username                                             | `username123`                   |
| `SMTP_PASSWORD`         | SMTP password                                             | `secret-password`               |
| `RECAPTCHA_SITE_KEY`    | Google reCAPTCHA site key                                 | `6Lc...`                        |
| `RECAPTCHA_SECRET_KEY`  | Google reCAPTCHA secret key                               | `6Lc...secret`                  |

See `.env.example` for a complete list of environment variables and descriptions.

### 7.2 Best Practices for Environment Variables
- Never commit `.env` files to version control.
- Use secure secrets management systems for production (e.g., GitHub Secrets, Vercel Environment Variables, Coolify Settings).
- Regularly rotate keys and credentials.
- Handle missing environment variables gracefully during build with the safe access methods in `lib/build-helpers.ts`

---

## 8. Summary & Implementation Roadmap

- **Local Development:**  
  Ensure a robust local setup with consistent configurations that mirror staging/production.

- **Version Control & CI/CD:**  
  Use GitHub for versioning, automated testing, and continuous deployment to either Vercel or Coolify.

- **Security:**  
  Enforce strict authentication, RBAC, and data protection measures along with comprehensive logging and monitoring.

- **Production Hygiene:**  
  Enforce cleaning of production builds by removing any development-specific instructions, debug code, and test endpoints.

- **Deployment Options:**
  - Use Vercel for serverless deployment with edge functions and global CDN
  - Use Coolify for container-based deployment with consistent performance and self-hosted options
  - Follow the comparison guide to make the best choice for your specific requirements

- **Operational Excellence:**  
  Maintain updated documentation, regular security audits, and a well-defined incident response plan.

By integrating these DevOps practices, the project benefits from a streamlined development process, secure and reliable deployments, and effective operational management.

---

## 9. References

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Supabase Documentation](https://supabase.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/getting-started/introduction)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [next-intl Documentation](https://github.com/amannn/next-intl)
- [i18n Routing Documentation](https://nextjs.org/docs/advanced-features/i18n-routing)
- [Vercel Documentation](https://vercel.com/docs)
- [Coolify Documentation](https://coolify.io/docs) 