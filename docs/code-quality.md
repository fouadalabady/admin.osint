# Code Quality Guidelines

This document outlines the code quality standards and procedures for the OSINT Dashboard project. Following these guidelines ensures a clean, maintainable, and error-free codebase.

## Code Quality Standards

### 1. Linting Rules

We use ESLint with the Next.js core web vitals configuration to enforce code quality. The following rules are set to `warn` to highlight issues that should be fixed:

- `@typescript-eslint/no-explicit-any`: Avoid using `any` type to ensure type safety.
- `@typescript-eslint/no-unused-vars`: Remove unused variables and imports.
- `react/no-unescaped-entities`: Properly escape special characters in JSX.
- `react-hooks/exhaustive-deps`: Specify all dependencies in React hooks.
- `@typescript-eslint/no-empty-object-type`: Avoid empty interfaces.

### 2. TypeScript Type Safety

- Always use proper TypeScript types instead of `any`.
- Define interfaces for all component props.
- Use type guards when necessary to ensure type safety.

### 3. React Best Practices

- Properly manage dependencies in useEffect hooks.
- Use proper React component structures and naming.
- Implement React.memo for performance optimization when appropriate.
- Follow the single responsibility principle in components.

## Build Process

Our build process enforces code quality through several steps:

1. **Linting**: `npm run lint:fix` runs ESLint to fix and identify issues.
2. **Type Checking**: `npm run typecheck` ensures TypeScript compliance.
3. **Formatting**: `npm run format` enforces consistent code style with Prettier.
4. **Pre-build Checks**: Before building, linting and type checking are run.

## CI/CD Integration

Code quality is enforced in our CI/CD pipelines:

- **CI Workflow**: Runs linting, type checking, and tests before builds.
- **CD Workflow**: Verifies code quality before deployment.
- **Docker Build**: Runs linting and type checking within the build process.

## Fixing Common Issues

### Fixing `no-explicit-any` Errors

```typescript
// Before
function processData(data: any) { ... }

// After
interface DataType {
  id: number;
  name: string;
  // Define all required properties
}

function processData(data: DataType) { ... }
```

### Fixing Unused Variables

```typescript
// Before
import { useState, useEffect, useRef } from 'react';
// If useRef is not used, remove it

// After
import { useState, useEffect } from 'react';
```

### Fixing React Hooks Dependencies

```typescript
// Before
useEffect(() => {
  fetchData(userId);
}, []); // Missing dependency

// After
useEffect(() => {
  fetchData(userId);
}, [userId]); // Properly specified dependency
```

### Fixing Unescaped Entities

```jsx
// Before
<p>Don't forget to escape characters</p>

// After
<p>Don&apos;t forget to escape characters</p>
```

## Development Workflow

1. Write code following the standards above.
2. Run `npm run fix-code-quality` regularly to identify and fix issues.
3. Address all warnings and errors before committing.
4. Submit PRs that pass all quality checks.

## Tools and Commands

- `npm run lint`: Check for linting issues.
- `npm run lint:fix`: Fix linting issues automatically when possible.
- `npm run typecheck`: Check for TypeScript errors.
- `npm run format`: Format code with Prettier.
- `npm run fix-code-quality`: Run all code quality checks and fixes.

By following these guidelines, we ensure that our codebase remains clean, maintainable, and free of common errors. 