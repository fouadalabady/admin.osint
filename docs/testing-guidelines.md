# Testing Guidelines

This document outlines the testing approach and best practices for the OSINT Dashboard & Agency Website project. Following these guidelines ensures consistent, high-quality code with proper test coverage.

## Testing Philosophy

Our testing strategy is built on these principles:

1. **Test-Driven Development (TDD)** - Write tests before implementation when possible
2. **Comprehensive Coverage** - Critical paths must have complete test coverage
3. **Automated Testing** - Tests should run automatically in CI/CD pipelines
4. **Realistic Testing** - Tests should simulate real-world usage scenarios
5. **Security-First Testing** - Security implications must be tested for all features

## Test Types

### 1. Unit Tests

Unit tests verify the functionality of individual components or functions in isolation.

**Tools:**

- Jest
- React Testing Library

**Guidelines:**

- Test each component in isolation, mocking dependencies
- Focus on testing component behavior, not implementation details
- Coverage requirements: 80% for critical utility functions and components

**Example:**

```tsx
// Component test example
describe('PasswordField', () => {
  it('should toggle password visibility when the toggle button is clicked', () => {
    const { getByLabelText, getByRole } = render(<PasswordField label="Password" />);
    const input = getByLabelText('Password') as HTMLInputElement;
    const toggleButton = getByRole('button', { name: /toggle password visibility/i });

    // Initially password is hidden
    expect(input.type).toBe('password');

    // Click to show password
    fireEvent.click(toggleButton);
    expect(input.type).toBe('text');

    // Click to hide password again
    fireEvent.click(toggleButton);
    expect(input.type).toBe('password');
  });
});
```

### 2. Integration Tests

Integration tests verify that different parts of the application work together as expected.

**Tools:**

- Jest
- React Testing Library
- MSW (Mock Service Worker) for API mocking

**Guidelines:**

- Test combinations of components and their interactions
- Test data flow between components and API calls
- Use realistic, representative data in tests

**Example:**

```tsx
// Integration test example
describe('ForgotPassword flow', () => {
  beforeAll(() => {
    // Setup MSW to intercept API calls
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('should submit email and show success message', async () => {
    // Mock successful API response
    server.use(
      rest.post('/api/auth/reset-password', (req, res, ctx) => {
        return res(ctx.json({ success: true }));
      })
    );

    const { getByLabelText, getByRole, findByText } = render(<ForgotPasswordPage />);

    // Fill and submit form
    fireEvent.change(getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.click(getByRole('button', { name: /reset password/i }));

    // Verify success message appears
    const successMessage = await findByText(/check your email/i);
    expect(successMessage).toBeInTheDocument();
  });
});
```

### 3. End-to-End (E2E) Tests

E2E tests verify the complete user journey through the application.

**Tools:**

- Cypress
- Playwright

**Guidelines:**

- Focus on critical user flows (login, reset password, form submissions)
- Test on multiple browsers and screen sizes
- Use a realistic test environment with seeded data

**Example:**

```typescript
// Cypress E2E test example
describe('Password Reset Flow', () => {
  it('should allow a user to reset their password', () => {
    // Visit forgot password page
    cy.visit('/auth/forgot-password');

    // Submit email
    cy.findByLabelText('Email').type('test@example.com');
    cy.findByRole('button', { name: /reset password/i }).click();

    // Verify success page
    cy.findByText(/check your email/i).should('be.visible');

    // Simulate clicking email link (in a real test, we'd intercept emails)
    cy.visit('/auth/reset-password?token=test-token');

    // Enter new password
    cy.findByLabelText('New Password').type('NewSecurePassword123!');
    cy.findByLabelText('Confirm Password').type('NewSecurePassword123!');
    cy.findByRole('button', { name: /update password/i }).click();

    // Verify success and redirection
    cy.url().should('include', '/auth/login');
    cy.findByText(/password has been reset/i).should('be.visible');
  });
});
```

### 4. API Tests

API tests verify that the API endpoints work correctly.

**Tools:**

- Jest
- Supertest

**Guidelines:**

- Test all API endpoints for success and error cases
- Verify request validation, authentication, and authorization
- Test rate limiting and security features

**Example:**

```typescript
// API test example
describe('POST /api/auth/reset-password', () => {
  it('should return 200 when a valid email is provided', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'test@example.com' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });

  it('should return 400 for invalid email format', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'invalid-email' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should be rate limited after multiple attempts', async () => {
    // First 5 requests should succeed
    for (let i = 0; i < 5; i++) {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: `test${i}@example.com` })
        .set('X-Forwarded-For', '192.168.1.1') // Simulate same IP
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
    }

    // 6th request should be rate limited
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'test6@example.com' })
      .set('X-Forwarded-For', '192.168.1.1')
      .set('Accept', 'application/json');

    expect(response.status).toBe(429); // Too Many Requests
  });
});
```

### 5. Security Tests

Security tests verify that the application is secure against common vulnerabilities.

**Tools:**

- OWASP ZAP
- Snyk

**Guidelines:**

- Test for common vulnerabilities (XSS, CSRF, SQL injection)
- Verify proper implementation of authentication and authorization
- Test security headers and configurations

