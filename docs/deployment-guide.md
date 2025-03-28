# Deployment Guide

This guide outlines the process for deploying the OSINT Dashboard to a production environment using Vercel. It covers the necessary steps, configuration, and best practices.

## Prerequisites

Before deploying, ensure you have:

1. A Vercel account with appropriate access permissions
2. A Supabase project set up and configured
3. All required environment variables defined
4. Completed all development and testing requirements

## Environment Variables

### Required Variables

The following environment variables must be set in your Vercel deployment settings:

```
# Authentication
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=your-secure-nextauth-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# GraphQL
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://your-production-domain.com/api/graphql
GRAPHQL_SERVER_SECRET=your-graphql-server-secret

# Email (SMTP)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password 
EMAIL_FROM=noreply@your-domain.com

# reCAPTCHA
RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
```

### Environment-Specific Configuration

Vercel provides different environments for each deployment:

1. **Production**: Main branch deployments
2. **Preview**: Pull request deployments
3. **Development**: Local development

You can use the `VERCEL_ENV` environment variable to determine the current environment and configure your application accordingly.

## Deployment Process

### 1. Connect Your Repository to Vercel

1. Log in to your Vercel account
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project settings:
   - Build Command: `npm run vercel-build`
   - Output Directory: `.next`
   - Environment Variables: Add all required variables

### 2. Configure Build Settings

For optimal builds in Vercel, configure the following:

1. Node.js Version: 18.x or higher
2. Install Command: `npm ci`
3. Build Command: `npm run vercel-build`

### 3. Set Up Custom Domain (Optional)

1. In your Vercel project settings, go to "Domains"
2. Add your custom domain
3. Follow the DNS configuration instructions
4. Set up SSL certificates (Vercel handles this automatically)

### 4. Configure Deployment Branch

1. In your Vercel project settings, go to "Git"
2. Set the Production Branch to your main branch (e.g., `main` or `master`)
3. Configure branch protection rules in GitHub to ensure code quality

## Deployment Strategies

### Continuous Deployment

Our recommended approach is to use continuous deployment:

1. Set up GitHub Actions for CI testing
2. Configure automatic deployments to Vercel
3. Use branch protection rules to enforce code quality
4. Implement a pull request review process

Example GitHub workflow:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/actions/cli@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Manual Deployments

For more controlled deployments:

1. Create production-ready builds locally
2. Test thoroughly in a staging environment
3. Deploy to production via the Vercel dashboard
4. Monitor the deployment for any issues

## Post-Deployment Tasks

After a successful deployment:

1. Verify all routes and functionality
2. Check that API endpoints are responding correctly
3. Monitor application logs for any errors
4. Perform spot checks on critical features
5. Verify that authentication is working properly

## Rollback Procedure

If issues are discovered after deployment:

1. Log in to the Vercel dashboard
2. Navigate to your project's Deployments tab
3. Find the last successful deployment
4. Click the three dots menu and select "Promote to Production"
5. Verify the rollback was successful

## Performance Optimization

Vercel offers several performance features:

1. **Edge Functions**: Deploy critical API routes to the edge network
2. **ISR (Incremental Static Regeneration)**: Use for pages that change infrequently
3. **Image Optimization**: Enable Next.js Image component with Vercel's optimization
4. **Analytics**: Enable Vercel Analytics to monitor Web Vitals

Configuration example in `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-image-domain.com'],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: true,
  },
};

export default nextConfig;
```

## Monitoring and Logging

### Vercel Analytics

1. Enable Vercel Analytics in your project settings
2. Monitor Core Web Vitals
3. Track user behavior and performance metrics
4. Set up alerts for performance degradation

### Error Monitoring

1. Consider integrating with Sentry or other error monitoring services
2. Configure structured logging in your application
3. Set up alerts for critical errors

## Security Considerations

1. Enable all security headers in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

2. Ensure all environment variables are properly set
3. Implement proper authentication checks in API routes
4. Use HttpOnly cookies for authentication tokens
5. Configure proper CORS settings

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check the build logs in Vercel
   - Verify that all dependencies are properly installed
   - Ensure environment variables are correctly set

2. **API Connection Issues**:
   - Verify Supabase connection settings
   - Check CORS configuration
   - Ensure proper authentication headers

3. **Deployment Timeouts**:
   - Optimize build times by using proper caching
   - Consider reducing the size of the application

### Getting Help

If you encounter issues with deployment:

1. Check the [Vercel documentation](https://vercel.com/docs)
2. Review the project's [architecture documentation](./project-architecture.md)
3. Consult the [Vercel Deployment Guide](./vercel-deployment.md) for specific guidance

## Conclusion

Following this deployment guide will help ensure a smooth transition from development to production. By leveraging Vercel's platform, the OSINT Dashboard can be deployed with minimal configuration while maintaining high performance and security standards.

## Document Purpose & Reference Usage

This document serves as the comprehensive deployment guide for the OSINT Dashboard project. It's designed to be used by:

- DevOps engineers handling the deployment process
- Developers preparing code for production
- System administrators managing production environments
- Team leads overseeing the deployment workflow

The guide should be consulted when:
- Setting up initial production deployments
- Configuring continuous integration/deployment pipelines
- Troubleshooting deployment issues
- Planning deployment strategies for new features
- Reviewing security configurations for production

This guide works in conjunction with the Project Architecture document and the Vercel-specific deployment document to provide a complete picture of the deployment process from development to production.
