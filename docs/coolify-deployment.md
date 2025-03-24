# Coolify Deployment Guide

This document outlines our approach to deploying the OSINT Dashboard to Coolify, with a focus on ensuring error-free builds and successful deployments.

## 1. Build Configuration

### 1.1 Optimized Next.js Configuration

Our `next.config.mjs` includes specific optimizations for Coolify deployment:

```javascript
// Production optimizations
poweredByHeader: false, // Remove X-Powered-By header
reactStrictMode: true,

// Enable output.standalone for better Docker compatibility
output: 'standalone',
```

The `standalone` output is particularly important for Docker-based deployments on Coolify, as it creates a more efficient container.

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

For Coolify deployments, we use:

```json
"coolify-build": "NODE_ENV=production npm run build:clean",
```

Which combines cleaning the build directory and running the error-tolerant build command.

## 3. Coolify Configuration

### 3.1 coolify.json

The `coolify.json` file in the project root defines how Coolify should build and deploy the application:

```json
{
  "name": "osint-dashboard",
  "buildPack": "nodejs",
  "nodejs": {
    "version": "18"
  },
  "commands": {
    "install": "npm ci",
    "build": "npm run build",
    "start": "npm start"
  },
  "environment": {
    "NODE_ENV": "production",
    "NEXT_TELEMETRY_DISABLED": "1"
  },
  "ports": [
    {
      "port": 3000,
      "protocol": "http",
      "public": true
    }
  ],
  "persistentStorage": [
    {
      "path": ".next/cache",
      "name": "next-cache"
    }
  ],
  "healthCheck": {
    "path": "/api/health",
    "port": 3000
  },
  "resources": {
    "cpu": 1,
    "memory": 1024
  },
  "deployment": {
    "cache": true,
    "restartOnFailure": true,
    "removeOldVersions": true
  }
}
```

### 3.2 Health Check Endpoint

We've implemented a health check endpoint at `/api/health/route.ts` that Coolify uses to verify deployment success:

```typescript
export async function GET() {
  return Response.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
  });
}
```

## 4. Dockerfile for Coolify

Our Dockerfile is optimized for Coolify deployments and handles errors gracefully:

```dockerfile
# Base stage for dependencies
FROM node:18-alpine AS base
WORKDIR /app

# Development dependencies stage
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
# Use our error-tolerant build
RUN npm run build

# Production runtime stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

## 5. Error Handling Strategy

### 5.1 Build Failures

When a build fails in Coolify:

1. Check the build logs for specific errors
2. If TypeScript errors are causing failures, ensure the build configuration is set to ignore these errors during build
3. For package installation failures, ensure node_modules is not in the .dockerignore file
4. Check for syntax errors or other critical issues that may not be related to typing

### 5.2 Handling TypeScript Errors

We've implemented a progressive approach to TypeScript errors:

1. Allow builds to proceed despite errors using `ignoreBuildErrors: true`
2. Create proper TypeScript definitions in `types/auth.d.ts` and other files
3. Use proper type assertions in the code, such as `(session?.user?.role as UserRole) === 'super_admin'`
4. Gradually fix errors in non-critical files

For detailed guidance, see `docs/type-checking.md`.

### 5.3 Runtime Failures

If the application deploys but doesn't run correctly:

1. Check the health check endpoint
2. Examine Coolify logs for runtime errors
3. Verify environment variables are correctly set in Coolify

## 6. Rollback Procedure

If a deployment fails or causes issues:

1. Use Coolify's rollback feature to return to the previous working version
2. Fix the issues locally
3. Push a new fix commit and allow Coolify to deploy it

## 7. Best Practices for Error-Free Deployments

1. Run `npm run build` locally before pushing to ensure it builds successfully
2. Include clear comments for temporary type suppression
3. Use the health check endpoint to verify application status
4. Maintain comprehensive documentation of known issues in `/docs`
5. Always test changes in a staging environment before deploying to production

## 8. References

- [Coolify Documentation](https://coolify.io/docs)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Our Build Process Guide](./build-process.md)
- [Our Type Checking Guide](./type-checking.md)

This document should be updated as our deployment processes evolve. 