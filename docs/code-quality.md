# Code Quality Guidelines for OSINT Dashboard

This document outlines our approach to code quality, standards for the codebase, and instructions for managing and fixing common issues.

## Introduction

We maintain high code quality standards to ensure our builds are error-free, especially when deploying with Vercel. Our approach includes:

1. **Static Analysis** via ESLint and TypeScript
2. **Formatting Standards** via Prettier
3. **Automated Quality Checks** in CI/CD pipelines
4. **Developer Tooling** to catch and fix issues early

## Code Standards

### TypeScript

- **Strong Typing**: Avoid the use of `any` types. Instead, define proper interfaces or types.
- **Unknown vs Any**: Use `unknown` instead of `any` when the type is truly unknown.
- **Type Guards**: Implement type guards when narrowing types, especially for error handling.

```typescript
// ❌ Bad - Using any
function handleError(error: any) {
  console.error(error.message);
}

// ✅ Good - Using type guards with unknown
function handleError(error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
}
```

### ESLint Rules

Our ESLint configuration enforces:

- No unused variables or imports
- No explicit any types
- No empty interfaces
- Proper React hooks dependencies
- Consistent naming conventions

### Fixing Common Issues

#### Unused Variables

```typescript
// ❌ Bad - Unused variable
const [value, setValue] = useState('');
// The variable 'value' is never used

// ✅ Good - Either use it or remove it
const [value, setValue] = useState('');
return <div>{value}</div>;

// Alternative: Use _ prefix (only if ESLint is configured to allow this)
const [_value, setValue] = useState('');
```

#### Type 'any' Issues

```typescript
// ❌ Bad - Using any
function processData(data: any) {
  return data.value;
}

// ✅ Good - Define a proper interface
interface DataItem {
  value: string;
  [key: string]: unknown;
}

function processData(data: DataItem) {
  return data.value;
}
```

#### Empty Interfaces

```typescript
// ❌ Bad - Empty interface
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

// ✅ Good - Use type alias instead
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
```

#### React Hooks Dependencies

```typescript
// ❌ Bad - Missing dependency
useEffect(() => {
  fetchData(userId);
}, []); // userId is missing in the dependency array

// ✅ Good - Include all dependencies
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

## Tools for Managing Code Quality

### Automated Fixes

We've added several npm scripts to help manage code quality:

- `npm run lint`: Run ESLint to identify issues
- `npm run lint:fix`: Run ESLint and automatically fix issues where possible
- `npm run format`: Format code with Prettier
- `npm run typecheck`: Check TypeScript types without compilation
- `npm run fix-code-quality`: Run both format and lint:fix to resolve common issues

### CI/CD Integration

Our GitHub Actions workflows include code quality checks that must pass before a build can proceed. This ensures that code quality issues don't make it to production.

### Pre-commit Hooks

We recommend setting up pre-commit hooks using husky and lint-staged to catch issues before they're committed:

```bash
npx husky-init && npm install
npx husky add .husky/pre-commit "npx lint-staged"
```

Then configure lint-staged in package.json:

```json
"lint-staged": {
  "*.{ts,tsx}": [
    "prettier --write",
    "eslint --fix"
  ]
}
```

## Best Practices for Clean Code

1. **Keep components small and focused** 
2. **Use proper error handling** - always catch errors and provide helpful messages
3. **Write meaningful comments** for complex logic
4. **Use consistent naming conventions**
5. **Organize imports** - group by external, internal, and relative
6. **Refactor complex functions** into smaller, testable units
7. **Add proper types for all parameters and return values**
8. **Follow the React hooks patterns** for handling side effects

## Conclusion

Maintaining high code quality is a team effort. By following these guidelines and using the provided tools, we can ensure our codebase remains clean, maintainable, and error-free through the build and deployment process.

## Document Purpose & Reference Usage

This document serves as a central reference for all developers working on the OSINT Dashboard project to understand and implement the project's code quality standards. It's intended to be used as:

- An onboarding resource for new team members to quickly understand code quality expectations
- A practical guide for fixing common linting and type-checking issues
- A reference for standardizing coding practices across the team
- A troubleshooting resource when resolving build failures related to code quality

Developers should consult this document when writing new code, refactoring existing code, or addressing code quality issues flagged during code reviews or CI/CD processes. It complements the Type Checking Guide and Linting Guide by focusing on broader coding quality principles and practical examples of best practices.
