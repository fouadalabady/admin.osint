# Build Process & Error Handling Guide

This document outlines our approach to build processes and error handling for the OSINT Dashboard project, specifically addressing issues that may cause build failures in the CI/CD pipeline and with Vercel deployments.

## 1. Current Build Configuration

We've implemented a multi-tiered approach to builds to accommodate different scenarios:

### 1.1 Development Builds

For local development, run:

```bash
npm run dev
```

This starts the Next.js development server with full type checking and ESLint feedback.

### 1.2 Standard Build

For regular builds:

```bash
npm run build
```

This build uses the following configuration in `package.json`:
```json
"build": "FORCE_BUILD=true NODE_ENV=production next build --no-lint"
```

By passing `--no-lint`, we bypass ESLint checks during the build process to prevent linting errors from blocking deployment. The `FORCE_BUILD` environment variable is used in conjunction with our Next.js configuration to ignore certain issues.

### 1.3 Force Build

For builds that need to proceed regardless of issues:

```bash
npm run build:force
```

This uses the same configuration but is explicitly named to indicate it's bypassing checks.

### 1.4 Production-Quality Build

For complete validation including linting and type checking:

```bash
npm run build:production
```

This runs the complete suite of checks and is ideal for ensuring code quality:
```json
"build:production": "npm run lint:fix && npm run typecheck && next build"
```

## 2. Error Suppression Strategy

### 2.1 ESLint Configuration

Our ESLint configuration in `.eslintrc.json` is designed to:

1. Flag issues as warnings rather than errors where appropriate
2. Disable certain checks in specific files that have known issues
3. Configure appropriate ignore patterns for common cases

Key configuration:
```json
"@typescript-eslint/no-unused-vars": ["error", { 
  "argsIgnorePattern": "^_",
  "varsIgnorePattern": "^_",
  "caughtErrorsIgnorePattern": "^_"
}]
```

For specific files with ongoing issues, we've added overrides:
```json
"overrides": [
  {
    "files": [
      "app/api/auth/register/route.ts",
      "app/dashboard/layout.tsx",
      "app/dashboard/users/page.tsx",
      "app/debug/session/page.tsx"
    ],
    "rules": {
      "@typescript-eslint/no-unused-vars": "off"
    }
  }
]
```

### 2.2 TypeScript Error Management

In `next.config.mjs` we've configured the TypeScript checking:

```javascript
typescript: {
  // Temporarily ignore TypeScript errors during build to allow deployment
  // TODO: Remove this once all TypeScript errors are fixed
  ignoreBuildErrors: true, 
}
```

This allows the build to succeed despite TypeScript errors, which is necessary for deployment while we work on fixing underlying type issues.

## 3. Vercel Deployment Considerations

For our Vercel deployment pipeline, we've taken several additional steps:

1. The build command in Vercel project settings uses our configured build process
2. We've added proper caching for faster builds
3. We've implemented a health check endpoint for Vercel to verify deployment success

For detailed information about Vercel deployments, see [Vercel Deployment Guide](./vercel-deployment.md).

## 4. Common Build Errors and Solutions

### 4.1 TypeScript Type Mismatch Errors

The most common errors are type mismatches, especially involving:

- User role comparisons
- Database error handling
- Session object extensions

#### Solution:
Use proper type assertions as documented in [Type Checking Guide](./type-checking.md). For example:

```typescript
// Correct approach for role checking
const isSuperAdmin = (session?.user?.role as UserRole) === 'super_admin';
```

### 4.2 Unused Variables

ESLint flags unused variables, which can cause build failures.

#### Solutions:
1. Remove truly unused variables
2. Use the underscore prefix for intentionally unused variables: `_unusedVar`
3. Add ESLint disable comments for specific lines when needed

### 4.3 Next.js API Type Issues

We've encountered issues with Next.js API route typings, particularly with auth handlers.

#### Solutions:
1. Use `@ts-ignore` comments when necessary (with explanations)
2. Create interfaces that extend NextAuth types
3. Use type assertions when the runtime types are known to be correct

## 5. Progressive Improvement Strategy

Our long-term strategy is to eliminate the need for error suppression:

1. Fix TypeScript issues incrementally, prioritizing security-critical code paths
2. Update our custom type definitions to better match runtime behavior
3. Improve test coverage to catch type-related bugs earlier
4. Eventually enable strict type checking in our build process

## 6. Best Practices for Developers

1. Run `npm run typecheck` locally before committing
2. Use `npm run lint:fix` to automatically fix simple issues
3. Add detailed comments for any `@ts-ignore` or other suppressions
4. Consult the [Type Checking Guide](./type-checking.md) for recommended patterns

## 7. References

- [Next.js TypeScript Documentation](https://nextjs.org/docs/basic-features/typescript)
- [ESLint Configuration Guide](https://eslint.org/docs/user-guide/configuring/)
- [TypeScript Configuration Guide](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)

This document should be updated as our build process evolves and issues are resolved. 

## 8. Document Purpose & Reference Usage

This document serves as a comprehensive guide for developers and DevOps personnel involved in the OSINT Dashboard project to understand and manage the build process and related error handling. It's a reference for:

- Understanding the different build commands and when to use each one
- Resolving common build failures in development and CI/CD pipelines
- Implementing proper error handling patterns for TypeScript and ESLint issues
- Following the strategic approach to eliminating error suppression over time

Team members should consult this document when setting up build processes, troubleshooting build failures, or implementing new features that might impact the build process. It works in conjunction with the Type Checking Guide and Vercel Deployment Guide to provide a complete picture of the project's build and deployment strategy. 