**Example:**

```typescript
// Security test example for CSRF protection
describe('CSRF Protection', () => {
  it('should reject API requests without CSRF token', async () => {
    // Login first to get a session
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .set('Accept', 'application/json');

    // Attempt to make a POST request without CSRF token
    const response = await request(app)
      .post('/api/user/profile')
      .send({ name: 'Updated Name' })
      .set('Accept', 'application/json');

    // Should be rejected with 403 Forbidden
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error', 'Invalid CSRF token');
  });
});
```

## Test Environment Setup

### Local Testing

1. **Setup local environment**:

   ```bash
   npm install
   cp .env.example .env.test.local
   # Configure test-specific environment variables
   ```

2. **Run tests**:

   ```bash
   # Run unit and integration tests
   npm test

   # Run with coverage report
   npm test -- --coverage

   # Run E2E tests
   npm run test:e2e
   ```

### CI/CD Testing

Tests are automatically run in GitHub Actions:

1. **Pull Request Tests**:

   - All tests run on every pull request
   - Coverage reports generated
   - E2E tests run against a temporary environment

2. **Main Branch Tests**:
   - All tests run on merges to main
   - Security scans performed
   - Performance tests run

## Testing Best Practices

### 1. Writing Effective Tests

- Write clear test descriptions that explain what is being tested
- Follow the Arrange-Act-Assert (AAA) pattern
- One assertion per test when possible
- Keep tests independent and isolated
- Use appropriate mocks and stubs

### 2. Testing Authentication and Authorization

- Test login, logout, and registration flows
- Verify role-based access controls
- Test authentication token handling
- Test session management and timeouts

### 3. Testing i18n and Localization

- Test UI with different languages
- Verify RTL layout rendering for Arabic
- Test date, number, and currency formatting

### 4. Testing Accessibility

- Verify ARIA attributes
- Test keyboard navigation
- Check color contrast and screen reader compatibility

### 5. Performance Testing

- Test application loading times
- Verify efficient API response times
- Test with simulated slow network conditions

## Common Testing Patterns

### Testing Form Submissions

```tsx
// Form submission test pattern
it('should submit the form with valid data', async () => {
  // Render form
  const { getByLabelText, getByRole } = render(<MyForm onSubmit={mockSubmit} />);

  // Fill form fields
  fireEvent.change(getByLabelText('Name'), { target: { value: 'Test User' } });
  fireEvent.change(getByLabelText('Email'), { target: { value: 'test@example.com' } });

  // Submit form
  fireEvent.click(getByRole('button', { name: /submit/i }));

  // Verify submission
  expect(mockSubmit).toHaveBeenCalledWith({
    name: 'Test User',
    email: 'test@example.com',
  });
});
```

### Testing Error Handling

```tsx
// Error handling test pattern
it('should display validation errors', async () => {
  // Render form
  const { getByLabelText, getByRole, findByText } = render(<MyForm />);

  // Submit without filling required fields
  fireEvent.click(getByRole('button', { name: /submit/i }));

  // Verify error messages
  expect(await findByText(/name is required/i)).toBeInTheDocument();
  expect(await findByText(/email is required/i)).toBeInTheDocument();
});
```

### Testing Async Operations

```tsx
// Async operation test pattern
it('should load and display data', async () => {
  // Mock API response
  mockAxios.get.mockResolvedValueOnce({
    data: { users: [{ id: 1, name: 'Test User' }] },
  });

  // Render component
  const { findByText } = render(<UserList />);

  // Verify loading state
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // Verify data appears
  expect(await findByText('Test User')).toBeInTheDocument();

  // Verify API was called correctly
  expect(mockAxios.get).toHaveBeenCalledWith('/api/users');
});
```

## Test Documentation

Each test file should include:

1. Brief description of what's being tested
2. Test coverage expectations
3. Any special setup or considerations

Example test header:

```typescript
/**
 * Password Reset API Tests
 *
 * Tests the password reset API endpoints for:
 * - Request password reset
 * - Verify reset codes
 * - Update password
 *
 * Expected coverage: 100% of API functionality
 *
 * Note: These tests require a running test database with proper
 * migration setup. The tests will create and verify test users.
 */
```

## Conclusion

Following these testing guidelines will ensure a robust, reliable application with high-quality code. Tests should evolve with the application, and new features should always include corresponding test coverage.

## Document Purpose & Reference Usage

This document serves as the authoritative testing reference for the OSINT Dashboard & Agency Website project. It's designed to be used by:

- Developers writing tests for new features
- QA engineers designing test strategies
- Team leads evaluating test coverage
- New team members learning the project's testing approach
- DevOps engineers configuring test automation in CI/CD pipelines

The testing guidelines should be consulted when:
- Implementing tests for new features or modifications
- Setting up testing environments locally or in CI/CD
- Determining the appropriate type of test for a specific feature
- Troubleshooting failing tests
- Establishing test coverage requirements
- Onboarding new developers to the project's testing practices

This document complements the Project Architecture and Security Model by providing specific guidance on how to verify that implementations meet both functional requirements and security standards. It serves as both a procedural guide for writing effective tests and a reference for test patterns that work well within the project's specific technology stack and architecture.
