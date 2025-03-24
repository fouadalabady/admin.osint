# Testing Guidelines: Password Reset Flow

This document outlines testing procedures for the password reset flow in the OSINT Dashboard, covering unit tests, integration tests, and end-to-end tests.

## Testing Environment Setup

### Local Testing Environment

Before running tests, set up the local environment:

1. Start Supabase locally:
   ```bash
   npx supabase start
   ```

2. Create necessary database tables:
   ```bash
   npx supabase db reset
   ```

3. Ensure test environment variables are set:
   ```
   TEST_USER_EMAIL=test@example.com
   TEST_USER_PASSWORD=StrongPassword123!
   ```

### Test Database Seeding

Seed the database with test users:

```typescript
// scripts/seed-test-db.ts
async function seedTestUsers() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Create test user
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test@example.com',
    password: 'StrongPassword123!',
    email_confirm: true
  });
  
  if (error) {
    console.error('Error seeding test user:', error);
    return;
  }
  
  console.log('Test user created with ID:', data.user.id);
}
```

## Unit Tests

### Testing Code Generation

```typescript
// utils/generateRandomCode.test.ts
import { generateRandomCode } from '../lib/utils';

describe('generateRandomCode', () => {
  test('generates code of specified length', () => {
    const code = generateRandomCode(6);
    expect(code.length).toBe(6);
  });
  
  test('generates only numeric characters', () => {
    const code = generateRandomCode(10);
    expect(/^\d+$/.test(code)).toBe(true);
  });
  
  test('generates different codes on successive calls', () => {
    const code1 = generateRandomCode();
    const code2 = generateRandomCode();
    expect(code1).not.toBe(code2);
  });
});
```

### Testing Email Validation

```typescript
// lib/validation.test.ts
import { validateEmail } from '../lib/validation';

describe('Email Validation', () => {
  test('validates correct email formats', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
  });
  
  test('rejects invalid email formats', () => {
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('user@example')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('user example.com')).toBe(false);
  });
});
```

### Testing Password Strength

```typescript
// utils/passwordStrength.test.ts
import { checkPasswordStrength } from '../lib/passwordStrength';

describe('Password Strength Checker', () => {
  test('identifies weak passwords', () => {
    expect(checkPasswordStrength('12345678')).toBe(0); // Very weak
    expect(checkPasswordStrength('password')).toBe(0); // Very weak
  });
  
  test('recognizes strong passwords', () => {
    expect(checkPasswordStrength('C0mpl3x!P@ssw0rd')).toBeGreaterThanOrEqual(3);
  });
  
  test('handles empty input', () => {
    expect(checkPasswordStrength('')).toBe(0);
  });
});
```

## Integration Tests

### Testing Reset Password API

```typescript
// app/api/auth/reset-password/route.test.ts
import { POST } from '../app/api/auth/reset-password/route';
import { createMockRequest } from '../test/helpers';

// Mock Supabase client
jest.mock('../lib/supabase', () => ({
  createServerSupabaseClient: jest.fn(() => ({
    auth: {
      resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null })
    },
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null })
    })
  }))
}));

describe('Reset Password API', () => {
  test('returns 400 for invalid email', async () => {
    const req = createMockRequest({ email: 'invalid-email' });
    const response = await POST(req);
    
    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty('error');
  });
  
  test('returns 200 for valid email', async () => {
    const req = createMockRequest({ email: 'test@example.com' });
    const response = await POST(req);
    
    expect(response.status).toBe(200);
    expect(await response.json()).toHaveProperty('success', true);
  });
  
  test('handles Supabase error gracefully', async () => {
    // Override mock to simulate error
    const supabaseClientMock = require('../lib/supabase').createServerSupabaseClient;
    supabaseClientMock.mockReturnValueOnce({
      auth: {
        resetPasswordForEmail: jest.fn().mockResolvedValue({ error: { message: 'Test error' } })
      },
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null })
      })
    });
    
    const req = createMockRequest({ email: 'test@example.com' });
    const response = await POST(req);
    
    // Should still return 200 to prevent user enumeration
    expect(response.status).toBe(200);
  });
});
```

### Testing Verification Code API

```typescript
// app/api/auth/verify-reset-code/route.test.ts
import { POST } from '../app/api/auth/verify-reset-code/route';
import { createMockRequest } from '../test/helpers';

// Mock database responses
jest.mock('../lib/supabase', () => ({
  createServerSupabaseClient: jest.fn(() => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [
          {
            id: '123',
            email: 'test@example.com',
            code: '123456',
            verified: false,
            expires_at: new Date(Date.now() + 3600000).toISOString()
          }
        ],
        error: null
      }),
      update: jest.fn().mockResolvedValue({ error: null })
    }),
    auth: {
      admin: {
        getUserByEmail: jest.fn().mockResolvedValue({ 
          data: { user: { id: 'user-123' } },
          error: null 
        }),
        updateUserById: jest.fn().mockResolvedValue({ error: null })
      }
    }
  }))
}));

describe('Verify Reset Code API', () => {
  test('returns 400 for missing parameters', async () => {
    const req = createMockRequest({ email: 'test@example.com' }); // Missing code and password
    const response = await POST(req);
    
    expect(response.status).toBe(400);
  });
  
  test('returns 400 for invalid code', async () => {
    // Override mock for invalid code
    const supabaseClientMock = require('../lib/supabase').createServerSupabaseClient;
    supabaseClientMock.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [], // No verification found
          error: null
        })
      })
    });
    
    const req = createMockRequest({ 
      email: 'test@example.com',
      code: '999999',
      password: 'NewPassword123!'
    });
    
    const response = await POST(req);
    expect(response.status).toBe(400);
  });
  
  test('returns 200 for successful verification', async () => {
    const req = createMockRequest({ 
      email: 'test@example.com',
      code: '123456',
      password: 'NewPassword123!'
    });
    
    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(await response.json()).toHaveProperty('success', true);
  });
});
```

