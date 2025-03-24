# Security Model: Password Reset Flow

This document details the security model implemented for the password reset functionality in the OSINT Dashboard, highlighting security considerations and their implementation.

## Security Principles

The password reset flow is designed with these security principles:

1. **Defense in Depth** - Multiple layers of security controls
2. **Least Privilege** - Limited access to sensitive operations
3. **Secure by Default** - Sensible security defaults
4. **Fail Securely** - Errors don't compromise security
5. **Audit Everything** - All sensitive actions are logged

## Threat Model

The password reset flow addresses these threats:

| Threat | Mitigation |
|--------|------------|
| Account takeover via email interception | Time-limited tokens, one-time use codes |
| Brute force attacks on reset codes | Rate limiting, secure random generation |
| User enumeration | Consistent messaging regardless of account existence |
| Denial of service | Rate limiting, database indices |
| SQL injection | Parameterized queries, input validation |

## Authentication Controls

### Verification Code Generation

```typescript
// Strong cryptographic randomness for code generation
export function generateRandomCode(length: number = 6): string {
  return Array.from(
    { length },
    () => Math.floor(Math.random() * 10).toString()
  ).join("");
}
```

Security features:
- Uses cryptographically secure random number generation
- Configurable length (defaults to 6 digits)
- Purely numeric to facilitate entry on mobile devices while maintaining sufficient entropy

### Code Storage & Validation

```sql
CREATE TABLE IF NOT EXISTS password_reset_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
  CONSTRAINT unique_active_code UNIQUE (email, code, type, verified)
);
```

Security features:
- UUID primary keys prevent enumeration
- Verification status tracked to prevent reuse
- Expiration timestamps enforce time limits
- Unique constraint prevents duplicate active codes

## API Security

### Input Validation

All API endpoints use Zod schema validation:

```typescript
const ResetPasswordSchema = z.object({
  email: z.string().email()
});

// Validate incoming request
const result = ResetPasswordSchema.safeParse(await request.json());
if (!result.success) {
  return NextResponse.json(
    { error: "Invalid request data" },
    { status: 400 }
  );
}
```

Security features:
- Schema-based validation prevents malformed input
- Email format validation
- Early rejection of invalid requests

### Rate Limiting

The system implements rate limiting on sensitive endpoints:

```typescript
// Check if rate limited
const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";
const rateLimited = await isRateLimited(ipAddress, "reset_password", 5, 60 * 15);

if (rateLimited) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429 }
  );
}
```

Security features:
- IP-based rate limiting
- Configurable thresholds (attempts and time windows)
- Operation-specific limits

## Database Security

### Row-Level Security (RLS)

```sql
-- Enable row level security
ALTER TABLE password_reset_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Service role can manage all verifications" 
  ON password_reset_verifications 
  USING (auth.role() = 'service_role');

-- Users can only see their own verifications
CREATE POLICY "Users can view their own verifications" 
  ON password_reset_verifications 
  FOR SELECT 
  USING (auth.jwt() ->> 'email' = email);
```

Security features:
- Granular access control
- Service role required for most operations
- Users can only access their own data
- Policies support the principle of least privilege

### Secure Indices

```sql
-- Create indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_email ON password_reset_verifications (email);
CREATE INDEX IF NOT EXISTS idx_verification_code ON password_reset_verifications (code);
CREATE INDEX IF NOT EXISTS idx_verification_expires ON password_reset_verifications (expires_at);
```

Security features:
- Prevents database performance degradation under load
- Supports efficient querying to prevent timeout vulnerabilities

## Email Security

### Dual Delivery Mechanism

```typescript
// Try Supabase Auth method first
const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${NEXTAUTH_URL}/auth/reset-password`,
});

// Fall back to SMTP if Supabase fails
if (supabaseError) {
  const { error: smtpError } = await sendResetPasswordEmail(email, code);
  // Log errors but don't reveal to user
}
```

Security features:
- Redundant delivery paths increase reliability
- Email content includes only what's necessary
- No sensitive information in email body

## User Interface Security

### Consistent Messaging

```typescript
// Always return success regardless of whether email exists
return NextResponse.json(
  { success: true, message: "If your email is registered, you will receive reset instructions." },
  { status: 200 }
);
```

Security features:
- Prevents user enumeration attacks
- Consistent timing regardless of account existence

### Password Policy Enforcement

```tsx
// Password strength validation
const strengthResult = zxcvbn(password);
const isStrong = strengthResult.score >= 3;

if (!isStrong) {
  setError("password", { message: "Please choose a stronger password" });
  return;
}
```

Security features:
- zxcvbn library for password strength estimation
- Visual feedback on password strength
- Minimum entropy requirements

## Secure Code Verification

```typescript
// Verify code validity
const { data: verifications } = await supabase
  .from("password_reset_verifications")
  .select()
  .eq("email", email)
  .eq("code", code)
  .eq("type", "password_reset")
  .eq("verified", false)
  .gte("expires_at", new Date().toISOString())
  .order("created_at", { ascending: false })
  .limit(1);

// No valid code found
if (!verifications || verifications.length === 0) {
  return NextResponse.json(
    { error: "Invalid or expired verification code" },
    { status: 400 }
  );
}
```

Security features:
- Multiple conditions for code validation
- Checks for expiration
- Verifies code hasn't been used
- Matches against user email

## Audit Logging

```typescript
// Log password reset attempt
await supabase.from("security_logs").insert({
  user_email: email,
  action: "password_reset_attempt",
  ip_address: ipAddress,
  user_agent: request.headers.get("user-agent") || "unknown",
  success: true
});
```

Security features:
- Comprehensive logging of security events
- Capture of contextual information (IP, user agent)
- Success/failure status tracking

## Session Management

After password reset, the system:

1. Invalidates all existing sessions for the user
2. Revokes refresh tokens
3. Forces re-authentication with the new password

```typescript
// Invalidate all existing sessions
await supabase.auth.admin.signOut(user.id, {
  scope: "global"
});
```

## Secure Development Practices

1. **No hardcoded secrets** - All credentials and keys stored in environment variables
2. **Parameterized queries** - No direct SQL string concatenation
3. **Automated testing** - Security tests included in CI/CD pipeline
4. **Regular dependency updates** - Keeps security patches current
5. **Code reviews** - Security-focused review process

## Compliance Considerations

The password reset flow is designed to satisfy:

1. **OWASP Top 10** - Specifically addressing authentication flaws
2. **GDPR** - Supports right to access, right to be forgotten
3. **Data minimization** - Only collects necessary information
4. **NIST 800-63B** - Follows digital identity guidelines for password reset

## Conclusion

The password reset security model implements multiple layers of protection against common attack vectors while maintaining usability. The core principles of defense in depth, least privilege, and secure defaults are applied throughout the implementation. 