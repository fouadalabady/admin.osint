# Linting Issues Guide

This guide provides step-by-step instructions for addressing the common linting issues in our OSINT Dashboard codebase, ensuring builds pass smoothly with Coolify.

## Common Linting Errors

Our build output shows several recurring issues that need to be addressed:

1. `@typescript-eslint/no-explicit-any`: Using `any` type
2. `@typescript-eslint/no-unused-vars`: Unused variables or imports
3. `@typescript-eslint/no-empty-object-type`: Empty interfaces
4. `react-hooks/exhaustive-deps`: Missing dependencies in hooks

## How to Fix Each Issue Type

### 1. Fixing `no-explicit-any` Issues

These errors occur when using the `any` type, which bypasses TypeScript's type checking.

**Example from our codebase:**
```typescript
catch (error: any) {
  console.error('Error in OTP verification process:', error);
  return NextResponse.json({ error: error.message || 'Failed to verify OTP' }, { status: 500 });
}
```

**Solution:**
```typescript
catch (error) {
  console.error('Error in OTP verification process:', error);
  const errorMessage = error instanceof Error ? error.message : 'Failed to verify OTP';
  return NextResponse.json({ error: errorMessage }, { status: 500 });
}
```

**For function parameters:**
```typescript
// Before
async function notifyAdminsAboutNewRegistration(supabase: any, userId: string, userEmail: string) {
  // ...
}

// After
import { SupabaseClient } from '@supabase/supabase-js';

async function notifyAdminsAboutNewRegistration(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string
) {
  // ...
}
```

### 2. Fixing `no-unused-vars` Issues

These errors occur when variables or imports are declared but never used.

**Examples from our codebase:**
```typescript
// Unused import
import { useState, useEffect, Link } from 'react';

// Unused variables
const [selectedRegistration, setSelectedRegistration] = useState(null);

// Unused component imports
import { AlertDialogTrigger } from '@/components/ui/alert-dialog';
```

**Solutions:**
1. Remove unused imports:
   ```typescript
   import { useState, useEffect } from 'react';
   ```

2. Remove unused variables or use them:
   ```typescript
   // Option 1: Remove the variable
   const [, setSelectedRegistration] = useState(null);
   
   // Option 2: Use the variable
   const [selectedRegistration, setSelectedRegistration] = useState(null);
   return <div>{selectedRegistration && <Details data={selectedRegistration} />}</div>;
   ```

3. Remove unused component imports:
   ```typescript
   import {
     AlertDialog,
     AlertDialogAction,
     AlertDialogCancel,
     AlertDialogContent,
     AlertDialogDescription,
     AlertDialogFooter,
     AlertDialogHeader,
     AlertDialogTitle,
   } from '@/components/ui/alert-dialog';
   ```

### 3. Fixing `no-empty-object-type` Issues

These occur when interfaces don't declare any properties or only extend other interfaces without adding new properties.

**Example from our codebase:**
```typescript
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Add specific props if needed
}
```

**Solution:**
Use a type alias instead:
```typescript
type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
```

### 4. Fixing `react-hooks/exhaustive-deps` Issues

These warnings occur when React's useEffect or useCallback hooks don't include all referenced values in their dependency arrays.

**Example from our codebase:**
```typescript
useEffect(() => {
  fetchRegistrations();
}, []); // fetchRegistrations is missing in the dependency array
```

**Solutions:**
1. Include the missing dependency:
   ```typescript
   useEffect(() => {
     fetchRegistrations();
   }, [fetchRegistrations]);
   ```

2. Move the function inside the effect if it only needs to be defined within the effect:
   ```typescript
   useEffect(() => {
     const fetchRegistrations = async () => {
       // Implementation here
     };
     
     fetchRegistrations();
   }, []);
   ```

3. Use useCallback for the function to stabilize it:
   ```typescript
   const fetchRegistrations = useCallback(async () => {
     // Implementation here
   }, [dependencies]);
   
   useEffect(() => {
     fetchRegistrations();
   }, [fetchRegistrations]);
   ```

## Automated Fixing Process

1. **Run the automatic fixer:**
   ```bash
   npm run fix-code-quality
   ```

2. **Review the remaining errors** in the console output.

3. **Fix each class of errors** following the patterns above.

4. **Re-run the linter** to verify fixes:
   ```bash
   npm run lint
   ```

5. **Fix any remaining issues** by hand and commit the changes.

## Testing Your Fixes

After addressing the linting issues, ensure that the build process completes successfully:

```bash
npm run build
```

If the build fails, review the output for any remaining issues and address them using the guidelines in this document.

## Preventing Future Issues

1. **IDE Integration**: Configure your IDE to show linting errors in real-time.
2. **Pre-commit Hooks**: Add pre-commit hooks that run linting before allowing commits.
3. **Regular Maintenance**: Periodically run the linting fix tool to catch new issues.
4. **Code Reviews**: Pay attention to linting issues during code reviews.

By following this guide and addressing all linting issues, we'll maintain a clean, error-free codebase that builds successfully in our Coolify deployment environment. 