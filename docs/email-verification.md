# Email Verification Documentation

## Overview

The application implements a robust email verification system for user registrations using One-Time Passwords (OTPs). This document outlines how the system works, troubleshooting common issues, and the solutions implemented.

## Verification Flow

1. **Registration Initiation**:

   - User submits registration form with email and password
   - System creates a new user in Supabase Auth with `email_confirm: false`
   - A 6-digit OTP is generated, hashed, and stored in the `otp_verifications` table
   - A verification email with the OTP is sent to the user
   - A pending record is created in `user_registration_requests` table

2. **Email Verification**:

   - User receives and enters the OTP code
   - System verifies the OTP by hashing it and comparing against the stored hash
   - Upon successful verification:
     - The OTP entry in `otp_verifications` is marked as verified (setting `verified_at`)
     - The `email_verified` flag is set to `true` in `user_registration_requests`
     - The user's `email_confirm` status is updated in Supabase Auth
     - Admins are notified about the new registration requiring approval

3. **Admin Approval**:
   - Admin reviews the registration request
   - Upon approval, the user status is changed to "active"

## Common Issues and Solutions

### Issue: "Email not confirmed" Error

**Problem**: Users completed the OTP verification process, but still received "Email not confirmed" errors when trying to log in.

**Root Cause**: When users verified their email with the OTP, we were correctly updating the `email_verified` flag in the `user_registration_requests` table, but we were not updating the user's `email_confirm` status in Supabase Auth.

**Solution**:

1. **Updated `verify-otp` Endpoint**: Added code to update `email_confirm` status in Supabase Auth:

   ```typescript
   const { error: updateUserError } = await supabase.auth.admin.updateUserById(userId, {
     email_confirm: true,
   });
   ```

2. **Created Fix Scripts**:
   - `fix-new-user-accounts.js`: Identifies and fixes specific users with email confirmation issues
   - `fix-all-user-emails.js`: Comprehensive fix for all users with verification inconsistencies

### Issue: Inconsistent Email Verification State

**Problem**: Sometimes there's a mismatch between the verification status in the OTP table and the user's email confirmation status in Supabase Auth.

**Solution**: The fix scripts check for:

1. Users who have verified their email through the OTP process (have a `verified_at` timestamp)
2. Users who have `email_verified: true` in their registration request
3. But who still have `email_confirm: false` in Supabase Auth

For these users, the scripts automatically update `email_confirm` to `true`.

## Scripts

### `fix-new-user-accounts.js`

This script:

- Identifies users with unconfirmed emails
- Checks if they have verified their email through OTP
- Updates their email confirmation status in Supabase Auth

Usage:

```bash
node scripts/fix-new-user-accounts.js
```

### `fix-all-user-emails.js`

A more comprehensive script that:

- Retrieves all users from Supabase Auth
- Finds those with unconfirmed emails
- Checks both `otp_verifications` and `user_registration_requests` tables for verification evidence
- Updates email confirmation status for verified users

Usage:

```bash
node scripts/fix-all-user-emails.js
```

## Best Practices

1. **Consistent State Updates**: When verifying email, ensure both database tables and Supabase Auth are updated together.

2. **Error Handling**: Implement comprehensive error handling for each step, with detailed logs.

3. **Regular Audits**: Periodically run the fix scripts to ensure consistency between verification tables and Supabase Auth.

4. **Testing**: When modifying the verification flow, test both the happy path and error conditions.

## Document Purpose & Reference Usage

This document serves as a specialized technical guide focused on the email verification system within the OSINT Dashboard project. It's designed to be referenced by:

- Developers implementing or modifying the email verification flow
- DevOps engineers troubleshooting authentication issues
- Support staff addressing user login problems
- System administrators maintaining the Supabase Auth infrastructure

The document should be consulted when:
- Investigating user reports of "Email not confirmed" errors
- Implementing changes to the verification system
- Debugging inconsistencies between verification tables and authentication status
- Onboarding new developers to the authentication subsystem
- Planning maintenance or updates to the email delivery components

This guide complements the Authentication documentation by focusing specifically on the email verification component, which is a critical security feature of the application. It documents both the intended behavior and solutions to known edge cases, helping ensure reliable user account creation and verification.