## End-to-End Tests

For end-to-end testing, use Playwright or Cypress to automate the complete user flow.

### Testing the Forgot Password Page

```typescript
// e2e/forgot-password.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Forgot Password Flow', () => {
  test('should show success message after submitting email', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Fill in email
    await page.fill('[name="email"]', 'test@example.com');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check for success message
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('instructions');
  });
  
  test('should validate email format', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Fill invalid email
    await page.fill('[name="email"]', 'invalid-email');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check for validation error
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('valid email');
  });
});
```

### Testing the Reset Password Page

```typescript
// e2e/reset-password.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Reset Password Page', () => {
  test('should allow resetting password with code', async ({ page }) => {
    // Mock API responses for testing
    await page.route('**/api/auth/verify-reset-code', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true })
      });
    });
    
    await page.goto('/auth/reset-password');
    
    // Switch to code-based tab
    await page.click('#code-tab');
    
    // Fill form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="code"]', '123456');
    await page.fill('[name="password"]', 'NewStrongP@ssw0rd');
    await page.fill('[name="confirmPassword"]', 'NewStrongP@ssw0rd');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check for success message
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('successfully reset');
    
    // Should redirect to login page after success
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });
  
  test('should validate password strength', async ({ page }) => {
    await page.goto('/auth/reset-password');
    
    // Switch to code-based tab
    await page.click('#code-tab');
    
    // Fill form with weak password
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="code"]', '123456');
    await page.fill('[name="password"]', 'password123');
    await page.fill('[name="confirmPassword"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check for validation error
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('stronger password');
  });
  
  test('should validate password match', async ({ page }) => {
    await page.goto('/auth/reset-password');
    
    // Switch to code-based tab
    await page.click('#code-tab');
    
    // Fill form with mismatched passwords
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="code"]', '123456');
    await page.fill('[name="password"]', 'StrongP@ssw0rd1');
    await page.fill('[name="confirmPassword"]', 'StrongP@ssw0rd2');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check for validation error
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('match');
  });
});
```

## Performance Testing

### API Response Times

Monitor API response times to ensure they meet performance targets:

```typescript
// performance/api-performance.test.ts
import { POST } from '../app/api/auth/reset-password/route';
import { createMockRequest } from '../test/helpers';

describe('API Performance', () => {
  test('reset password API responds within 500ms', async () => {
    const req = createMockRequest({ email: 'test@example.com' });
    
    const startTime = performance.now();
    await POST(req);
    const endTime = performance.now();
    
    const responseTime = endTime - startTime;
    expect(responseTime).toBeLessThan(500);
  });
});
```

## Security Testing

### Testing Rate Limiting

```typescript
// security/rate-limiting.test.ts
import { POST } from '../app/api/auth/reset-password/route';
import { createMockRequest } from '../test/helpers';

describe('Rate Limiting', () => {
  test('blocks excessive requests from same IP', async () => {
    const req = createMockRequest(
      { email: 'test@example.com' },
      { headers: { 'x-forwarded-for': '192.168.1.1' } }
    );
    
    // Make initial requests
    for (let i = 0; i < 5; i++) {
      await POST(req);
    }
    
    // This request should be rate limited
    const response = await POST(req);
    expect(response.status).toBe(429);
  });
});
```

## Test Reporting and CI/CD Integration

Configure Jest to generate coverage reports:

```json
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

## Manual Testing Checklist

For thorough testing, follow this manual testing checklist:

1. **Forgot Password Flow**
   - [ ] Submit valid email address
   - [ ] Submit invalid email format
   - [ ] Submit non-existent email address
   - [ ] Check for consistent success messaging

2. **Email Receipt**
   - [ ] Verify Supabase email delivery
   - [ ] Verify SMTP fallback email delivery
   - [ ] Check email content and formatting
   - [ ] Verify reset link functionality
   - [ ] Verify code readability

3. **Reset Password Page**
   - [ ] Test URL token verification
   - [ ] Test manual code entry
   - [ ] Test password strength feedback
   - [ ] Test password matching validation
   - [ ] Test successful submission

4. **Security Checks**
   - [ ] Test expired tokens/codes
   - [ ] Test used tokens/codes (prevent reuse)
   - [ ] Test rate limiting (multiple attempts)
   - [ ] Test SQL injection in input fields

5. **Accessibility**
   - [ ] Test keyboard navigation
   - [ ] Test screen reader compatibility
   - [ ] Test color contrast
   - [ ] Test with zoom/magnification

## Appendix: Test Helpers

### Mock Request Creator

```typescript
// test/helpers.ts
import { NextRequest } from 'next/server';

export function createMockRequest(body: any, options = {}) {
  const { headers = {} } = options;
  
  return new NextRequest('http://localhost:3000', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers
    })
  });
}
```

### Test Database Utilities

```typescript
// test/db-helpers.ts
import { createClient } from '@supabase/supabase-js';

export async function cleanupTestData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Clean up test verification codes
  await supabase
    .from('password_reset_verifications')
    .delete()
    .eq('email', 'test@example.com');
    
  // Other cleanup as needed
} 