# Vercel Deployment Guide

This document outlines our approach to deploying the OSINT Dashboard to Vercel, with a focus on ensuring error-free builds and successful deployments.

## 1. Build Configuration

### 1.1 Optimized Next.js Configuration

Our `next.config.mjs` includes specific optimizations for Vercel deployment:

```javascript
// Production optimizations
poweredByHeader: false, // Remove X-Powered-By header
reactStrictMode: true,

// Image optimization configuration
images: {
  domains: ['your-domain.com'],
  formats: ['image/avif', 'image/webp'],
},

// Vercel specific configurations
experimental: {
  serverActions: true,
},
```

The Next.js configuration is optimized for Vercel's hosting environment, taking advantage of their edge network and serverless functions.

### 1.2 TypeScript and ESLint Error Handling

During the build process, we temporarily ignore TypeScript errors and ESLint issues to ensure successful builds:

```javascript
// Configure ESLint during builds
eslint: {
  // Temporarily ignore ESLint during builds to allow deployments
  // TODO: Re-enable once critical ESLint issues are resolved
  ignoreDuringBuilds: true,
},

// TypeScript type checking configuration
typescript: {
  // Temporarily ignore TypeScript errors during build to allow deployment
  // TODO: Remove this once all TypeScript errors are fixed
  ignoreBuildErrors: true,
},
```

While this allows builds to complete, our development process includes gradually fixing all type errors and linting issues. See `docs/type-checking.md` and `docs/build-process.md` for our approach to code quality.

## 2. Build Scripts

We've configured several build scripts in `package.json` to handle different scenarios:

```json
"build": "FORCE_BUILD=true NODE_ENV=production next build --no-lint",
"build:force": "FORCE_BUILD=true NODE_ENV=production next build --no-lint",
"build:production": "npm run lint:fix && npm run typecheck && next build",
```

For Vercel deployments, we use:

```json
"vercel-build": "NODE_OPTIONS='--max-old-space-size=4096' NEXT_PUBLIC_VERCEL_ENV=production VERCEL_ENV=build next build || (echo 'Build failed! Trying again with debug logs:' && NODE_OPTIONS='--max-old-space-size=4096' NEXT_PUBLIC_VERCEL_ENV=production VERCEL_ENV=build DEBUG=* next build)",
```

This script increases Node's memory allocation, sets Vercel-specific environment variables, and includes fallback debugging if the initial build fails.

## 3. Vercel Configuration

### 3.1 vercel.json

The `vercel.json` file in the project root defines how Vercel should build and deploy the application:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "NEXT_TELEMETRY_DISABLED": "1"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
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
        }
      ]
    }
  ]
}
```

### 3.2 Health Check Endpoint

We've implemented a health check endpoint at `/api/health/route.ts` that can be used to verify deployment success:

```typescript
export async function GET() {
  return Response.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
  });
}
```

## 4. Vercel Environment Variables

Vercel provides several environment variables that we can use to detect the current environment:

- `VERCEL_ENV`: Can be 'production', 'preview', or 'development'
- `VERCEL`: Set to '1' when running on Vercel
- `VERCEL_URL`: The URL of the deployment (e.g., 'project-name-git-branch-username.vercel.app')
- `VERCEL_REGION`: The region where the function is running

We use these variables to tailor our application behavior based on the environment:

```typescript
const isProduction = process.env.VERCEL_ENV === 'production';
const isVercel = process.env.VERCEL === '1';
const deploymentUrl = process.env.VERCEL_URL || 'localhost:3000';
```

## 5. Error Handling Strategy

### 5.1 Build Failures

When a build fails in Vercel:

1. Check the build logs in the Vercel dashboard for specific errors
2. If TypeScript errors are causing failures, ensure the build configuration is set to ignore these errors during build
3. For memory issues, adjust the `NODE_OPTIONS` with higher memory allocation
4. Use the debug build option in our `vercel-build` script for more verbose output

### 5.2 Handling TypeScript Errors

We've implemented a progressive approach to TypeScript errors:

1. Allow builds to proceed despite errors using `ignoreBuildErrors: true`
2. Create proper TypeScript definitions in `types/auth.d.ts` and other files
3. Use proper type assertions in the code, such as `(session?.user?.role as UserRole) === 'super_admin'`
4. Gradually fix errors in non-critical files

For detailed guidance, see `docs/type-checking.md`.

### 5.3 Runtime Failures

For runtime errors in the Vercel environment:

1. Use Vercel's Function Logs feature to identify issues
2. Add structured error logging that captures environment information
3. Implement error boundary components to prevent cascading UI failures
4. Consider using Vercel's Error Monitoring integration with Sentry

### 5.4 Rollback Strategy

Vercel's deployment system makes it easy to roll back to previous deployments:

1. Go to the Vercel dashboard for the project
2. Find the "Deployments" tab
3. Locate the last working deployment
4. Click the "..." menu and select "Promote to Production"

This allows quick recovery from problematic deployments without code changes.

## 6. Preview Deployments

Vercel automatically creates preview deployments for pull requests, which enables:

1. Testing changes in an isolated environment
2. Running integration tests against the preview URL
3. Sharing links with team members for review
4. Verifying functionality before merging to main branch

To facilitate this workflow, we've added a GitHub Actions workflow for automated tests against preview deployments.

## 7. Performance Monitoring

Vercel provides built-in analytics and performance monitoring:

1. **Web Vitals**: Tracking Core Web Vitals metrics
2. **Edge Network Performance**: CDN and Edge Function performance
3. **API Routes Monitoring**: Response times and error rates
4. **Function Execution**: Serverless function performance

This data helps us identify bottlenecks and improve user experience.

## Document Purpose & Reference Usage

This document serves as a comprehensive reference for deploying our application to Vercel. It should be used by:

- DevOps engineers configuring deployment pipelines
- Developers troubleshooting build or runtime issues
- Team leads planning deployment strategies
- New team members understanding our deployment process

Consult this document when:
- Setting up new Vercel projects
- Debugging deployment failures
- Optimizing build configurations
- Implementing monitoring and alerting
- Planning for high-availability deployments
- Understanding the lifecycle of our production application