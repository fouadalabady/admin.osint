import { createHash } from 'crypto';

// Generate a random OTP of specified length
export function generateOTP(length = 6): string {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  
  return otp;
}

// Hash an OTP for secure storage
export function hashOTP(otp: string, email: string): string {
  return createHash('sha256')
    .update(`${otp}:${email}:${process.env.NEXTAUTH_SECRET}`)
    .digest('hex');
}

// Verify an OTP against its hash
export function verifyOTP(otp: string, hash: string, email: string): boolean {
  const computedHash = hashOTP(otp, email);
  return computedHash === hash;
}

// Calculate expiry timestamp (default: 10 minutes from now)
export function getOTPExpiry(minutes = 10): number {
  return Date.now() + minutes * 60 * 1000;
}

// Check if OTP is expired
export function isOTPExpired(expiryTimestamp: number): boolean {
  return Date.now() > expiryTimestamp;
} 