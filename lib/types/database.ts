export type UserRole = "admin" | "editor" | "user";

export interface UserMetadata {
  name?: string;
  avatar_url?: string;
}

export interface DatabaseUser {
  id: string;
  email: string;
  user_metadata?: UserMetadata;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface OTPVerification {
  id: string;
  user_id: string;
  otp_code: string;
  otp_hash: string;
  expires_at: Date;
  created_at: string;
  updated_at: string;
}

export interface RegistrationRequest {
  id: string;
  email: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
} 