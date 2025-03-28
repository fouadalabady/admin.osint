# Type Checking & Error Handling Guide

This document outlines our approach to TypeScript type checking and error handling in the OSINT Dashboard project. It explains both the ideal practices and temporary workarounds implemented to ensure successful builds.

## 1. TypeScript Configuration

### 1.1 Current Build Configuration

Our current Next.js configuration in `next.config.mjs` includes:

```javascript
typescript: {
  // Temporarily ignore TypeScript errors during build to allow deployment
  // TODO: Remove this once all TypeScript errors are fixed
  ignoreBuildErrors: true, 
},
```

This allows us to deploy the application while we progressively fix type errors. This is a **temporary measure** that should be removed once all critical type issues are resolved.

### 1.2 Type Checking During Development

While builds may temporarily proceed despite type errors, developers should run type checks locally:

```bash
npm run typecheck
```

### 1.3 Production Ready Type Checking

For production-grade builds that enforce type checking:

```bash
npm run build:production
```

This command runs the full suite of linting and type checking before building.

## 2. Common Type Issues & Solutions

### 2.1 User Role Type Safety

The most common type errors occur when comparing user roles. We've defined a proper `UserRole` type in `types/auth.d.ts`:

```typescript
export type UserRole = 'super_admin' | 'admin' | 'editor' | 'user';
```

When comparing roles, use appropriate type assertions or type guards:

```typescript
// Correct approach
if (session?.user?.role as UserRole === 'super_admin') {
  // ...
}

// Alternative using type guard
function isSuperAdmin(role: unknown): role is 'super_admin' {
  return role === 'super_admin';
}

if (isSuperAdmin(session?.user?.role)) {
  // ...
}
```

### 2.2 Database Error Handling

When dealing with database errors from Supabase, use type assertions to maintain type safety:

```typescript
const { error } = await supabase.from('table_name').select();

// Type assertion approach
const dbError = error as DatabaseError | null;
```

### 2.3 Session Extensions

We've extended the Next-Auth `Session` type to include custom properties. When accessing these properties, ensure you're using the correct type imports:

```typescript
import { Session } from 'next-auth';
// Our Session type is extended in types/auth.d.ts
```

## 3. Error Suppression Patterns

While fixing all type errors is preferred, there are legitimate cases where TypeScript's type system doesn't perfectly match our runtime behavior. In these cases:

### 3.1 Using @ts-ignore

Use sparingly and always with a comment explaining why:

```typescript
// @ts-ignore: We know user.role is always defined in this context because of the auth middleware
if (user.role === 'admin') {
  // ...
}
```

### 3.2 Type Assertions

When you're confident about a type but TypeScript isn't:

```typescript
const userData = data as User;
```

## 4. ESLint Integration

Our ESLint configuration works with TypeScript to provide additional error checking:

```json
"@typescript-eslint/no-unused-vars": "warn",
"@typescript-eslint/no-explicit-any": "warn",
```

## 5. Roadmap to Full Type Safety

1. Fix existing type errors one by one, prioritizing auth and security-critical code paths
2. Implement comprehensive type definitions for all database models
3. Enforce strict type checking in CI/CD pipeline
4. Remove temporary type error suppression in `next.config.mjs`
5. Enable strict mode in `tsconfig.json`

## 6. Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Next.js TypeScript Guide](https://nextjs.org/docs/basic-features/typescript)
- [Supabase TypeScript Support](https://supabase.com/docs/reference/javascript/typescript-support)

This document should be updated as the type system and error handling patterns in the codebase evolve. 

## 7. Document Purpose & Reference Usage

This document serves as a comprehensive guide for developers working on the OSINT Dashboard project to understand and implement proper TypeScript type checking and error handling. It's a reference for:

- Troubleshooting common type errors in the codebase
- Implementing proper type safety patterns
- Understanding temporary workarounds for build processes
- Tracking the project's roadmap toward full type safety

Developers should consult this document when encountering TypeScript errors, implementing new features that require type definitions, or when addressing build failures related to type checking. 